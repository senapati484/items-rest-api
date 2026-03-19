const mongoose = require('mongoose');

const READY_STATE_MAP = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnected',
};

const RECONNECT_INTERVAL_MS = 30 * 1000;
const CONNECTION_OPTIONS = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let connectPromise = null;
let reconnectTimer = null;
let reconnectEnabled = false;
let lastErrorMessage = null;
let eventHandlersRegistered = false;
let statusOverride = null;

const sanitizeDbErrorMessage = (message = 'Unknown database error') =>
  message.replace(/mongodb(?:\+srv)?:\/\/\S+/gi, '[redacted mongo uri]');

const getConnectionState = () => {
  if (connectPromise) {
    return 'connecting';
  }

  return READY_STATE_MAP[mongoose.connection.readyState] || 'disconnected';
};

const clearReconnectTimer = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
};

const getDbStatus = () => {
  if (statusOverride) {
    return { ...statusOverride };
  }

  const status = {
    connected: getConnectionState() === 'connected',
    state: getConnectionState(),
  };

  if (lastErrorMessage) {
    status.lastError = lastErrorMessage;
  }

  return status;
};

const isDbConnected = () => getDbStatus().connected;

const registerConnectionEventHandlers = () => {
  if (eventHandlersRegistered) {
    return;
  }

  eventHandlersRegistered = true;

  mongoose.connection.on('error', (error) => {
    lastErrorMessage = sanitizeDbErrorMessage(error.message);
    console.error(`❌ MongoDB error: ${lastErrorMessage}`);
  });

  mongoose.connection.on('disconnected', () => {
    if (!reconnectEnabled) {
      return;
    }

    console.warn('⚠️ MongoDB disconnected.');
    scheduleReconnect();
  });
};

const connectDB = async () => {
  registerConnectionEventHandlers();

  if (!process.env.MONGO_URI) {
    const error = new Error('MONGO_URI is not configured.');
    lastErrorMessage = sanitizeDbErrorMessage(error.message);
    console.error(`❌ MongoDB connection error: ${lastErrorMessage}`);
    throw error;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectPromise) {
    return connectPromise;
  }

  console.log('⏳ Connecting to MongoDB...');

  connectPromise = mongoose
    .connect(process.env.MONGO_URI, CONNECTION_OPTIONS)
    .then((conn) => {
      clearReconnectTimer();
      lastErrorMessage = null;
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return conn;
    })
    .catch((error) => {
      lastErrorMessage = sanitizeDbErrorMessage(error.message);
      console.error(`❌ MongoDB connection error: ${lastErrorMessage}`);
      throw error;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
};

function scheduleReconnect() {
  if (
    !reconnectEnabled ||
    reconnectTimer ||
    isDbConnected() ||
    connectPromise ||
    getConnectionState() === 'connecting'
  ) {
    return;
  }

  console.warn(`⚠️ MongoDB unavailable. Retrying in ${RECONNECT_INTERVAL_MS / 1000}s.`);

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;

    try {
      console.log('🔁 Retrying MongoDB connection...');
      await connectDB();
    } catch (error) {
      scheduleReconnect();
    }
  }, RECONNECT_INTERVAL_MS);

  if (typeof reconnectTimer.unref === 'function') {
    reconnectTimer.unref();
  }
}

const startReconnectLoop = () => {
  reconnectEnabled = true;
  scheduleReconnect();
};

const __setDbStatusForTests = (status) => {
  statusOverride = { ...status };
};

const __clearDbStatusForTests = () => {
  statusOverride = null;
};

module.exports = {
  RECONNECT_INTERVAL_MS,
  connectDB,
  getDbStatus,
  isDbConnected,
  startReconnectLoop,
  __setDbStatusForTests,
  __clearDbStatusForTests,
};
