const express = require('express');
const router = express.Router();
const salesforceLogin = require('../config/salesforce');

/**
 * Cache for resolved Account field API names to avoid repeated describe calls.
 */
/**
 * Universal Resolver for Salesforce Field API Names
 */
let schemaCache = {
    Account: { class: "Class__c", section: null, roll: null },
    Attendance__c: { student: "Student__c", date: "Attendance_Date__c", status: "Attendance_Status__c", class: "Class__c", section: "Section__c", roll: "Roll_No__c" },
    Attendance_Session__c: { class: "Class__c", section: "Section__c", date: "Date__c", teacher: "Taken_By__c" },
    ts: 0
};

async function resolveSchema(conn) {
    const CACHE_TTL = 30 * 60 * 1000;
    if (schemaCache.ts && Date.now() - schemaCache.ts < CACHE_TTL) return schemaCache;

    const findField = (fields, candidates) => {
        candidates = candidates.map(c => c.toLowerCase());
        let f = fields.find(fld => fld.label && candidates.includes(fld.label.toLowerCase()));
        if (!f) f = fields.find(fld => fld.name && candidates.some(c => fld.name.toLowerCase().includes(c)));
        return f ? f.name : null;
    };

    try {
        // 1. Resolve Account Fields
        const dAcc = await conn.sobject('Account').describe();
        schemaCache.Account = {
            class: findField(dAcc.fields, ["class", "Current Class", "Current_Class__c", "Class__c"]) || "Class__c",
            section: findField(dAcc.fields, ["section", "Section__c"]),
            roll: findField(dAcc.fields, ["roll", "Roll Number", "Roll_No__c", "Roll_Number__c"])
        };

        // 2. Resolve Attendance__c Fields
        const dAtt = await conn.sobject('Attendance__c').describe();
        schemaCache.Attendance__c = {
            student: findField(dAtt.fields, ["student", "student_id", "student_ref", "student__c"]),
            date: findField(dAtt.fields, ["date", "attendance_date"]),
            status: findField(dAtt.fields, ["status", "attendance_status"]),
            class: findField(dAtt.fields, ["class", "class__c"]),
            section: findField(dAtt.fields, ["section", "section__c"]),
            roll: findField(dAtt.fields, ["roll", "roll_no", "roll_number"])
        };

        // 3. Resolve Attendance_Session__c Fields
        const dSes = await conn.sobject('Attendance_Session__c').describe();
        schemaCache.Attendance_Session__c = {
            class: findField(dSes.fields, ["class", "class__c"]),
            section: findField(dSes.fields, ["section", "section__c"]),
            date: findField(dSes.fields, ["date", "date__c"]),
            teacher: findField(dSes.fields, ["teacher", "taken_by", "teacher__c"])
        };

        schemaCache.ts = Date.now();
        console.log("[SCHEMA RESOLVED]", JSON.stringify(schemaCache));
        return schemaCache;
    } catch (err) {
        console.error("[SCHEMA RESOLVE ERROR]", err.message);
        return schemaCache;
    }
}

// 1. Get students for a class/section with attendance status
router.get('/students', async (req, res) => {
    const { classValue, sectionValue, date } = req.query;
    if (!classValue) return res.status(400).json({ error: "Missing 'classValue'" });

    try {
        const conn = await salesforceLogin();
        const schema = await resolveSchema(conn);
        const acc = schema.Account;
        const att = schema.Attendance__c;
        const ses = schema.Attendance_Session__c;

        // Fetch Students
        let selectFields = `Id, Name, ${acc.class}`;
        if (acc.section) selectFields += `, ${acc.section}`;
        if (acc.roll) selectFields += `, ${acc.roll}`;

        let soql = `SELECT ${selectFields} FROM Account 
                    WHERE (${acc.class} = '${escapeSOQL(classValue)}' OR ${acc.class} = 'Class ${escapeSOQL(classValue)}')`;
        if (sectionValue && acc.section) soql += ` AND ${acc.section} = '${escapeSOQL(sectionValue)}'`;
        soql += " ORDER BY Name ASC LIMIT 500";

        const result = await conn.query(soql);
        let records = result.records;

        let sessionInfo = null;
        if (date && records.length > 0) {
            const dateLiteral = String(date).split("T")[0];
            const studentIds = records.map(r => `'${r.Id}'`).join(",");

            // Fetch Attendance
            if (att.student && att.status && att.date) {
                const attQuery = `SELECT ${att.student}, ${att.status} FROM Attendance__c 
                                 WHERE ${att.date} = ${dateLiteral} AND ${att.student} IN (${studentIds})`;
                const attRes = await conn.query(attQuery);
                const attMap = new Map();
                attRes.records.forEach(a => attMap.set(a[att.student], a[att.status]));
                records = records.map(r => ({ ...r, Attendance_Status__c: attMap.get(r.Id) || null }));
            }

            // Fetch Session
            if (ses.class && ses.date) {
                let sesSoql = `SELECT Id, ${ses.teacher ? ses.teacher + '.Name' : 'Id'} FROM Attendance_Session__c 
                               WHERE ${ses.class} = '${escapeSOQL(classValue)}' AND ${ses.date} = '${dateLiteral}'`;
                if (sectionValue && ses.section) sesSoql += ` AND ${ses.section} = '${escapeSOQL(sectionValue)}'`;
                const sesRes = await conn.query(sesSoql + " LIMIT 1");
                if (sesRes.records.length > 0) {
                    const s = sesRes.records[0];
                    sessionInfo = { id: s.Id, takenBy: s[ses.teacher] ? (s[ses.teacher].Name || s[ses.teacher]) : "Unknown" };
                }
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
        const schema = await resolveSchema(conn);
        const att = schema.Attendance__c;
        const ses = schema.Attendance_Session__c;
        const dateLiteral = String(date).split("T")[0];

        // 1. Upsert Session
        if (ses.class && ses.date) {
            const shortClass = classValue.replace(/^Class\s+/i, "");
            const sessionPayload = {
                [ses.class]: shortClass,
                [ses.date]: dateLiteral
            };
            if (ses.section) sessionPayload[ses.section] = sectionValue || "";
            if (ses.teacher) sessionPayload[ses.teacher] = takenBy;

            let sessionMatch = `${ses.class} = '${escapeSOQL(shortClass)}' AND ${ses.date} = '${dateLiteral}'`;
            if (ses.section) sessionMatch += ` AND ${ses.section} = '${escapeSOQL(sectionValue || "")}'`;

            const existingSession = await conn.sobject('Attendance_Session__c').find(sessionMatch).limit(1);

            if (existingSession.length > 0) {
                const updatePayload = {};
                if (ses.teacher) updatePayload[ses.teacher] = takenBy;
                if (Object.keys(updatePayload).length > 0) {
                    await conn.sobject('Attendance_Session__c').record(existingSession[0].Id).update(updatePayload);
                }
            } else {
                await conn.sobject('Attendance_Session__c').create(sessionPayload);
            }
        }

        // 2. Bulk Upsert Attendance Records
        if (att.student && att.date && att.status) {
            const studentIdsArr = attendances.map(a => `'${escapeSOQL(a.studentId)}'`).join(",");
            const existingAttQuery = `SELECT Id, ${att.student} FROM Attendance__c WHERE ${att.date} = ${dateLiteral} AND ${att.student} IN (${studentIdsArr})`;
            const existingAtts = await conn.query(existingAttQuery);
            const existingMap = new Map();
            existingAtts.records.forEach(r => existingMap.set(r[att.student], r.Id));

            const shortClass = classValue.replace(/^Class\s+/i, "");
            const recordsToProcess = attendances.map(item => {
                const existingId = existingMap.get(item.studentId);
                const payload = {
                    [att.student]: item.studentId,
                    [att.date]: dateLiteral,
                    [att.status]: item.status
                };
                if (att.roll) payload[att.roll] = item.rollNumber || "";
                if (att.class) payload[att.class] = shortClass;
                if (att.section) payload[att.section] = sectionValue || "";

                if (existingId) payload.Id = existingId;
                return payload;
            });

            // Split into inserts and updates
            const toUpdate = recordsToProcess.filter(r => r.Id);
            const toCreate = recordsToProcess.filter(r => !r.Id && r[att.status] === 'Absent');

            if (toUpdate.length > 0) await conn.sobject('Attendance__c').update(toUpdate);
            if (toCreate.length > 0) await conn.sobject('Attendance__c').create(toCreate);
        }

        res.json({ success: true, message: "Attendance records processed successfully" });
    } catch (err) {
        console.error("[SAVE ATTENDANCE ERROR]", err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
