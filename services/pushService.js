const admin = require('../firebase/firebaseAdmin');

const sendPush = async (token, title, body, data = {}) => {
  try {
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
      },
      android: {
        priority: 'high',
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ PUSH SENT =>', response);
    return true;
  } catch (err) {
    console.error('❌ PUSH FAILED =>', err.message);
    return false; // 🔥 VERY IMPORTANT
  }
};

module.exports = { sendPush };
