const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');

router.get('/', auth, async (req, res) => {
  try {
    const conn = await salesforceLogin();

    const className = req.query.class;
    const sectionName = req.query.section;

    // ✅ BASE QUERY
    let query = `
      SELECT Id, Name, Section__c
      FROM Account
      WHERE Type = 'Student'
    `;

    // ✅ ADD FILTERS
    if (className) {
      query += ` AND Class__c = '${className}'`;
    }
    if (sectionName && sectionName !== 'All') {
      query += ` AND Section__c = '${sectionName}'`;
    }

    query += ' LIMIT 100';

    console.log('[STUDENTS FETCH] Generated SOQL:', query);

    const result = await conn.query(query);
    console.log(`[STUDENTS FETCH] Found ${result.records.length} students`);

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
