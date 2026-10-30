const mongoose = require('mongoose');
const config = require('../config/env');

const MONGO_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

const checkHealth = () => {
  const dbStateCode = mongoose.connection.readyState;
  const dbStatus = MONGO_STATES[dbStateCode] || 'unknown';
  const isDbHealthy = dbStateCode === 1;

  return {
    status: isDbHealthy ? 'healthy' : 'degraded',
    service: 'Restaurant Orders & Kitchen Display Backend',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: {
      status: dbStatus,
      host: mongoose.connection.host || 'unknown',
      name: mongoose.connection.name || 'unknown',
      healthy: isDbHealthy,
    },
    system: {
      nodeVersion: process.version,
      memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  };
};

module.exports = {
  checkHealth,
};
