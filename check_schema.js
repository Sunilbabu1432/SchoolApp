require('dotenv').config();
const salesforceLogin = require('./config/salesforce');

async function checkSchema() {
    try {
        const conn = await salesforceLogin();
        const describe = await conn.sobject('Account').describe();
        const sectionFields = describe.fields.filter(f => f.name.toLowerCase().includes('section') || f.label.toLowerCase().includes('section'));
        console.log('--- Section Fields on Account ---');
        sectionFields.forEach(f => console.log(`${f.name} (${f.label})`));

        const classFields = describe.fields.filter(f => f.name.toLowerCase().includes('class') || f.label.toLowerCase().includes('class'));
        console.log('\n--- Class Fields on Account ---');
        classFields.forEach(f => console.log(`${f.name} (${f.label})`));
    } catch (err) {
        console.error(err);
    }
}

checkSchema();
