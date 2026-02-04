require('dotenv').config();
const salesforceLogin = require('../config/salesforce');

(async () => {
    try {
        const conn = await salesforceLogin();
        // Aggregate query might not work nicely in some JSForce versions or depending on permissions, but let's try.
        // If GROUP BY fails, I'll just query all and aggregate in JS.
        const res = await conn.query("SELECT Class_Name__c FROM Teacher_Assignment__c");

        const counts = {};
        res.records.forEach(r => {
            counts[r.Class_Name__c] = (counts[r.Class_Name__c] || 0) + 1;
        });

        console.log('--- Class Counts ---');
        console.table(counts);

        const examRes = await conn.query("SELECT Exam_Type__c FROM Student_Mark__c GROUP BY Exam_Type__c");
        console.log('\n--- Exam Types ---');
        examRes.records.forEach(r => console.log(r.Exam_Type__c));

    } catch (err) {
        console.error(err);
    }
})();
