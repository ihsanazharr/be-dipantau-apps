// src/models/index.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models - HAPUS HimpunanMember
const User = require('./User')(sequelize);
const Himpunan = require('./Himpunan')(sequelize);
// const HimpunanMember = require('./HimpunanMember')(sequelize); // DIHAPUS
const Activity = require('./Activity')(sequelize);
const Attendance = require('./Attendance')(sequelize);
const Notification = require('./Notification')(sequelize);
const Task = require('./Task')(sequelize);

// Define associations
function initAssociations() {
  // === USER-HIMPUNAN ASSOCIATIONS === 
  
  // 1. User sebagai ADMIN himpunan (one-to-many)
  User.hasMany(Himpunan, { 
    foreignKey: 'adminId', 
    as: 'managedHimpunan' 
  });
  
  Himpunan.belongsTo(User, { 
    foreignKey: 'adminId', 
    as: 'admin' 
  });
  
  // 2. User sebagai MEMBER himpunan (many-to-one)
  // TAMBAH: Association baru untuk membership
  User.belongsTo(Himpunan, {
    foreignKey: 'himpunanId',
    as: 'himpunan' // User belongs to one himpunan as member
  });
  
  Himpunan.hasMany(User, {
    foreignKey: 'himpunanId',
    as: 'members' // Himpunan has many users as members
  });
  
  // === ACTIVITY ASSOCIATIONS ===
  Himpunan.hasMany(Activity, { 
    foreignKey: 'himpunanId', 
    as: 'activities' 
  });
  
  Activity.belongsTo(Himpunan, { 
    foreignKey: 'himpunanId', 
    as: 'himpunan' 
  });
  
  Activity.hasMany(Attendance, { 
    foreignKey: 'activityId', 
    as: 'attendances' 
  });
  
  // === TASK ASSOCIATIONS ===
  Himpunan.hasMany(Task, {
    foreignKey: 'himpunanId',
    as: 'tasks'
  });
  
  Task.belongsTo(Himpunan, {
    foreignKey: 'himpunanId',
    as: 'himpunan'
  });
  
  // Task can be assigned to a user
  Task.belongsTo(User, {
    foreignKey: 'assignedToId',
    as: 'assignedTo'
  });
  
  // Task can be created by a user
  Task.belongsTo(User, {
    foreignKey: 'createdById',
    as: 'createdBy'
  });
  
  // User can have many assigned tasks
  User.hasMany(Task, {
    foreignKey: 'assignedToId',
    as: 'assignedTasks'
  });
  
  // User can have created many tasks
  User.hasMany(Task, {
    foreignKey: 'createdById',
    as: 'createdTasks'
  });
  
  // === ATTENDANCE ASSOCIATIONS ===
  Attendance.belongsTo(Activity, { 
    foreignKey: 'activityId', 
    as: 'activity' 
  });
  
  Attendance.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });
  
  // === NOTIFICATION ASSOCIATIONS ===
  Notification.belongsTo(User, { 
    foreignKey: 'recipientId', 
    as: 'recipient' 
  });
  
  Notification.belongsTo(User, { 
    foreignKey: 'senderId', 
    as: 'sender' 
  });
  
  // HAPUS: Semua HimpunanMember associations dihapus
  // HimpunanMember.belongsTo(User, { 
  //   foreignKey: 'userId', 
  //   as: 'user' 
  // });
  // 
  // HimpunanMember.belongsTo(Himpunan, { 
  //   foreignKey: 'himpunanId', 
  //   as: 'himpunan' 
  // });
  //
  // Himpunan.hasMany(HimpunanMember, { 
  //   foreignKey: 'himpunanId', 
  //   as: 'members' 
  // });
}

// Initialize associations
initAssociations();

// HAPUS HimpunanMember dari export
module.exports = {
  sequelize,
  Sequelize,
  User,
  Himpunan,
  // HimpunanMember, // DIHAPUS
  Activity,
  Attendance,
  Notification,
  Task
};