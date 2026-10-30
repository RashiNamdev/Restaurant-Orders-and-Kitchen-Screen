const mongoose = require('mongoose');
const os = require('os');
const config = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
      runtimeAdapters: { os },
      driverInfo: {
        name: 'restaurant-server',
        version: '1.0.0',
      },
    });

    if (!config.isTest) {
      console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    }

    return conn;
  } catch (error) {
    if (!config.isTest) {
      console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (!config.isTest) {
      console.log('[Database] MongoDB connection closed gracefully');
    }
  } catch (error) {
    console.error(`[Database Error] Error disconnecting from MongoDB: ${error.message}`);
  }
};

// Global Mongoose event listeners
mongoose.connection.on('disconnected', () => {
  if (!config.isTest) {
    console.warn('[Database] MongoDB connection lost. Reconnecting...');
  }
});

mongoose.connection.on('error', (err) => {
  if (!config.isTest) {
    console.error(`[Database Event Error] MongoDB error: ${err.message}`);
  }
});

module.exports = {
  connectDB,
  disconnectDB,
};
