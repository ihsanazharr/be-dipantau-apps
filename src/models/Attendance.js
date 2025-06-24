const {
  DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    checkInTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    checkOutTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('hadir', 'tidak_hadir', 'terlambat', 'izin'),
      defaultValue: 'hadir'
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    qrCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Tambahan field untuk tracking yang lebih detail
    attendanceMethod: {
      type: DataTypes.ENUM('qr_scan', 'manual', 'auto'),
      defaultValue: 'qr_scan'
    },
    // Koordinat GPS untuk verifikasi lokasi
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    // Device info untuk tracking
    deviceInfo: {
      type: DataTypes.JSON,
      allowNull: true
    },
    // IP Address untuk tracking
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Durasi kehadiran (dalam menit)
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // Apakah attendance ini sudah diverifikasi admin
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Admin yang memverifikasi
    verifiedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    // Tanggal verifikasi
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Relasi dengan activity
    activityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Activities',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    // Relasi dengan user
    userId: {
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
      beforeUpdate: async (attendance, options) => {
        // Auto calculate duration jika ada checkIn dan checkOut
        if (attendance.checkInTime && attendance.checkOutTime) {
          const checkIn = new Date(attendance.checkInTime);
          const checkOut = new Date(attendance.checkOutTime);
          attendance.duration = Math.round((checkOut - checkIn) / (1000 * 60)); // dalam menit
        }

        // Auto set verification date
        if (attendance.changed('isVerified') && attendance.isVerified && !attendance.verifiedAt) {
          attendance.verifiedAt = new Date();
        }
      },
      afterCreate: async (attendance, options) => {
        // Update currentParticipants di Activity
        const {
          Activity
        } = require('./index');
        if (attendance.status === 'hadir') {
          await Activity.increment('currentParticipants', {
            where: {
              id: attendance.activityId
            }
          });
        }
      },
      afterUpdate: async (attendance, options) => {
        // Update currentParticipants di Activity jika status berubah
        if (attendance.changed('status')) {
          const {
            Activity
          } = require('./index');
          const previousStatus = attendance._previousDataValues.status;

          if (previousStatus !== 'hadir' && attendance.status === 'hadir') {
            await Activity.increment('currentParticipants', {
              where: {
                id: attendance.activityId
              }
            });
          } else if (previousStatus === 'hadir' && attendance.status !== 'hadir') {
            await Activity.decrement('currentParticipants', {
              where: {
                id: attendance.activityId
              }
            });
          }
        }
      }
    },
    indexes: [{
        fields: ['activityId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['checkInTime']
      },
      {
        unique: true,
        fields: ['activityId', 'userId']
      }
    ]
  });

  return Attendance;
};