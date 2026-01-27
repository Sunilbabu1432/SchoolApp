const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');
const { sendPush, sendPushBulk } = require('../services/pushService');

/**
 * =====================================
 * TEACHER → SUBMIT MARKS
 * =====================================
 */
router.post('/', auth, async (req, res) => {
  try {
    const {
      studentId,
      className,
      subject,
      examType,
      marks,
      maxMarks,
    } = req.body;

    if (
      !studentId ||
      !className ||
      !subject ||
      !examType ||
      marks === undefined ||
      maxMarks === undefined
    ) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const conn = await salesforceLogin();

    const markResult = await conn.sobject('Student_Mark__c').create({
      Student__c: studentId,
      Class__c: String(className),
      Subject__c: String(subject),
      Exam_Type__c: String(examType),
      Marks__c: Number(marks),
      Max_Marks__c: Number(maxMarks),
      Status__c: 'Submitted',
      Teacher__c: req.user.contactId,
    });

    const accRes = await conn.query(
      `SELECT Id, Name, Manager__c FROM Account WHERE Id = '${studentId}' LIMIT 1`
    );

    if (!accRes.records.length || !accRes.records[0].Manager__c) {
      return res.json({ success: true, markId: markResult.id });
    }

    const student = accRes.records[0];

    const mgrRes = await conn.query(
      `SELECT Id, FCM_Token__c FROM Contact WHERE Id = '${student.Manager__c}' LIMIT 1`
    );

    if (mgrRes.records.length && mgrRes.records[0].FCM_Token__c) {
      await sendPush(
        mgrRes.records[0].FCM_Token__c,
        'Marks Submitted',
        `${student.Name} - ${subject} (${examType})`,
        { type: 'MARKS', markId: markResult.id }
      );
    }

    res.json({ success: true, markId: markResult.id });

  } catch (err) {
    console.error('❌ MARK SUBMIT ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to submit marks' });
  }
});

/**
 * =====================================
 * MANAGER → GET MARK DETAILS
 * =====================================
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const conn = await salesforceLogin();

    const result = await conn.query(
      `SELECT Id, Student__r.Name, Class__c, Subject__c,
              Exam_Type__c, Marks__c, Max_Marks__c, Status__c
       FROM Student_Mark__c
       WHERE Id = '${req.params.id}' LIMIT 1`
    );

    if (!result.records.length) {
      return res.status(404).json({ message: 'Marks not found' });
    }

    const m = result.records[0];

    res.json({
      studentName: m.Student__r?.Name || '',
      className: m.Class__c,
      subject: m.Subject__c,
      examType: m.Exam_Type__c,
      marks: m.Marks__c,
      maxMarks: m.Max_Marks__c,
      status: m.Status__c,
    });

  } catch (err) {
    console.error('❌ GET MARK ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to load marks' });
  }
});

/**
 * =====================================
 * MANAGER → PUBLISH RESULTS (CLASS-WISE)
 * =====================================
 */
router.post('/publish', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { examType, className } = req.body;
    if (!examType || !className) {
      return res.status(400).json({ message: 'Missing examType or className' });
    }

    const conn = await salesforceLogin();

    // 1️⃣ Get submitted marks
    const marksRes = await conn.query(
      `SELECT Id, Student__c
       FROM Student_Mark__c
       WHERE Exam_Type__c = '${examType}'
         AND Class__c = '${className}'
         AND Status__c = 'Submitted'`
    );

    if (!marksRes.records.length) {
      return res.json({ success: true, message: 'No marks to publish' });
    }

    // 2️⃣ Bulk update
    await conn.sobject('Student_Mark__c').update(
      marksRes.records.map(m => ({ Id: m.Id, Status__c: 'Published' }))
    );

    // 3️⃣ Collect parent tokens
    const studentIds = marksRes.records.map(r => `'${r.Student__c}'`).join(',');
    const parentsRes = await conn.query(
      `SELECT Parent__r.FCM_Token__c
       FROM Account
       WHERE Id IN (${studentIds})
         AND Parent__r.FCM_Token__c != null`
    );

    const tokens = parentsRes.records
      .map(r => r.Parent__r?.FCM_Token__c)
      .filter(Boolean);

    // 4️⃣ Send bulk push
    if (tokens.length) {
      await sendPushBulk(
        tokens,
        '📢 Exam Results Published',
        `${examType} results published for ${className}`,
        { type: 'RESULT_PUBLISHED', examType, className }
      );
    }

    res.json({
      success: true,
      publishedCount: marksRes.records.length,
      notifiedParents: tokens.length,
    });

  } catch (err) {
    console.error('❌ PUBLISH ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to publish results' });
  }
});

module.exports = router;
