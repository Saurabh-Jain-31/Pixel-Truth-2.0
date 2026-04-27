/**
 * EvidenceChain — Blockchain-style immutable audit trail
 *
 * Each block contains:
 *   - uploadId reference
 *   - SHA-256 hash of the evidence data
 *   - previousHash (links to prior block — tamper-evident)
 *   - timestamp
 *   - action type
 *
 * This creates a verifiable chain of custody for legal proceedings.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const evidenceBlockSchema = new mongoose.Schema({
  // Chain linkage
  blockIndex: { type: Number, required: true },
  previousHash: { type: String, required: true },
  blockHash: { type: String, required: true },

  // References
  upload: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Action
  action: {
    type: String,
    enum: ['UPLOAD_ANALYZED', 'VIOLATION_DETECTED', 'TAKEDOWN_REQUESTED', 'TAKEDOWN_SENT', 'EVIDENCE_EXPORTED', 'RESOLVED'],
    required: true,
  },

  // Evidence payload (hashed into blockHash)
  payload: {
    fileName: String,
    fileHash: String,          // SHA-256 of the actual file
    perceptualHash: String,
    matchPercent: Number,
    status: String,
    platformMatches: [{ platform: String, url: String, channel: String, similarity: Number }],
    message: String,
    ipAddress: String,
    userAgent: String,
  },

  // Takedown tracking
  takedownStatus: {
    type: String,
    enum: ['none', 'pending', 'sent', 'acknowledged', 'resolved'],
    default: 'none',
  },
  takedownUrl: String,
  takedownNote: String,

  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

// Static: compute block hash
evidenceBlockSchema.statics.computeHash = function(blockIndex, previousHash, timestamp, payload, action) {
  const data = JSON.stringify({ blockIndex, previousHash, timestamp, payload, action });
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Static: get last block for a user
evidenceBlockSchema.statics.getLastBlock = async function(userId) {
  return this.findOne({ user: userId }).sort({ blockIndex: -1 });
};

// Static: create new block
evidenceBlockSchema.statics.addBlock = async function(userId, uploadId, action, payload) {
  const lastBlock = await this.getLastBlock(userId);
  const blockIndex = lastBlock ? lastBlock.blockIndex + 1 : 0;
  const previousHash = lastBlock ? lastBlock.blockHash : '0000000000000000000000000000000000000000000000000000000000000000';
  const timestamp = new Date();
  const blockHash = this.computeHash(blockIndex, previousHash, timestamp, payload, action);

  return this.create({
    blockIndex,
    previousHash,
    blockHash,
    upload: uploadId,
    user: userId,
    action,
    payload,
    timestamp,
  });
};

// Static: verify chain integrity for a user
evidenceBlockSchema.statics.verifyChain = async function(userId) {
  const blocks = await this.find({ user: userId }).sort({ blockIndex: 1 });
  for (let i = 1; i < blocks.length; i++) {
    const current = blocks[i];
    const previous = blocks[i - 1];
    if (current.previousHash !== previous.blockHash) {
      return { valid: false, brokenAt: i, message: `Chain broken at block ${i}` };
    }
    const recomputed = this.computeHash(current.blockIndex, current.previousHash, current.timestamp, current.payload, current.action);
    if (recomputed !== current.blockHash) {
      return { valid: false, brokenAt: i, message: `Block ${i} hash mismatch — evidence may be tampered` };
    }
  }
  return { valid: true, totalBlocks: blocks.length };
};

module.exports = mongoose.model('EvidenceChain', evidenceBlockSchema);
