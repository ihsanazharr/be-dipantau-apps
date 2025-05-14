// src/routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.post('/check-in', auth, attendanceController.checkInAttendance);
router.put('/check-out', auth, attendanceController.checkOutAttendance);
router.get('/:id', auth, attendanceController.getAttendanceById);

router.put('/:id', auth, authorize('super_admin', 'admin'), attendanceController.updateAttendance);
router.delete('/:id', auth, authorize('super_admin', 'admin'), attendanceController.deleteAttendance);

module.exports = router;