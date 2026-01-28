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
    const { studentId, className, subject, examType, marks, maxMarks } = req.body;

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

    // 1️⃣ CREATE MARK
    const markResult = await conn.sobject('Student_Mark__c').create({
      Student__c: studentId,
      Class__c: className,
      Subject__c: subject,
      Exam_Type__c: examType,
      Marks__c: Number(marks),
      Max_Marks__c: Number(maxMarks),
      Status__c: 'Submitted',
      Teacher__c: req.user.contactId,
    });

    // 2️⃣ FETCH STUDENT + MANAGER
    const accRes = await conn.query(
      `SELECT Id, Name, Manager__c
       FROM Account
       WHERE Id = '${studentId}'
       LIMIT 1`
    );

    if (!accRes.records.length || !accRes.records[0].Manager__c) {
      return res.json({ success: true, markId: markResult.id });
    }

    const student = accRes.records[0];

    // 3️⃣ FETCH MANAGER TOKEN
    const mgrRes = await conn.query(
      `SELECT FCM_Token__c
       FROM Contact
       WHERE Id = '${student.Manager__c}'
       LIMIT 1`
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
 * PARENT → VIEW PUBLISHED RESULTS
 * ⚠️ MUST BE ABOVE :id ROUTE
 * =====================================
 */
router.get('/parent/results', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Parent') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const studentAccountId = req.user.studentAccountId;
    if (!studentAccountId) {
      return res.status(400).json({ message: 'Student not linked' });
    }

    const conn = await salesforceLogin();

    const result = await conn.query(`
      SELECT Subject__c,
             Exam_Type__c,
             Marks__c,
             Max_Marks__c,
             Class__c
      FROM Student_Mark__c
      WHERE Student__c = '${studentAccountId}'
        AND Status__c = 'Published'
      ORDER BY Exam_Type__c
    `);

    res.json({ success: true, results: result.records });

  } catch (err) {
    console.error('❌ PARENT RESULTS ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to load results' });
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
      `SELECT Student__r.Name,
              Class__c,
              Subject__c,
              Exam_Type__c,
              Marks__c,
              Max_Marks__c,
              Status__c
       FROM Student_Mark__c
       WHERE Id = '${req.params.id}'
       LIMIT 1`
    );

    if (!result.records.length) {
      return res.status(404).json({ message: 'Marks not found' });
    }

    res.json(result.records[0]);

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

    // 1️⃣ FETCH SUBMITTED MARKS
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

    // 2️⃣ UPDATE TO PUBLISHED
    await conn.sobject('Student_Mark__c').update(
      marksRes.records.map(r => ({
        Id: r.Id,
        Status__c: 'Published',
      }))
    );

    // 3️⃣ FETCH PARENT TOKENS (🔥 FINAL FIX)
    const studentIds = marksRes.records
      .map(r => r.Student__c)
      .filter(Boolean);

    if (!studentIds.length) {
      return res.json({
        success: true,
        publishedCount: marksRes.records.length,
        notifiedParents: 0,
      });
    }

    const parentsRes = await conn.query(
  `SELECT FCM_Token__c
   FROM Contact
   WHERE AccountId IN (${studentIds.map(id => `'${id}'`).join(',')})
     AND FCM_Token__c != null`
);

    const tokens = parentsRes.records
      .map(r => r.FCM_Token__c)
      .filter(Boolean);

    console.log('📲 Parent FCM tokens =>', tokens);

    // 4️⃣ SEND BULK PUSH
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
