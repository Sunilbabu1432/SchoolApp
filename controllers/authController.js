const jwt = require('jsonwebtoken');
const salesforceLogin = require('../config/salesforce');

exports.login = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile required' });
    }

    const conn = await salesforceLogin();

    const result = await conn.query(`
      SELECT Id, Name, Type__c, MobilePhone
      FROM Contact
      WHERE MobilePhone = '${mobile}'
      LIMIT 1
    `);

    if (!result.records.length) {
      return res.status(401).json({ message: 'No contact found' });
    }

    const user = result.records[0];

    const token = jwt.sign(
      { contactId: user.Id, role: user.Type__c },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      contactId: user.Id,
      role: user.Type__c,
      name: user.Name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
