const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');

router.post('/', auth, async (req, res) => {
  try {
    console.log('🔥 SAVE TOKEN HIT');

    const { token } = req.body;
    const contactId = req.user.contactId; // ✅ FIX HERE

    if (!token) {
      return res.status(400).json({ message: 'Token missing' });
    }

    if (!contactId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conn = await salesforceLogin();

    await conn.sobject('Contact').update({
      Id: contactId,
      FCM_Token__c: token,
    });

    console.log('✅ TOKEN SAVED TO CONTACT =>', contactId);

    res.json({ success: true });

  } catch (err) {
    console.error('❌ SAVE TOKEN ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to save token' });
  }
});

module.exports = router;
