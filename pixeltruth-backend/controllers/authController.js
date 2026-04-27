const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const createLog = require('../utils/logger');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    // Only allow admin role if explicitly set (in production, restrict this further)
    const userRole = role === 'admin' ? 'admin' : 'consumer';

    const user = await User.create({ name, email, password, role: userRole });
    const token = generateToken(user._id);

    await createLog({
      level: 'INFO',
      message: `New user registered: ${email} (${userRole})`,
      user: email,
      userId: user._id,
    });

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Validate role matches
    if (role && user.role !== role) {
      return res.status(403).json({
        message: `This account is registered as "${user.role}", not "${role}".`,
      });
    }

    const token = generateToken(user._id);

    await createLog({
      level: 'INFO',
      message: `User logged in: ${email}`,
      user: email,
      userId: user._id,
    });

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  // JWT is stateless — client deletes the token
  res.json({ message: 'Logged out successfully.' });
};

// GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/google
const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: 'Google credential is required.' });

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link Google ID if signed up manually before
      if (!user.googleId) {
        user.googleId = googleId;
        user.avatar = picture;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        role: 'consumer',
      });
      await createLog({
        level: 'INFO',
        message: `New Google user registered: ${email}`,
        user: email,
        userId: user._id,
      });
    }

    const token = generateToken(user._id);

    await createLog({
      level: 'INFO',
      message: `Google sign-in: ${email}`,
      user: email,
      userId: user._id,
    });

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, getMe, googleAuth };
