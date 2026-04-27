const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.post('/chat', protect, chat);

module.exports = router;
