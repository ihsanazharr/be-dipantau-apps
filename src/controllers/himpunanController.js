// controllers/himpunanController.js
const { User, Himpunan } = require('../models');
const {
  Op
} = require('sequelize');

// Helper: Authorization check
const authorizeHimpunanAccess = async (user, himpunanId) => {
  if (user.role === 'super_admin') return true;

  return !!await User.findOne({
    where: {
      id: user.id,
      himpunanId,
      isHimpunanAdmin: true
    }
  });
};

// @desc Create a new himpunan
// @route POST /api/himpunan
// @access Private/Admin

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

    // Debugging log
    console.log('Authenticated user:', req.user); // Pastikan req.user terisi
    console.log('User  model:', User); // Pastikan model User terdefinisi

    // Existing himpunan check
    const exists = await Himpunan.findOne({
      where: {
        [Op.or]: [{ name }, { aka }]
      }
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Himpunan already exists'
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
      status: 'active',
      createdById: req.user.id // Set createdBy
    });

    // Pindahkan logika update user ke sini
    await User.update(
      { isHimpunanAdmin: true },
      { where: { id: req.user.id } }
    );

    res.status(201).json({
      success: true,
      message: 'Himpunan created successfully',
      data: himpunan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create himpunan',
      error: error.message
    });
  }
};

// @desc Get list of himpunans
// @route GET /api/himpunan
// @access Public

exports.getAllHimpunan = async (req, res) => {

  try {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'active';
    const whereClause = {
      [Op.and]: [{
        name: {
          [Op.iLike]: `%${search}%`
        }
      }]
    };
    if (status !== 'all') {
      whereClause[Op.and].push({
        status
      });
    }
    const {
      count,
      rows
    } = await Himpunan.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'admins',
        where: {
          isHimpunanAdmin: true
        },
        attributes: ['id', 'fullName', 'email'],
        required: false
      }],
      order: [
        ['createdAt', 'DESC']
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
      message: 'Failed to fetch himpunan',
      error: error.message
    });
  }

};

// @desc Get himpunan by ID

// @route GET /api/himpunan/:id

// @access Public

exports.getHimpunanById = async (req, res) => {

  try {

    const himpunan = await Himpunan.findByPk(req.params.id, {
      include: [{
          model: User,
          as: 'admins',
          where: {
            isHimpunanAdmin: true
          },
          attributes: ['id', 'fullName', 'email'],
          required: false
        },
        {
          model: User,
          as: 'members',
          attributes: ['id', 'fullName', 'email', 'profilePicture', 'score']
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

// @desc Update himpunan
// @route PUT /api/himpunan/:id
// @access Private/Admin

exports.updateHimpunan = async (req, res) => {
  try {
    const himpunan = await Himpunan.findByPk(req.params.id);
    if (!himpunan) {
      return res.status(404).json({
        success: false,
        message: 'Himpunan not found'
      });
    }

    // Check if user is admin of this himpunan or super_admin
    // Authorization
    const allowed = await authorizeHimpunanAccess(req.user, himpunan.id);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    await himpunan.update(req.body);
    res.status(200).json({
      success: true,
      data: himpunan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc Delete himpunan
// @route DELETE /api/himpunan/:id
// @access Private/Admin

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
    const isAdmin = await User.findOne({
      where: {
        id: req.user.id,
        himpunanId: himpunan.id,
        isHimpunanAdmin: true
      }
    });
    if (!isAdmin && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this himpunan'
      });
    }
    await himpunan.destroy();
    // Set semua user yang terkait himpunan ini menjadi non-admin
    await User.update({
      isHimpunanAdmin: false,
      himpunanId: null
    }, {
      where: {
        himpunanId: himpunan.id
      }
    });
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

// @desc Get himpunan managed by current user

// @route GET /api/himpunan/my-himpunan

// @access Private

exports.getMyHimpunan = async (req, res) => {

  try {

    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Himpunan,
        as: 'himpunan',
        include: [{
          model: User,
          as: 'admins',
          where: {
            isHimpunanAdmin: true
          },
          attributes: ['id', 'fullName', 'email'],
          required: false
        }]
      }]
    });
    if (!user.himpunan) {
      return res.status(404).json({
        success: false,
        message: 'You are not managing any himpunan'
      });
    }
    res.status(200).json({
      success: true,
      data: user.himpunan
    });
  } catch (error) {

    res.status(500).json({
      success: false,
      message: 'Failed to fetch himpunan',
      error: error.message
    });
  }

};

// Fungsi untuk bergabung dengan himpunan
exports.joinHimpunan = async (req, res) => {
  try {
    const { himpunanId } = req.body;
    const userId = req.user.id;

    // Cek apakah himpunan ada
    const himpunan = await Himpunan.findByPk(himpunanId);
    if (!himpunan) {
      return res.status(404).json({
        success: false,
        message: 'Himpunan tidak ditemukan'
      });
    }

    // Cek apakah pengguna sudah menjadi anggota
    const user = await User.findByPk(userId);
    if (user.himpunanId) {
      return res.status(400).json({
        success: false,
        message: 'Anda sudah menjadi anggota himpunan'
      });
    }

    // Update pengguna untuk bergabung dengan himpunan
    await user.update({
      himpunanId,
      membershipStatus: 'pending', // Atau status lain yang sesuai
      joinDate: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Permintaan bergabung dengan himpunan berhasil dikirim',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal bergabung dengan himpunan',
      error: error.message
    });
  }
};

// @desc Leave current himpunan
// @route DELETE /api/himpunan/leave
// @access Private
exports.leaveHimpunan = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user.himpunanId) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of any himpunan'
      });
    }

    await user.update({
      himpunanId: null,
      membershipStatus: 'inactive',
      isHimpunanAdmin: false
    });

    res.status(200).json({
      success: true,
      message: 'Successfully left the himpunan'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to leave himpunan',
      error: error.message
    });
  }
};

// @desc Update membership status of a user
// @route PATCH /api/himpunan/member/:userId/status
// @access Private/Admin
exports.updateMembershipStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    const user = await User.findByPk(userId);
    if (!user || !user.himpunanId) {
      return res.status(404).json({
        success: false,
        message: 'User or membership not found'
      });
    }

    // Authorization: only admin of the same himpunan or super_admin
    const isAdmin = await User.findOne({
      where: {
        id: req.user.id,
        himpunanId: user.himpunanId,
        isHimpunanAdmin: true
      }
    });

    if (!isAdmin && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update membership status'
      });
    }

    await user.update({ membershipStatus: status });
    res.status(200).json({
      success: true,
      message: 'Membership status updated',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update membership status',
      error: error.message
    });
  }
};

// Fungsi untuk melihat permintaan bergabung
exports.getJoinRequests = async (req, res) => {
  try {
    // Pastikan hanya admin himpunan yang bisa melihat permintaan
    if (req.user.role !== 'super_admin' && !req.user.isHimpunanAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    // Dapatkan himpunanId dari admin
    const himpunanId = req.user.himpunanId;
    
    // Jika super_admin, ambil semua permintaan
    // Jika admin himpunan, ambil hanya untuk himpunannya
    const whereClause = { 
      membershipStatus: 'pending' 
    };

    if (req.user.role !== 'super_admin') {
      whereClause.himpunanId = himpunanId;
    }

    const joinRequests = await User.findAll({
      where: whereClause,
      attributes: ['id', 'fullName', 'email', 'profilePicture', 'createdAt'],
      include: [{
        model: Himpunan,
        attributes: ['id', 'name'],
        as: 'himpunan'
      }]
    });

    res.status(200).json({
      success: true,
      requests: joinRequests
    });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch join requests',
      error: error.message
    });
  }
};

// @desc Change himpunan admin (assign new admin)
// @route PUT /api/himpunan/:id/change-admin
// @access Private/Admin

exports.changeHimpunanAdmin = async (req, res) => {

  try {

    const {
      newAdminId
    } = req.body;
    const himpunan = await Himpunan.findByPk(req.params.id);
    if (!himpunan) {
      return res.status(404).json({
        success: false,
        message: 'Himpunan not found'
      });
    }
    // Check if user is current admin of this himpunan or super_admin
    const isCurrentAdmin = await User.findOne({
      where: {
        id: req.user.id,
        himpunanId: himpunan.id,
        isHimpunanAdmin: true
      }
    });
    if (!isCurrentAdmin && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to change admin for this himpunan'
      });
    }
    // Check if new admin exists and is member of this himpunan
    const newAdmin = await User.findOne({
      where: {
        id: newAdminId,
        himpunanId: himpunan.id
      }
    });
    if (!newAdmin) {
      return res.status(404).json({
        success: false,
        message: 'New admin user not found in this himpunan'
      });
    }
    // Remove admin status from current admins of this himpunan
    await User.update({
      isHimpunanAdmin: false
    }, {
      where: {
        himpunanId: himpunan.id,
        isHimpunanAdmin: true
      }
    });
    // Assign admin to new user
    await newAdmin.update({
      isHimpunanAdmin: true
    });
    res.status(200).json({
      success: true,
      message: 'Himpunan admin changed successfully',
      data: {
        himpunanId: himpunan.id,
        newAdminId: newAdmin.id,
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