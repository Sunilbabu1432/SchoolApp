const express = require('express');
const router = express.Router();
const salesforceLogin = require('../config/salesforce');

/**
 * Cache for resolved Account field API names to avoid repeated describe calls.
 */
let fieldNameCache = {
    classField: "Class__c",
    sectionField: null,
    rollField: null,
    ts: 0,
};

function escapeSOQL(value) {
    if (value == null) return "";
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/%/g, "\\%");
}

async function resolveAccountFieldNames(conn) {
    const CACHE_TTL = 30 * 60 * 1000; // 30 mins cache
    if (fieldNameCache.ts && Date.now() - fieldNameCache.ts < CACHE_TTL) {
        return fieldNameCache;
    }

    try {
        const describe = await conn.sobject('Account').describe();
        const fields = describe.fields;

        const findFieldName = (candidates) => {
            candidates = candidates.map((c) => c.toLowerCase());
            let f = fields.find(fld => fld.label && candidates.includes(String(fld.label).toLowerCase()));
            if (f) return f.name;
            f = fields.find(fld => fld.name && candidates.some(c => String(fld.name).toLowerCase().includes(c)));
            if (f) return f.name;
            return null;
        };

        // Fix fallback to Class__c as seen in bulk_import.js
        const classField = findFieldName(["class", "Current Class", "Current_Class__c", "Class__c"]) || "Class__c";
        const sectionField = findFieldName(["section", "Section__c"]);
        const rollField = findFieldName(["roll", "Roll Number", "Roll_No__c", "Roll_Number__c"]);

        fieldNameCache = { classField, sectionField, rollField, ts: Date.now() };
        return fieldNameCache;
    } catch (err) {
        console.error("[DESCRIBE ERROR]", err.message);
        return { classField: "Class__c", sectionField: null, rollField: null, ts: Date.now() };
    }
}

// 1. Get students for a class/section with attendance status
router.get('/students', async (req, res) => {
    const { classValue, sectionValue, date } = req.query;

    if (!classValue) {
        return res.status(400).json({ error: "Missing 'classValue' parameter" });
    }

    try {
        const conn = await salesforceLogin();
        const { classField, sectionField, rollField } = await resolveAccountFieldNames(conn);

        // Build SELECT clause based on existing fields
        let selectFields = `Id, Name, ${classField}`;
        if (sectionField) selectFields += `, ${sectionField}`;
        if (rollField) selectFields += `, ${rollField}`;

        let soql = `SELECT ${selectFields} 
                    FROM Account 
                    WHERE (${classField} = '${escapeSOQL(classValue)}' OR ${classField} = 'Class ${escapeSOQL(classValue)}')`;

        if (sectionValue && sectionField) {
            soql += ` AND ${sectionField} = '${escapeSOQL(sectionValue)}'`;
        }
        soql += " ORDER BY Name ASC LIMIT 500";

        const result = await conn.query(soql);
        let records = result.records;

        // Fetch existing attendance if date is provided
        let sessionInfo = null;
        if (date && records.length > 0) {
            const dateLiteral = String(date).split("T")[0];
            const studentIds = records.map(r => `'${r.Id}'`).join(",");

            const attQuery = `SELECT Student__c, Attendance_Status__c 
                             FROM Attendance__c 
                             WHERE Attendance_Date__c = ${dateLiteral} AND Student__c IN (${studentIds})`;
            const attResult = await conn.query(attQuery);
            const attMap = new Map();
            attResult.records.forEach(a => attMap.set(a.Student__c, a.Attendance_Status__c));

            records = records.map(r => ({
                ...r,
                Attendance_Status__c: attMap.get(r.Id) || null
            }));

            // Fetch session info
            const sessionQuery = `SELECT Id, Taken_By__r.Name 
                                 FROM Attendance_Session__c 
                                 WHERE Class__c = '${escapeSOQL(classValue)}' 
                                 AND Section__c = '${escapeSOQL(sectionValue || '')}' 
                                 AND Date__c = '${dateLiteral}' LIMIT 1`;
            const sessionResult = await conn.query(sessionQuery);
            if (sessionResult.records.length > 0) {
                sessionInfo = {
                    id: sessionResult.records[0].Id,
                    takenBy: sessionResult.records[0].Taken_By__r ? sessionResult.records[0].Taken_By__r.Name : "Unknown"
                };
            }
        }

        res.json({ students: records, session: sessionInfo });
    } catch (err) {
        console.error("[BACKEND ATTENDANCE ERROR]", err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. Save/Update Attendance
router.post('/save', async (req, res) => {
    const { date, attendances, takenBy, classValue, sectionValue } = req.body;

    if (!date || !Array.isArray(attendances)) {
        return res.status(400).json({ error: "Missing 'date' or 'attendances' array" });
    }

    try {
        const conn = await salesforceLogin();
        const dateLiteral = String(date).split("T")[0];

        // 1. Upsert Session
        const sessionPayload = {
            Class__c: classValue.replace(/^Class\s+/i, ""),
            Section__c: sectionValue || "",
            Date__c: dateLiteral,
            Taken_By__c: takenBy
        };

        const sessionMatch = `Class__c = '${escapeSOQL(sessionPayload.Class__c)}' AND Section__c = '${escapeSOQL(sessionPayload.Section__c)}' AND Date__c = '${dateLiteral}'`;
        const existingSession = await conn.sobject('Attendance_Session__c').find(sessionMatch).limit(1);

        if (existingSession.length > 0) {
            await conn.sobject('Attendance_Session__c').record(existingSession[0].Id).update({ Taken_By__c: takenBy });
        } else {
            await conn.sobject('Attendance_Session__c').create(sessionPayload);
        }

        // 2. Bulk Upsert Attendance Records
        const studentIds = attendances.map(a => `'${escapeSOQL(a.studentId)}'`).join(",");
        const existingAttQuery = `SELECT Id, Student__c FROM Attendance__c WHERE Attendance_Date__c = ${dateLiteral} AND Student__c IN (${studentIds})`;
        const existingAtts = await conn.query(existingAttQuery);
        const existingMap = new Map();
        existingAtts.records.forEach(r => existingMap.set(r.Student__c, r.Id));

        const recordsToProcess = attendances.map(item => {
            const existingId = existingMap.get(item.studentId);
            const payload = {
                Student__c: item.studentId,
                Attendance_Date__c: dateLiteral,
                Attendance_Status__c: item.status,
                Roll_Number__c: item.rollNumber || "",
                Class__c: classValue.replace(/^Class\s+/i, ""),
                Section__c: sectionValue || ""
            };
            if (existingId) payload.Id = existingId;
            return payload;
        });

        // Split into inserts and updates for jsforce
        const toUpdate = recordsToProcess.filter(r => r.Id);
        const toCreate = recordsToProcess.filter(r => !r.Id && r.Attendance_Status__c === 'Absent'); // Only create if absent (optimization)

        if (toUpdate.length > 0) await conn.sobject('Attendance__c').update(toUpdate);
        if (toCreate.length > 0) await conn.sobject('Attendance__c').create(toCreate);

        res.json({ success: true, message: "Attendance records processed successfully" });
    } catch (err) {
        console.error("[SAVE ATTENDANCE ERROR]", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
