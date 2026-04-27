const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Upload = require('../models/Upload');
const Violation = require('../models/Violation');
const EvidenceChain = require('../models/EvidenceChain');
const analyzeContent = require('../utils/analyzeContent');
const createLog = require('../utils/logger');

// ─── Compute SHA-256 of a file ────────────────────────────────────────────────
function computeFileHash(filePath) {
  try {
    const buf = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buf).digest('hex');
  } catch { return null; }
}

// POST /api/upload
const uploadAndAnalyze = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });

    const { originalname, filename, mimetype, size, path: filePath } = req.file;

    // Compute file integrity hash
    const fileHash = computeFileHash(filePath);

    const upload = await Upload.create({
      user: req.user._id,
      fileName: filename,
      originalName: originalname,
      mimeType: mimetype,
      fileSize: size,
      filePath,
      fileHash,
      status: 'Processing',
    });

    await createLog({ level: 'INFO', message: `Upload started: ${originalname}`, user: req.user.email, userId: req.user._id, meta: { uploadId: upload._id } });

    const result = await analyzeContent(filePath, mimetype, upload._id, req.user._id);

    upload.status = result.status;
    upload.isAiGenerated = result.isAiGenerated;
    upload.confidence = result.confidence;
    upload.matchPercent = result.matchPercent;
    upload.perceptualHash = result.perceptualHash;
    upload.aHash = result.aHash;
    upload.featureVector = result.featureVector;
    upload.framesExtracted = result.framesExtracted;
    upload.fileType = result.fileType;
    upload.message = result.message;
    if (result.aiInsights) upload.aiInsights = result.aiInsights;
    if (result.platformMatches) upload.platformMatches = result.platformMatches.slice(0, 10);
    await upload.save();

    // Create evidence block in chain
    const evidenceBlock = await EvidenceChain.addBlock(
      req.user._id,
      upload._id,
      result.status === 'High Risk' || result.status === 'Suspicious' ? 'VIOLATION_DETECTED' : 'UPLOAD_ANALYZED',
      {
        fileName: originalname,
        fileHash,
        perceptualHash: result.perceptualHash,
        matchPercent: result.matchPercent,
        status: result.status,
        platformMatches: (result.platformMatches || []).slice(0, 5).map(m => ({
          platform: m.platform, url: m.url, channel: m.channel, similarity: m.similarity,
        })),
        message: result.message,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']?.slice(0, 100),
      }
    );

    upload.evidenceBlockId = evidenceBlock._id;
    await upload.save();

    // Violation record
    if (result.status === 'High Risk' || result.status === 'Suspicious') {
      await Violation.create({
        upload: upload._id, user: req.user._id, fileName: originalname,
        status: result.status, matchPercent: result.matchPercent,
        confidence: result.confidence, description: result.message,
      });
      await createLog({ level: 'WARN', message: `Violation detected: ${originalname} — ${result.status} (${result.matchPercent}% match)`, user: req.user.email, userId: req.user._id, meta: { uploadId: upload._id } });
    } else {
      await createLog({ level: 'SUCCESS', message: `Analysis complete: ${originalname} — Safe`, user: req.user.email, userId: req.user._id });
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
      aiInsights: upload.aiInsights || null,
      platformMatches: result.platformMatches || [],
      actionSteps: result.actionSteps || [],
      perceptualHash: result.perceptualHash,
      fileType: result.fileType,
      fileHash,
      evidenceBlockHash: evidenceBlock.blockHash,
      evidenceBlockIndex: evidenceBlock.blockIndex,
    });
  } catch (err) { next(err); }
};

// GET /api/results/:id
const getResult = async (req, res, next) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.id, user: req.user._id });
    if (!upload) return res.status(404).json({ message: 'Result not found.' });
    res.json({ upload });
  } catch (err) { next(err); }
};

// GET /api/history
const getHistory = async (req, res, next) => {
  try {
    const uploads = await Upload.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-featureVector -filePath');
    res.json({ uploads });
  } catch (err) { next(err); }
};

// GET /api/history/:id
const getHistoryItem = async (req, res, next) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.id, user: req.user._id }).select('-featureVector');
    if (!upload) return res.status(404).json({ message: 'Upload not found.' });
    res.json({ upload });
  } catch (err) { next(err); }
};

// POST /api/history/:id/takedown — request takedown
const requestTakedown = async (req, res, next) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.id, user: req.user._id });
    if (!upload) return res.status(404).json({ message: 'Upload not found.' });

    const { note, targetUrl } = req.body;
    upload.takedownStatus = 'pending';
    upload.takedownNote = note || '';
    await upload.save();

    // Add to evidence chain
    await EvidenceChain.addBlock(req.user._id, upload._id, 'TAKEDOWN_REQUESTED', {
      fileName: upload.originalName,
      fileHash: upload.fileHash,
      perceptualHash: upload.perceptualHash,
      matchPercent: upload.matchPercent,
      status: upload.status,
      platformMatches: [],
      message: `Takedown requested for: ${targetUrl || 'unknown URL'}. Note: ${note || 'none'}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']?.slice(0, 100),
    });

    await createLog({ level: 'WARN', message: `Takedown requested: ${upload.originalName}`, user: req.user.email, userId: req.user._id });

    res.json({ message: 'Takedown request recorded in evidence chain.', takedownStatus: 'pending' });
  } catch (err) { next(err); }
};

// GET /api/history/:id/evidence — get full evidence package
const getEvidencePackage = async (req, res, next) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.id, user: req.user._id });
    if (!upload) return res.status(404).json({ message: 'Upload not found.' });

    const blocks = await EvidenceChain.find({ upload: upload._id, user: req.user._id }).sort({ blockIndex: 1 });
    const chainVerification = await EvidenceChain.verifyChain(req.user._id);

    // Add export block to chain
    await EvidenceChain.addBlock(req.user._id, upload._id, 'EVIDENCE_EXPORTED', {
      fileName: upload.originalName,
      fileHash: upload.fileHash,
      perceptualHash: upload.perceptualHash,
      matchPercent: upload.matchPercent,
      status: upload.status,
      platformMatches: [],
      message: 'Evidence package exported for legal use',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']?.slice(0, 100),
    });

    res.json({
      evidencePackage: {
        generatedAt: new Date().toISOString(),
        caseId: `PT-${upload._id.toString().slice(-8).toUpperCase()}`,
        file: {
          name: upload.originalName,
          type: upload.fileType,
          size: upload.fileSize,
          sha256: upload.fileHash,
          perceptualHash: upload.perceptualHash,
          uploadedAt: upload.createdAt,
        },
        analysis: {
          status: upload.status,
          matchPercent: upload.matchPercent,
          confidence: upload.confidence,
          isAiGenerated: upload.isAiGenerated,
          message: upload.message,
          aiInsights: upload.aiInsights,
        },
        platformMatches: upload.platformMatches || [],
        chainOfCustody: blocks.map(b => ({
          blockIndex: b.blockIndex,
          blockHash: b.blockHash,
          previousHash: b.previousHash,
          action: b.action,
          timestamp: b.timestamp,
          payloadSummary: b.payload?.message || b.action,
        })),
        chainIntegrity: chainVerification,
        legalNote: 'This evidence package was generated by PixelTruth. The blockchain-style chain of custody provides tamper-evident proof of content analysis. Each block hash is computed using SHA-256 and linked to the previous block.',
      },
    });
  } catch (err) { next(err); }
};

// GET /api/evidence/verify — verify entire chain integrity
const verifyChain = async (req, res, next) => {
  try {
    const result = await EvidenceChain.verifyChain(req.user._id);
    const totalBlocks = await EvidenceChain.countDocuments({ user: req.user._id });
    res.json({ ...result, totalBlocks });
  } catch (err) { next(err); }
};

module.exports = { uploadAndAnalyze, getResult, getHistory, getHistoryItem, requestTakedown, getEvidencePackage, verifyChain };
