/**
 * Main Analysis Pipeline
 * Steps 2, 4, 6 + Cross-Platform Detection
 *
 * After fingerprinting + AI analysis, searches YouTube for the same content
 * and tells the user: where it was found, when, by whom, and what to do.
 */

const fs = require('fs');
const axios = require('axios');
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
  "safetyScore": number (0-100, higher = more original/safe),
  "searchKeywords": string[] (3-5 keywords to find this content on YouTube/Instagram),
  "contentTopic": string (brief topic like "cricket match", "music video", "nature photography", max 50 chars)
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

// ─── Extract keywords from filename as fallback ───────────────────────────────
function keywordsFromFilename(filePath) {
  const base = require('path').basename(filePath, require('path').extname(filePath));
  // Split on common separators, filter short words
  return base
    .replace(/[_\-\.]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase split
    .split(' ')
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 2)
    .slice(0, 5);
}

// ─── Cross-Platform Search: YouTube ──────────────────────────────────────────
async function searchYouTube(keywords, filePath, mimeType) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  // Build keyword list — use Gemini keywords first, fall back to filename
  let searchTerms = keywords?.filter(Boolean) || [];
  if (searchTerms.length === 0) {
    searchTerms = keywordsFromFilename(filePath);
  }
  // Still nothing? Use generic content type search
  if (searchTerms.length === 0) {
    searchTerms = mimeType?.startsWith('video/') ? ['video content'] : ['image content'];
  }

  try {
    const seen = new Set();
    const results = [];

    // Run up to 2 search queries for broader coverage
    const queries = [
      searchTerms.slice(0, 3).join(' '),
      searchTerms.slice(0, 2).join(' '),
    ].filter((q, i, arr) => q && arr.indexOf(q) === i); // dedupe

    for (const query of queries) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=6&key=${apiKey}`;
      const { data } = await axios.get(url, { timeout: 8000 });
      for (const item of (data.items || [])) {
        const vid = item.id.videoId;
        if (!seen.has(vid)) {
          seen.add(vid);
          results.push({
            platform: 'YouTube',
            id: vid,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            uploadedAt: item.snippet.publishedAt,
            thumbnail: item.snippet.thumbnails?.medium?.url,
            url: `https://www.youtube.com/watch?v=${vid}`,
            description: item.snippet.description?.slice(0, 120),
          });
        }
      }
    }
    return results;
  } catch (err) {
    console.error('[YouTube Search]', err.message);
    return [];
  }
}

// ─── Score visual similarity via thumbnail hash ───────────────────────────────
const sharp = require('sharp');

async function thumbnailHash(url) {
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 6000 });
    const { data } = await sharp(Buffer.from(res.data))
      .resize(9, 8, { fit: 'fill' }).grayscale().raw()
      .toBuffer({ resolveWithObject: true });
    let bits = '';
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 8; c++)
        bits += data[r * 9 + c] < data[r * 9 + c + 1] ? '1' : '0';
    let hex = '';
    for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    return hex;
  } catch { return null; }
}

function hammingScore(h1, h2) {
  if (!h1 || !h2 || h1.length !== h2.length) return 0;
  let d = 0;
  for (let i = 0; i < h1.length; i++) {
    const xor = parseInt(h1[i], 16) ^ parseInt(h2[i], 16);
    d += xor.toString(2).split('').filter(b => b === '1').length;
  }
  return Math.max(0, Math.round(100 - (d / 64) * 100));
}

// ─── Build "what to do" action list ──────────────────────────────────────────
function buildActionSteps(platformMatches, status) {
  const actions = [];
  const hasAnyResults = platformMatches.length > 0;
  const hasHighMatch = platformMatches.some(m => m.similarity >= 50);

  if (status === 'High Risk' || hasHighMatch) {
    actions.push({ priority: 'high', icon: 'gavel', title: 'File a Copyright Claim', desc: 'Submit a DMCA takedown to the platform where your content was found without permission.', link: 'https://support.google.com/youtube/answer/2807622', linkText: 'YouTube DMCA Guide' });
    actions.push({ priority: 'high', icon: 'camera', title: 'Document the Evidence', desc: 'Screenshot the infringing content, note the URL, upload date, and channel/account name.' });
    actions.push({ priority: 'medium', icon: 'mail', title: 'Contact the Uploader', desc: 'Send a cease-and-desist message asking them to remove your content immediately.' });
  } else if (status === 'Suspicious' || hasAnyResults) {
    actions.push({ priority: 'medium', icon: 'eye', title: 'Review These Results', desc: `Found ${platformMatches.length} related video${platformMatches.length > 1 ? 's' : ''} on YouTube. Check if any are unauthorized copies of your content.` });
    actions.push({ priority: 'medium', icon: 'camera', title: 'Document for Reference', desc: 'Save screenshots and URLs of suspicious content as evidence.' });
    actions.push({ priority: 'low', icon: 'gavel', title: 'File DMCA if Confirmed', desc: 'If you confirm a video is an unauthorized copy, file a DMCA takedown immediately.', link: 'https://support.google.com/youtube/answer/2807622', linkText: 'YouTube DMCA Guide' });
  } else {
    actions.push({ priority: 'low', icon: 'shield', title: 'Content Appears Safe', desc: 'No significant matches found. Your content looks original across scanned platforms.' });
    actions.push({ priority: 'low', icon: 'bell', title: 'Set Up Regular Monitoring', desc: 'Re-analyze periodically to catch any future unauthorized uploads.' });
  }

  return actions;
}

// ─── Main Pipeline ────────────────────────────────────────────────────────────
const analyzeContent = async (filePath, mimeType, uploadId = null, userId = null) => {
  const isVideo = mimeType && mimeType.startsWith('video/');
  const isImage = mimeType && mimeType.startsWith('image/');

  // Step 2: Fingerprint
  const fp = await computeFingerprint(filePath, mimeType);

  // Step 4: Gemini Vision
  const gemini = await analyzeWithGemini(filePath, mimeType);

  // Step 6: DB match
  const { matchPercent: dbMatchPercent, matchedUpload } = await findBestMatch(
    { dHash: fp.dHash, aHash: fp.aHash, featureVector: fp.featureVector },
    userId, uploadId
  );

  let geminiRisk = 0;
  if (gemini?.safetyScore !== undefined) {
    geminiRisk = 100 - gemini.safetyScore;
    if (gemini.isAiGenerated) geminiRisk = Math.min(100, geminiRisk + 10);
  }

  const matchPercent = dbMatchPercent > 0
    ? Math.round(dbMatchPercent * 0.7 + geminiRisk * 0.3)
    : Math.round(geminiRisk);

  const status = determineStatus(matchPercent);
  const isAiGenerated = gemini ? gemini.isAiGenerated : false;
  const confidence = gemini ? gemini.aiGeneratedConfidence : 50;

  // Cross-platform search — uses Gemini keywords if available, falls back to filename
  const keywords = gemini?.searchKeywords || [];
  const ytResults = await searchYouTube(keywords, filePath, mimeType);

  // Score each YouTube result against uploaded content's fingerprint
  const platformMatches = await Promise.all(
    ytResults.map(async (yt) => {
      const ytHash = yt.thumbnail ? await thumbnailHash(yt.thumbnail) : null;
      const similarity = hammingScore(fp.dHash, ytHash);
      const daysSinceUpload = yt.uploadedAt
        ? Math.floor((Date.now() - new Date(yt.uploadedAt)) / (1000 * 60 * 60 * 24))
        : null;
      return {
        ...yt,
        similarity,
        daysSinceUpload,
        // Lower threshold — show all results, let user judge
        riskLevel: similarity >= 65 ? 'High Risk' : similarity >= 35 ? 'Suspicious' : 'Low',
      };
    })
  );

  // Show ALL results sorted by similarity (not filtered out)
  platformMatches.sort((a, b) => b.similarity - a.similarity);

  // Build action steps — trigger if any YouTube results found
  const actionSteps = buildActionSteps(platformMatches, status);

  // Build message
  const topMatch = platformMatches.find(m => m.similarity >= 35);
  let message = '';
  const foundCount = platformMatches.length;
  if (gemini) {
    const cat = gemini.contentCategory || 'unknown';
    if (status === 'High Risk') {
      message = `High risk (${matchPercent}% match). Category: ${cat}.${topMatch ? ` Found on ${topMatch.platform}: "${topMatch.title}" by ${topMatch.channel}.` : ''} Immediate action recommended.`;
    } else if (status === 'Suspicious') {
      message = `Suspicious content (${matchPercent}% match). Category: ${cat}.${topMatch ? ` Possible match on ${topMatch.platform}.` : ''} Manual review suggested.`;
    } else {
      message = `Content appears original (${matchPercent}% match). ${gemini.contentDescription || ''}${foundCount > 0 ? ` Found ${foundCount} related video${foundCount > 1 ? 's' : ''} on YouTube — check below.` : ' No matches found on YouTube.'}`;
    }
  } else {
    if (status === 'High Risk') {
      message = `High similarity detected (${matchPercent}%). Immediate review recommended.${foundCount > 0 ? ` ${foundCount} YouTube results found.` : ''}`;
    } else if (status === 'Suspicious') {
      message = `Moderate similarity (${matchPercent}%). Manual review suggested.${foundCount > 0 ? ` ${foundCount} YouTube results found.` : ''}`;
    } else {
      message = `No significant fingerprint match (${matchPercent}%).${foundCount > 0 ? ` Found ${foundCount} related video${foundCount > 1 ? 's' : ''} on YouTube based on filename keywords.` : ' No matches found on YouTube.'}`;
    }
  }

  return {
    status,
    isAiGenerated,
    confidence,
    matchPercent,
    perceptualHash: fp.dHash,
    aHash: fp.aHash,
    featureVector: fp.featureVector,
    framesExtracted: fp.framesExtracted,
    message,
    fileType: isVideo ? 'video' : isImage ? 'image' : 'unknown',
    matchedUploadId: matchedUpload?._id || null,
    platformMatches,          // NEW: cross-platform results
    actionSteps,              // NEW: what to do
    aiInsights: gemini ? {
      contentDescription: gemini.contentDescription,
      contentTopic: gemini.contentTopic,
      manipulationSigns: gemini.manipulationSigns,
      riskFactors: gemini.riskFactors,
      contentCategory: gemini.contentCategory,
      searchKeywords: gemini.searchKeywords,
    } : null,
  };
};

module.exports = analyzeContent;
