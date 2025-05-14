// src/models/Notification.js
module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        defaultValue: sequelize.Sequelize.INTEGER,
        primaryKey: true
      },
      title: {
        type: sequelize.Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: sequelize.Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: sequelize.Sequelize.STRING,
        defaultValue: 'reminder'
      },
      isRead: {
        type: sequelize.Sequelize.BOOLEAN,
        defaultValue: false
      },
      priority: {
        type: sequelize.Sequelize.ENUM('rendah', 'sedang', 'tinggi', 'urgent'),
        defaultValue: 'rendah'
      }
    });
  
    return Notification;
  };