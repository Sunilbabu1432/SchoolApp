const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');
const { sendPush } = require('../services/pushService');

/**
 * MANAGER → APPROVE / REJECT MARKS
 */
router.post('/', auth, async (req, res) => {
  try {
    const { markId, action } = req.body; // action = APPROVE | REJECT

    if (!markId || !action) {
      return res.status(400).json({ message: 'Missing data' });
    }

    const conn = await salesforceLogin();

    // 1️⃣ Update status
    const statusValue = action === 'APPROVE' ? 'Approved' : 'Rejected';

    await conn.sobject('Student_Mark__c').update({
      Id: markId,
      Status__c: statusValue,
    });

    // 2️⃣ Get teacher for push
    const markRes = await conn.query(`
      SELECT Id, Teacher__r.FCM_Token__c
      FROM Student_Mark__c
      WHERE Id='${markId}'
      LIMIT 1
    `);

    const teacherToken =
      markRes.records[0]?.Teacher__r?.FCM_Token__c;

    if (teacherToken) {
      await sendPush(
        teacherToken,
        `Marks ${statusValue}`,
        `Manager has ${statusValue.toLowerCase()} the marks`,
        {
          type: 'MARK_ACTION',
          status: statusValue,
        }
      );
    }

    res.json({ success: true, status: statusValue });

  } catch (err) {
    console.error('❌ MARK ACTION ERROR', err.message);
    res.status(500).json({ message: 'Action failed' });
  }
});

module.exports = router;
