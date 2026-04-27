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

// ─── Gemini: assess if a similar video is a copyright violation ───────────────
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

// ─── Compute what IS similar and what is NOT similar ─────────────────────────
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

  // Step 4: Fetch source video metadata
  const source = await fetchVideoMetadata(videoId);

  // Step 2: Compute dual hash of source thumbnail
  const sourceHashes = await thumbnailHashes(source.thumbnail);

  // Step 4: Gemini analysis with copyright verdict
  const geminiInsights = await analyzeWithGemini(
    source.thumbnail,
    source.title,
    source.description || '',
    source.channel
  );

  // Step 4: Multi-keyword scanning
  const primaryQuery = geminiInsights?.searchKeywords?.join(' ') || source.title;
  const extraKeywords = [
    source.title,
    ...(source.tags?.slice(0, 2) || []),
  ].filter(k => k !== primaryQuery);

  const candidates = await searchSimilarVideos(primaryQuery, videoId, extraKeywords);

  // Step 6: Score + copyright assessment for each candidate
  const results = await Promise.all(
    candidates.map(async (c) => {
      const cHashes = await thumbnailHashes(c.thumbnail);
      const titleScore = titleSimilarity(source.title, c.title);
      const similarity = computeSimilarityScore(
        sourceHashes.dHash, cHashes.dHash,
        titleScore,
        sourceHashes.aHash, cHashes.aHash
      );

      // Step 6 thresholds
      let riskLevel = 'Low';
      if (similarity >= 90) riskLevel = 'High Risk';
      else if (similarity >= 70) riskLevel = 'Suspicious';

      // Compute what IS and IS NOT similar
      const differences = computeDifferences(source, c, titleScore, similarity);

      // Run copyright assessment only for suspicious/high-risk (save API quota)
      let copyrightAssessment = null;
      if (similarity >= 50) {
        copyrightAssessment = await assessCopyrightViolation(
          source.title, source.channel,
          c.title, c.channel,
          similarity
        );
      }

      return {
        ...c,
        similarity,
        riskLevel,
        titleScore,
        differences,
        copyrightAssessment,
        copyrightComplaintUrl: getCopyrightComplaintUrl(c.id),
      };
    })
  );

  results.sort((a, b) => b.similarity - a.similarity);

  const highRisk = results.filter(r => r.riskLevel === 'High Risk');
  const suspicious = results.filter(r => r.riskLevel === 'Suspicious');
  const violations = results.filter(r => r.copyrightAssessment?.isCopyrightViolation);

  return {
    source,
    geminiInsights,
    similarVideos: results,
    summary: {
      totalChecked: results.length,
      highRisk: highRisk.length,
      suspicious: suspicious.length,
      possibleViolations: violations.length,
      overallStatus: highRisk.length > 0 ? 'High Risk' : suspicious.length > 0 ? 'Suspicious' : 'Safe',
    },
  };
}

module.exports = { analyzeYouTubeVideo, extractVideoId };
