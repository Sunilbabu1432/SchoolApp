const jwt = require('jsonwebtoken');
const salesforceLogin = require('../config/salesforce');

exports.login = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile required' });
    }

    const conn = await salesforceLogin();

    // 🔹 Parent ki AccountId kavali kabatti include chesam
    const result = await conn.query(`
      SELECT Id, Name, Type__c, MobilePhone, AccountId
      FROM Contact
      WHERE MobilePhone = '${mobile}'
      LIMIT 1
    `);

    if (!result.records.length) {
      return res.status(401).json({ message: 'No contact found' });
    }

    const user = result.records[0];

    // 🔐 JWT payload
    const payload = {
      contactId: user.Id,
      role: user.Type__c,
    };

    // 🔹 ONLY FOR PARENT – studentAccountId add
    if (user.Type__c === 'Parent') {
      payload.studentAccountId = user.AccountId;
    }

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      contactId: user.Id,
      role: user.Type__c,
      name: user.Name,

      // 🔹 frontend ki easy ga kavali antey
      studentAccountId:
        user.Type__c === 'Parent' ? user.AccountId : null,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
