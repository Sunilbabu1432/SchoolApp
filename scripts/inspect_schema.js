require('dotenv').config();
const salesforceLogin = require('../config/salesforce');

(async () => {
    try {
        const conn = await salesforceLogin();

        console.log('--- Student_Mark__c Fields ---');
        const studentMarkDesc = await conn.sobject('Student_Mark__c').describe();
        studentMarkDesc.fields.forEach(f => console.log(`${f.name} (${f.type})`));

        console.log('\n--- Teacher_Assignment__c Fields ---');
        const teacherAssignDesc = await conn.sobject('Teacher_Assignment__c').describe();
        teacherAssignDesc.fields.forEach(f => console.log(`${f.name} (${f.type})`));

        console.log('\n--- Contact Fields ---');
        const contactDesc = await conn.sobject('Contact').describe();
        contactDesc.fields.forEach(f => console.log(`${f.name} (${f.type})`));

    } catch (err) {
        console.error('Error describing objects:', err);
    }
})();
