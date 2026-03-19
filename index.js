require('dotenv').config();
const { connectDB, startReconnectLoop, RECONNECT_INTERVAL_MS } = require('./src/config/db');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📚 API Docs:    http://localhost:${PORT}/api-docs`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    try {
      await connectDB();
    } catch (error) {
      console.warn('⚠️ Starting in degraded mode. /health and /api-docs remain available while MongoDB reconnects.');
      console.warn(`⚠️ API routes will return 503 until the database is reachable. Retry interval: ${RECONNECT_INTERVAL_MS / 1000}s.`);
    }

    startReconnectLoop();
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

startServer();
