const jsforce = require('jsforce');

module.exports = async function salesforceLogin() {
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
  return conn;
};
