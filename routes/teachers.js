const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');

router.get('/', auth, async (req, res) => {
  try {
    const conn = await salesforceLogin();

    const result = await conn.query(`
      SELECT Id, Name, Phone, Email
      FROM Contact
      WHERE Type__c = 'Teacher'
      LIMIT 50
    `);

    res.json({
      success: true,
      teachers: result.records,
    });
  } catch (err) {
    console.error('TEACHER FETCH ERROR =>', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
