require('dotenv').config();
const salesforceLogin = require('../config/salesforce');

(async () => {
    try {
        console.log('🧹 Starting Data Cleanup (v2/Realistic)...');
        const conn = await salesforceLogin();

        // 1. Delete Student Marks
        console.log('🗑️ Deleting Student Marks created today...');
        const markRes = await conn.query("SELECT Id FROM Student_Mark__c WHERE CreatedDate = TODAY");
        if (markRes.records.length > 0) {
            await conn.sobject('Student_Mark__c').del(markRes.records.map(r => r.Id));
            console.log(`✅ Deleted ${markRes.records.length} marks.`);
        }

        // 2. Delete Teacher Assignments
        console.log('🗑️ Deleting Teacher Assignments created today...');
        const assignRes = await conn.query("SELECT Id FROM Teacher_Assignment__c WHERE CreatedDate = TODAY");
        if (assignRes.records.length > 0) {
            await conn.sobject('Teacher_Assignment__c').del(assignRes.records.map(r => r.Id));
            console.log(`✅ Deleted ${assignRes.records.length} assignments.`);
        }

        // 3. Delete Parents (Contacts linked to Accounts)
        console.log('🗑️ Deleting Parents created today...');
        const parentRes = await conn.query("SELECT Id FROM Contact WHERE FirstName = 'Parent' AND CreatedDate = TODAY");
        if (parentRes.records.length > 0) {
            await conn.sobject('Contact').del(parentRes.records.map(r => r.Id));
            console.log(`✅ Deleted ${parentRes.records.length} parents.`);
        }

        // 4. Delete Teachers and Managers (Contacts)
        console.log('🗑️ Deleting Teachers and Managers created today...');
        const tmRes = await conn.query("SELECT Id FROM Contact WHERE Type__c IN ('Teacher', 'Manager') AND CreatedDate = TODAY");
        if (tmRes.records.length > 0) {
            await conn.sobject('Contact').del(tmRes.records.map(r => r.Id));
            console.log(`✅ Deleted ${tmRes.records.length} staff contacts (Teachers/Managers).`);
        }

        // 5. Delete Students (Accounts)
        console.log('🗑️ Deleting Students (Accounts) created today...');
        const studentRes = await conn.query("SELECT Id FROM Account WHERE Type = 'Student' AND CreatedDate = TODAY");
        if (studentRes.records.length > 0) {
            await conn.sobject('Account').del(studentRes.records.map(r => r.Id));
            console.log(`✅ Deleted ${studentRes.records.length} students.`);
        }

        console.log('\n✨ CLEANUP COMPLETE! All data added today has been removed.');

    } catch (err) {
        console.error('❌ Cleanup Error:', err);
    } finally {
        process.exit();
    }
})();
