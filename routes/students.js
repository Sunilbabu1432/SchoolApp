const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');

router.get('/', auth, async (req, res) => {
  try {
    const conn = await salesforceLogin();

    const className = req.query.class; // 🔑 optional

    // ✅ BASE QUERY (same as before)
    let query = `
      SELECT Id, Name
      FROM Account
      WHERE Type = 'Student'
    `;

    // ✅ ONLY ADD FILTER IF CLASS IS SENT
    if (className) {
      query += ` AND Class__c = '${className}'`;
    }

    query += ' LIMIT 50';

    const result = await conn.query(query);

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
