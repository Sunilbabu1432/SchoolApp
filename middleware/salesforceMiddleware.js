const salesforceLogin = require('../config/salesforce');

module.exports = async (req, res, next) => {
  try {
    const conn = await salesforceLogin();
    req.salesforce = conn; // 🔥 THIS IS THE FIX
    next();
  } catch (err) {
    console.error('Salesforce connection failed:', err);
    res.status(500).json({ message: 'Salesforce connection failed' });
  }
};
