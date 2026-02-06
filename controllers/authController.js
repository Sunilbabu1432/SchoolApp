const jwt = require('jsonwebtoken');
const salesforceLogin = require('../config/salesforce');

// Temporary in-memory storage for OTPs. 
// In production, use Redis or a database with TTL.
const otpStore = new Map();

exports.requestOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile required' });
    }

    const conn = await salesforceLogin();

    // Verify if mobile number exists in Salesforce
    const result = await conn.query(`
      SELECT Id, Name, Type__c, MobilePhone
      FROM Contact
      WHERE MobilePhone = '${mobile}'
      LIMIT 1
    `);

    if (!result.records.length) {
      return res.status(401).json({ message: 'No contact found with this mobile number' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (5 minutes)
    otpStore.set(mobile, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // 🚀 SIMULATION: Log OTP to console (In real app, send via SMS)
    console.log(`------------------------------`);
    console.log(`📱 OTP for ${mobile}: ${otp}`);
    console.log(`------------------------------`);

    res.json({ message: 'OTP sent successfully' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ message: 'Mobile and OTP required' });
    }

    // Verify OTP
    const stored = otpStore.get(mobile);
    if (!stored) {
      return res.status(401).json({ message: 'OTP expired or not requested' });
    }

    if (stored.expiresAt < Date.now()) {
      otpStore.delete(mobile);
      return res.status(401).json({ message: 'OTP expired' });
    }

    if (stored.otp !== otp) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    // Clear OTP after successful use
    otpStore.delete(mobile);

    const conn = await salesforceLogin();

    const result = await conn.query(`
      SELECT Id, Name, Type__c, MobilePhone, AccountId
      FROM Contact
      WHERE MobilePhone = '${mobile}'
      LIMIT 1
    `);

    if (!result.records.length) {
      return res.status(404).json({ message: 'Contact not found' });
    }

    const user = result.records[0];

    // 🔐 JWT payload
    const payload = {
      contactId: user.Id,
      role: user.Type__c,
    };

    if (user.Type__c === 'Parent') {
      payload.studentAccountId = user.AccountId;
    }

    // Session valid for 24 hours
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      contactId: user.Id,
      role: user.Type__c,
      name: user.Name,
      studentAccountId: user.Type__c === 'Parent' ? user.AccountId : null,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
