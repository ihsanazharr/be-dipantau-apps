const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Activity = sequelize.define('Activity', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: 'rapat'
    },
    startDateTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDateTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('dijadwalkan', 'berlangsung', 'selesai', 'dibatalkan'),
      defaultValue: 'dijadwalkan'
    },
    qrCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    attendanceMode: {
      type: DataTypes.ENUM('online', 'offline', 'hybrid'),
      defaultValue: 'offline'
    },
    // Tambahan field untuk manajemen yang lebih baik
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    currentParticipants: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Apakah activity ini wajib dihadiri
    isMandatory: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Link untuk meeting online
    meetingLink: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Password untuk meeting online
    meetingPassword: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Catatan tambahan
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // Relasi dengan himpunan
    himpunanId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Himpunans',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    // User yang membuat activity (admin himpunan)
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  }, {
    timestamps: true,
    hooks: {
      beforeCreate: async (activity, options) => {
        // Generate QR Code jika belum ada
        if (!activity.qrCode) {
          activity.qrCode = `\ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}\``;
        }
      },
      beforeUpdate: async (activity, options) => {
        // Auto update status berdasarkan waktu
        const now = new Date();
        if (activity.changed('startDateTime') || activity.changed('endDateTime')) {
          if (now < activity.startDateTime) {
            activity.status = 'dijadwalkan';
          } else if (now >= activity.startDateTime && now <= activity.endDateTime) {
            activity.status = 'berlangsung';
          } else if (now > activity.endDateTime) {
            activity.status = 'selesai';
          }
        }
      }
    },
    indexes: [
      {
        fields: ['status']
      },
      {
        fields: ['himpunanId']
      },
      {
        fields: ['createdById']
      },
      {
        fields: ['startDateTime']
      },
      {
        fields: ['qrCode']
      }
    ]
  });

  return Activity;
};