const { chatWithAI } = require('../utils/aiChat');

/**
 * POST /api/ai/chat
 * Body: { message: string, history: [{role, parts}] }
 */
const chat = async (req, res, next) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    const reply = await chatWithAI(history, message.trim());
    res.json({ reply });
  } catch (err) {
    if (err.message === 'GEMINI_API_KEY not configured') {
      return res.status(503).json({ message: 'AI service not configured. Please set GEMINI_API_KEY.' });
    }
    next(err);
  }
};

module.exports = { chat };
