const express = require('express');
const router = express.Router();
const { analyzeInstagram } = require('../controllers/instagramController');
const { protect } = require('../middleware/auth');

router.post('/analyze', protect, analyzeInstagram);

module.exports = router;
