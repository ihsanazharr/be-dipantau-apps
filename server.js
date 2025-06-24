// server.js
require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');

// Define port
const PORT = process.env.PORT || 5000;

const syncOptions = {
  force: process.env.NODE_ENV === 'development' && process.env.DB_SYNC_FORCE === 'true',
  alter: process.env.NODE_ENV !== 'production' && process.env.DB_SYNC_ALTER === 'true'
};

// Connect to database and start server
const startServer = async () => {
  try {
    // Sync database
    await sequelize.sync(syncOptions);
    console.log('Database connection has been established successfully.');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  // Exit process
  process.exit(1);
});

// sequelize.sync({ force: false })
//   .then(() => {
//     console.log('Database re-synchronized successfully!');
//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   })
//   .catch(err => {
//     console.error('Error synchronizing database:', err);
//   });

// Start the server
startServer();