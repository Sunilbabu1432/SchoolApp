require('dotenv').config();
const salesforceLogin = require('../config/salesforce');
(async () => {
    try {
        const conn = await salesforceLogin();
        const org = await conn.query('SELECT TimeZoneSidKey, Name FROM Organization');
        console.log('--- Salesforce Org Info ---');
        console.log('Org Name:', org.records[0].Name);
        console.log('Org TimeZone:', org.records[0].TimeZoneSidKey);

        const userInfo = await conn.identity();
        console.log('\n--- Connected User Info ---');
        console.log('Username:', userInfo.username);
        console.log('User TimeZone:', userInfo.timezone);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
})();
