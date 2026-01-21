const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');
const { sendPush } = require('../services/pushService');

router.post('/notifications/manager-to-teachers', auth, async (req, res) => {
  try {
    const { teacherIds, message } = req.body;

    if (!teacherIds || !teacherIds.length) {
      return res.status(400).json({ message: 'No teachers selected' });
    }

    const conn = await salesforceLogin();

    const result = await conn.query(`
      SELECT Id, Name, FCM_Token__c
      FROM Contact
      WHERE Id IN ('${teacherIds.join("','")}')
    `);

    const teachers = result.records.filter(t => t.FCM_Token__c);

    if (!teachers.length) {
      return res
        .status(400)
        .json({ message: 'No valid FCM tokens found' });
    }

    // 🔔 SEND PUSH ONE BY ONE (SAFE)
    for (const teacher of teachers) {
      await sendPush(
        teacher.FCM_Token__c,
        'Message from Manager',
        message,
        {
          type: 'INFO',
        }
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ SEND NOTIFICATION ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

module.exports = router;
