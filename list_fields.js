require('dotenv').config();
const salesforceLogin = require('./config/salesforce');

async function listFields() {
    try {
        const conn = await salesforceLogin();
        const describe = await conn.sobject('Account').describe();
        console.log('--- Account Fields ---');
        describe.fields.forEach(f => {
            if (f.name.endsWith('__c') || f.name === 'Name' || f.name === 'Id') {
                console.log(`${f.name} (${f.label})`);
            }
        });
    } catch (err) {
        console.error(err);
    }
}

listFields();
