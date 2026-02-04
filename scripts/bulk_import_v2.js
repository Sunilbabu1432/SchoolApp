require('dotenv').config();
const salesforceLogin = require('../config/salesforce');

const CLASSES = [
    'Nursery', 'LKG', 'UKG',
    'Class-1', 'Class-2', 'Class-3', 'Class-4', 'Class-5',
    'Class-6', 'Class-7', 'Class-8', 'Class-9', 'Class-10'
];

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Science'];

const TEACHER_NAMES = [
    { first: 'Rakesh', last: 'Sharma' },
    { first: 'Sunita', last: 'Verma' },
    { first: 'Amit', last: 'Patel' },
    { first: 'Priya', last: 'Singh' },
    { first: 'Vikram', last: 'Reddy' },
    { first: 'Anjali', last: 'Gupta' },
    { first: 'Suresh', last: 'Nair' },
    { first: 'Meena', last: 'Iyer' },
    { first: 'Rajesh', last: 'Kumar' },
    { first: 'Kavita', last: 'Rao' }
];

const STUDENT_NAMES = [
    'Arjun', 'Isha', 'Rohan', 'Sana', 'Vihaan', 'Kavya',
    'Aarav', 'Dia', 'Ishaan', 'Myra', 'Reyansh', 'Ananya',
    'Vivaan', 'Aavya', 'Kabir', 'Zoya', 'Aditya', 'Kyra',
    'Aryan', 'Siya', 'Sai', 'Kiara', 'Advait', 'Shanaya',
    'Hritik', 'Tanu', 'Yash', 'Riya', 'Dev', 'Tara',
    'Om', 'Pari', 'Karan', 'Juhi', 'Sunny', 'Simran',
    'Rahul', 'Pooja', 'Abhi', 'Nikita'
];

const MANAGER_NAMES = [
    { first: 'Sanjay', last: 'Babu' },
    { first: 'Lakshmi', last: 'Prasad' }
];

(async () => {
    try {
        console.log('🚀 Starting Realistic Bulk Data Import (v2)...');
        const conn = await salesforceLogin();

        // 1. Create Managers
        console.log('👔 Creating Managers...');
        const managerRecords = MANAGER_NAMES.map(m => ({
            FirstName: m.first,
            LastName: m.last,
            Email: `${m.first.toLowerCase()}@school.com`,
            Type__c: 'Manager'
        }));
        const managersResult = await conn.sobject('Contact').create(managerRecords);
        const managerIds = managersResult.filter(r => r.success).map(r => r.id);
        console.log(`✅ Created ${managerIds.length} managers.`);

        // 2. Create Teachers
        console.log(`👨‍🏫 Creating Teachers...`);
        const teacherRecords = TEACHER_NAMES.map(t => ({
            FirstName: t.first,
            LastName: t.last,
            Phone: `98480${Math.floor(Math.random() * 90000 + 10000)}`,
            Email: `${t.first.toLowerCase()}.${t.last.toLowerCase()}@school.com`,
            Type__c: 'Teacher'
        }));
        const teachersResult = await conn.sobject('Contact').create(teacherRecords);
        const teacherIds = teachersResult.filter(r => r.success).map(r => r.id);
        console.log(`✅ Created ${teacherIds.length} teachers.`);

        // 3. Create Students and Parents
        console.log('🎓 Creating Students (Accounts) with Manager Lookups and linked Parents (Contacts)...');
        let studentNameIndex = 0;
        for (const className of CLASSES) {
            console.log(`   Processing ${className}...`);
            const studentAccounts = [];
            for (let i = 1; i <= 3; i++) {
                const name = STUDENT_NAMES[studentNameIndex % STUDENT_NAMES.length];
                studentAccounts.push({
                    Name: `${name} (${className})`,
                    Type: 'Student',
                    Class__c: className,
                    Manager__c: managerIds[i % managerIds.length] // Distribute across managers
                });
                studentNameIndex++;
            }
            const accountsResult = await conn.sobject('Account').create(studentAccounts);

            const parentRecords = [];
            accountsResult.forEach((res, index) => {
                if (res.success) {
                    const studentName = studentAccounts[index].Name.split(' ')[0];
                    parentRecords.push({
                        FirstName: 'Parent',
                        LastName: `of ${studentName}`,
                        Email: `parent.${studentName.toLowerCase()}@example.com`,
                        AccountId: res.id,
                        Phone: `91234${Math.floor(Math.random() * 90000 + 10000)}`
                    });
                }
            });
            await conn.sobject('Contact').create(parentRecords);
        }
        console.log('✅ Students, Managers, and Parents created for all classes.');

        // 4. Create Teacher Assignments
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

        const assignResult = await conn.sobject('Teacher_Assignment__c').create(assignmentRecords);
        const successfulAssign = assignResult.filter(r => r.success).length;
        console.log(`✅ Created ${successfulAssign} teacher assignments.`);

        console.log('\n✨ v2 IMPORT COMPLETE! Realistic names and lookups are ready.');

    } catch (err) {
        console.error('❌ Bulk Import Error:', err);
    } finally {
        process.exit();
    }
})();
