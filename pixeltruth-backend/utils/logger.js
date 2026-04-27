const Log = require('../models/Log');

const createLog = async ({ level = 'INFO', message, user = 'system', userId = null, meta = {} }) => {
  try {
    await Log.create({ level, message, user, userId, meta });
  } catch (err) {
    // Non-critical — don't crash the app if logging fails
    console.error('[Logger] Failed to write log:', err.message);
  }
};

module.exports = createLog;
