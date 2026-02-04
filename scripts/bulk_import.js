require('dotenv').config();
const salesforceLogin = require('../config/salesforce');

const CLASSES = [
    'Nursery', 'LKG', 'UKG',
    'Class-1', 'Class-2', 'Class-3', 'Class-4', 'Class-5',
    'Class-6', 'Class-7', 'Class-8', 'Class-9', 'Class-10'
];

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'];

const TEACHERS_COUNT = 10;
const STUDENTS_PER_CLASS = 3;

(async () => {
    try {
        console.log('🚀 Starting Bulk Data Import...');
        const conn = await salesforceLogin();

        // 1. Create Teachers
        console.log(`👨‍🏫 Creating ${TEACHERS_COUNT} Teachers...`);
        const teacherRecords = [];
        for (let i = 1; i <= TEACHERS_COUNT; i++) {
            teacherRecords.push({
                FirstName: 'Teacher',
                LastName: `Number ${i}`,
                Phone: `90000000${i.toString().padStart(2, '0')}`,
                Email: `teacher${i}@school.com`,
                Type__c: 'Teacher'
            });
        }
        const teachersResult = await conn.sobject('Contact').create(teacherRecords);
        const teacherIds = teachersResult.filter(r => r.success).map(r => r.id);
        console.log(`✅ Created ${teacherIds.length} teachers.`);

        // 2. Create Students and Parents
        console.log('🎓 Creating Students and linked Parents...');
        for (const className of CLASSES) {
            console.log(`   Processing ${className}...`);
            const studentAccounts = [];
            for (let i = 1; i <= STUDENTS_PER_CLASS; i++) {
                studentAccounts.push({
                    Name: `${className} Student ${i}`,
                    Type: 'Student',
                    Class__c: className
                });
            }
            const accountsResult = await conn.sobject('Account').create(studentAccounts);

            const parentRecords = [];
            accountsResult.forEach((res, index) => {
                if (res.success) {
                    parentRecords.push({
                        FirstName: 'Parent',
                        LastName: `of ${studentAccounts[index].Name}`,
                        Email: `parent${index}@example.com`,
                        AccountId: res.id,
                        Phone: '9111111111'
                    });
                }
            });
            await conn.sobject('Contact').create(parentRecords);
        }
        console.log('✅ Students and Parents created for all classes.');

        // 3. Create Teacher Assignments
        console.log('📚 Assigning Teachers to Subjects...');
        const assignmentRecords = [];
        let teacherIndex = 0;

        for (const className of CLASSES) {
            for (const subject of SUBJECTS) {
                const teacherId = teacherIds[teacherIndex % teacherIds.length];
                assignmentRecords.push({
                    teacherId__c: teacherId,
                    Class_Name__c: className,
                    subject__c: subject
                });
                teacherIndex++;
            }
        }

        // JSForce has a limit on collection size for some calls, let's chunk if needed
        // But for ~65 assignments, it's fine.
        const assignResult = await conn.sobject('Teacher_Assignment__c').create(assignmentRecords);
        const successfulAssign = assignResult.filter(r => r.success).length;
        console.log(`✅ Created ${successfulAssign} teacher assignments.`);

        console.log('\n✨ BULK IMPORT COMPLETE! Your Org is now fully populated.');

    } catch (err) {
        console.error('❌ Bulk Import Error:', err);
    } finally {
        process.exit();
    }
})();
