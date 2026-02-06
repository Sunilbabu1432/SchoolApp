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

function escapeSOQL(value) {
    if (value == null) return "";
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/%/g, "\\%");
}

/**
 * Normalizes a custom field name to its relationship name (e.g., __c to __r)
 */
function toRel(field) {
    if (!field) return field;
    return field.endsWith('__c') ? field.replace(/__c$/, '__r') : field;
}

async function resolveSchema(conn) {
    const CACHE_TTL = 30 * 60 * 1000;
    if (schemaCache.ts && Date.now() - schemaCache.ts < CACHE_TTL) return schemaCache;

    const findField = (fields, candidates) => {
        candidates = candidates.map(c => c.toLowerCase());
        // 1. Exact match (normalize __c)
        let f = fields.find(fld =>
            (fld.label && candidates.includes(fld.label.toLowerCase())) ||
            (fld.name && candidates.includes(fld.name.toLowerCase())) ||
            (fld.name && candidates.includes(fld.name.toLowerCase().replace('__c', '')))
        );
        // 2. Custom field substring match
        if (!f) f = fields.find(fld =>
            fld.name && fld.name.endsWith('__c') &&
            candidates.some(c => fld.name.toLowerCase().includes(c))
        );
        // 3. Any substring match
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
            class: findField(dSes.fields, ["class", "class__c", "Current_Class__c"]),
            section: findField(dSes.fields, ["section", "section__c"]),
            date: findField(dSes.fields, ["date", "date__c", "Attendance_Date__c", "Session_Date__c"]),
            teacher: findField(dSes.fields, ["teacher", "taken_by", "teacher__c", "Teacher_Name__c"])
        };

        schemaCache.ts = Date.now();
        console.log("[RESOLVE SCHEMA] Success for Attendance_Session__c:", {
            id: sesInfo.id,
            fields: schemaCache.Attendance_Session__c
        });
        return schemaCache;
    } catch (err) {
        console.error("[SCHEMA RESOLVE ERROR]", err.message, err.stack);
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

        const dateLiteral = date ? String(date).split("T")[0] : null;
        const escapedClass = escapeSOQL(classValue);
        const escapedSection = sectionValue ? escapeSOQL(sectionValue) : null;

        // Construct Queries
        let studentFields = `Id, Name, ${acc.class}`;
        if (acc.section) studentFields += `, ${acc.section}`;
        if (acc.roll) studentFields += `, ${acc.roll}`;

        let studentSoql = `SELECT ${studentFields} FROM Account 
                          WHERE (${acc.class} = '${escapedClass}' OR ${acc.class} = 'Class ${escapedClass}')`;
        if (escapedSection && acc.section) studentSoql += ` AND ${acc.section} = '${escapedSection}'`;
        studentSoql += " ORDER BY Name ASC LIMIT 500";

        let sessionPromise = Promise.resolve(null);
        if (dateLiteral && ses.class && ses.date) {
            const teacherRel = toRel(ses.teacher);
            let sesSoql = `SELECT Id, ${teacherRel ? teacherRel + '.Name' : 'Id'} FROM Attendance_Session__c 
                           WHERE ${ses.class} = '${escapedClass}' AND ${ses.date} = ${dateLiteral}`;
            if (escapedSection && ses.section) sesSoql += ` AND ${ses.section} = '${escapedSection}'`;
            sessionPromise = conn.query(sesSoql + " LIMIT 1").then(res => {
                if (res.records.length > 0) {
                    const s = res.records[0];
                    return { id: s.Id, takenBy: s[teacherRel] ? (s[teacherRel].Name || s[ses.teacher]) : "Unknown" };
                }
                return null;
            });
        }

        // We can ALSO fetch all attendance records for this class/section/date in parallel
        // instead of waiting for student IDs.
        let attendancePromise = Promise.resolve(new Map());
        if (dateLiteral && att.class && att.date && att.status && att.student) {
            let attSoql = `SELECT ${att.student}, ${att.status} FROM Attendance__c 
                           WHERE ${att.date} = ${dateLiteral} AND (${att.class} = '${escapedClass}' OR ${att.class} = 'Class ${escapedClass}')`;
            if (escapedSection && att.section) attSoql += ` AND ${att.section} = '${escapedSection}'`;

            attendancePromise = conn.query(attSoql).then(res => {
                const amap = new Map();
                res.records.forEach(a => amap.set(a[att.student], a[att.status]));
                return amap;
            });
        }

        // Run everything in parallel
        const [studentRes, sessionInfo, attendanceMap] = await Promise.all([
            conn.query(studentSoql),
            sessionPromise,
            attendancePromise
        ]);

        const students = studentRes.records.map(r => ({
            ...r,
            Attendance_Status__c: attendanceMap.get(r.Id) || null
        }));

        res.json({ students, session: sessionInfo });
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
            const sessionPayload = {};
            if (ses.class) sessionPayload[ses.class] = shortClass;
            if (ses.date) sessionPayload[ses.date] = dateLiteral;
            if (ses.section) sessionPayload[ses.section] = sectionValue || "";
            if (ses.teacher) sessionPayload[ses.teacher] = takenBy || "";

            console.log("[SESSION UPSERT] Payload:", JSON.stringify(sessionPayload, null, 2));

            const matchCriteria = {
                [ses.class]: shortClass,
                [ses.date]: dateLiteral
            };
            if (ses.section) matchCriteria[ses.section] = sectionValue || "";

            const existingSession = await conn.sobject('Attendance_Session__c').find(matchCriteria).limit(1);

            if (existingSession.length > 0) {
                console.log("[SESSION EXISTS]", existingSession[0].Id);
                const updatePayload = {};
                if (ses.teacher) updatePayload[ses.teacher] = takenBy;
                if (Object.keys(updatePayload).length > 0) {
                    await conn.sobject('Attendance_Session__c').record(existingSession[0].Id).update(updatePayload);
                    console.log("[SESSION UPDATED]");
                }
            } else {
                console.log("[SESSION] Creating new record...");
                const createRes = await conn.sobject('Attendance_Session__c').create(sessionPayload);
                console.log("[SESSION] Create Result:", JSON.stringify(createRes, null, 2));
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
