// src/routes/indexRoutes.js
const express = require('express');
const router = express.Router();

const userRoutes = require('./userRoutes');
const himpunanRoutes = require('./himpunanRoutes');
const activityRoutes = require('./activityRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');
const taskRoutes = require('./taskRoutes');

router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Himpunan API',
    documentation: '/api'
  });
});

router.use('/api/users', userRoutes);
router.use('/api/himpunan', himpunanRoutes);
router.use('/api/activities', activityRoutes);
router.use('/api/attendances', attendanceRoutes);
router.use('/api/notifications', notificationRoutes);
router.use('/api/admin', adminRoutes);
router.use('/api/tasks', taskRoutes);

// Routes with dynamic parameters

// HAPUS route untuk himpunan members yang menggunakan himpunanMemberRoutes
// router.use('/api/himpunan/:himpunanId/members', (req, res, next) => {
//   req.himpunanId = req.params.himpunanId;
//   next();
// }, require('./himpunanMemberRoutes'));

router.use('/api/himpunan/:himpunanId/users', (req, res, next) => {
  req.himpunanId = req.params.himpunanId;
  next();
}, userRoutes);

router.use('/api/himpunan/:himpunanId/activities', (req, res, next) => {
  req.himpunanId = req.params.himpunanId;
  next();
}, require('./activityRoutes'));

router.use('/api/activities/:activityId/attendances', (req, res, next) => {
  req.activityId = req.params.activityId;
  next();
}, require('./attendanceRoutes'));

// Route for himpunan tasks
router.use('/api/himpunan/:himpunanId/tasks', (req, res, next) => {
  req.himpunanId = req.params.himpunanId;
  next();
}, require('./taskRoutes'));

// HAPUS route duplikat untuk himpunan users
// router.use('/api/himpunan/:himpunanId/users', (req, res, next) => {
//   req.himpunanId = req.params.himpunanId;
//   next();
// }, require('./userHimpunanRoutes'));

// Base route to check if API is working
router.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working',
    data: {
      apiVersion: '1.0.0',
      documentation: '/api/docs',
      availableEndpoints: [
        '/api/users',
        '/api/himpunan',
        // '/api/himpunan-members', // HAPUS
        '/api/activities',
        '/api/attendances',
        '/api/notifications',
        '/api/admin',
        '/api/tasks'
      ]
    }
  });
});

module.exports = router;