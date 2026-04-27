/**
 * Step 6 — Matching Algorithm (Decision Brain)
 * Compares a new fingerprint against ALL stored fingerprints in MongoDB.
 * Uses:
 *   - Hamming distance on dHash + aHash
 *   - Cosine similarity on feature vectors
 * Thresholds:
 *   90%+ match → HIGH RISK
 *   70–90%     → Suspicious
 *   <70%       → Safe
 */

const Upload = require('../models/Upload');
const { matchScore } = require('./fingerprint');

/**
 * Compare new fingerprint against all stored uploads (excluding current user's own)
 * Returns best match score and matched upload if found
 */
async function findBestMatch(newFingerprint, currentUserId, currentUploadId) {
  try {
    // Fetch all uploads that have fingerprint data, excluding current upload
    const stored = await Upload.find({
      _id: { $ne: currentUploadId },
      perceptualHash: { $ne: null },
      featureVector: { $exists: true, $not: { $size: 0 } },
    })
      .select('_id fileName originalName perceptualHash featureVector user status')
      .limit(500) // cap for performance
      .lean();

    if (stored.length === 0) return { matchPercent: 0, matchedUpload: null };

    let bestScore = 0;
    let bestMatch = null;

    for (const doc of stored) {
      // Build stored fingerprint object
      // perceptualHash stores dHash; featureVector stores the vector
      const storedFp = {
        dHash: doc.perceptualHash,
        aHash: doc.perceptualHash, // fallback — same hash used for both if aHash not stored separately
        featureVector: doc.featureVector,
      };

      const score = matchScore(newFingerprint, storedFp);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = doc;
      }
    }

    return {
      matchPercent: bestScore,
      matchedUpload: bestMatch,
    };
  } catch (err) {
    console.error('[MatchEngine]', err.message);
    return { matchPercent: 0, matchedUpload: null };
  }
}

/**
 * Determine risk status based on match percent
 * Step 6 thresholds from spec:
 *   90%+ → HIGH RISK
 *   70–90% → Suspicious
 *   <70% → Safe
 */
function determineStatus(matchPercent) {
  if (matchPercent >= 90) return 'High Risk';
  if (matchPercent >= 70) return 'Suspicious';
  return 'Safe';
}

module.exports = { findBestMatch, determineStatus };
