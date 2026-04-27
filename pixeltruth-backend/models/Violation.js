const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema(
  {
    upload: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Upload',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['High Risk', 'Suspicious'],
      required: true,
    },
    matchPercent: {
      type: Number,
    },
    confidence: {
      type: Number,
    },
    source: {
      type: String,
      default: 'Direct Upload',
    },
    description: {
      type: String,
      default: '',
    },
    // Evidence
    matchedFrames: [String],
    evidenceGenerated: {
      type: Boolean,
      default: false,
    },
    // Action taken
    takedownRequested: {
      type: Boolean,
      default: false,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

violationSchema.index({ user: 1, createdAt: -1 });
violationSchema.index({ status: 1 });

module.exports = mongoose.model('Violation', violationSchema);
