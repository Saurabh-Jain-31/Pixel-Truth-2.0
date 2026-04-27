const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_CONTEXT = `You are PixelTruth AI, an expert assistant for a digital content fingerprinting and copyright protection platform.
You help users understand:
- Content analysis results (Safe, Suspicious, High Risk)
- AI-generated content detection
- Copyright violations and unauthorized media usage
- Perceptual hashing and fingerprinting technology
- How to respond to detected violations (DMCA takedowns, etc.)
- Best practices for protecting digital content

Be concise, professional, and helpful. If asked about something unrelated to content protection or the platform, politely redirect.`;

/**
 * Multi-turn AI chat using Gemini
 * @param {Array} history - [{role: 'user'|'model', parts: [{text}]}]
 * @param {string} userMessage
 */
async function chatWithAI(history, userMessage) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: SYSTEM_CONTEXT,
  });

  const chat = model.startChat({ history: history || [] });
  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

module.exports = { chatWithAI };
