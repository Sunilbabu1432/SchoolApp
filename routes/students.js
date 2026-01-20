const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');

router.get('/', auth, async (req, res) => {
  try {
    const conn = await salesforceLogin();

    const result = await conn.query(`
      SELECT Id, Name
      FROM Account
      WHERE Type = 'Student'
      LIMIT 50
    `);

    res.json({
      success: true,
      students: result.records,
    });
  } catch (err) {
    console.error('STUDENT FETCH ERROR =>', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
