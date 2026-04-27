const express = require('express');
const router = express.Router();
const {
  uploadAndAnalyze, getResult, getHistory, getHistoryItem,
  requestTakedown, getEvidencePackage, verifyChain,
} = require('../controllers/contentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload',                    protect, upload.single('file'), uploadAndAnalyze);
router.get('/results/:id',                protect, getResult);
router.get('/history',                    protect, getHistory);
router.get('/history/:id',                protect, getHistoryItem);
router.post('/history/:id/takedown',      protect, requestTakedown);
router.get('/history/:id/evidence',       protect, getEvidencePackage);
router.get('/evidence/verify',            protect, verifyChain);

module.exports = router;
