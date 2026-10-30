const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./socket');

const server = http.createServer(app);

// Initialize Socket.IO on the HTTP server
initSocket(server);

// Start Server after connecting to MongoDB
const startServer = async () => {
  try {
    await connectDB();

    server.listen(config.port, () => {
      console.log('====================================================');
      console.log(`🚀 Restaurant API Server running in [${config.nodeEnv}] mode`);
      console.log(`🌐 Server URL:        http://localhost:${config.port}`);
      console.log(`🩺 Health Check:      http://localhost:${config.port}/api/health`);
      console.log(`🔌 Socket.IO:         Ready for real-time kitchen screen events`);
      console.log(`👥 Allowed Origins:   ${config.corsOrigins.join(', ')}`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error(`[Fatal Startup Error] Could not start server: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('[Server] HTTP and Socket server closed.');
    await disconnectDB();
    console.log('[Server] Graceful shutdown complete. Exiting process.');
    process.exit(0);
  });

  // Force close after 10s timeout
  setTimeout(() => {
    console.error('[Server] Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
  process.exit(1);
});

// Launch server if executed directly
if (require.main === module) {
  startServer();
}

module.exports = {
  server,
  startServer,
};
