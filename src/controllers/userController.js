const jwt = require('jsonwebtoken');
const {
  User,
  Himpunan
} = require('../models');
const {
  Op
} = require('sequelize');
const crypto = require('crypto');
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET, {
      expiresIn: '7d'
    }
  );
};

exports.registerUser = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      phoneNumber
    } = req.body;

    const userExists = await User.findOne({
      where: {
        email
      }
    });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      email,
      password,
      fullName,
      phoneNumber,
      username: email.split('@')[0],
      role: 'member'
    });

    const token = generateToken(user);

    await user.update({
      lastLogin: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    const user = await User.findOne({
      where: {
        email
      }
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact admin.'
      });
    }

    const isPasswordValid = await user.validPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user);

    await user.update({
      lastLogin: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire']
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      username,
      profilePicture,
      position,
      isHimpunanAdmin,
      himpunanRole,
      membershipStatus
    } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields yang diizinkan untuk user biasa
    if (fullName) user.fullName = fullName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (username) user.username = username;
    if (profilePicture) user.profilePicture = profilePicture;

    // Update fields khusus admin (hanya untuk super_admin)
    if (req.user.role === 'super_admin') {
      if (position !== undefined) user.position = position;
      if (isHimpunanAdmin !== undefined) user.isHimpunanAdmin = isHimpunanAdmin;
      if (himpunanRole !== undefined) user.himpunanRole = himpunanRole;
      if (membershipStatus !== undefined) user.membershipStatus = membershipStatus;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        username: user.username,
        profilePicture: user.profilePicture,
        position: user.position,
        isHimpunanAdmin: user.isHimpunanAdmin
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// @desc    Request password reset
// @route   POST /api/users/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const {
      email
    } = req.body;
    const user = await User.findOne({
      where: {
        email
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email does not exist'
      });
    }

    // Generate random token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set token and expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save();

    // In a real app, send email with reset link
    // For now, just return the token
    res.status(200).json({
      success: true,
      message: 'Password reset link sent to email',
      resetToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   POST /api/users/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const {
      token,
      password
    } = req.body;

    const user = await User.findOne({
      where: {
        resetPasswordToken: token,
        resetPasswordExpire: {
          [Op.gt]: Date.now()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const {
      count,
      rows
    } = await User.findAndCountAll({
      where: {
        [Op.or]: [{
            fullName: {
              [Op.iLike]: `%${search}%`
            }
          },
          {
            email: {
              [Op.iLike]: `%${search}%`
            }
          },
          {
            username: {
              [Op.iLike]: `%${search}%`
            }
          }
        ]
      },
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire']
      },
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
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire']
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      role,
      isActive,
      phoneNumber,
      username
    } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (username) user.username = username;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.destroy();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

exports.updateUserScore = async (req, res) => {
  try {
    const {
      userId
    } = req.params;
    const {
      score
    } = req.body;

    // Validate
    if (isNaN(score)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid score value'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Authorization
    if (req.user.role === 'admin') {
      const adminHimpunan = await User.findOne({
        where: {
          id: req.user.id,
          isHimpunanAdmin: true
        }
      });

      if (!adminHimpunan || user.himpunanId !== adminHimpunan.himpunanId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to modify this user'
        });
      }
    } else if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Update
    await user.update({
      score
    });
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Fungsi untuk mendapatkan user berdasarkan himpunan - MODIFIKASI
exports.getUsersByHimpunan = async (req, res) => {
  try {
    const {
      himpunanId
    } = req.params;

    // Authorization
    if (req.user.role === 'admin') {
      const isAdmin = await User.findOne({
        where: {
          id: req.user.id,
          himpunanId,
          isHimpunanAdmin: true
        }
      });

      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized access'
        });
      }
    } else if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const users = await User.findAll({
      where: {
        himpunanId
      },
      attributes: {
        exclude: ['password']
      }
    });

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.joinHimpunan = async (req, res) => {
  try {
    const {
      himpunanId
    } = req.body;
    const userId = req.user.id;

    // Check if himpunan exists
    const himpunan = await Himpunan.findByPk(himpunanId);
    if (!himpunan) {
      return res.status(404).json({
        success: false,
        message: 'Himpunan not found'
      });
    }

    // Check if user already has membership
    const user = await User.findByPk(userId);
    if (user.himpunanId) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of a himpunan'
      });
    }

    // Update user to join himpunan
    await user.update({
      himpunanId,
      membershipStatus: 'pending',
      joinDate: new Date(),
      membershipType: 'aktif'
    });

    res.status(200).json({
      success: true,
      message: 'Membership request submitted successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to join himpunan',
      error: error.message
    });
  }
};

// TAMBAH: Fungsi untuk update membership status
exports.updateMembershipStatus = async (req, res) => {
  try {
    const {
      userId
    } = req.params;
    const {
      status
    } = req.body;

    const user = await User.findByPk(userId, {
      include: [{
        model: Himpunan,
        as: 'himpunan'
      }]
    });

    if (!user || !user.himpunanId) {
      return res.status(404).json({
        success: false,
        message: 'User or membership not found'
      });
    }

    // Check if user is admin of this himpunan or super_admin
    if (user.himpunan.adminId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this membership'
      });
    }

    // Validate status
    if (!['active', 'inactive', 'pending', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Update status
    await user.update({
      membershipStatus: status
    });

    res.status(200).json({
      success: true,
      message: 'Membership status updated successfully',
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

// TAMBAH: Fungsi untuk leave himpunan
exports.leaveHimpunan = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user.himpunanId) {
      return res.status(404).json({
        success: false,
        message: 'You are not a member of any himpunan'
      });
    }

    // Update user to leave himpunan
    await user.update({
      himpunanId: null,
      membershipStatus: 'inactive',
      joinDate: null,
      himpunanRole: 'anggota'
    });

    res.status(200).json({
      success: true,
      message: 'You have successfully left the himpunan'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to leave himpunan',
      error: error.message
    });
  }
};

// TAMBAH: Fungsi untuk remove member (by admin)
exports.removeMember = async (req, res) => {
  try {
    const {
      userId
    } = req.params;

    const user = await User.findByPk(userId, {
      include: [{
        model: Himpunan,
        as: 'himpunan'
      }]
    });

    if (!user || !user.himpunanId) {
      return res.status(404).json({
        success: false,
        message: 'User or membership not found'
      });
    }

    // Check if user is admin of this himpunan or super_admin
    if (user.himpunan.adminId !== req.user.id && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to remove this member'
      });
    }

    // Remove user from himpunan
    await user.update({
      himpunanId: null,
      membershipStatus: 'inactive',
      joinDate: null,
      himpunanRole: 'anggota'
    });

    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove member',
      error: error.message
    });
  }
};

// TAMBAH: Fungsi untuk get user's current membership
exports.getMyMembership = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId, {
      include: [{
        model: Himpunan,
        as: 'himpunan',
        include: [{
          model: User,
          as: 'admin',
          attributes: ['id', 'fullName', 'email']
        }]
      }],
      attributes: {
        exclude: ['password', 'resetPasswordToken', 'resetPasswordExpire']
      }
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership',
      error: error.message
    });
  }
};

exports.createAdmin = async (req, res, next) => {
  try {
    const { name, email, password, position, phoneNumber } = req.body;
    
    // Hanya buat admin dasar TANPA himpunanId
    const admin = await User.create({
      fullName: name,
      email,
      password,
      role: 'admin',
      position: position || 'Admin',
      joinedAt: new Date(),
      phoneNumber,
      permissions: {
        canManageUsers: true,
        canCreateTasks: true,
        canCreateActivities: true,
        canScanQR: true,
        canManageAttendance: true,
        canViewReports: true
      },
      score: 0
    });

    // Kirim respons tanpa password
    const adminData = admin.get({ plain: true });
    delete adminData.password;
    
    res.status(201).json({
      success: true,
      message: 'Admin berhasil dibuat. Silakan assign himpunan setelahnya.',
      data: adminData
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal membuat admin',
      error: error.message
    });
  }
};

exports.debugCreateAdmin = async (req, res) => {
  try {
    // Data hard-coded untuk testing
    const testData = {
      fullName: "DEBUG ADMIN",
      email: "debug@admin.com",
      password: "debug123",
      himpunanId: 1,
      isHimpunanAdmin: true,
      role: "admin",
      position: "Debug Position",
      phoneNumber: "081234567890"
    };

    // Langsung create tanpa validasi
    const admin = await User.create(testData);

    // Dapatkan data dari database
    const dbAdmin = await User.findByPk(admin.id, {
      raw: true
    });

    res.status(200).json({
      success: true,
      input: testData,
      database: dbAdmin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Debug failed",
      error: error.message,
      stack: error.stack
    });
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      where: {
        [Op.or]: [{
            role: 'super_admin'
          },
          {
            isHimpunanAdmin: true
          }
        ]
      },
      attributes: {
        exclude: ['password']
      }
    });

    res.status(200).json({
      success: true,
      data: admins
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admins',
      error: error.message
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword
    } = req.body;

    // Pastikan password baru memenuhi kriteria (minimal 6 karakter, dll)
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password baru harus memiliki minimal 6 karakter'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    // Validasi password lama
    const isMatch = await user.validPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password lama tidak cocok'
      });
    }

    // Update password baru (hashing dilakukan di hook model)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password berhasil diperbarui'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengubah password',
      error: error.message
    });
  }
};


module.exports = exports;