/**
 * Main Analysis Pipeline
 * Implements Steps 2, 4, 6 from the PixelTruth spec:
 *
 * Step 2 — Fingerprinting Engine:
 *   - dHash (difference hash)
 *   - aHash (average hash)
 *   - 32-dim feature vector (statistical grid descriptor)
 *   - Real video frame extraction via FFmpeg
 *
 * Step 4 — Scanning (for uploaded content):
 *   - Gemini Vision AI analysis of content
 *   - Detects AI-generated content, manipulation signs, risk factors
 *
 * Step 6 — Matching Algorithm:
 *   - Cosine similarity on feature vectors
 *   - Hamming distance on dHash + aHash
 *   - Compare against ALL stored fingerprints in DB
 *   - 90%+ → High Risk, 70-90% → Suspicious, <70% → Safe
 */

const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { computeFingerprint } = require('./fingerprint');
const { findBestMatch, determineStatus } = require('./matchEngine');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Step 4: Gemini Vision Analysis ──────────────────────────────────────────
async function analyzeWithGemini(filePath, mimeType) {
  if (!process.env.GEMINI_API_KEY) return null;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const fileData = fs.readFileSync(filePath);
    const base64 = fileData.toString('base64');
    const effectiveMime = mimeType.startsWith('video/') ? 'image/jpeg' : mimeType;

    const prompt = `You are an expert digital forensics AI for a content integrity platform.
Analyze this media and respond ONLY with valid JSON (no markdown):
{
  "isAiGenerated": boolean,
  "aiGeneratedConfidence": number (0-100),
  "contentDescription": string (max 100 chars),
  "manipulationSigns": string[] (signs of editing/manipulation, empty if none),
  "contentCategory": string ("original" | "modified" | "ai-generated" | "suspicious"),
  "riskFactors": string[] (risk factors, empty if none),
  "safetyScore": number (0-100, higher = more original/safe)
}`;

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType: effectiveMime } },
      prompt,
    ]);

    const text = result.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('[Gemini]', err.message);
    return null;
  }
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────
const analyzeContent = async (filePath, mimeType, uploadId = null, userId = null) => {
  const isVideo = mimeType && mimeType.startsWith('video/');
  const isImage = mimeType && mimeType.startsWith('image/');

  // ── Step 2: Compute real fingerprints ────────────────────────────────────
  const fp = await computeFingerprint(filePath, mimeType);

  // ── Step 4: Gemini Vision scan ────────────────────────────────────────────
  const gemini = await analyzeWithGemini(filePath, mimeType);

  // ── Step 6: Match against stored fingerprints in DB ──────────────────────
  const { matchPercent: dbMatchPercent, matchedUpload } = await findBestMatch(
    { dHash: fp.dHash, aHash: fp.aHash, featureVector: fp.featureVector },
    userId,
    uploadId
  );

  // Blend DB match score (60%) with Gemini risk score (40%)
  let geminiRisk = 0;
  if (gemini?.safetyScore !== undefined) {
    geminiRisk = 100 - gemini.safetyScore;
    if (gemini.isAiGenerated) geminiRisk = Math.min(100, geminiRisk + 10);
  }

  // If DB has a real match, weight it heavily
  const matchPercent = dbMatchPercent > 0
    ? Math.round(dbMatchPercent * 0.7 + geminiRisk * 0.3)
    : Math.round(geminiRisk);

  // ── Step 6: Apply thresholds ──────────────────────────────────────────────
  const status = determineStatus(matchPercent);

  // AI detection
  const isAiGenerated = gemini ? gemini.isAiGenerated : false;
  const confidence = gemini ? gemini.aiGeneratedConfidence : 50;

  // Build message
  let message = '';
  if (gemini) {
    const signs = gemini.manipulationSigns?.length
      ? ` Signs: ${gemini.manipulationSigns.slice(0, 2).join(', ')}.`
      : '';
    const cat = gemini.contentCategory || 'unknown';
    if (status === 'High Risk') {
      message = `High risk detected (${matchPercent}% match score). Category: ${cat}.${signs}${matchedUpload ? ` Similar to: "${matchedUpload.originalName || matchedUpload.fileName}".` : ''} Immediate review recommended.`;
    } else if (status === 'Suspicious') {
      message = `Suspicious content (${matchPercent}% match score). Category: ${cat}.${signs} Manual review suggested.`;
    } else {
      message = `Content appears original (${matchPercent}% match score). Category: ${cat}. ${gemini.contentDescription || ''}`;
    }
  } else {
    if (status === 'High Risk') {
      message = `High similarity detected (${matchPercent}%).${matchedUpload ? ` Matches: "${matchedUpload.originalName || matchedUpload.fileName}".` : ''} Immediate review recommended.`;
    } else if (status === 'Suspicious') {
      message = `Moderate similarity (${matchPercent}%). Content may be a modified version.`;
    } else {
      message = `No significant match found (${matchPercent}%). Content appears original.`;
    }
  }

  return {
    status,
    isAiGenerated,
    confidence,
    matchPercent,
    perceptualHash: fp.dHash,   // stored as perceptualHash for backward compat
    aHash: fp.aHash,
    featureVector: fp.featureVector,
    framesExtracted: fp.framesExtracted,
    message,
    fileType: isVideo ? 'video' : isImage ? 'image' : 'unknown',
    matchedUploadId: matchedUpload?._id || null,
    aiInsights: gemini ? {
      contentDescription: gemini.contentDescription,
      manipulationSigns: gemini.manipulationSigns,
      riskFactors: gemini.riskFactors,
      contentCategory: gemini.contentCategory,
    } : null,
  };
};

module.exports = analyzeContent;
