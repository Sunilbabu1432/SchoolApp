require('dotenv').config();
const salesforceLogin = require('../config/salesforce');

(async () => {
    try {
        console.log('🚀 Starting Bulk Marks Insertion...');
        const conn = await salesforceLogin();

        // 1. Get all students (Account)
        const studentsRes = await conn.query("SELECT Id, Class__c FROM Account WHERE Type = 'Student'");
        if (studentsRes.records.length === 0) {
            console.error('❌ No students found. Run bulk_import.js first.');
            return;
        }

        // 2. Get some teachers to "own" the marks
        const teachersRes = await conn.query("SELECT Id FROM Contact WHERE Type__c = 'Teacher' LIMIT 5");
        const teacherIds = teachersRes.records.map(r => r.id);

        const EXAMS = ['Unit Test', 'Mid Term', 'Final Exam'];
        const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'];

        console.log(`📝 Inserting marks for ${studentsRes.records.length} students...`);
        const markRecords = [];

        for (const student of studentsRes.records) {
            // For each student, insert marks for one exam and two subjects
            const exam = EXAMS[0]; // Unit Test
            const subjects = SUBJECTS.slice(0, 2); // Math and Science

            for (const subject of subjects) {
                markRecords.push({
                    Student__c: student.Id,
                    Class__c: student.Class__c,
                    Subject__c: subject,
                    Exam_Type__c: exam,
                    Marks__c: Math.floor(Math.random() * 20) + 70, // Random score between 70-90
                    Max_Marks__c: 100,
                    Status__c: 'Submitted',
                    Teacher__c: teacherIds[Math.floor(Math.random() * teacherIds.length)],
                    Publish_At__c: new Date(Date.now() + 60000).toISOString() // Publish in 1 minute
                });
            }
        }

        // Chunking for performance if needed, but for ~80 records it's fine
        const result = await conn.sobject('Student_Mark__c').create(markRecords);
        const successCount = result.filter(r => r.success).length;

        console.log(`✅ Successfully inserted ${successCount} mark records.`);
        console.log('\n✨ Done! You can now use the manager app to Publish results once they are ready.');

    } catch (err) {
        console.error('❌ Marks Insertion Error:', err);
    } finally {
        process.exit();
    }
})();
