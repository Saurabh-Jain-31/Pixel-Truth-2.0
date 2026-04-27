const { analyzeInstagramPost } = require('../utils/instagramAnalyzer');
const createLog = require('../utils/logger');

// POST /api/instagram/analyze
const analyzeInstagram = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url?.trim()) return res.status(400).json({ message: 'Instagram URL is required.' });

    await createLog({ level: 'INFO', message: `Instagram analysis: ${url}`, user: req.user.email, userId: req.user._id });

    const result = await analyzeInstagramPost(url.trim());

    await createLog({
      level: 'INFO',
      message: `Instagram analysis complete — Risk: ${result.summary.copyrightRisk}`,
      user: req.user.email, userId: req.user._id,
    });

    res.json(result);
  } catch (err) {
    if (err.message.includes('Invalid Instagram')) return res.status(400).json({ message: err.message });
    next(err);
  }
};

module.exports = { analyzeInstagram };
