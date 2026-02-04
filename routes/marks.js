const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const salesforceLogin = require('../config/salesforce');
const { sendPush } = require('../services/pushService');

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

    const dupCheck = await conn.query(`
      SELECT Id
      FROM Student_Mark__c
      WHERE Student__c = '${studentId}'
        AND Subject__c = '${subject}'
        AND Exam_Type__c = '${examType}'
    `);

    if (dupCheck.records.length) {
      return res.status(409).json({
        message: 'Marks already submitted for this subject',
      });
    }

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

    res.json({ success: true, markId: markResult.id });

  } catch (err) {
    console.error('❌ MARK SUBMIT ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to submit marks' });
  }
});

/**
 * =====================================
 * PARENT → VIEW RESULTS
 * =====================================
 */
router.get('/parent/results', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Parent') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const conn = await salesforceLogin();

    const marksRes = await conn.query(`
      SELECT Subject__c, Exam_Type__c, Marks__c, Max_Marks__c, Class__c
      FROM Student_Mark__c
      WHERE Student__c = '${req.user.studentAccountId}'
        AND Status__c = 'Published'
    `);

    res.json({ success: true, results: marksRes.records });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Failed to load results' });
  }
});

/**
 * =====================================
 * MANAGER → SCHEDULE RESULTS
 * =====================================
 */
router.post('/schedule', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { examType, className, publishAt } = req.body;
    const publishDate = new Date(publishAt).toISOString();

    const conn = await salesforceLogin();

    const marksRes = await conn.query(`
      SELECT Id
      FROM Student_Mark__c
      WHERE Exam_Type__c = '${examType}'
        AND Class__c = '${className}'
        AND Status__c = 'Submitted'
    `);

    if (!marksRes.records.length) {
      return res.status(404).json({ message: 'No submitted marks found' });
    }

    await conn.sobject('Student_Mark__c').update(
      marksRes.records.map(r => ({
        Id: r.Id,
        Publish_At__c: publishDate,
      }))
    );

    res.json({
      success: true,
      scheduledCount: marksRes.records.length,
    });

  } catch (err) {
    console.error('❌ SCHEDULE ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to schedule results' });
  }
});

/**
 * =====================================
 * MANAGER → PENDING SUBJECTS
 * ✅ MUST BE BEFORE /:id
 * =====================================
 */
router.get('/pending-subjects', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Manager') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { className, examType } = req.query;
    const conn = await salesforceLogin();

    const assignmentRes = await conn.query(`
      SELECT subject__c, teacherId__r.Name
      FROM Teacher_Assignment__c
      WHERE Class_Name__c = '${className}'
    `);

    const submittedRes = await conn.query(`
      SELECT Subject__c
      FROM Student_Mark__c
      WHERE Class__c = '${className}'
        AND Exam_Type__c = '${examType}'
        AND Status__c = 'Submitted'
    `);

    const submitted = new Set(submittedRes.records.map(r => r.Subject__c));

    const pending = assignmentRes.records.filter(
      a => !submitted.has(a.subject__c)
    );

    res.json({
      success: true,
      className,
      examType,
      pendingCount: pending.length,
      pendingSubjects: pending.map(p => ({
        subject: p.subject__c,
        teacherName: p.teacherId__r?.Name || '',
      })),
    });

  } catch (err) {
    console.error('❌ PENDING SUBJECTS ERROR =>', err.message);
    res.status(500).json({ message: 'Failed to load pending subjects' });
  }
});

/**
 * =====================================
 * ⚠️ MUST BE LAST
 * =====================================
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const conn = await salesforceLogin();

    const result = await conn.query(`
      SELECT Subject__c, Marks__c, Status__c
      FROM Student_Mark__c
      WHERE Id = '${req.params.id}'
      LIMIT 1
    `);

    if (!result.records.length) {
      return res.status(404).json({ message: 'Marks not found' });
    }

    res.json(result.records[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Failed to load marks' });
  }
});

module.exports = router;
