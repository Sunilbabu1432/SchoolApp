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

    if (!studentId || !className || !subject || !examType ||
        marks === undefined || maxMarks === undefined) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const conn = await salesforceLogin();

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

    const existingMarks = await conn.query(`
      SELECT Id
      FROM Student_Mark__c
      WHERE Student__c = '${studentId}'
        AND Exam_Type__c = '${examType}'
        AND Status__c = 'Submitted'
    `);

    if (existingMarks.records.length === 1) {
      const accRes = await conn.query(`
        SELECT Name, Manager__c
        FROM Account
        WHERE Id = '${studentId}'
        LIMIT 1
      `);

      if (accRes.records.length && accRes.records[0].Manager__c) {
        const mgrRes = await conn.query(`
          SELECT FCM_Token__c
          FROM Contact
          WHERE Id = '${accRes.records[0].Manager__c}'
          LIMIT 1
        `);

        if (mgrRes.records.length && mgrRes.records[0].FCM_Token__c) {
          await sendPush(
            mgrRes.records[0].FCM_Token__c,
            'Marks Submitted',
            `${accRes.records[0].Name} - ${examType} marks submitted`,
            { type: 'MARKS_READY', examType }
          );
        }
      }
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

    const studentRes = await conn.query(`
      SELECT Name
      FROM Account
      WHERE Id = '${studentAccountId}'
      LIMIT 1
    `);

    const marksRes = await conn.query(`
      SELECT Id,
             Subject__c,
             Exam_Type__c,
             Marks__c,
             Max_Marks__c,
             Class__c
      FROM Student_Mark__c
      WHERE Student__c = '${studentAccountId}'
        AND Status__c = 'Published'
      ORDER BY Exam_Type__c, Subject__c
    `);

    res.json({
      success: true,
      studentName: studentRes.records[0]?.Name || '',
      results: marksRes.records,
    });

  } catch (err) {
    console.error('❌ PARENT RESULTS ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to load results' });
  }
});

/**
 * =====================================
 * MANAGER → SCHEDULE PUBLISH (NEW)
 * =====================================
 */
router.post('/schedule-publish', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { examType, className, publishAt } = req.body;

    if (!examType || !className || !publishAt) {
      return res.status(400).json({
        message: 'examType, className and publishAt required',
      });
    }

    const conn = await salesforceLogin();

    // 🔍 Find submitted marks for this exam + class
    const marksRes = await conn.query(`
      SELECT Id
      FROM Student_Mark__c
      WHERE Exam_Type__c = '${examType}'
        AND Class__c = '${className}'
        AND Status__c = 'Submitted'
    `);

    if (!marksRes.records.length) {
      return res.status(404).json({
        message: 'No submitted marks found for this exam',
      });
    }

    // ✅ Update all related marks with schedule info
    await conn.sobject('Student_Mark__c').update(
      marksRes.records.map(r => ({
        Id: r.Id,
        Publish_At__c: publishAt
      }))
    );

    res.json({
      success: true,
      scheduledCount: marksRes.records.length,
      message: 'Exam scheduled successfully',
    });

  } catch (err) {
    console.error('❌ SCHEDULE ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to schedule publish' });
  }
});


/**
 * =====================================
 * MANAGER → GET MARK DETAILS
 * ⚠️ MUST BE LAST
 * =====================================
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const conn = await salesforceLogin();

    const result = await conn.query(`
      SELECT Student__r.Name,
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

    res.json(result.records[0]);

  } catch (err) {
    console.error('❌ GET MARK ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to load marks' });
  }
});

module.exports = router;
