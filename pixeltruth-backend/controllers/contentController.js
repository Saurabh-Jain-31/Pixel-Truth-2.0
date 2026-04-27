const path = require('path');
const Upload = require('../models/Upload');
const Violation = require('../models/Violation');
const analyzeContent = require('../utils/analyzeContent');
const createLog = require('../utils/logger');

// POST /api/upload
const uploadAndAnalyze = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { originalname, filename, mimetype, size, path: filePath } = req.file;

    // Create upload record with Pending status
    const upload = await Upload.create({
      user: req.user._id,
      fileName: filename,
      originalName: originalname,
      mimeType: mimetype,
      fileSize: size,
      filePath,
      status: 'Processing',
    });

    await createLog({
      level: 'INFO',
      message: `Upload started: ${originalname}`,
      user: req.user.email,
      userId: req.user._id,
      meta: { uploadId: upload._id },
    });

    // Run analysis pipeline
    const result = await analyzeContent(filePath, mimetype);

    // Update upload with results
    upload.status = result.status;
    upload.isAiGenerated = result.isAiGenerated;
    upload.confidence = result.confidence;
    upload.matchPercent = result.matchPercent;
    upload.perceptualHash = result.perceptualHash;
    upload.featureVector = result.featureVector;
    upload.framesExtracted = result.framesExtracted;
    upload.fileType = result.fileType;
    upload.message = result.message;
    await upload.save();

    // If violation detected, create a Violation record
    if (result.status === 'High Risk' || result.status === 'Suspicious') {
      await Violation.create({
        upload: upload._id,
        user: req.user._id,
        fileName: originalname,
        status: result.status,
        matchPercent: result.matchPercent,
        confidence: result.confidence,
        description: result.message,
      });

      await createLog({
        level: 'WARN',
        message: `Violation detected: ${originalname} — ${result.status} (${result.matchPercent}% match)`,
        user: req.user.email,
        userId: req.user._id,
        meta: { uploadId: upload._id, matchPercent: result.matchPercent },
      });
    } else {
      await createLog({
        level: 'SUCCESS',
        message: `Analysis complete: ${originalname} — Safe (${result.matchPercent}% match)`,
        user: req.user.email,
        userId: req.user._id,
      });
    }

    res.status(201).json({
      _id: upload._id,
      fileName: upload.originalName,
      status: upload.status,
      isAiGenerated: upload.isAiGenerated,
      confidence: upload.confidence,
      matchPercent: upload.matchPercent,
      framesExtracted: upload.framesExtracted,
      message: upload.message,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/results/:id
const getResult = async (req, res, next) => {
  try {
    const upload = await Upload.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!upload) {
      return res.status(404).json({ message: 'Result not found.' });
    }

    res.json({ upload });
  } catch (err) {
    next(err);
  }
};

// GET /api/history
const getHistory = async (req, res, next) => {
  try {
    const uploads = await Upload.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-featureVector -perceptualHash -filePath');

    res.json({ uploads });
  } catch (err) {
    next(err);
  }
};

// GET /api/history/:id
const getHistoryItem = async (req, res, next) => {
  try {
    const upload = await Upload.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).select('-featureVector');

    if (!upload) {
      return res.status(404).json({ message: 'Upload not found.' });
    }

    res.json({ upload });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadAndAnalyze, getResult, getHistory, getHistoryItem };
