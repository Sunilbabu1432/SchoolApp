require('dotenv').config();
const salesforceLogin = require('../config/salesforce');

(async () => {
    try {
        const conn = await salesforceLogin();
        const res = await conn.query("SELECT Id, Subject__c, Class_Name__c FROM Teacher_Assignment__c WHERE Class_Name__c = 'Class-10'");
        console.log('Assignments found:', res.records.length);
        res.records.forEach(r => console.log(`- ${r.Subject__c}`));

        const marks = await conn.query("SELECT COUNT(Id) cnt FROM Student_Mark__c WHERE Class__c = 'Class-10' AND Status__c = 'Submitted'");
        console.log('Submitted Marks found:', marks.records[0].cnt);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
