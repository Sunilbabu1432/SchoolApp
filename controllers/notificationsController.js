const salesforceLogin = require('../config/salesforce');

exports.saveToken = async (req, res) => {
  try {
    const { token } = req.body;           // 👈 MUST be "token"
    const { contactId } = req.user;       // 👈 from JWT

    if (!token) {
      return res.status(400).json({ message: 'Token missing' });
    }

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
};
