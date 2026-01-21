const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');

router.post('/', auth, async (req, res) => {
  try {
    console.log('🔥 SAVE TOKEN HIT');

    // 🔹 ONLY CHANGE IS HERE 👇
    const { fcmToken } = req.body;   // ✅ was: token
    const contactId = req.user.contactId;

    if (!fcmToken) {
      return res.status(400).json({ message: 'Token missing' });
    }

    if (!contactId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const conn = await salesforceLogin();

    await conn.sobject('Contact').update({
      Id: contactId,
      FCM_Token__c: fcmToken,        // ✅ same variable
    });

    console.log('✅ TOKEN SAVED TO CONTACT =>', contactId);

    res.json({ success: true });

  } catch (err) {
    console.error('❌ SAVE TOKEN ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to save token' });
  }
});

module.exports = router;
