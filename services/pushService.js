import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.project_id,
      clientEmail: process.env.client_email,
      privateKey: process.env.private_key.replace(/\\n/g, '\n'),
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
