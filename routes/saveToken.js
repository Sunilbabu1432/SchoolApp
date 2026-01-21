const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');

router.post('/', auth, async (req, res) => {
  const { token } = req.body;
  const contactId = req.user.contactId;

  if (!token) {
    return res.status(400).json({ message: 'Token missing' });
  }

  const conn = await salesforceLogin();
  await conn.sobject('Contact').update({
    Id: contactId,
    FCM_Token__c: token,
  });

  res.json({ success: true });
});

module.exports = router;
