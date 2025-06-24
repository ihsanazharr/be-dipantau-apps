// models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255]
      }
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'member',
      validate: {
        isIn: [['super_admin', 'admin', 'member']]
      }
    },
    himpunanId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Himpunans', // Pastikan ini sesuai dengan nama tabel di database
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    isHimpunanAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    membershipStatus: { 
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'inactive' 
  },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    qrCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {
        canManageUsers: false,
        canManageHimpunan: false,
        canCreateTasks: false,
        canCreateActivities: false,
        canScanQR: false,
        canManageAttendance: false,
        canViewReports: false
      }
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    lastActive: {
      type: DataTypes.DATE,
      allowNull: true
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[0-9]+$/
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      afterCreate: async (user) => {
        if (user.himpunanId) {
          const Himpunan = sequelize.models.Himpunan; // Akses model Himpunan
          const himpunan = await Himpunan.findByPk(user.himpunanId);
          if (himpunan) await himpunan.updateTotalMembers();
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('himpunanId')) {
          const Himpunan = sequelize.models.Himpunan; // Akses model Himpunan
          // Update himpunan lama
          if (user.previous('himpunanId')) {
            const oldHimpunan = await Himpunan.findByPk(user.previous('himpunanId'));
            if (oldHimpunan) await oldHimpunan.updateTotalMembers();
          }

          // Update himpunan baru
          if (user.himpunanId) {
            const newHimpunan = await Himpunan.findByPk(user.himpunanId);
            if (newHimpunan) await newHimpunan.updateTotalMembers();
          }
        }

        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      afterDestroy: async (user) => {
        if (user.himpunanId) {
          const Himpunan = sequelize.models.Himpunan; // Akses model Himpunan
          const himpunan = await Himpunan.findByPk(user.himpunanId);
          if (himpunan) await himpunan.updateTotalMembers();
        }
      }
    },
    indexes: [{
      unique: true,
      fields: ['email']
    }]
  });

  // Method untuk validasi password
  User.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
  };

  return User;
};
