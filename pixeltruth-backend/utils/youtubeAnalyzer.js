const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Extract YouTube video ID ─────────────────────────────────────────────────
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// ─── Fetch video metadata via YouTube Data API ────────────────────────────────
async function fetchVideoMetadata(videoId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not configured');

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${apiKey}`;
  const { data } = await axios.get(url);

  if (!data.items || data.items.length === 0) {
    throw new Error('Video not found or is private.');
  }

  const item = data.items[0];
  return {
    id: videoId,
    title: item.snippet.title,
    description: item.snippet.description?.slice(0, 300),
    channel: item.snippet.channelTitle,
    channelId: item.snippet.channelId,
    publishedAt: item.snippet.publishedAt,
    thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
    tags: item.snippet.tags || [],
    viewCount: item.statistics?.viewCount,
    duration: item.contentDetails?.duration,
    url: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

// ─── Search YouTube for similar videos ───────────────────────────────────────
// Step 4: Multi-keyword scanning — runs multiple searches for better coverage
async function searchSimilarVideos(query, excludeId, extraKeywords = []) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    // Build search queries: main query + up to 2 keyword variants
    const queries = [query, ...extraKeywords.slice(0, 2)].filter(Boolean);
    const seen = new Set([excludeId]);
    const results = [];

    for (const q of queries) {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=8&key=${apiKey}`;
      const { data } = await axios.get(url);
      for (const item of (data.items || [])) {
        const vid = item.id.videoId;
        if (!seen.has(vid)) {
          seen.add(vid);
          results.push({
            id: vid,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            url: `https://www.youtube.com/watch?v=${vid}`,
            description: item.snippet.description?.slice(0, 150),
          });
        }
      }
    }
    return results;
  } catch {
    return [];
  }
}

// ─── Compute dHash from image buffer ─────────────────────────────────────────
async function dHashFromBuffer(buffer) {
  try {
    const { data } = await sharp(buffer)
      .resize(9, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    let bits = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const idx = row * 9 + col;
        bits += data[idx] < data[idx + 1] ? '1' : '0';
      }
    }
    let hex = '';
    for (let i = 0; i < 64; i += 4) {
      hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    }
    return hex;
  } catch {
    return null;
  }
}

// ─── Compute aHash from image buffer ─────────────────────────────────────────
async function aHashFromBuffer(buffer) {
  try {
    const { data } = await sharp(buffer)
      .resize(8, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const avg = data.reduce((s, v) => s + v, 0) / 64;
    let bits = '';
    for (let i = 0; i < 64; i++) bits += data[i] >= avg ? '1' : '0';
    let hex = '';
    for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    return hex;
  } catch {
    return null;
  }
}

// ─── Hamming distance ─────────────────────────────────────────────────────────
function hammingDistance(h1, h2) {
  if (!h1 || !h2 || h1.length !== h2.length) return 64;
  let d = 0;
  for (let i = 0; i < h1.length; i++) {
    const xor = parseInt(h1[i], 16) ^ parseInt(h2[i], 16);
    d += xor.toString(2).split('').filter(b => b === '1').length;
  }
  return d;
}

// ─── Download thumbnail and compute both hashes ───────────────────────────────
async function thumbnailHashes(thumbnailUrl) {
  try {
    const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer', timeout: 8000 });
    const buf = Buffer.from(response.data);
    const [d, a] = await Promise.all([dHashFromBuffer(buf), aHashFromBuffer(buf)]);
    return { dHash: d, aHash: a };
  } catch {
    return { dHash: null, aHash: null };
  }
}

// ─── Gemini: analyze thumbnail image + copyright verdict ─────────────────────
async function analyzeWithGemini(thumbnailUrl, title, description = '', channel = '') {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer', timeout: 8000 });
    const base64 = Buffer.from(response.data).toString('base64');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a YouTube copyright and content analyst AI.
Analyze this video thumbnail along with its metadata.
Video title: "${title}"
Channel: "${channel}"
Description snippet: "${description}"

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "contentType": string (e.g. "tutorial", "music", "gaming", "news", "vlog", "educational", "sports highlights", "movie clip"),
  "mainSubject": string (main topic/subject in max 60 chars),
  "searchKeywords": string[] (3-5 best keywords to find similar/duplicate videos),
  "isAiGenerated": boolean,
  "contentDescription": string (max 80 chars),
  "copyrightVerdict": string (one of: "Likely Original", "Possibly Copyrighted", "Likely Copyrighted", "Unknown"),
  "copyrightReason": string (brief reason for verdict, max 120 chars),
  "suggestedActions": string[] (2-4 actionable suggestions for the content owner, e.g. "File a DMCA takedown", "Monitor for re-uploads"),
  "licenseType": string (one of: "Standard YouTube License", "Creative Commons", "Unknown"),
  "riskLevel": string (one of: "Low", "Medium", "High")
}`;

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType: 'image/jpeg' } },
      prompt,
    ]);
    const text = result.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('[Gemini YouTube]', err.message);
    return null;
  }
}

// ─── Gemini: deep analysis report for a candidate video ──────────────────────
async function deepAnalyzeCandidate(source, candidate, similarity, channelStats) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const subCount = channelStats?.subscriberCount ? parseInt(channelStats.subscriberCount).toLocaleString() : 'unknown';
    const prompt = `You are a senior YouTube copyright attorney and digital forensics expert.

ORIGINAL VIDEO:
- Title: "${source.title}"
- Channel: "${source.channel}"
- Published: ${source.publishedAt}
- Views: ${source.viewCount || 'unknown'}

POTENTIALLY INFRINGING VIDEO:
- Title: "${candidate.title}"
- Channel: "${candidate.channel}" (${subCount} subscribers)
- Published: ${candidate.publishedAt}
- Visual similarity: ${similarity}%
- Description: "${candidate.description || 'none'}"

Provide a comprehensive analysis. Respond ONLY with valid JSON (no markdown):
{
  "verdict": string ("Definite Violation" | "Likely Violation" | "Possible Violation" | "Probably Safe" | "Cannot Determine"),
  "confidence": number (0-100),
  "monetizationRisk": string ("High" | "Medium" | "Low"),
  "monetizationRiskReason": string (max 100 chars),
  "legalStrength": string ("Strong Case" | "Moderate Case" | "Weak Case" | "No Case"),
  "deepAnalysis": string (2-3 sentence professional analysis of the copyright situation, max 300 chars),
  "evidencePoints": string[] (3-5 specific evidence points supporting the verdict),
  "immediateActions": string[] (2-3 specific immediate actions the original creator should take RIGHT NOW),
  "longTermActions": string[] (2-3 long-term protective measures),
  "estimatedTimeToResolve": string (e.g. "24-48 hours", "1-2 weeks", "1-3 months"),
  "suggestedAction": string ("File DMCA Takedown" | "Send Copyright Strike" | "Monitor Closely" | "No Action Needed" | "Seek Legal Advice")
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('[Gemini Deep]', err.message);
    return null;
  }
}
async function assessCopyrightViolation(sourceTitle, sourceChannel, candidateTitle, candidateChannel, similarity) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a YouTube copyright expert AI.
Original video: "${sourceTitle}" by channel "${sourceChannel}"
Potentially infringing video: "${candidateTitle}" by channel "${candidateChannel}"
Visual similarity score: ${similarity}%

Based on this information, respond ONLY with valid JSON (no markdown):
{
  "isCopyrightViolation": boolean,
  "confidence": number (0-100),
  "verdict": string (one of: "Likely Violation", "Possible Violation", "Probably Safe", "Cannot Determine"),
  "reason": string (brief explanation, max 150 chars),
  "suggestedAction": string (one of: "File DMCA Takedown", "Send Copyright Strike", "Monitor Closely", "No Action Needed", "Seek Legal Advice")
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(text);
  } catch {
    return null;
  }
}
// Blends: dHash Hamming (35%) + aHash Hamming (35%) + title overlap (30%)
function computeSimilarityScore(sourceHash, candidateHash, titleScore, sourceAHash, candidateAHash) {
  const dDist = hammingDistance(sourceHash, candidateHash);
  const dScore = Math.max(0, 100 - (dDist / 64) * 100);

  let aScore = dScore; // fallback if aHash not available
  if (sourceAHash && candidateAHash) {
    const aDist = hammingDistance(sourceAHash, candidateAHash);
    aScore = Math.max(0, 100 - (aDist / 64) * 100);
  }

  return Math.round(dScore * 0.35 + aScore * 0.35 + titleScore * 0.30);
}

// ─── Fetch channel statistics ─────────────────────────────────────────────────
async function fetchChannelStats(channelId) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !channelId) return null;
  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
    const { data } = await axios.get(url, { timeout: 6000 });
    const ch = data.items?.[0];
    if (!ch) return null;
    return {
      name: ch.snippet.title,
      subscriberCount: ch.statistics.subscriberCount,
      videoCount: ch.statistics.videoCount,
      viewCount: ch.statistics.viewCount,
      joinedAt: ch.snippet.publishedAt,
      country: ch.snippet.country || null,
      isVerified: ch.statistics.subscriberCount > 100000,
    };
  } catch { return null; }
}

// ─── Parse ISO 8601 duration to seconds ──────────────────────────────────────
function parseDuration(iso) {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

// ─── Detect re-upload based on dates ─────────────────────────────────────────
function detectReupload(sourceDate, candidateDate) {
  const src = new Date(sourceDate);
  const cand = new Date(candidateDate);
  const diffDays = Math.round((cand - src) / (1000 * 60 * 60 * 24));
  if (diffDays > 1) return { isReupload: true, daysAfter: diffDays };
  if (diffDays < -1) return { isReupload: false, daysBefore: Math.abs(diffDays) };
  return { isReupload: false, sameTime: true };
}

// ─── Engagement anomaly score ─────────────────────────────────────────────────
// Low views but high likes = suspicious bot activity or private sharing
// Very high views but 0 comments = possible view farming
function engagementScore(viewCount, likeCount, commentCount) {
  if (!viewCount) return { score: 50, label: 'Unknown', anomaly: false };
  const v = parseInt(viewCount) || 0;
  const l = parseInt(likeCount) || 0;
  const c = parseInt(commentCount) || 0;
  if (v === 0) return { score: 50, label: 'No views', anomaly: false };
  const likeRatio = l / v;
  const commentRatio = c / v;
  let score = 100;
  let anomaly = false;
  if (likeRatio > 0.15) { score -= 20; anomaly = true; } // unusually high like ratio
  if (commentRatio === 0 && v > 10000) { score -= 15; anomaly = true; } // no comments on popular video
  if (v > 1000000 && l < 100) { score -= 30; anomaly = true; } // viral but no likes
  return { score: Math.max(0, score), label: anomaly ? 'Anomalous' : 'Normal', anomaly };
}
function computeDifferences(source, candidate, titleScore, similarity) {
  const similar = [];
  const different = [];

  // Title
  if (titleScore >= 60) similar.push(`Title is very similar (${titleScore}% word overlap)`);
  else if (titleScore >= 30) similar.push(`Title has some overlap (${titleScore}% words match)`);
  else different.push('Title is different');

  // Channel
  if (source.channel.toLowerCase() === candidate.channel.toLowerCase()) {
    similar.push('Same channel — likely the original uploader');
  } else {
    different.push(`Different channel: "${candidate.channel}" vs your "${source.channel}"`);
  }

  // Upload date
  const srcDate = new Date(source.publishedAt);
  const candDate = new Date(candidate.publishedAt);
  const daysDiff = Math.abs((srcDate - candDate) / (1000 * 60 * 60 * 24));
  if (candDate > srcDate) {
    different.push(`Uploaded ${Math.round(daysDiff)} days AFTER your video — possible re-upload`);
  } else if (daysDiff < 7) {
    similar.push('Uploaded around the same time');
  } else {
    different.push(`Uploaded ${Math.round(daysDiff)} days before your video`);
  }

  // Visual similarity
  if (similarity >= 80) similar.push(`High visual similarity (${similarity}%) — thumbnails look nearly identical`);
  else if (similarity >= 50) similar.push(`Moderate visual similarity (${similarity}%) in thumbnail`);
  else different.push(`Low visual similarity (${similarity}%) — thumbnails look different`);

  return { similar, different };
}

// ─── Generate YouTube copyright complaint URL ─────────────────────────────────
function getCopyrightComplaintUrl(infringingVideoId) {
  return `https://www.youtube.com/copyright_complaint_form?video_id=${infringingVideoId}`;
}

// ─── Generate DMCA takedown URL ───────────────────────────────────────────────
function getDmcaUrl(infringingVideoUrl) {
  return `https://support.google.com/youtube/answer/2807622`;
}
function titleSimilarity(t1, t2) {
  const words1 = new Set(t1.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3));
  const words2 = new Set(t2.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ').filter(w => w.length > 3));
  if (words1.size === 0) return 0;
  let overlap = 0;
  words1.forEach(w => { if (words2.has(w)) overlap++; });
  return Math.round((overlap / Math.max(words1.size, words2.size)) * 100);
}

// ─── Main YouTube Analysis Pipeline ──────────────────────────────────────────
async function analyzeYouTubeVideo(youtubeUrl) {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) throw new Error('Invalid YouTube URL. Please provide a valid YouTube link.');

  // 1. Fetch source video metadata + channel stats
  const source = await fetchVideoMetadata(videoId);
  const sourceChannelStats = await fetchChannelStats(source.channelId);

  // 2. Compute dual hash of source thumbnail
  const sourceHashes = await thumbnailHashes(source.thumbnail);

  // 3. Gemini analysis with copyright verdict
  const geminiInsights = await analyzeWithGemini(
    source.thumbnail, source.title, source.description || '', source.channel
  );

  // 4. Multi-keyword scanning
  const primaryQuery = geminiInsights?.searchKeywords?.join(' ') || source.title;
  const extraKeywords = [source.title, ...(source.tags?.slice(0, 2) || [])].filter(k => k !== primaryQuery);
  const candidates = await searchSimilarVideos(primaryQuery, videoId, extraKeywords);

  // 5. Score + deep analysis for each candidate
  const results = await Promise.all(
    candidates.map(async (c) => {
      const cHashes = await thumbnailHashes(c.thumbnail);
      const titleScore = titleSimilarity(source.title, c.title);
      const similarity = computeSimilarityScore(
        sourceHashes.dHash, cHashes.dHash, titleScore, sourceHashes.aHash, cHashes.aHash
      );

      // Risk level
      let riskLevel = 'Low';
      if (similarity >= 90) riskLevel = 'High Risk';
      else if (similarity >= 70) riskLevel = 'Suspicious';

      // Differences
      const differences = computeDifferences(source, c, titleScore, similarity);

      // Re-upload detection
      const reuploadInfo = detectReupload(source.publishedAt, c.publishedAt);

      // Channel stats for candidate
      let candidateChannelStats = null;
      if (similarity >= 40) {
        // Fetch channel ID from search result — need extra API call
        try {
          const vidUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${c.id}&key=${process.env.YOUTUBE_API_KEY}`;
          const { data } = await axios.get(vidUrl, { timeout: 5000 });
          const channelId = data.items?.[0]?.snippet?.channelId;
          if (channelId) candidateChannelStats = await fetchChannelStats(channelId);
        } catch {}
      }

      // Deep AI analysis for suspicious/high-risk
      let deepAnalysis = null;
      if (similarity >= 50) {
        deepAnalysis = await deepAnalyzeCandidate(source, c, similarity, candidateChannelStats);
      }

      // Engagement anomaly
      const engagement = c.viewCount
        ? engagementScore(c.viewCount, c.likeCount, c.commentCount)
        : null;

      return {
        ...c,
        similarity,
        riskLevel,
        titleScore,
        differences,
        reuploadInfo,
        candidateChannelStats,
        deepAnalysis,
        engagement,
        copyrightComplaintUrl: getCopyrightComplaintUrl(c.id),
        // Keep backward compat
        copyrightAssessment: deepAnalysis ? {
          isCopyrightViolation: ['Definite Violation', 'Likely Violation'].includes(deepAnalysis.verdict),
          confidence: deepAnalysis.confidence,
          verdict: deepAnalysis.verdict === 'Definite Violation' ? 'Likely Violation'
            : deepAnalysis.verdict === 'Probably Safe' ? 'Probably Safe'
            : deepAnalysis.verdict,
          reason: deepAnalysis.deepAnalysis,
          suggestedAction: deepAnalysis.suggestedAction,
        } : null,
      };
    })
  );

  results.sort((a, b) => b.similarity - a.similarity);

  const highRisk = results.filter(r => r.riskLevel === 'High Risk');
  const suspicious = results.filter(r => r.riskLevel === 'Suspicious');
  const violations = results.filter(r => r.deepAnalysis?.verdict?.includes('Violation'));
  const reuploadCount = results.filter(r => r.reuploadInfo?.isReupload).length;

  // Source duration in seconds
  const sourceDurationSec = parseDuration(source.duration);

  return {
    source: { ...source, channelStats: sourceChannelStats, durationSec: sourceDurationSec },
    geminiInsights,
    similarVideos: results,
    summary: {
      totalChecked: results.length,
      highRisk: highRisk.length,
      suspicious: suspicious.length,
      possibleViolations: violations.length,
      reuploadDetected: reuploadCount,
      overallStatus: highRisk.length > 0 ? 'High Risk' : suspicious.length > 0 ? 'Suspicious' : 'Safe',
    },
  };
}

module.exports = { analyzeYouTubeVideo, extractVideoId };
