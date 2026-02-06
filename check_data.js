require('dotenv').config();
const salesforceLogin = require('./config/salesforce');

async function checkData() {
    try {
        const conn = await salesforceLogin();
        const result = await conn.query("SELECT Name, Class__c, Section__c FROM Account WHERE Type = 'Student' LIMIT 10");
        console.log('--- Sample Students ---');
        result.records.forEach(r => console.log(`${r.Name} | Class: ${r.Class__c} | Section: ${r.Section__c}`));
    } catch (err) {
        console.error(err);
    }
}

checkData();
