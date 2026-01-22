const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');
const { sendPush } = require('../services/pushService');

/**
 * ================================
 * TEACHER → MANAGER (CREATE CASE)
 * ================================
 */
router.post('/', auth, async (req, res) => {
  try {
    const { studentAccountId, subject, description } = req.body;

    if (!studentAccountId || !subject) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const conn = await salesforceLogin();

    // 1️⃣ Create Case
    const caseResult = await conn.sobject('Case').create({
      Subject: subject,
      Description: description || '',
      Status: 'New',
      Origin: 'Mobile App',
      AccountId: studentAccountId,
    });

    console.log('✅ CASE CREATED =>', caseResult.id);

    // 🔹 Fetch CaseNumber (VERY IMPORTANT)
const caseInfo = await conn.query(`
  SELECT Id, CaseNumber
  FROM Case
  WHERE Id = '${caseResult.id}'
  LIMIT 1
`);

const caseNumber = caseInfo.records[0]?.CaseNumber;


    // 2️⃣ Fetch Student Account + Manager lookup
    const accRes = await conn.query(`
      SELECT Id, Name, Manager__c
      FROM Account
      WHERE Id = '${studentAccountId}'
      LIMIT 1
    `);

    if (!accRes.records.length) {
      console.log('❌ STUDENT ACCOUNT NOT FOUND');
      return res.json({ success: true, caseId: caseResult.id });
    }

    const student = accRes.records[0];

    if (!student.Manager__c) {
      console.log('❌ MANAGER NOT LINKED IN ACCOUNT');
      return res.json({ success: true, caseId: caseResult.id });
    }

    // 3️⃣ Fetch Manager Contact
    const mgrRes = await conn.query(`
      SELECT Id, Name, FCM_Token__c
      FROM Contact
      WHERE Id = '${student.Manager__c}'
      LIMIT 1
    `);

    if (!mgrRes.records.length) {
      console.log('❌ MANAGER CONTACT NOT FOUND');
      return res.json({ success: true, caseId: caseResult.id });
    }

    const manager = mgrRes.records[0];
    console.log('👤 MANAGER FOUND =>', manager.Name);

    if (!manager.FCM_Token__c) {
      console.log('❌ MANAGER TOKEN NOT FOUND');
      return res.json({ success: true, caseId: caseResult.id });
    }

    // 4️⃣ Send Push
   await sendPush(
  manager.FCM_Token__c,
  'New Student Complaint',
  subject,
  {
    type: 'CASE',
    caseId: caseResult.id,      // backend fetch ki
    caseNumber: caseNumber,     // UI display ki
    studentName: student.Name,
  }
);


    console.log('✅ PUSH SENT TO MANAGER');

    res.json({
  success: true,
  caseId: caseResult.id,
  caseNumber,
});


  } catch (err) {
    console.error('❌ CASE ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to create case' });
  }
});

// 🔹 MANAGER – GET CASE DETAILS
router.get('/:id', auth, async (req, res) => {
  try {
    const conn = await salesforceLogin();

    const result = await conn.query(`
      SELECT 
        Id,
        CaseNumber,
        Subject,
        Description,
        Status,
        Account.Name
      FROM Case
      WHERE Id = '${req.params.id}'
      LIMIT 1
    `);

    if (!result.records.length) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    const c = result.records[0];

    // ✅ IMPORTANT: frontend expect chesedhi ee structure
    res.json({
      caseId: c.CaseNumber,          // display ki
      subject: c.Subject || '',
      description: c.Description || '',
      status: c.Status,
      studentName: c.Account?.Name || '',
    });

  } catch (err) {
    console.error('❌ GET CASE ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to load complaint' });
  }
});


module.exports = router;
