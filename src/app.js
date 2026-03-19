const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { getDbStatus } = require('./config/db');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/auth.routes');
const itemRoutes = require('./routes/item.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const notFoundMiddleware = require('./middlewares/notFound.middleware');
const requireDbConnection = require('./middlewares/requireDbConnection.middleware');

const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Swagger Docs ─────────────────────────────────────────────────────────────
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Custom CSS for light/white theme
const swaggerUiOptions = {
  customCss: `
    :root {
      --primary: #667eea;
      --primary-dark: #764ba2;
      --bg-white: #ffffff;
      --bg-light: #f5f5f5;
      --border: #e0e0e0;
      --text-dark: #333333;
      --text-light: #666666;
    }
    
    body {
      background: var(--bg-light);
      color: var(--text-dark);
    }
    
    .swagger-ui {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .swagger-ui .topbar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .swagger-ui .info .title {
      color: var(--primary);
    }
    
    .swagger-ui .info .description {
      color: var(--text-light);
    }
    
    .swagger-ui .scheme-container {
      background: var(--bg-white);
      border: 1px solid var(--border);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    
    .swagger-ui .btn {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }
    
    .swagger-ui .btn:hover {
      background: var(--primary-dark);
      border-color: var(--primary-dark);
    }
    
    .swagger-ui .model-box {
      background: var(--bg-white);
      border: 1px solid var(--border);
    }
    
    .swagger-ui section.models {
      border: 1px solid var(--border);
      background: var(--bg-white);
    }
    
    .swagger-ui section.models .model-container {
      background: var(--bg-white);
      border: 1px solid var(--border);
    }
    
    .swagger-ui .response-col_status {
      background: var(--bg-light);
    }
    
    .swagger-ui table thead tr {
      background: #f9f9f9;
      border-bottom: 2px solid var(--border);
    }
    
    .swagger-ui table tbody tr {
      border-bottom: 1px solid var(--border);
    }
    
    .swagger-ui table tbody tr:hover {
      background: rgba(102, 126, 234, 0.05);
    }
    
    .swagger-ui input[type="text"],
    .swagger-ui input[type="password"],
    .swagger-ui input[type="email"],
    .swagger-ui input[type="number"],
    .swagger-ui textarea,
    .swagger-ui select {
      background: var(--bg-white);
      color: var(--text-dark);
      border: 1px solid var(--border);
    }
    
    .swagger-ui input[type="text"]:focus,
    .swagger-ui input[type="password"]:focus,
    .swagger-ui input[type="email"]:focus,
    .swagger-ui input[type="number"]:focus,
    .swagger-ui textarea:focus,
    .swagger-ui select:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .swagger-ui code {
      background: #f9f9f9;
      color: #d63384;
      padding: 2px 6px;
      border-radius: 3px;
    }
    
    .swagger-ui pre {
      background: #f9f9f9;
      border: 1px solid var(--border);
      color: var(--text-dark);
    }
    
    .swagger-ui .response {
      border: 1px solid var(--border);
    }
    
    .swagger-ui .response-visuals {
      background: var(--bg-white);
    }
    
    .swagger-ui .opblock {
      border: 1px solid var(--border);
      margin: 10px 0;
      background: var(--bg-white);
    }
    
    .swagger-ui .opblock.opblock-get {
      border-left: 4px solid #61affe;
    }
    
    .swagger-ui .opblock.opblock-post {
      border-left: 4px solid #49cc90;
    }
    
    .swagger-ui .opblock.opblock-put {
      border-left: 4px solid #fca130;
    }
    
    .swagger-ui .opblock.opblock-delete {
      border-left: 4px solid #f93e3e;
    }
    
    .swagger-ui .opblock-tag {
      border-bottom: 1px solid var(--border);
      color: var(--text-dark);
    }
    
    .swagger-ui .authorization__btn {
      background: var(--primary);
      color: white;
    }
    
    .swagger-ui .models {
      border: 1px solid var(--border);
      background: var(--bg-white);
    }
    
    .swagger-ui .parameter__name {
      color: var(--primary);
    }
    
    .swagger-ui .response-col_description {
      color: var(--text-light);
    }
    
    .swagger-ui .opblock-summary {
      color: var(--text-dark);
    }
    
    .swagger-ui .opblock.opblock-get .opblock-summary {
      background: rgba(97, 175, 254, 0.05);
    }
    
    .swagger-ui .opblock.opblock-post .opblock-summary {
      background: rgba(73, 204, 144, 0.05);
    }
    
    .swagger-ui .opblock.opblock-put .opblock-summary {
      background: rgba(252, 161, 48, 0.05);
    }
    
    .swagger-ui .opblock.opblock-delete .opblock-summary {
      background: rgba(249, 62, 62, 0.05);
    }
  `,
  customSiteTitle: 'Items REST API - Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    displayOperationId: false,
    defaultModelsExpandDepth: 1,
    filter: true,
    showRequestHeaders: true,
    useUnsafeMarkdown: false,
  },
};

// Swagger UI setup with dark mode
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs/', swaggerUi.setup(swaggerSpec, swaggerUiOptions));
app.get('/api-docs', (req, res) => {
  res.redirect('/api-docs/');
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const database = getDbStatus();
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database,
  });
});
// ─── Root Route ───────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Items REST API',
    version: '1.0.0',
    docs: 'http://localhost:3000/api-docs',
    endpoints: {
      auth: '/api/auth',
      items: '/api/items',
      health: '/health',
    },
  });
});
// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', requireDbConnection, authRoutes);
app.use('/api/items', requireDbConnection, itemRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use(notFoundMiddleware);

// ─── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorMiddleware);

module.exports = app;
