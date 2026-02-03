require('dotenv').config({ path: '.env' }); // Adjust path to .env if needed
const salesforceLogin = require('../config/salesforce');

async function createSchema() {
    try {
        const conn = await salesforceLogin();
        console.log('Connected to Salesforce');

        const metadata = [
            {
                fullName: 'Attendance_Session__c',
                label: 'Attendance Session',
                pluralLabel: 'Attendance Sessions',
                deploymentStatus: 'Deployed',
                sharingModel: 'ReadWrite',
                nameField: {
                    type: 'AutoNumber',
                    label: 'Session ID'
                },
                fields: [
                    {
                        fullName: 'Class__c',
                        label: 'Class',
                        type: 'Text',
                        length: 50
                    },
                    {
                        fullName: 'Section__c',
                        label: 'Section',
                        type: 'Text',
                        length: 10
                    },
                    {
                        fullName: 'Date__c',
                        label: 'Date',
                        type: 'Date'
                    },
                    {
                        fullName: 'Taken_By__c',
                        label: 'Taken By',
                        type: 'Lookup',
                        referenceTo: 'Contact', // Assuming Teacher is a Contact
                        relationshipLabel: 'Attendance Sessions',
                        relationshipName: 'Attendance_Sessions'
                    }
                ]
            },
            {
                fullName: 'Attendance__c',
                label: 'Attendance',
                pluralLabel: 'Attendances',
                deploymentStatus: 'Deployed',
                sharingModel: 'ReadWrite',
                nameField: {
                    type: 'AutoNumber',
                    label: 'Attendance ID'
                },
                fields: [
                    {
                        fullName: 'Student__c',
                        label: 'Student',
                        type: 'Lookup',
                        referenceTo: 'Account', // Student is Account
                        relationshipLabel: 'Attendances',
                        relationshipName: 'Attendances'
                    },
                    {
                        fullName: 'Attendance_Date__c',
                        label: 'Attendance Date',
                        type: 'Date'
                    },
                    {
                        fullName: 'Attendance_Status__c',
                        label: 'Attendance Status',
                        type: 'Picklist',
                        valueSet: {
                            valueSetDefinition: {
                                sorted: false,
                                value: [
                                    { fullName: 'Present', default: true },
                                    { fullName: 'Absent', default: false }
                                ]
                            }
                        }
                    },
                    {
                        fullName: 'Roll_Number__c',
                        label: 'Roll Number',
                        type: 'Text',
                        length: 20
                    },
                    {
                        fullName: 'Class__c',
                        label: 'Class',
                        type: 'Text',
                        length: 50
                    },
                    {
                        fullName: 'Section__c',
                        label: 'Section',
                        type: 'Text',
                        length: 10
                    }
                ]
            }
        ];

        // Check if objects already exist
        try {
            const descriptions = await conn.metadata.read('CustomObject', ['Attendance_Session__c', 'Attendance__c']);

            // descriptions can be an array or single object
            const existing = Array.isArray(descriptions) ? descriptions : [descriptions];

            for (const updateDef of metadata) {
                const exists = existing.find(d => d.fullName === updateDef.fullName && d.fullName);
                if (exists) {
                    console.log(`Updating existing object: ${updateDef.fullName}`);
                    await conn.metadata.update('CustomObject', updateDef);
                } else {
                    console.log(`Creating new object: ${updateDef.fullName}`);
                    await conn.metadata.create('CustomObject', updateDef);
                }
            }

        } catch (e) {
            console.log("Error reading metadata, attempting creation anyway:", e.message);
            // Fallback to create
            for (const obj of metadata) {
                try {
                    const result = await conn.metadata.create('CustomObject', obj);
                    console.log('Created ' + obj.fullName + ': ' + result.success);
                    if (!result.success) console.error(result.errors);
                } catch (err) {
                    console.error('Failed to create ' + obj.fullName, err.message);
                }
            }
        }

        console.log('Schema setup complete.');

    } catch (err) {
        console.error('Error:', err);
    }
}

createSchema();
