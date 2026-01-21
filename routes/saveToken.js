const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');

router.post('/save-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token missing' });
    }

    const contactId = req.user.contactId;

    const conn = await salesforceLogin();
    await conn.sobject('Contact').update({
      Id: contactId,
      FCM_Token__c: token,
    });

    console.log('✅ TOKEN SAVED TO CONTACT =>', contactId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save token' });
  }
});



module.exports = router;
