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

// Import models
const User = require('./User')(sequelize);
const Himpunan = require('./Himpunan')(sequelize);
const Activity = require('./Activity')(sequelize);
const Attendance = require('./Attendance')(sequelize);
const Notification = require('./Notification')(sequelize);
const Task = require('./Task')(sequelize);

// Define associations
function initAssociations() {
  // === USER-HIMPUNAN ASSOCIATIONS === 
  // User belongs to Himpunan (sebagai member atau admin)
  User.belongsTo(Himpunan, {
    foreignKey: 'himpunanId',
    as: 'himpunan'
  });
  
  // Himpunan has many Users (members dan admins)
  Himpunan.hasMany(User, {
    foreignKey: 'himpunanId',
    as: 'members'
  });
  
  // Himpunan has many admins (users dengan isHimpunanAdmin = true)
  Himpunan.hasMany(User, {
    foreignKey: 'himpunanId',
    as: 'admins',
    scope: {
      isHimpunanAdmin: true
    }
  });
  
  // === ACTIVITY ASSOCIATIONS ===
  // Himpunan has many Activities
  Himpunan.hasMany(Activity, { 
    foreignKey: 'himpunanId', 
    as: 'activities' 
  });
  
  // Activity belongs to Himpunan
  Activity.belongsTo(Himpunan, { 
    foreignKey: 'himpunanId', 
    as: 'himpunan' 
  });
  
  // Activity belongs to User (creator)
  Activity.belongsTo(User, {
    foreignKey: 'createdById',
    as: 'creator'
  });
  
  // User has many created Activities
  User.hasMany(Activity, {
    foreignKey: 'createdById',
    as: 'createdActivities'
  });
  
  // Activity has many Attendances
  Activity.hasMany(Attendance, { 
    foreignKey: 'activityId', 
    as: 'attendances' 
  });
  
  // === TASK ASSOCIATIONS ===
  // Himpunan has many Tasks
  Himpunan.hasMany(Task, {
    foreignKey: 'himpunanId',
    as: 'tasks'
  });
  
  // Task belongs to Himpunan
  Task.belongsTo(Himpunan, {
    foreignKey: 'himpunanId',
    as: 'himpunan'
  });
  
  // Task belongs to User (assignee - yang mengambil task)
  Task.belongsTo(User, {
    foreignKey: 'assignedToId',
    as: 'assignedTo'
  });
  
  // Task belongs to User (creator - yang membuat task)
  Task.belongsTo(User, {
    foreignKey: 'createdById',
    as: 'createdBy'
  });
  
  // Task belongs to User (approver - yang approve task)
  Task.belongsTo(User, {
    foreignKey: 'approvedById',
    as: 'approvedBy'
  });
  
  // User has many assigned Tasks
  User.hasMany(Task, {
    foreignKey: 'assignedToId',
    as: 'assignedTasks'
  });
  
  // User has many created Tasks
  User.hasMany(Task, {
    foreignKey: 'createdById',
    as: 'createdTasks'
  });
  
  // User has many approved Tasks
  User.hasMany(Task, {
    foreignKey: 'approvedById',
    as: 'approvedTasks'
  });
  
  // === ATTENDANCE ASSOCIATIONS ===
  // Attendance belongs to Activity
  Attendance.belongsTo(Activity, { 
    foreignKey: 'activityId', 
    as: 'activity' 
  });
  
  // Attendance belongs to User (attendee)
  Attendance.belongsTo(User, { 
    foreignKey: 'userId', 
    as: 'user' 
  });
  
  // Attendance belongs to User (verifier)
  Attendance.belongsTo(User, {
    foreignKey: 'verifiedById',
    as: 'verifiedBy'
  });
  
  // User has many Attendances
  User.hasMany(Attendance, {
    foreignKey: 'userId',
    as: 'attendances'
  });
  
  // User has many verified Attendances
  User.hasMany(Attendance, {
    foreignKey: 'verifiedById',
    as: 'verifiedAttendances'
  });
  
  // === NOTIFICATION ASSOCIATIONS ===
  // Notification belongs to User (recipient)
  Notification.belongsTo(User, { 
    foreignKey: 'recipientId', 
    as: 'recipient' 
  });
  
  // Notification belongs to User (sender)
  Notification.belongsTo(User, { 
    foreignKey: 'senderId', 
    as: 'sender' 
  });
  
  // Notification belongs to Himpunan
  Notification.belongsTo(Himpunan, {
    foreignKey: 'himpunanId',
    as: 'himpunan'
  });
  
  // Notification belongs to Activity
  Notification.belongsTo(Activity, {
    foreignKey: 'activityId',
    as: 'activity'
  });
  
  // Notification belongs to Task
  Notification.belongsTo(Task, {
    foreignKey: 'taskId',
    as: 'task'
  });
  
  // User has many received Notifications
  User.hasMany(Notification, {
    foreignKey: 'recipientId',
    as: 'receivedNotifications'
  });
  
  // User has many sent Notifications
  User.hasMany(Notification, {
    foreignKey: 'senderId',
    as: 'sentNotifications'
  });
  
  // Himpunan has many Notifications
  Himpunan.hasMany(Notification, {
    foreignKey: 'himpunanId',
    as: 'notifications'
  });
  
  // Activity has many Notifications
  Activity.hasMany(Notification, {
    foreignKey: 'activityId',
    as: 'notifications'
  });
  
  // Task has many Notifications
  Task.hasMany(Notification, {
    foreignKey: 'taskId',
    as: 'notifications'
  });
}

// Initialize associations
initAssociations();

module.exports = {
  sequelize,
  Sequelize,
  User,
  Himpunan,
  Activity,
  Attendance,
  Notification,
  Task
};