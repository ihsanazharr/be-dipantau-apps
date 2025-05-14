const { Notification, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Create a new notification
// @route   POST /api/notifications
exports.createNotification = async (req, res) => {
  try {
    const { 
      title, 
      content, 
      type, 
      recipientId, 
      priority 
    } = req.body;

    const senderId = req.user.id;

    if (recipientId) {
      const recipient = await User.findByPk(recipientId);
      if (!recipient) {
        return res.status(404).json({
          success: false,
          message: 'Recipient not found'
        });
      }
    }

    const notification = await Notification.create({
      title,
      content,
      type: type || 'reminder',
      recipientId,
      senderId,
      priority: priority || 'rendah',
      isRead: false
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

// @desc    Get all notifications for the current user
// @route   GET /api/notifications/my-notifications
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const isRead = req.query.isRead;
    const type = req.query.type;

    // Build where clause
    const whereClause = { recipientId: userId };
    
    if (isRead !== undefined) {
      whereClause.isRead = isRead === 'true';
    }
    
    if (type) {
      whereClause.type = type;
    }

    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'email', 'profilePicture']
        }
      ],
      order: [['createdAt', 'DESC']],
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
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// @desc    Get notification by ID
// @route   GET /api/notifications/:id
// @access  Private
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'fullName', 'email', 'profilePicture']
        },
        {
          model: User,
          as: 'recipient',
          attributes: ['id', 'fullName', 'email', 'profilePicture']
        }
      ]
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient or the sender or super_admin
    if (notification.recipientId !== req.user.id && 
        notification.senderId !== req.user.id && 
        req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this notification'
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/mark-read
// @access  Private
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient
    if (notification.recipientId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to mark this notification as read'
      });
    }

    // Update isRead status
    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    // Update all unread notifications for user
    await Notification.update(
      { isRead: true },
      { 
        where: { 
          recipientId: userId,
          isRead: false
        } 
      }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user is the recipient or the sender or super_admin
    if (notification.recipientId !== req.user.id && 
        notification.senderId !== req.user.id && 
        req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this notification'
      });
    }

    await notification.destroy();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// @desc    Get unread notifications count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadNotificationsCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Notification.count({
      where: { 
        recipientId: userId,
        isRead: false
      }
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread notifications count',
      error: error.message
    });
  }
};

// @desc    Send notification to all members of a himpunan
// @route   POST /api/notifications/himpunan/:himpunanId
// @access  Private/Admin
exports.sendHimpunanNotification = async (req, res) => {
  try {
    const { himpunanId } = req.params;
    const { title, content, type, priority } = req.body;
    const senderId = req.user.id;

    // Check if himpunan exists
    const himpunan = await Himpunan.findByPk(himpunanId);
    if (!himpunan) {
      return res.status(404).json({
        success: false,
        message: 'Himpunan not found'
      });
    }

    // Check if user is admin of this himpunan or super_admin
    if (himpunan.adminId !== senderId && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to send notifications to this himpunan'
      });
    }

    // Get all active members
    const members = await HimpunanMember.findAll({
      where: { 
        himpunanId,
        status: 'active'
      },
      attributes: ['userId']
    });

    if (members.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active members found in this himpunan'
      });
    }

    // Create notifications for each member
    const notifications = await Promise.all(
      members.map(member => 
        Notification.create({
          title,
          content,
          type: type || 'reminder',
          recipientId: member.userId,
          senderId,
          priority: priority || 'rendah',
          isRead: false
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `Notification sent to ${members.length} members`,
      count: notifications.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send notifications',
      error: error.message
    });
  }
};

module.exports = exports;