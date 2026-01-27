require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

require('./firebase/firebaseAdmin');

app.use('/auth', require('./routes/authRoutes'));
app.use('/students', require('./routes/students'));
app.use('/save-token', require('./routes/saveToken'));
app.use('/cases', require('./routes/cases'));
app.use('/teachers', require('./routes/teachers'));


const salesforceMiddleware = require('./middleware/salesforceMiddleware');

app.use('/notifications', salesforceMiddleware, require('./routes/notificationRoutes'));

app.use('/marks', require('./routes/marks'));

app.use('/mark-action', require('./routes/markAction'));




app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
