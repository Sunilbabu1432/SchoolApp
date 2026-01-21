const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');
const { sendPush } = require('../services/pushService');

/**
 * ================================
 * CREATE CASE (Teacher → Manager)
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

    // 2️⃣ Fetch Student Account (ONLY Manager lookup)
    const accountResult = await conn.query(`
      SELECT Id, Name, Manager__c
      FROM Account
      WHERE Id = '${studentAccountId}'
      LIMIT 1
    `);

    if (
      !accountResult.records.length ||
      !accountResult.records[0].Manager__c
    ) {
      console.log('❌ MANAGER NOT LINKED TO STUDENT');
      return res.json({
        success: true,
        caseId: caseResult.id,
      });
    }

    const managerContactId = accountResult.records[0].Manager__c;
    const studentName = accountResult.records[0].Name;

    // 3️⃣ Fetch Manager Contact + FCM Token
    const managerResult = await conn.query(`
      SELECT Id, Name, FCM_Token__c
      FROM Contact
      WHERE Id = '${managerContactId}'
      LIMIT 1
    `);

    if (
      managerResult.records.length &&
      managerResult.records[0].FCM_Token__c
    ) {
      const manager = managerResult.records[0];

      console.log('👤 MANAGER FOUND =>', manager.Name);

      // 4️⃣ Send Push Notification
      await sendPush(
        manager.FCM_Token__c,
        'New Student Complaint',
        subject,
        {
          type: 'CASE',
          caseId: caseResult.id,
          subject,
          description: description || '',
          studentName,
        }
      );
    } else {
      console.log('❌ MANAGER TOKEN NOT FOUND');
    }

    res.json({
      success: true,
      caseId: caseResult.id,
    });
  } catch (err) {
    console.error('❌ CASE ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to create case' });
  }
});

/**
 * ================================
 * GET CASE DETAILS
 * ================================
 */
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
    console.error('❌ GET CASE ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to fetch case' });
  }
});

module.exports = router;
