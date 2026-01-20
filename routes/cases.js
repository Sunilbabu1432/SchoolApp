const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');
const { sendPush } = require('../services/pushService');

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

    // 2️⃣ Fetch Student + Manager
    const accountResult = await conn.query(`
      SELECT Id, Name,
             Manager__r.Id,
             Manager__r.Name,
             Manager__r.FCM_Token__c
      FROM Account
      WHERE Id = '${studentAccountId}'
      LIMIT 1
    `);

    if (
      accountResult.records.length &&
      accountResult.records[0].Manager__r &&
      accountResult.records[0].Manager__r.FCM_Token__c
    ) {
      const manager = accountResult.records[0].Manager__r;
      const studentName = accountResult.records[0].Name;

      console.log('👤 MANAGER FOUND =>', manager.Name);

      // 3️⃣ SEND PUSH (FULL PAYLOAD)
      await sendPush(
  manager.FCM_Token__c,
  'New Student Complaint',
  subject,
  {
    type: 'CASE',
    caseId: caseResult.id,
    subject: subject,
    description: description || '',
    studentName: studentName,
  }
);

    } else {
      console.log('❌ MANAGER OR TOKEN NOT FOUND');
    }

    res.json({
      success: true,
      caseId: caseResult.id,
    });

  } catch (err) {
    console.error('CASE ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to create case' });
  }
});

router.get('/:caseId', auth, async (req, res) => {
  try {
    const { caseId } = req.params;

    const conn = await salesforceLogin();

    const result = await conn.query(`
      SELECT Id, Subject, Description, Status,
             Account.Name
      FROM Case
      WHERE Id = '${caseId}'
      LIMIT 1
    `);

    if (!result.records.length) {
      return res.status(404).json({ message: 'Case not found' });
    }

    const c = result.records[0];

    res.json({
      caseId: c.Id,
      subject: c.Subject,
      description: c.Description,
      status: c.Status,
      studentName: c.Account?.Name || '',
    });

  } catch (err) {
    console.error('GET CASE ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to fetch case' });
  }
});


module.exports = router;
