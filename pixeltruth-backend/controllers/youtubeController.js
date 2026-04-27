const { analyzeYouTubeVideo } = require('../utils/youtubeAnalyzer');
const createLog = require('../utils/logger');

// POST /api/youtube/analyze
const analyzeYoutube = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url || !url.trim()) {
      return res.status(400).json({ message: 'YouTube URL is required.' });
    }

    await createLog({
      level: 'INFO',
      message: `YouTube analysis started: ${url}`,
      user: req.user.email,
      userId: req.user._id,
    });

    const result = await analyzeYouTubeVideo(url.trim());

    await createLog({
      level: result.summary.overallStatus === 'Safe' ? 'SUCCESS' : 'WARN',
      message: `YouTube analysis complete — ${result.summary.overallStatus} (${result.summary.highRisk} high risk, ${result.summary.suspicious} suspicious)`,
      user: req.user.email,
      userId: req.user._id,
      meta: { videoId: result.source.id, title: result.source.title },
    });

    res.json(result);
  } catch (err) {
    if (err.message.includes('YOUTUBE_API_KEY') || err.message.includes('Invalid YouTube')) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  }
};

module.exports = { analyzeYoutube };
