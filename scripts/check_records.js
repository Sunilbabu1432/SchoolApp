require('dotenv').config();
const salesforceLogin = require('../config/salesforce');
(async () => {
    try {
        const conn = await salesforceLogin();
        const now = new Date();
        console.log('Current Server Time (Local):', now.toString());
        console.log('Current Server Time (ISO/UTC):', now.toISOString());

        const query = `
            SELECT Id, Exam_Type__c, Class__c, Status__c, Publish_At__c 
            FROM Student_Mark__c 
            WHERE Publish_At__c != null 
            AND Status__c = 'Submitted'
            ORDER BY Publish_At__c ASC 
            LIMIT 10
        `;
        const res = await conn.query(query);

        console.log('\n--- Pending Scheduled Marks ---');
        res.records.forEach(r => {
            const pubDate = new Date(r.Publish_At__c);
            const diffMin = Math.round((pubDate - now) / 60000);
            console.log(`ID: ${r.Id}`);
            console.log(`  Exam: ${r.Exam_Type__c} | Class: ${r.Class__c}`);
            console.log(`  Publish_At__c: ${r.Publish_At__c}`);
            console.log(`  Publish Time (IST): ${pubDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
            console.log(`  Status: ${r.Status__c}`);
            console.log(`  Will publish in: ${diffMin} minutes`);
            console.log('-----------------------------------');
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
})();
