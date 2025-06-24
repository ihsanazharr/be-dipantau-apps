const {
  Attendance,
  Activity,
  User,
  Himpunan,
  HimpunanMember
} = require('../models');
const {
  Op
} = require('sequelize');
const QRCode = require('qrcode'); // Pastikan QRCode sudah di-import

// @desc    Record attendance (check-in)
// @route   POST /api/attendances/check-in
exports.checkInAttendance = async (req, res) => {

  try {

    const {
      activityId,
      qrCode,
      location
    } = req.body;
    const userId = req.user.id;
    // Aktivitas harus dalam status sesuai
    const activity = await Activity.findOne({
      where: {
        id: activityId,
        qrCode,
        status: {
          [Op.in]: ['dijadwalkan', 'berlangsung']
        }
      }
    });
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Invalid QR Code or activity'
      });
    }
    // Validasi keanggotaan himpunan
    if (req.user.himpunanId !== activity.himpunanId && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not a member of this himpunan'
      });
    }
    // Cek apakah sudah absen
    const existing = await Attendance.findOne({
      where: {
        activityId,
        userId
      }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Already attended'
      });
    }
    // Buat catatan absensi
    const now = new Date();
    const startTime = new Date(activity.startDateTime);
    const status = now > startTime ? 'terlambat' : 'hadir';
    const attendance = await Attendance.create({
      activityId,
      userId,
      checkInTime: now,
      location,
      status
    });
    res.status(201).json({
      success: true,
      message: 'Attendance recorded',
      data: attendance
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Record checkout
// @route   PUT /api/attendances/check-out
// @access  Private
exports.checkOutAttendance = async (req, res) => {
  try {
    const {
      activityId,
      location
    } = req.body;
    const userId = req.user.id;

    // Find attendance record
    const attendance = await Attendance.findOne({
      where: {
        userId,
        activityId,
        checkOutTime: null
      }
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'No active attendance record found'
      });
    }

    // Update checkout time
    attendance.checkOutTime = new Date();
    if (location) attendance.location = location;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Check-out recorded successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to record check-out',
      error: error.message
    });
  }
};

// @desc    Get all attendance records for an activity
// @route   GET /api/activities/:activityId/attendances
// @access  Private/Admin
exports.getActivityAttendances = async (req, res) => {
  try {
    const {
      activityId
    } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';

    // Find activity
    const activity = await Activity.findByPk(activityId, {
      include: [{
        model: Himpunan,
        as: 'himpunan'
      }]
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check if user is admin of this himpunan or super_admin
    if (activity.himpunan.adminId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view attendance records for this activity'
      });
    }

    // Build where clause
    const whereClause = {
      activityId
    };
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const {
      count,
      rows
    } = await Attendance.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'fullName', 'email', 'profilePicture']
      }],
      order: [
        ['checkInTime', 'DESC']
      ],
      limit,
      offset
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
};

// @desc    Get attendance record by ID
// @route   GET /api/attendances/:id
// @access  Private/Admin
exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id, {
      include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'email', 'profilePicture']
        },
        {
          model: Activity,
          as: 'activity',
          include: [{
            model: Himpunan,
            as: 'himpunan'
          }]
        }
      ]
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check if user is admin of this himpunan or super_admin or the user
    if (attendance.activity.himpunan.adminId !== req.user.id &&
      req.user.role !== 'super_admin' &&
      attendance.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this attendance record'
      });
    }

    res.status(200).json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance record',
      error: error.message
    });
  }
};

// @desc    Update attendance record
// @route   PUT /api/attendances/:id
// @access  Private/Admin
exports.updateAttendance = async (req, res) => {
  try {
    const {
      status,
      notes
    } = req.body;

    const attendance = await Attendance.findByPk(req.params.id, {
      include: [{
        model: Activity,
        as: 'activity',
        include: [{
          model: Himpunan,
          as: 'himpunan'
        }]
      }]
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check if user is admin of this himpunan or super_admin
    if (attendance.activity.himpunan.adminId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this attendance record'
      });
    }

    // Update fields
    if (status) attendance.status = status;
    if (notes !== undefined) attendance.notes = notes;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Attendance record updated successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update attendance record',
      error: error.message
    });
  }
};

// @desc    Delete attendance record
// @route   DELETE /api/attendances/:id
// @access  Private/Admin
exports.deleteAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id, {
      include: [{
        model: Activity,
        as: 'activity',
        include: [{
          model: Himpunan,
          as: 'himpunan'
        }]
      }]
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    // Check if user is admin of this himpunan or super_admin
    if (attendance.activity.himpunan.adminId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this attendance record'
      });
    }

    await attendance.destroy();

    res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record',
      error: error.message
    });
  }
};

// @desc    Get user's attendance records
// @route   GET /api/users/my-attendances
// @access  Private
exports.getMyAttendances = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const himpunanId = req.query.himpunanId;

    // Build where clause
    const whereClause = {
      userId
    };
    let activityWhereClause = {};

    if (himpunanId) {
      activityWhereClause.himpunanId = himpunanId;
    }

    const {
      count,
      rows
    } = await Attendance.findAndCountAll({
      where: whereClause,
      include: [{
        model: Activity,
        as: 'activity',
        where: activityWhereClause,
        include: [{
          model: Himpunan,
          as: 'himpunan',
          attributes: ['id', 'name', 'logo']
        }]
      }],
      order: [
        ['checkInTime', 'DESC']
      ],
      limit,
      offset
    });

    res.status(200).json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance records',
      error: error.message
    });
  }
};

module.exports = exports;