require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

require('./firebase/firebaseAdmin');


// 🔐 Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/students', require('./routes/students'));
app.use('/save-token', require('./routes/saveToken'));
app.use('/cases', require('./routes/cases'));

app.use('/teachers', require('./routes/teachers'));


app.use('/notifications', require('./routes/notifications'));





// Root check
app.get('/', (req, res) => {
  res.send('Backend running');
});

// ✅ Health check (ADD THIS)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is healthy'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
