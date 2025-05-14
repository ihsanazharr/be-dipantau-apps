// src/controllers/activityController.js
const { Activity, Himpunan, Attendance, User } = require('../models');
const { Op } = require('sequelize');
const QRCode = require('qrcode');
const crypto = require('crypto');

// @desc    Create a new activity
// @route   POST /api/activities
// @access  Private/Admin
exports.createActivity = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      startDateTime, 
      endDateTime, 
      location, 
      himpunanId,
      attendanceMode 
    } = req.body;

    // Check if himpunan exists
    const himpunan = await Himpunan.findByPk(himpunanId);
    if (!himpunan) {
      return res.status(404).json({
        success: false,
        message: 'Himpunan not found'
      });
    }

    // Check if user is admin of this himpunan or super_admin
    if (himpunan.adminId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to create activities for this himpunan'
      });
    }

    // Generate unique QR code data
    const qrData = crypto.randomBytes(16).toString('hex');
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(qrData);

    // Create activity
    const activity = await Activity.create({
      title,
      description,
      type,
      startDateTime,
      endDateTime,
      location,
      himpunanId,
      status: 'dijadwalkan',
      qrCode: qrData,
      attendanceMode: attendanceMode || 'offline'
    });

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: {
        ...activity.toJSON(),
        qrCodeUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create activity',
      error: error.message
    });
  }
};

// @desc    Get all activities
// @route   GET /api/activities
// @access  Private
exports.getAllActivities = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';
    const himpunanId = req.query.himpunanId;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    // Build where clause
    const whereClause = {};
    
    if (search) {
      whereClause.title = { [Op.iLike]: `%${search}%` };
    }
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (himpunanId) {
      whereClause.himpunanId = himpunanId;
    }
    
    if (startDate && endDate) {
      whereClause.startDateTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (startDate) {
      whereClause.startDateTime = {
        [Op.gte]: new Date(startDate)
      };
    } else if (endDate) {
      whereClause.startDateTime = {
        [Op.lte]: new Date(endDate)
      };
    }

    const { count, rows } = await Activity.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Himpunan,
          as: 'himpunan',
          attributes: ['id', 'name', 'logo']
        }
      ],
      order: [['startDateTime', 'DESC']],
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
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
};

// @desc    Get activity by ID
// @route   GET /api/activities/:id
// @access  Private
exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id, {
      include: [
        {
          model: Himpunan,
          as: 'himpunan',
          attributes: ['id', 'name', 'logo']
        },
        {
          model: Attendance,
          as: 'attendances',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'fullName', 'email', 'profilePicture']
            }
          ]
        }
      ]
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(activity.qrCode);

    res.status(200).json({
      success: true,
      data: {
        ...activity.toJSON(),
        qrCodeUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity',
      error: error.message
    });
  }
};

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private/Admin
exports.updateActivity = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      type, 
      startDateTime, 
      endDateTime, 
      location, 
      status,
      attendanceMode 
    } = req.body;

    const activity = await Activity.findByPk(req.params.id, {
      include: [
        {
          model: Himpunan,
          as: 'himpunan'
        }
      ]
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
        message: 'You are not authorized to update this activity'
      });
    }

    // Update fields
    if (title) activity.title = title;
    if (description) activity.description = description;
    if (type) activity.type = type;
    if (startDateTime) activity.startDateTime = startDateTime;
    if (endDateTime) activity.endDateTime = endDateTime;
    if (location) activity.location = location;
    if (status) activity.status = status;
    if (attendanceMode) activity.attendanceMode = attendanceMode;

    await activity.save();

    // Regenerate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(activity.qrCode);

    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      data: {
        ...activity.toJSON(),
        qrCodeUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update activity',
      error: error.message
    });
  }
};

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private/Admin
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id, {
      include: [
        {
          model: Himpunan,
          as: 'himpunan'
        }
      ]
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
        message: 'You are not authorized to delete this activity'
      });
    }

    await activity.destroy();

    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity',
      error: error.message
    });
  }
};

// @desc    Get himpunan activities
// @route   GET /api/himpunan/:himpunanId/activities
// @access  Private
exports.getHimpunanActivities = async (req, res) => {
  try {
    const { himpunanId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'all';

    // Check if himpunan exists
    const himpunan = await Himpunan.findByPk(himpunanId);
    if (!himpunan) {
      return res.status(404).json({
        success: false,
        message: 'Himpunan not found'
      });
    }

    // Build where clause
    const whereClause = { himpunanId };
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const { count, rows } = await Activity.findAndCountAll({
      where: whereClause,
      order: [['startDateTime', 'DESC']],
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
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
};

// @desc    Update activity status
// @route   PUT /api/activities/:id/status
// @access  Private/Admin
exports.updateActivityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const activity = await Activity.findByPk(id, {
      include: [
        {
          model: Himpunan,
          as: 'himpunan'
        }
      ]
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
        message: 'You are not authorized to update this activity'
      });
    }

    // Validate status
    if (!['dijadwalkan', 'berlangsung', 'selesai', 'dibatalkan'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Update status
    activity.status = status;
    await activity.save();

    res.status(200).json({
      success: true,
      message: 'Activity status updated successfully',
      data: activity
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update activity status',
      error: error.message
    });
  }
};

module.exports = exports;