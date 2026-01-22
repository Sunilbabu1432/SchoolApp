const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');
const { sendPush } = require('../services/pushService');

router.post('/manager-to-teachers', auth, async (req, res) => {
  try {
    const { teacherIds, message } = req.body;

    if (!teacherIds || !teacherIds.length || !message) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

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

    for (const token of tokens) {
      await sendPush(token, 'Message from Manager', message);
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Push failed' });
  }
});

module.exports = router;
