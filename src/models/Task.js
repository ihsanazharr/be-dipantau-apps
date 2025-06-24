const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define('Task', {
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
    // Status yang lebih detail untuk task selection flow
    status: {
      type: DataTypes.ENUM('available', 'claimed', 'in_progress', 'completed', 'cancelled'),
      defaultValue: 'available'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completionDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Tanggal ketika task di-claim oleh anggota
    claimedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    scoreReward: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
      allowNull: true
    },
    // Maksimal anggota yang bisa mengambil task ini (untuk task yang bisa dikerjakan banyak orang)
    maxAssignees: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    // Counter berapa orang yang sudah mengambil task ini
    currentAssignees: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Field untuk tracking progress
    progressPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      }
    },
    // Apakah task ini memerlukan approval dari admin
    requiresApproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Status approval jika diperlukan
    approvalStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: true
    },
    // Catatan dari admin untuk approval/rejection
    approvalNotes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // User yang mengambil/claim task ini
    assignedToId: {
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
      allowNull: false,
      references: {
        model: 'Himpunans',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    // User yang meng-approve task (jika requiresApproval = true)
    approvedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {
    timestamps: true,
    hooks: {
      beforeUpdate: async (task, options) => {
        // Auto set completion date ketika status berubah ke completed
        if (task.changed('status') && task.status === 'completed' && !task.completionDate) {
          task.completionDate = new Date();
        }
        
        // Auto set claimed date ketika status berubah ke claimed
        if (task.changed('status') && task.status === 'claimed' && !task.claimedAt) {
          task.claimedAt = new Date();
        }
        
        // Update progress percentage berdasarkan status
        if (task.changed('status')) {
          switch (task.status) {
            case 'available':
              task.progressPercentage = 0;
              break;
            case 'claimed':
              task.progressPercentage = 10;
              break;
            case 'in_progress':
              if (task.progressPercentage < 10) task.progressPercentage = 25;
              break;
            case 'completed':
              task.progressPercentage = 100;
              break;
            case 'cancelled':
              // Progress tetap seperti sebelumnya
              break;
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
        fields: ['assignedToId']
      },
      {
        fields: ['createdById']
      },
      {
        fields: ['dueDate']
      }
    ]
  });

  return Task;
};