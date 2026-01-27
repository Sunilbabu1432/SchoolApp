const admin = require('../firebase/firebaseAdmin');

const sendPush = async (token, title, body, data = {}) => {
  try {
    if (!token) {
      console.log('❌ PUSH SKIPPED => Empty token');
      return false;
    }

    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ PUSH SENT =>', response);
    return true;
  } catch (err) {
    console.error('❌ PUSH FAILED =>', err.message);

    // OPTIONAL (future cleanup)
    // if (err.code === 'messaging/registration-token-not-registered') {
    //   👉 Salesforce lo FCM_Token__c clear cheyyachu
    // }

    return false; // 🔥 VERY IMPORTANT
  }
};
const sendPushBulk = async (tokens, title, body, data = {}) => {
  const BATCH_SIZE = 500;

  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);

    await admin.messaging().sendEachForMulticast({
      tokens: batch,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: { priority: 'high' },
    });
  }
};


module.exports = { sendPush, sendPushBulk };
