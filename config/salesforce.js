const jsforce = require('jsforce');

let cachedConn = null;

module.exports = async function salesforceLogin() {
  if (cachedConn && cachedConn.accessToken) {
    try {
      // Periodic check or just try to use it. 
      // jsforce handles some re-authentication if oauth2 is configured, 
      // but simple reuse is a huge win for speed.
      await cachedConn.identity();
      return cachedConn;
    } catch (err) {
      console.log('🔄 Salesforce session expired, re-logging...');
      cachedConn = null;
    }
  }

  const conn = new jsforce.Connection({
    oauth2: {
      loginUrl: process.env.SF_LOGIN_URL,
      clientId: process.env.SF_CLIENT_ID,
      clientSecret: process.env.SF_CLIENT_SECRET,
      redirectUri: 'http://localhost:5000/oauth/callback'
    }
  });

  await conn.login(
    process.env.SF_USERNAME,
    process.env.SF_PASSWORD + process.env.SF_TOKEN
  );

  console.log('✅ Salesforce connected via OAuth');
  cachedConn = conn;
  return conn;
};
