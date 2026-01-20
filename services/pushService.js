import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export const sendPush = async (token, title, body, data = {}) => {
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
};
