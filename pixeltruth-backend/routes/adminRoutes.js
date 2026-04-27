const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  updateUserRole,
  getAllUploads,
  getViolations,
  getLogs,
} = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

// All routes in this file require auth + admin role
router.use(protect, restrictTo('admin'));

router.get('/stats', getDashboardStats);
router.get('/uploads', getAllUploads);
router.get('/logs', getLogs);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/role', updateUserRole);
router.get('/violations', getViolations);

module.exports = router;
