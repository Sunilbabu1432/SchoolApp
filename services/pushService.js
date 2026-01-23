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
        title: title || 'Notification',   // 🔥 safety
        body: body || '',                 // 🔥 safety
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ PUSH SENT =>', response);
    return true;
  } catch (err) {
    console.error('❌ PUSH FAILED =>', err.message);

    // OPTIONAL (future cleanup)
    // if (err.code === 'messaging/registration-token-not-registered') {
    //   Salesforce lo FCM_Token__c clear cheyyachu
    // }

    return false;
  }
};

module.exports = { sendPush };
