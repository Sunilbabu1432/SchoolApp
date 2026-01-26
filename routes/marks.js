const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');
const { sendPush } = require('../services/pushService');

/**
 * ================================
 * TEACHER → MANAGER (SUBMIT MARKS)
 * ================================
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
      !marks ||
      !maxMarks
    ) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const conn = await salesforceLogin();

    // 1️⃣ Create Student_Mark__c record
   const markResult = await conn
  .sobject('Student_Mark__c')
  .create({
    Student__c: studentId,
    Class__c: className,
    Subject__c: subject,
    Exam_Type__c: examType,
    Marks__c: Number(marks),
    Max_Marks__c: Number(maxMarks),
    Status__c: 'Submitted',
  });


    console.log('✅ MARK CREATED =>', markResult.id);

    // 2️⃣ Get Student + Manager
    const accRes = await conn.query(`
      SELECT Id, Name, Manager__c
      FROM Account
      WHERE Id = '${studentId}'
      LIMIT 1
    `);

    if (!accRes.records.length) {
      return res.json({ success: true });
    }

    const student = accRes.records[0];

    if (!student.Manager__c) {
      console.log('❌ MANAGER NOT LINKED');
      return res.json({ success: true });
    }

    // 3️⃣ Get Manager token
    const mgrRes = await conn.query(`
      SELECT Id, Name, FCM_Token__c
      FROM Contact
      WHERE Id = '${student.Manager__c}'
      LIMIT 1
    `);

    if (!mgrRes.records.length) {
      return res.json({ success: true });
    }

    const manager = mgrRes.records[0];

    if (!manager.FCM_Token__c) {
      console.log('❌ MANAGER TOKEN EMPTY');
      return res.json({ success: true });
    }

    // 4️⃣ Send Push Notification (SAME LOGIC AS COMPLAINT)
    await sendPush(
      manager.FCM_Token__c,
      'Marks Submitted',
      `${student.Name} - ${subject} (${examType})`,
      {
        type: 'MARKS',
        markId: markResult.id,
        subject,
        examType,
        className,
      }
    );

    console.log('✅ MARKS PUSH SENT TO MANAGER');

    res.json({ success: true });

  } catch (err) {
    console.error('❌ MARK SUBMIT ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to submit marks' });
  }
});
/**
 * ================================
 * MANAGER – GET MARK DETAILS
 * ================================
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const conn = await salesforceLogin();

    const result = await conn.query(`
      SELECT
        Id,
        Student__r.Name,
        Class__c,
        Subject__c,
        Exam_Type__c,
        Marks__c,
        Max_Marks__c,
        Status__c
      FROM Student_Mark__c
      WHERE Id = '${req.params.id}'
      LIMIT 1
    `);

    if (!result.records.length) {
      return res.status(404).json({ message: 'Marks not found' });
    }

    const m = result.records[0];

    res.json({
      studentName: m.Student__r.Name,
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

module.exports = router;
