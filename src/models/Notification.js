const {
  DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('reminder', 'announcement', 'task_assigned', 'activity_created', 'attendance_reminder', 'score_update', 'system'),
      defaultValue: 'reminder'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    priority: {
      type: DataTypes.ENUM('rendah', 'sedang', 'tinggi', 'urgent'),
      defaultValue: 'rendah'
    },
    actionUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    actionText: {
      type: DataTypes.STRING,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Ubah channels dari ARRAY(ENUM) menjadi ARRAY(STRING) dengan validasi
    channels: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: ['in_app'],
      validate: {
        isValidChannels(value) {
          if (value) {
            const validChannels = ['in_app', 'email', 'push'];
            for (const channel of value) {
              if (!validChannels.includes(channel)) {
                throw new Error(`Invalid channel: ${channel}`);
              }
            }
          }
        }
      }
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        // Ubah channels dari ARRAY(ENUM) menjadi ARRAY(STRING) dengan validasi
        channels: {
          type: DataTypes.ARRAY(DataTypes.STRING),
          defaultValue: ['in_app'],
          validate: {
            isValidChannels(value) {
              if (value) {
                const validChannels = ['in_app', 'email', 'push'];
                for (const channel of value) {
                  if (!validChannels.includes(channel)) {
                    throw new Error(`Invalid channel: ${channel}`);
                  }
                }
              }
            }
          }
        },
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    himpunanId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Himpunans',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    activityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Activities',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Tasks',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    }
  }, {
    timestamps: true,
    hooks: {
      beforeUpdate: async (notification, options) => {
        if (notification.changed('isRead') && notification.isRead && !notification.readAt) {
          notification.readAt = new Date();
        }
      }
    },
    indexes: [{
        fields: ['recipientId']
      },
      {
        fields: ['senderId']
      },
      {
        fields: ['himpunanId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['priority']
      },
      {
        fields: ['isRead']
      },
      {
        fields: ['scheduledAt']
      },
      {
        fields: ['createdAt']
      }
    ]
  });

  return Notification;
};