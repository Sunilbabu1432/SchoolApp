require('dotenv').config();
const salesforceLogin = require('../config/salesforce');

(async () => {
    try {
        console.log('🚀 Starting Data Seeding Script...');
        const conn = await salesforceLogin();

        // 1. Get a Student (Account via Contact)
        const contactRes = await conn.query("SELECT Id, Name, AccountId FROM Contact WHERE AccountId != null LIMIT 1");
        if (contactRes.records.length === 0) {
            console.error('❌ No Contact with AccountId found. Cannot create data.');
            return;
        }
        const accountId = contactRes.records[0].AccountId;
        const studentName = contactRes.records[0].Name;
        console.log(`👤 Using Student (Account): ${studentName} (${accountId})`);

        // 2. Define Data
        const testClass = 'Class-5';
        const examType = 'Unit Test';
        console.log(`🏫 Using Class: ${testClass}`);
        console.log(`📝 Exam Type: ${examType}`);

        // 3. Create Student Mark (Status = Submitted, Time = Past)
        console.log('📝 Inserting Student Mark...');
        const pastTime = new Date(Date.now() - 60000).toISOString(); // 1 min ago

        const result = await conn.sobject('Student_Mark__c').create({
            Student__c: accountId,
            Class__c: testClass,
            Exam_Type__c: examType,
            Status__c: 'Submitted',
            Publish_At__c: pastTime
        });

        if (result.success) {
            console.log(`✅ Student Mark created successfully!`);
            console.log(`🆔 Record ID: ${result.id}`);
            console.log(`📅 Publish At: ${pastTime}`);
            console.log(`ℹ️ This record is 'Submitted' and ready for the cronjob to pick up.`);
        } else {
            console.error('❌ Failed to create record.');
            console.error(result.errors);
        }

    } catch (err) {
        console.error('❌ Seeding Error:', err);
    } finally {
        process.exit();
    }
})();
