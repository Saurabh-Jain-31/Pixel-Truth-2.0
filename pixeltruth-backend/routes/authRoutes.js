const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);

module.exports = router;
