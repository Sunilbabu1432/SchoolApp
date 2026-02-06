const express = require('express');
const { login, requestOtp } = require('../controllers/authController');

const router = express.Router();
router.post('/request-otp', requestOtp);
router.post('/login', login);

module.exports = router;
