require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// 🔐 Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/students', require('./routes/students'));
app.use('/save-token', require('./routes/saveToken')); // ✅ IMPORTANT
app.use('/cases', require('./routes/cases'));

// Health check
app.get('/', (req, res) => {
  res.send('Backend running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
