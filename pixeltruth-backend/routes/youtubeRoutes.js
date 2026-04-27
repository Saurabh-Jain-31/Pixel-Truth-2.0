const express = require('express');
const router = express.Router();
const { analyzeYoutube } = require('../controllers/youtubeController');
const { protect } = require('../middleware/auth');

router.post('/analyze', protect, analyzeYoutube);

module.exports = router;
