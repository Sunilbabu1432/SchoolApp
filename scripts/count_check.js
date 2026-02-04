require('dotenv').config();
const salesforceLogin = require('../config/salesforce');
(async () => {
    try {
        const conn = await salesforceLogin();
        const t = await conn.query("SELECT COUNT(Id) cnt FROM Contact WHERE Type__c = 'Teacher'");
        const s = await conn.query("SELECT COUNT(Id) cnt FROM Account WHERE Type = 'Student'");
        const m = await conn.query("SELECT COUNT(Id) cnt FROM Contact WHERE Type__c = 'Manager'");
        const a = await conn.query("SELECT COUNT(Id) cnt FROM Teacher_Assignment__c");
        const p = await conn.query("SELECT COUNT(Id) cnt FROM Contact WHERE AccountId != null AND Type__c NOT IN ('Teacher', 'Manager')");

        const smCheck = await conn.query("SELECT COUNT(Id) cnt FROM Account WHERE Type = 'Student' AND Manager__c != null");

        console.log('--- Current Counts (v2) ---');
        console.log('Managers:', m.records[0].cnt);
        console.log('Teachers:', t.records[0].cnt);
        console.log('Students (Accounts):', s.records[0].cnt);
        console.log('Parents (Contacts):', p.records[0].cnt);
        console.log('Assignments:', a.records[0].cnt);
        console.log('Students with Manager Lookup:', smCheck.records[0].cnt);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
})();
