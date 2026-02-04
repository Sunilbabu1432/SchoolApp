require('dotenv').config();
const salesforceLogin = require('../config/salesforce');

(async () => {
    try {
        console.log('🕒 Timezone Synchronization Diagnosis');
        console.log('====================================');

        const now = new Date();
        console.log('Server Time (Local): ', now.toString());
        console.log('Server Time (UTC):   ', now.toISOString());

        const conn = await salesforceLogin();

        // 1. Get Org Info
        const orgInfo = await conn.query("SELECT TimeZoneSidKey FROM Organization LIMIT 1");
        console.log('Salesforce Org TimeZone:', orgInfo.records[0].TimeZoneSidKey);

        // 2. Get User Info
        const userInfo = await conn.query(`SELECT Name, TimeZoneSidKey FROM User WHERE Username = '${process.env.SF_USERNAME}' LIMIT 1`);
        if (userInfo.records.length > 0) {
            console.log('Connected User:', userInfo.records[0].Name);
            console.log('User TimeZone Setting:', userInfo.records[0].TimeZoneSidKey);
        }

        // 3. Check Recent Marks
        console.log('\n🔍 Recent Marks Data:');
        const marks = await conn.query("SELECT Id, Publish_At__c, CreatedDate, Class__c FROM Student_Mark__c ORDER BY CreatedDate DESC LIMIT 1");
        if (marks.records.length > 0) {
            const m = marks.records[0];
            console.log(`Mark ID: ${m.Id} (${m.Class__c})`);
            console.log(`CreatedDate (UTC):   ${m.CreatedDate}`);
            console.log(`Publish_At__c (UTC): ${m.Publish_At__c}`);

            // Show human readable IST (GMT+5:30)
            const pubDate = new Date(m.Publish_At__c);
            console.log(`Publish_At__c (IST): ${pubDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        } else {
            console.log('No marks found in Org.');
        }

    } catch (err) {
        console.error('❌ Diagnosis Error:', err);
    } finally {
        process.exit();
    }
})();
