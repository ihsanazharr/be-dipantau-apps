const { Himpunan, User } = require('../models'); // Hapus HimpunanMember
const { Op } = require('sequelize');

// @route   POST /api/himpunan
// @access  Private/Admin
exports.createHimpunan = async (req, res) => {
  try {
    const { 
      name,
      aka,
      description, 
      foundedDate, 
      contactEmail, 
      contactPhone, 
      address 
    } = req.body;

    console.log('User ID:', req.user.id);

    const existingHimpunan = await Himpunan.findOne({ where: { name } });
    if (existingHimpunan) {
      return res.status(400).json({
        success: false,
        message: 'Himpunan with this name already exists'
      });
    }

    const himpunan = await Himpunan.create({
      name,
      aka,
      description,
      foundedDate,
      contactEmail,
      contactPhone,
      address,
      adminId: req.user.id,
      status: 'active'
    });

    console.log('Created himpunan:', JSON.stringify(himpunan, null, 2));

    res.status(201).json({
      success: true,
      message: 'Himpunan created successfully',
      data: himpunan
    });
  } catch (error) {
    console.error('Error creating himpunan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create himpunan',
      error: error.message
    });
  }
};

exports.getAllHimpunan = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'active';

    const whereClause = {
      [Op.and]: [
        { name: { [Op.iLike]: `%${search}%` } }
      ]
    };

    if (status !== 'all') {
      whereClause[Op.and].push({ status });
    }

    const { count, rows } = await Himpunan.findAndCountAll({
      where: whereClause,
      include: [{ 
        model: User, 
        as: 'admin',
        attributes: ['id', 'fullName', 'email']
      }],
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
      message: 'Failed to fetch himpunan',
      error: error.message
    });
  }
};

// @desc    Get himpunan by ID
// @route   GET /api/himpunan/:id
// @access  Public
exports.getHimpunanById = async (req, res) => {
  try {
    const himpunan = await Himpunan.findByPk(req.params.id, {
      include: [
        { 
          model: User, 
          as: 'admin',
          attributes: ['id', 'fullName', 'email']
        },
        {
          // MODIFIKASI: Gunakan association members langsung dari User
          model: User,
          as: 'members',
          attributes: ['id', 'fullName', 'email', 'profilePicture', 'score', 'membershipStatus', 'joinDate', 'himpunanRole']
        }
      ]
    });

    if (!himpunan) {
      return res.status(404).json({
        success: false,
        message: 'Himpunan not found'
      });
    }

    res.status(200).json({
      success: true,
      data: himpunan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch himpunan',
      error: error.message
    });
  }
};

// @desc    Update himpunan
// @route   PUT /api/himpunan/:id
// @access  Private/Admin
exports.updateHimpunan = async (req, res) => {
  try {
    const { 
      name, 
      description,
      aka,
      foundedDate, 
      contactEmail, 
      contactPhone, 
      address,
      status,
      logo
    } = req.body;

    const himpunan = await Himpunan.findByPk(req.params.id);

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
        message: 'You are not authorized to update this himpunan'
      });
    }

    // Update fields
    if (name) himpunan.name = name;
    if (aka) himpunan.aka = aka;
    if (description) himpunan.description = description;
    if (foundedDate) himpunan.foundedDate = foundedDate;
    if (contactEmail) himpunan.contactEmail = contactEmail;
    if (contactPhone) himpunan.contactPhone = contactPhone;
    if (address) himpunan.address = address;
    if (status) himpunan.status = status;
    if (logo) himpunan.logo = logo;

    await himpunan.save();

    res.status(200).json({
      success: true,
      message: 'Himpunan updated successfully',
      data: himpunan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update himpunan',
      error: error.message
    });
  }
};

// @desc    Delete himpunan
// @route   DELETE /api/himpunan/:id
// @access  Private/Admin
exports.deleteHimpunan = async (req, res) => {
  try {
    const himpunan = await Himpunan.findByPk(req.params.id);

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
        message: 'You are not authorized to delete this himpunan'
      });
    }

    await himpunan.destroy();

    res.status(200).json({
      success: true,
      message: 'Himpunan deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete himpunan',
      error: error.message
    });
  }
};

// @desc    Get himpunan managed by current user
// @route   GET /api/himpunan/my-himpunan
// @access  Private
exports.getMyHimpunan = async (req, res) => {
  try {
    const himpunan = await Himpunan.findAll({
      where: { adminId: req.user.id },
      include: [
        { 
          model: User, 
          as: 'admin',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: himpunan.length,
      data: himpunan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch himpunan',
      error: error.message
    });
  }
};

// @desc    Change himpunan admin
// @route   PUT /api/himpunan/:id/change-admin
// @access  Private/Admin
exports.changeHimpunanAdmin = async (req, res) => {
  try {
    const { newAdminId } = req.body;
    
    const himpunan = await Himpunan.findByPk(req.params.id);
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
        message: 'You are not authorized to change admin for this himpunan'
      });
    }

    // Check if new admin exists
    const newAdmin = await User.findByPk(newAdminId);
    if (!newAdmin) {
      return res.status(404).json({
        success: false,
        message: 'New admin user not found'
      });
    }

    // Update admin
    himpunan.adminId = newAdminId;
    await himpunan.save();

    res.status(200).json({
      success: true,
      message: 'Himpunan admin changed successfully',
      data: {
        himpunanId: himpunan.id,
        newAdminId,
        newAdminName: newAdmin.fullName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to change himpunan admin',
      error: error.message
    });
  }
};

module.exports = exports;