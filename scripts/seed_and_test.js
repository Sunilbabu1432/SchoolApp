require('dotenv').config();
const salesforceLogin = require('../config/salesforce');
const { checkAndPublishMarks } = require('../jobs/publishMarksJob');

(async () => {
    try {
        console.log('🚀 Starting Test Script...');
        const conn = await salesforceLogin();

        // 1. Get a Student (Account via Contact)
        const contactRes = await conn.query("SELECT Id, Name, AccountId FROM Contact WHERE AccountId != null LIMIT 1");
        if (contactRes.records.length === 0) {
            console.error('❌ No Contact with AccountId found. Cannot create test data.');
            return;
        }
        const accountId = contactRes.records[0].AccountId;
        const studentName = contactRes.records[0].Name;
        console.log(`👤 Using Student (Account): ${studentName} (${accountId})`);

        // 2. Define Test Data
        const testClass = 'Class-5'; // Found via check_classes.js (Count = 1)
        const examType = 'Unit Test';
        console.log(`🏫 Using Class: ${testClass}`);
        console.log(`📝 Exam Type: ${examType}`);

        // 3. Skip Teacher Assignment (Already exists for Class-5)
        console.log('ℹ️ Teacher Assignment already exists (Count=1). Skipping creation.');

        // 4. Create Student Mark (Status = Submitted, Time = Past)
        console.log('📝 Creating Student Mark...');
        const pastTime = new Date(Date.now() - 60000).toISOString(); // 1 min ago
        await conn.sobject('Student_Mark__c').create({
            Student__c: accountId,
            Class__c: testClass,
            Exam_Type__c: examType,
            Status__c: 'Submitted',
            Publish_At__c: pastTime
        });
        console.log(`✅ Student Mark created (Publish_At: ${pastTime}).`);

        // 5. Run the Cron Logic Manually
        console.log('\n⏳ Triggering Cron Function Manually... (Waiting 2s for propagation)');
        await new Promise(r => setTimeout(r, 2000));
        await checkAndPublishMarks();

        // 6. Verify Result
        console.log('\n🔍 Verifying Result...');

        // Wait a small moment for async update if any (should be awaited in job though)

        const verifyRes = await conn.query(`
            SELECT Id, Status__c 
            FROM Student_Mark__c 
            WHERE Class__c = '${testClass}' 
            AND Exam_Type__c = '${examType}'
        `);

        if (verifyRes.records.length && verifyRes.records[0].Status__c === 'Published') {
            console.log('🎉 SUCCESS: Mark status changed to "Published"!');
        } else {
            console.error('❌ FAILURE: Mark status is ' + (verifyRes.records[0]?.Status__c || 'Unknown'));
        }

    } catch (err) {
        console.error('❌ Test Script Error:', err);
    } finally {
        // Optional: Cleanup
        // await conn.sobject('Student_Mark__c').destroy(markId);
        // await conn.sobject('Teacher_Assignment__c').destroy(assignId);
        process.exit();
    }
})();
