// src/controllers/adminController.js
const {
  User,
  Himpunan
} = require('../models');
const {
  formatResponse
} = require('../../utils/helpers');
const bcrypt = require('bcrypt');

exports.getAllAdmins = async (req, res, next) => {
  try {
    const admins = await User.findAll({
      where: {
        role: ['admin', 'super_admin']
      },
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire']
      }
    });

    const adminsWithHimpunan = [];
    for (const admin of admins) {
      const adminObj = admin.toJSON();
      if (admin.role === 'admin') {
        const himpunan = await Himpunan.findOne({
          where: {
            adminId: admin.id
          },
          attributes: ['id', 'name', 'code']
        });
        adminObj.himpunan = himpunan;
      }
      adminsWithHimpunan.push(adminObj);
    }

    res.status(200).json(formatResponse(
      true,
      'Admin berhasil diambil',
      adminsWithHimpunan
    ));
  } catch (error) {
    console.error('Error in getAllAdmins:', error);
    res.status(500).json(formatResponse(
      false,
      error.message || 'Terjadi kesalahan saat mengambil data admin'
    ));
  }
};

exports.getAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      where: {
        id: req.params.id,
        role: ['admin', 'super_admin']
      },
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire']
      }
    });

    if (!admin) {
      return res.status(404).json(formatResponse(
        false,
        'Admin tidak ditemukan'
      ));
    }

    const adminData = admin.toJSON();
    if (admin.role === 'admin') {
      const himpunan = await Himpunan.findOne({
        where: {
          adminId: admin.id
        },
        attributes: ['id', 'name', 'code']
      });
      adminData.himpunan = himpunan;
    }

    res.status(200).json(formatResponse(
      true,
      'Admin berhasil diambil',
      adminData
    ));
  } catch (error) {
    console.error('Error in getAdmin:', error);
    res.status(500).json(formatResponse(
      false,
      error.message || 'Terjadi kesalahan saat mengambil data admin'
    ));
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      himpunanId,
      position,
      phoneNumber,
      permissions
    } = req.body;

    if (himpunanId) {
      const himpunan = await Himpunan.findByPk(himpunanId);
      if (!himpunan) {
        return res.status(404).json(formatResponse(
          false,
          'Himpunan tidak ditemukan'
        ));
      }
    }

    const admin = await User.create({
      fullName: name,
      email,
      password,
      role: 'admin',
      position: position || 'Admin',
      joinedAt: new Date(),
      phoneNumber,
      permissions: permissions || {},
      score: 0
    });

    if (himpunanId) {
      const himpunan = await Himpunan.findByPk(himpunanId);
      await himpunan.update({
        adminId: admin.id
      });
    }

    const createdAdmin = await User.findByPk(admin.id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire']
      }
    });

    if (himpunanId) {
      const himpunan = await Himpunan.findByPk(himpunanId, {
        attributes: ['id', 'name']
      });
      createdAdmin.himpunan = himpunan;
    }

    res.status(201).json(formatResponse(
      true,
      'Admin berhasil dibuat',
      createdAdmin
    ));
  } catch (error) {
    console.error('Error in createAdmin:', error);
    next(error);
  }
};

exports.assignHimpunanToAdmin = async (req, res) => {
  try {
    const { adminId, himpunanId } = req.body;

    if (!adminId || !himpunanId) {
      return res.status(400).json({ success:false, message: 'adminId dan himpunanId wajib diisi' });
    }

    const admin = await User.findByPk(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ success:false, message: 'Admin tidak ditemukan' });
    }

    const himpunan = await Himpunan.findByPk(himpunanId);
    if (!himpunan) {
      return res.status(404).json({ success:false, message: 'Himpunan tidak ditemukan' });
    }

    await admin.update({
      himpunanId: himpunan.id,
      isHimpunanAdmin: true,
      permissions: {
        ...admin.permissions,
        canManageHimpunan: true
      }
    });

    await himpunan.update({ adminId: admin.id });

    res.json({
      success: true,
      message: 'Himpunan berhasil ditetapkan ke admin',
      data: {
        adminId: admin.id,
        himpunanId: himpunan.id,
        adminName: admin.fullName,
        himpunanName: himpunan.name
      }
    });
  } catch (error) {
    console.error('Error assigning himpunan:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menetapkan himpunan',
      error: error.message
    });
  }
};


// Update admin
exports.updateAdmin = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      himpunanId,
      position,
      phoneNumber,
      permissions,
      score
    } = req.body;

    // Find admin
    const admin = await User.findOne({
      where: {
        id: req.params.id,
        role: ['admin', 'super_admin']
      }
    });

    if (!admin) {
      return res.status(404).json(formatResponse(
        false,
        'Admin tidak ditemukan'
      ));
    }

    // Check if user is allowed to update
    const isSuperAdmin = req.user.role === 'super_admin';
    const isOwnAccount = admin.id === req.user.id;

    if (!isSuperAdmin && !isOwnAccount) {
      return res.status(403).json(formatResponse(
        false,
        'Tidak memiliki izin untuk mengubah admin ini'
      ));
    }

    // Check if himpunan exists if provided
    if (himpunanId) {
      const himpunan = await Himpunan.findByPk(himpunanId);
      if (!himpunan) {
        return res.status(404).json(formatResponse(
          false,
          'Himpunan tidak ditemukan'
        ));
      }

      // Update himpunan with this admin
      await himpunan.update({
        adminId: admin.id
      });
    }

    // Update admin fields
    await admin.update({
      fullName: fullName || admin.fullName,
      email: email || admin.email,
      position: position || admin.position,
      phoneNumber: phoneNumber || admin.phoneNumber,
      permissions: permissions || admin.permissions,
      score: score !== undefined ? score : admin.score
    });

    const updatedAdmin = await User.findByPk(admin.id, {
      include: [{
        model: Himpunan,
        as: 'managedHimpunan',
        attributes: ['id', 'name', 'code']
      }],
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire']
      }
    });

    res.status(200).json(formatResponse(
      true,
      'Admin berhasil diupdate',
      updatedAdmin
    ));
  } catch (error) {
    next(error);
  }
};

// Delete admin
exports.deleteAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      where: {
        id: req.params.id,
        role: ['admin', 'super_admin']
      }
    });

    if (!admin) {
      return res.status(404).json(formatResponse(
        false,
        'Admin tidak ditemukan'
      ));
    }

    // Delete admin
    await admin.destroy();

    res.status(200).json(formatResponse(
      true,
      'Admin berhasil dihapus'
    ));
  } catch (error) {
    next(error);
  }
};

// Reset admin password
exports.resetAdminPassword = async (req, res, next) => {
  try {
    const {
      newPassword
    } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json(formatResponse(
        false,
        'Password baru harus memiliki minimal 6 karakter'
      ));
    }

    const admin = await User.findOne({
      where: {
        id: req.params.id,
        role: ['admin', 'super_admin']
      }
    });

    if (!admin) {
      return res.status(404).json(formatResponse(
        false,
        'Admin tidak ditemukan'
      ));
    }

    // Update password
    admin.password = await bcrypt.hash(newPassword, 10);
    await admin.save();

    res.status(200).json(formatResponse(
      true,
      'Password admin berhasil direset'
    ));
  } catch (error) {
    next(error);
  }
};

// Activate admin
exports.activateAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      where: {
        id: req.params.id,
        role: ['admin', 'super_admin']
      }
    });

    if (!admin) {
      return res.status(404).json(formatResponse(
        false,
        'Admin tidak ditemukan'
      ));
    }

    // Update status
    await admin.update({
      isActive: true
    });

    res.status(200).json(formatResponse(
      true,
      'Admin berhasil diaktifkan'
    ));
  } catch (error) {
    next(error);
  }
};

// Deactivate admin
exports.deactivateAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      where: {
        id: req.params.id,
        role: ['admin', 'super_admin']
      }
    });

    if (!admin) {
      return res.status(404).json(formatResponse(
        false,
        'Admin tidak ditemukan'
      ));
    }

    // Update status
    await admin.update({
      isActive: false
    });

    res.status(200).json(formatResponse(
      true,
      'Admin berhasil dinonaktifkan'
    ));
  } catch (error) {
    next(error);
  }
};

// Admin roles
exports.getAdminRoles = async (req, res, next) => {
  res.status(200).json(formatResponse(
    true,
    'Admin roles retrieved successfully',
    [{
        id: 1,
        name: 'Super Admin',
        permissions: ['all']
      },
      {
        id: 2,
        name: 'Himpunan Admin',
        permissions: ['manage_members', 'view_statistics']
      },
      {
        id: 3,
        name: 'Operator',
        permissions: ['view_members', 'input_data']
      }
    ]
  ));
};

// Admin logs function - similar to previous implementations
exports.getAdminLogs = async (req, res, next) => {
  // Implementation remains similar
  res.status(200).json(formatResponse(
    true,
    'Admin logs retrieved successfully',
    [{
        id: 1,
        userId: 1,
        action: 'LOGIN',
        timestamp: new Date(),
        ip: '192.168.1.1'
      },
      {
        id: 2,
        userId: 1,
        action: 'UPDATE_HIMPUNAN',
        timestamp: new Date(),
        ip: '192.168.1.1'
      }
    ]
  ));
};

exports.getAdminLogsByAdmin = async (req, res, next) => {
  res.status(200).json(formatResponse(
    true,
    'Admin logs retrieved successfully',
    [{
        id: 1,
        userId: req.params.adminId,
        action: 'LOGIN',
        timestamp: new Date(),
        ip: '192.168.1.1'
      },
      {
        id: 2,
        userId: req.params.adminId,
        action: 'UPDATE_PROFILE',
        timestamp: new Date(),
        ip: '192.168.1.1'
      }
    ]
  ));
};

exports.updateUserScore = async (req, res, next) => {
  try {
    const {
      userId
    } = req.params;
    const {
      score
    } = req.body;

    if (score === undefined || isNaN(score)) {
      return res.status(400).json({
        success: false,
        message: 'Nilai skor harus berupa angka yang valid'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Tidak memiliki izin untuk mengubah skor user'
      });
    }

    if (req.user.role === 'admin') {
      const adminHimpunan = await Himpunan.findOne({
        where: {
          adminId: req.user.id
        }
      });

      if (!adminHimpunan) {
        return res.status(403).json({
          success: false,
          message: 'Admin tidak terdaftar sebagai pengelola himpunan manapun'
        });
      }

      const isMember = await HimpunanMember.findOne({
        where: {
          userId: userId,
          himpunanId: adminHimpunan.id
        }
      });

      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Tidak dapat mengubah skor user yang bukan anggota himpunan Anda'
        });
      }
    }

    await user.update({
      score
    });

    res.status(200).json({
      success: true,
      message: 'Skor user berhasil diperbarui',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        score: user.score
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui skor user',
      error: error.message
    });
  }
};

exports.createAdminRole = async (req, res, next) => {
  try {
    const {
      name,
      permissions
    } = req.body;

    // Validasi input
    if (!name || !permissions) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan permissions harus diisi'
      });
    }

    const role = {
      id: Math.floor(Math.random() * 1000) + 4,
      name,
      permissions
    };

    res.status(201).json({
      success: true,
      message: 'Admin role berhasil dibuat',
      data: role
    });
  } catch (error) {
    console.error('Error in createAdminRole:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat admin role',
      error: error.message
    });
  }
};

exports.updateAdminRole = async (req, res, next) => {
  try {
    const {
      id
    } = req.params;
    const {
      name,
      permissions
    } = req.body;

    res.status(200).json({
      success: true,
      message: 'Admin role berhasil diupdate',
      data: {
        id,
        name,
        permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAdminRole = async (req, res, next) => {
  try {
    const {
      id
    } = req.params;

    // Implementasi dummy (ganti dengan implementasi sebenarnya)
    res.status(200).json({
      success: true,
      message: 'Admin role berhasil dihapus'
    });
  } catch (error) {
    next(error);
  }
};