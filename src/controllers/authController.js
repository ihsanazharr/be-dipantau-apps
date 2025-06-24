// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const {
  User
} = require('../models');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({
    id
  }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

exports.refreshToken = async (req, res) => {
  const {
    refreshToken
  } = req.body;
  // Verifikasi refresh token
  // Generate new access token
};

exports.register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role
    } = req.body;

    // Cek apakah user sudah ada
    const userExists = await User.findOne({
      where: {
        email
      }
    });
    if (userExists) {
      return res.status(400).json({
        message: 'Pengguna sudah terdaftar'
      });
    }

    // Buat user baru
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'member'
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token
    });
  } catch (error) {
    res.status(400).json({
      message: 'Gagal mendaftar',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    // Cari user berdasarkan email
    const user = await User.findOne({
      where: {
        email
      }
    });

    // Periksa user dan password
    if (user && (await user.validPassword(password))) {
      // Update last login
      await user.update({
        lastLogin: new Date()
      });

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user.id)
      });

      console.log('Authenticated user:', user.id, user.email);
    } else {
      res.status(401).json({
        message: 'Email atau password salah'
      });
    }
  } catch (error) {
    res.status(500).json({
      message: 'Gagal login',
      error: error.message
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    // req.user sudah diset oleh middleware protect
    res.status(200).json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.fullName,
      phoneNumber: req.user.phoneNumber
    });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal mengambil profil',
      error: error.message
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      profilePicture
    } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'Pengguna tidak ditemukan'
      });
    }

    // Update profil
    await user.update({
      fullName: fullName || user.fullName,
      phoneNumber: phoneNumber || user.phoneNumber,
      profilePicture: profilePicture || user.profilePicture
    });

    res.status(200).json({
      message: 'Profil berhasil diperbarui',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal memperbarui profil',
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

    const user = await User.findByPk(req.user.id);

    // Periksa password saat ini
    if (!(await user.validPassword(currentPassword))) {
      return res.status(400).json({
        message: 'Password saat ini salah'
      });
    }

    // Update password
    await user.update({
      password: newPassword
    });

    res.status(200).json({
      message: 'Password berhasil diperbarui'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal mengubah password',
      error: error.message
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const {
      email
    } = req.body;

    // Cari user berdasarkan email
    const user = await User.findOne({
      where: {
        email
      }
    });

    if (!user) {
      return res.status(404).json({
        message: 'Email tidak ditemukan'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Set token dan waktu kedaluwarsa
    await user.update({
      resetPasswordToken: crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex'),
      resetPasswordExpire: Date.now() + 10 * 60 * 1000 // 10 menit
    });

    // TODO: Kirim email reset password
    // Buat URL reset
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    res.status(200).json({
      message: 'Token reset password telah dikirim',
      resetToken
    });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal memproses lupa password',
      error: error.message
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // Hash token dari URL
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Cari user dengan token yang cocok dan belum kedaluwarsa
    const user = await User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpire: {
          [Op.gt]: Date.now()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Token reset password tidak valid atau sudah kedaluwarsa'
      });
    }

    // Set password baru
    await user.update({
      password: req.body.password,
      resetPasswordToken: null,
      resetPasswordExpire: null
    });

    res.status(200).json({
      message: 'Password berhasil direset'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal mereset password',
      error: error.message
    });
  }
};

exports.logout = async (req, res) => {
  try {
    await req.user.update({
      lastLogin: null
    });

    res.status(200).json({
      message: 'Logout berhasil'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Gagal logout',
      error: error.message
    });
  }
};