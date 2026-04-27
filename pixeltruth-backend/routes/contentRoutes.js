const express = require('express');
const router = express.Router();
const { uploadAndAnalyze, getResult, getHistory, getHistoryItem } = require('../controllers/contentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Apply protect individually so /api/health is not intercepted
router.post('/upload',       protect, upload.single('file'), uploadAndAnalyze);
router.get('/results/:id',   protect, getResult);
router.get('/history',       protect, getHistory);
router.get('/history/:id',   protect, getHistoryItem);

module.exports = router;
