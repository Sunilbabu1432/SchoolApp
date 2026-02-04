require('dotenv').config();
const salesforceLogin = require('../config/salesforce');

(async () => {
    try {
        const conn = await salesforceLogin();

        // Find Classes/Exams that have scheduled marks but are still 'Submitted'
        const pendingGroupsRes = await conn.query(`
            SELECT Exam_Type__c, Class__c
            FROM Student_Mark__c
            WHERE Status__c = 'Submitted'
            AND Publish_At__c != null
            GROUP BY Exam_Type__c, Class__c
        `);

        console.log('--- Publishing Deadlock Analysis ---\n');

        for (const row of pendingGroupsRes.records) {
            const { Exam_Type__c, Class__c } = row;

            // 1. Get Expected Count
            const expectedRes = await conn.query(`
                SELECT COUNT(Id) cnt
                FROM Teacher_Assignment__c
                WHERE Class_Name__c = '${Class__c}'
            `);
            const expectedCount = expectedRes.records[0].cnt;

            // 2. Get Submitted Count (any status Submitted/Published)
            const submittedRes = await conn.query(`
                SELECT Subject__c
                FROM Student_Mark__c
                WHERE Class__c = '${Class__c}'
                AND Exam_Type__c = '${Exam_Type__c}'
                GROUP BY Subject__c
            `);
            const submittedCount = submittedRes.records.length;

            console.log(`Class: ${Class__c} | Exam: ${Exam_Type__c}`);
            console.log(`  Expected Subjects: ${expectedCount}`);
            console.log(`  Submitted Subjects (Total): ${submittedCount}`);

            if (submittedCount < expectedCount) {
                console.log(`  🔴 REASON: Waiting for ${expectedCount - submittedCount} more subjects to be submitted.`);

                // Find missing subjects
                const assignedRes = await conn.query(`SELECT Subject__c FROM Teacher_Assignment__c WHERE Class_Name__c = '${Class__c}'`);
                const assignedSubjects = assignedRes.records.map(a => a.Subject__c);
                const submittedSubjects = new Set(submittedRes.records.map(s => s.Subject__c));
                const missing = assignedSubjects.filter(s => !submittedSubjects.has(s));
                console.log(`  Missing: ${missing.join(', ')}`);
            } else {
                console.log(`  🟢 Ready to publish (or should have been).`);
            }
            console.log('-----------------------------------');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
})();
