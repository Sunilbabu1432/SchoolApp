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
      SELECT Id, Name, FCM_Token__c
      FROM Contact
      WHERE Id IN ('${teacherIds.join("','")}')
    `);

    const tokens = result.records
      .map(r => r.FCM_Token__c)
      .filter(t => t && t.length >20); // Remove null/undefined

    console.log('TOKENS FOUND =>', tokens);

    if (!tokens.length) {
      return res.status(404).json({ message: 'No tokens found' });
    }

    for (const token of tokens) {
      await sendPush(token, 'Message from Manager', message, {
        type: 'INFO',
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ PUSH ERROR =>', err.message);
    res.status(500).json({ message: 'Push failed' });
  }
});



module.exports = router;
