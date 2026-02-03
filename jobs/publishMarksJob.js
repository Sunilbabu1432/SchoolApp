const cron = require('node-cron');
const salesforceLogin = require('../config/salesforce');
const { sendPushBulk } = require('../services/pushService');

/**
 * ⏰ CRON: Runs every 5 minutes
 * Publishes scheduled marks automatically
 */
cron.schedule('*/5 * * * *', async () => {
  console.log('⏳ CRON: Checking scheduled marks...');

  try {
    const conn = await salesforceLogin();

    // 1️⃣ Find marks ready to publish
    const marksRes = await conn.query(`
      SELECT Id, Student__c, Exam_Type__c, Class__c
      FROM Student_Mark__c
      WHERE Status__c = 'Submitted'
        AND Publish_At__c != null
        AND Publish_At__c <= NOW()
    `);

    if (!marksRes.records.length) {
      console.log('✅ CRON: No marks to publish');
      return;
    }

    // 2️⃣ Publish marks
    await conn.sobject('Student_Mark__c').update(
      marksRes.records.map(r => ({
        Id: r.Id,
        Status__c: 'Published',
      }))
    );

    console.log(`🚀 CRON: Published ${marksRes.records.length} marks`);

    // 3️⃣ Notify parents
    const studentIds = [...new Set(marksRes.records.map(r => r.Student__c))];

    const parentsRes = await conn.query(`
      SELECT FCM_Token__c
      FROM Contact
      WHERE AccountId IN (${studentIds.map(id => `'${id}'`).join(',')})
        AND FCM_Token__c != null
    `);

    const tokens = parentsRes.records.map(r => r.FCM_Token__c);

    if (tokens.length) {
      await sendPushBulk(
        tokens,
        '📢 Exam Results Published',
        'Your exam results have been published',
        { type: 'RESULT_PUBLISHED' }
      );
      console.log(`🔔 CRON: Notified ${tokens.length} parents`);
    }

  } catch (err) {
    console.error('❌ CRON ERROR =>', err.message);
  }
});

console.log('✅ publishMarksJob cron initialized');
