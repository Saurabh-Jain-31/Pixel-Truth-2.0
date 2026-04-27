/**
 * Instagram Content Analyzer
 *
 * Note: Instagram has no public search API.
 * We use:
 *   1. Instagram oEmbed API — fetch post metadata (title, thumbnail, author)
 *   2. Gemini Vision — analyze the image/thumbnail for copyright signals
 *   3. YouTube Data API — cross-platform search for same content
 *   4. Action guide — what to do if violation found
 */

const axios = require('axios');
const sharp = require('sharp');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ─── Extract Instagram post URL (clean it) ────────────────────────────────────
function extractInstagramPostUrl(input) {
  // Accept reel, post, tv URLs
  const match = input.match(/(https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/[A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

// ─── Fetch metadata via Instagram oEmbed (no auth needed) ────────────────────
async function fetchInstagramMetadata(postUrl) {
  try {
    const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(postUrl)}&maxwidth=640`;
    const { data } = await axios.get(oembedUrl, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    return {
      title: data.title || 'Instagram Post',
      author: data.author_name || 'Unknown',
      authorUrl: data.author_url || '',
      thumbnail: data.thumbnail_url || null,
      thumbnailWidth: data.thumbnail_width,
      thumbnailHeight: data.thumbnail_height,
      html: data.html,
      postUrl,
      platform: 'Instagram',
    };
  } catch (err) {
    // oEmbed may fail for private posts — return minimal info
    console.error('[Instagram oEmbed]', err.message);
    return {
      title: 'Instagram Post (private or unavailable)',
      author: 'Unknown',
      authorUrl: '',
      thumbnail: null,
      postUrl,
      platform: 'Instagram',
      error: 'Could not fetch post metadata. Post may be private.',
    };
  }
}

// ─── Gemini: analyze Instagram thumbnail ─────────────────────────────────────
async function analyzeWithGemini(thumbnailUrl, title, author) {
  if (!process.env.GEMINI_API_KEY || !thumbnailUrl) return null;
  try {
    const response = await axios.get(thumbnailUrl, { responseType: 'arraybuffer', timeout: 8000 });
    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = 'image/jpeg';

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const prompt = `You are a social media copyright analyst AI.
Analyze this Instagram post image/thumbnail.
Post title/caption: "${title}"
Posted by: "${author}"

Respond ONLY with valid JSON (no markdown):
{
  "contentType": string (e.g. "original video", "music video", "sports clip", "movie scene", "meme", "personal content", "brand content"),
  "mainSubject": string (max 60 chars),
  "isAiGenerated": boolean,
  "contentDescription": string (max 100 chars),
  "copyrightRisk": string (one of: "Low", "Medium", "High"),
  "copyrightVerdict": string (one of: "Likely Original", "Possibly Copyrighted", "Likely Copyrighted", "Unknown"),
  "copyrightReason": string (max 150 chars),
  "searchKeywords": string[] (3-5 keywords to find this content on YouTube),
  "whatToDo": string[] (3-5 specific action steps the content owner should take),
  "reportSteps": string[] (step-by-step how to report this on Instagram, 3-5 steps)
}`;

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType } },
      prompt,
    ]);
    const text = result.response.text().trim()
      .replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(text);
  } catch (err) {
    console.error('[Gemini Instagram]', err.message);
    return null;
  }
}

// ─── Search YouTube for same content (cross-platform detection) ───────────────
async function searchYouTubeForContent(keywords, author) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || !keywords?.length) return [];

  try {
    const query = keywords.slice(0, 3).join(' ');
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${apiKey}`;
    const { data } = await axios.get(url);

    return (data.items || []).map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnail: item.snippet.thumbnails?.medium?.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    }));
  } catch {
    return [];
  }
}

// ─── dHash from buffer ────────────────────────────────────────────────────────
async function dHashFromBuffer(buffer) {
  try {
    const { data } = await sharp(buffer)
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

// ─── Score YouTube result against Instagram thumbnail ─────────────────────────
async function scoreYouTubeMatch(instagramHash, ytVideo) {
  if (!instagramHash || !ytVideo.thumbnail) return 0;
  try {
    const res = await axios.get(ytVideo.thumbnail, { responseType: 'arraybuffer', timeout: 6000 });
    const ytHash = await dHashFromBuffer(Buffer.from(res.data));
    const dist = hammingDistance(instagramHash, ytHash);
    return Math.max(0, Math.round(100 - (dist / 64) * 100));
  } catch { return 0; }
}

// ─── Static action guide (always shown, no API needed) ───────────────────────
function getActionGuide(copyrightRisk, geminiActions) {
  const base = [
    {
      step: 1,
      title: 'Document the Evidence',
      desc: 'Take screenshots of the infringing post, note the URL, post date, and account name.',
      icon: 'camera',
    },
    {
      step: 2,
      title: 'Report on Instagram',
      desc: 'Tap the three dots (⋯) on the post → "Report" → "Intellectual Property" → "Copyright".',
      icon: 'flag',
      link: 'https://help.instagram.com/126382350847838',
      linkText: 'Instagram Copyright Help',
    },
    {
      step: 3,
      title: 'File a Formal DMCA Takedown',
      desc: 'Submit a formal copyright complaint to Meta via their IP reporting tool.',
      icon: 'gavel',
      link: 'https://www.facebook.com/help/contact/1758255661104383',
      linkText: 'Meta IP Report Form',
    },
    {
      step: 4,
      title: 'Contact the Infringer Directly',
      desc: 'Send a cease-and-desist message to the account asking them to remove the content.',
      icon: 'mail',
    },
    {
      step: 5,
      title: 'Consult a Copyright Attorney',
      desc: 'For serious violations or repeated infringement, seek legal advice for further action.',
      icon: 'scale',
    },
  ];

  if (copyrightRisk === 'Low') return base.slice(0, 2);
  if (copyrightRisk === 'Medium') return base.slice(0, 3);
  return base; // High risk — show all steps
}

// ─── Main Instagram Analysis Pipeline ────────────────────────────────────────
async function analyzeInstagramPost(instagramUrl) {
  const cleanUrl = extractInstagramPostUrl(instagramUrl);
  if (!cleanUrl) throw new Error('Invalid Instagram URL. Use a post, reel, or TV link.');

  // 1. Fetch metadata
  const meta = await fetchInstagramMetadata(cleanUrl);

  // 2. Gemini analysis
  const gemini = await analyzeWithGemini(meta.thumbnail, meta.title, meta.author);

  // 3. Compute thumbnail hash
  let thumbnailHash = null;
  if (meta.thumbnail) {
    try {
      const res = await axios.get(meta.thumbnail, { responseType: 'arraybuffer', timeout: 8000 });
      thumbnailHash = await dHashFromBuffer(Buffer.from(res.data));
    } catch {}
  }

  // 4. Cross-platform YouTube search
  const keywords = gemini?.searchKeywords || [meta.title, meta.author].filter(Boolean);
  const youtubeMatches = await searchYouTubeForContent(keywords, meta.author);

  // 5. Score YouTube matches
  const scoredMatches = await Promise.all(
    youtubeMatches.map(async (yt) => {
      const score = await scoreYouTubeMatch(thumbnailHash, yt);
      return { ...yt, similarity: score };
    })
  );
  scoredMatches.sort((a, b) => b.similarity - a.similarity);

  // 6. Action guide
  const actionGuide = getActionGuide(gemini?.copyrightRisk || 'Medium', gemini?.whatToDo);

  // 7. Instagram report URL
  const reportUrl = `https://help.instagram.com/126382350847838`;
  const metaReportUrl = `https://www.facebook.com/help/contact/1758255661104383`;

  return {
    post: meta,
    geminiInsights: gemini,
    youtubeMatches: scoredMatches,
    actionGuide,
    reportLinks: {
      instagramReport: reportUrl,
      metaDmca: metaReportUrl,
      instagramHelp: 'https://help.instagram.com/277982542336146',
    },
    summary: {
      copyrightRisk: gemini?.copyrightRisk || 'Unknown',
      copyrightVerdict: gemini?.copyrightVerdict || 'Unknown',
      youtubeMatchesFound: scoredMatches.length,
      highSimilarityMatches: scoredMatches.filter(m => m.similarity >= 60).length,
    },
  };
}

module.exports = { analyzeInstagramPost };
