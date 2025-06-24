// src/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.use(auth);

router.post('/check-in', attendanceController.checkInAttendance);
router.post('/check-out', attendanceController.checkOutAttendance);
router.get('/user/me', attendanceController.getMyAttendances);
router.get('/activity/:activityId', attendanceController.getActivityAttendances);
router.get('/:id', attendanceController.getAttendanceById);

router.use(authorize('super_admin', 'admin'));

router.put('/:id', attendanceController.updateAttendance);
router.delete('/:id', attendanceController.deleteAttendance);

module.exports = router;