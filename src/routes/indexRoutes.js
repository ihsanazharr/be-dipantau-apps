const express = require('express');
const router = express.Router();

// Impor semua route yang diperlukan
const userRoutes = require('./userRoutes'); // Tambahkan ini
const himpunanRoutes = require('./himpunanRoutes');
const activityRoutes = require('./activityRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const taskRoutes = require('./taskRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');

// Versi API
router.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Himpunan Management API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      himpunan: '/api/himpunan',
      activities: '/api/activities',
      attendances: '/api/attendances',
      tasks: '/api/tasks',
      notifications: '/api/notifications'
    }
  });
});

// Main routes
router.use('/api/users', userRoutes);
router.use('/api/himpunan', himpunanRoutes);
router.use('/api/activities', activityRoutes);
router.use('/api/attendances', attendanceRoutes);
router.use('/api/tasks', taskRoutes);
router.use('/api/notifications', notificationRoutes);
router.use('/api/admin', adminRoutes);

// Route untuk anggota himpunan
router.use('/api/himpunan/:himpunanId/members', 
  (req, res, next) => {
    req.himpunanId = req.params.himpunanId;
    next();
  }, 
  userRoutes
);

module.exports = router;