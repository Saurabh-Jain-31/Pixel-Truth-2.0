const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
    },
    fileType: {
      type: String, // 'video' | 'image'
      enum: ['video', 'image', 'unknown'],
      default: 'unknown',
    },
    mimeType: {
      type: String,
    },
    fileSize: {
      type: Number, // bytes
    },
    filePath: {
      type: String, // server path or cloud URL
    },

    // Analysis results
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Safe', 'Suspicious', 'High Risk', 'Error'],
      default: 'Pending',
    },
    isAiGenerated: {
      type: Boolean,
      default: null,
    },
    confidence: {
      type: Number, // 0-100
      default: null,
    },
    matchPercent: {
      type: Number, // 0-100
      default: null,
    },

    // Fingerprint data — Step 2 (Fingerprinting Engine)
    perceptualHash: {
      type: String,   // dHash (difference hash)
      default: null,
    },
    aHash: {
      type: String,   // average hash
      default: null,
    },
    featureVector: {
      type: [Number], // 32-dim statistical feature vector
      default: [],
    },

    // Metadata
    resolution: String,
    duration: String,
    framesExtracted: {
      type: Number,
      default: 0,
    },

    // Analysis message
    message: {
      type: String,
      default: '',
    },

    // Gemini AI insights
    aiInsights: {
      contentDescription: String,
      manipulationSigns: [String],
      riskFactors: [String],
      contentCategory: String,
    },
  },
  { timestamps: true }
);

// Index for fast queries
uploadSchema.index({ user: 1, createdAt: -1 });
uploadSchema.index({ status: 1 });

module.exports = mongoose.model('Upload', uploadSchema);
