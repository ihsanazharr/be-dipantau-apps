// src/models/Attendance.js
module.exports = (sequelize) => {
    const Attendance = sequelize.define('Attendance', {
      id: {
        type: sequelize.Sequelize.INTEGER,
        defaultValue: sequelize.Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      checkInTime: {
        type: sequelize.Sequelize.DATE,
        allowNull: true
      },
      checkOutTime: {
        type: sequelize.Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: sequelize.Sequelize.ENUM('hadir', 'tidak_hadir', 'terlambat', 'izin'),
        defaultValue: 'hadir'
      },
      location: {
        type: sequelize.Sequelize.STRING,
        allowNull: true
      },
      notes: {
        type: sequelize.Sequelize.TEXT,
        allowNull: true
      }
    });
  
    return Attendance;
  };