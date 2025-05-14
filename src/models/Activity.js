// src/models/Activity.js
module.exports = (sequelize) => {
    const Activity = sequelize.define('Activity', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        defaultValue: sequelize.Sequelize.INTEGER,
        primaryKey: true
      },
      title: {
        type: sequelize.Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: sequelize.Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: sequelize.Sequelize.STRING,
        defaultValue: 'rapat'
      },
      startDateTime: {
        type: sequelize.Sequelize.DATE,
        allowNull: false
      },
      endDateTime: {
        type: sequelize.Sequelize.DATE,
        allowNull: false
      },
      location: {
        type: sequelize.Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: sequelize.Sequelize.ENUM('dijadwalkan', 'berlangsung', 'selesai', 'dibatalkan'),
        defaultValue: 'dijadwalkan'
      },
      qrCode: {
        type: sequelize.Sequelize.STRING,
        allowNull: true
      },
      attendanceMode: {
        type: sequelize.Sequelize.ENUM('online', 'offline', 'hybrid'),
        defaultValue: 'offline'
      }
    });
  
    return Activity;
  };