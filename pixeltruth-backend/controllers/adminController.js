const User = require('../models/User');
const Upload = require('../models/Upload');
const Violation = require('../models/Violation');
const Log = require('../models/Log');
const createLog = require('../utils/logger');

// GET /api/admin/stats
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalUsers, totalUploads, violations, safeContent] = await Promise.all([
      User.countDocuments(),
      Upload.countDocuments(),
      Upload.countDocuments({ status: { $in: ['High Risk', 'Suspicious'] } }),
      Upload.countDocuments({ status: 'Safe' }),
    ]);

    res.json({ totalUsers, totalUploads, violations, safeContent });
  } catch (err) {
    next(err);
  }
};

// GET /api/users
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account.' });
    }

    await User.findByIdAndDelete(req.params.id);

    await createLog({
      level: 'WARN',
      message: `User deleted: ${user.email}`,
      user: req.user.email,
      userId: req.user._id,
    });

    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/users/:id/role
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['consumer', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found.' });

    await createLog({
      level: 'INFO',
      message: `Role updated for ${user.email}: ${role}`,
      user: req.user.email,
      userId: req.user._id,
    });

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/uploads
const getAllUploads = async (req, res, next) => {
  try {
    const uploads = await Upload.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .select('-featureVector -perceptualHash -filePath');

    res.json({ uploads });
  } catch (err) {
    next(err);
  }
};

// GET /api/violations
const getViolations = async (req, res, next) => {
  try {
    const violations = await Violation.find()
      .populate('user', 'name email')
      .populate('upload', 'fileName mimeType')
      .sort({ createdAt: -1 });

    res.json({ violations });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/logs
const getLogs = async (req, res, next) => {
  try {
    const logs = await Log.find()
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ logs });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  updateUserRole,
  getAllUploads,
  getViolations,
  getLogs,
};
