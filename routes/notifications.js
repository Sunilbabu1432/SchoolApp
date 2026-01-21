const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');
const admin = require('../firebase/firebaseAdmin');

router.post('/notifications/manager-to-teachers', auth, async (req, res) => {
  try {
    const { teacherIds, message } = req.body;

    console.log('TEACHER IDS =>', teacherIds);

    if (!teacherIds || !teacherIds.length) {
      return res.status(400).json({ message: 'No teachers selected' });
    }

    // 🔑 STEP 1: Salesforce nundi teachers FCM token fetch
    const conn = await salesforceLogin();

    const result = await conn.query(`
      SELECT Id, FCM_Token__c
      FROM Contact
      WHERE Id IN ('${teacherIds.join("','")}')
    `);

    const tokens = result.records
      .map(r => r.FCM_Token__c)
      .filter(Boolean);

    console.log('TOKENS FOUND =>', tokens);

    if (!tokens.length) {
      return res
        .status(400)
        .json({ message: 'No devices found for selected teachers' });
    }

    // 🔔 STEP 2: Send Push
    const messages = tokens.map(token => ({
      token,
      notification: {
        title: 'Message from Manager',
        body: message,
      },
    }));

    await admin.messaging().sendEach(messages);

    return res.json({ success: true });
  } catch (err) {
    console.error('SEND NOTIFICATION ERROR =>', err.message);
    return res.status(500).json({ message: 'Failed to send notification' });
  }
});

module.exports = router;
