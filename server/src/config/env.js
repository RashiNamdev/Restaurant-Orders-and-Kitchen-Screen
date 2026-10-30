const path = require('path');
const dotenv = require('dotenv');

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const parseOrigins = (raw) => {
  if (!raw) return ['http://localhost:5173'];
  return raw.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurant_db',
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  socketCorsOrigins: parseOrigins(process.env.SOCKET_CORS_ORIGIN || process.env.CORS_ORIGIN),
  isDev: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test',
  isTest: process.env.NODE_ENV === 'test',
};

module.exports = config;
