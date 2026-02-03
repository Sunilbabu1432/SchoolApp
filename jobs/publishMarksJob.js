const cron = require('node-cron');
const salesforceLogin = require('../config/salesforce');
const { sendPushBulk } = require('../services/pushService');

cron.schedule('*/5 * * * *', async () => {
  console.log('⏳ CRON: Checking scheduled exams with counting logic...');

  try {
    const conn = await salesforceLogin();

    // 1️⃣ Find exam + class combinations which have submitted marks & schedule set
    const pendingRes = await conn.query(`
      SELECT Exam_Type__c, Class__c
      FROM Student_Mark__c
      WHERE Status__c = 'Submitted'
        AND Publish_At__c != null
      GROUP BY Exam_Type__c, Class__c
    `);

    if (!pendingRes.records.length) {
      console.log('✅ CRON: Nothing to check');
      return;
    }

    for (const row of pendingRes.records) {
      const examType = row.Exam_Type__c;
      const className = row.Class__c;

      // 2️⃣ Expected teachers / subjects count from Teacher_Assignment__c
      const expectedRes = await conn.query(`
        SELECT COUNT(Id) cnt
        FROM Teacher_Assignment__c
        WHERE Class_Name__c = '${className}'
      `);

      const expectedCount = expectedRes.records[0]?.cnt || 0;

      if (expectedCount === 0) {
        console.log(`⚠️ No teacher assignments for ${className}`);
        continue;
      }

      // 3️⃣ Fetch submitted marks WITH Publish_At__c
      const submittedRes = await conn.query(`
        SELECT Id, Student__c, Publish_At__c
        FROM Student_Mark__c
        WHERE Exam_Type__c = '${examType}'
          AND Class__c = '${className}'
          AND Status__c = 'Submitted'
          AND Publish_At__c != null
      `);

      const now = new Date();

      // ⏰ Time check in Node (NO NOW() in SOQL)
      const readyMarks = submittedRes.records.filter(r =>
        new Date(r.Publish_At__c) <= now
      );

      const submittedCount = readyMarks.length;

      // 4️⃣ Validation: all teachers submitted + time reached
      if (submittedCount < expectedCount) {
        console.log(
          `⏸️ Waiting: ${className} ${examType} (${submittedCount}/${expectedCount})`
        );
        continue; // ❌ Do not publish
      }

      // 5️⃣ Publish marks
      await conn.sobject('Student_Mark__c').update(
        readyMarks.map(r => ({
          Id: r.Id,
          Status__c: 'Published',
        }))
      );

      console.log(
        `🚀 Published ${submittedCount} marks for ${className} ${examType}`
      );

      // 6️⃣ Notify parents
      const studentIds = [...new Set(readyMarks.map(r => r.Student__c))];

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
          `${examType} results published for ${className}`,
          { type: 'RESULT_PUBLISHED', examType, className }
        );
        console.log(`🔔 Notified ${tokens.length} parents`);
      }
    }

  } catch (err) {
    console.error('❌ CRON ERROR =>', err.message);
  }
});

console.log('✅ publishMarksJob cron with counting initialized');
