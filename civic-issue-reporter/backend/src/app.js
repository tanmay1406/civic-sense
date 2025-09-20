const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const path = require("path");
require("dotenv").config();

// Import database and models
const {
  initializeDatabase,
  seedDatabase,
  sequelize,
  mongoose,
} = require("./models");

// Import middleware
const authMiddleware = require("./middleware/auth");
const { errorHandler } = require("./middleware/errorHandler");
const { requestLogger } = require("./middleware/requestLogger");
const validation = require("./middleware/validation");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const issueRoutes = require("./routes/issues");
const categoryRoutes = require("./routes/categories");
const departmentRoutes = require("./routes/departments");
const adminRoutes = require("./routes/admin");
const uploadRoutes = require("./routes/upload");
const analyticsRoutes = require("./routes/analytics");
const notificationRoutes = require("./routes/notifications");

// Import services
const NotificationService = require("./services/NotificationService");
const SocketService = require("./services/SocketService");

// Create Express application
const app = express();

// Simple console logger
const logger = {
  info: (message, meta = {}) => console.log(`[INFO] ${message}`, meta),
  error: (message, error = {}) => console.error(`[ERROR] ${message}`, error),
  warn: (message, meta = {}) => console.warn(`[WARN] ${message}`, meta),
  debug: (message, meta = {}) => console.log(`[DEBUG] ${message}`, meta),
};

// Make logger available globally
global.logger = logger;

// Trust proxy (important for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : ["http://localhost:3000", "http://localhost:3001"];

    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));

// Compression middleware
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Request logging
if (process.env.ENABLE_REQUEST_LOGGING === "true") {
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }),
  );
} else {
  app.use(morgan("tiny"));
}

// Rate limiting
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(429).json({
        error: message,
        retryAfter: Math.round(windowMs / 1000),
      });
    },
  });
};

// General rate limiting
app.use(
  "/api/",
  createRateLimit(
    15 * 60 * 1000, // 15 minutes
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    "Too many requests from this IP, please try again later.",
  ),
);

// Stricter rate limiting for auth endpoints
app.use(
  "/api/auth/",
  createRateLimit(
    15 * 60 * 1000, // 15 minutes
    10, // 10 requests
    "Too many authentication attempts, please try again later.",
  ),
);

// File upload rate limiting
app.use(
  "/api/upload/",
  createRateLimit(
    15 * 60 * 1000, // 15 minutes
    20, // 20 uploads
    "Too many file uploads, please try again later.",
  ),
);

// Body parsing middleware
app.use(
  express.json({
    limit: process.env.MAX_REQUEST_SIZE || "10mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.MAX_REQUEST_SIZE || "10mb",
  }),
);

// Custom request logger middleware
app.use(requestLogger);

// Health check endpoint (before auth middleware)
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      database: "connected",
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
        total:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
      },
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
});

// API info endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Civic Issue Reporter API",
    version: process.env.npm_package_version || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    documentation: "/api/docs",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      issues: "/api/issues",
      categories: "/api/categories",
      departments: "/api/departments",
      admin: "/api/admin",
      upload: "/api/upload",
      analytics: "/api/analytics",
      notifications: "/api/notifications",
    },
  });
});

// Mount API routes
const apiRouter = express.Router();

// Health check endpoint under /api
apiRouter.get("/health", async (req, res) => {
  try {
    // Check database connection
    await mongoose.connection.db.admin().ping();

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      database: "connected",
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
        total:
          Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
      },
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    logger.error("Health check failed:", error);
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: "Database connection failed",
    });
  }
});

// Public routes (no authentication required)
apiRouter.use("/auth", authRoutes);
apiRouter.use("/categories", categoryRoutes);

// Protected routes (authentication required)
apiRouter.use("/users", authMiddleware.requireAuth, userRoutes);
apiRouter.use("/issues", authMiddleware.requireAuth, issueRoutes);
apiRouter.use("/departments", authMiddleware.requireAuth, departmentRoutes);
apiRouter.use("/upload", authMiddleware.requireAuth, uploadRoutes);
apiRouter.use("/analytics", authMiddleware.requireAuth, analyticsRoutes);
apiRouter.use("/notifications", authMiddleware.requireAuth, notificationRoutes);

// Admin routes (admin authentication required)
apiRouter.use(
  "/admin",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["admin", "super_admin"]),
  adminRoutes,
);

// Mount API router
app.use("/api", apiRouter);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use(
    express.static(path.join(__dirname, "../../../admin-dashboard/build")),
  );

  app.get("*", (req, res) => {
    res.sendFile(
      path.join(__dirname, "../../../admin-dashboard/build/index.html"),
    );
  });
}

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  try {
    // Close database connections
    await sequelize.close();
    logger.info("Database connections closed.");

    // Close any other resources (Redis, file handles, etc.)
    if (global.redisClient) {
      await global.redisClient.quit();
      logger.info("Redis connection closed.");
    }

    logger.info("Graceful shutdown completed.");
    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
};

// Handle process termination
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info("Database initialized successfully");

    // Seed database if in development and no data exists
    if (process.env.NODE_ENV === "development") {
      await seedDatabase();
    }

    // Start the server
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(` Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(` Health check: http://localhost:${PORT}/health`);
      logger.info(` API docs: http://localhost:${PORT}/api`);
    });

    // Initialize Socket.io for real-time updates
    const io = SocketService.initialize(server);
    global.io = io;

    // Initialize notification service
    await NotificationService.initialize();

    // Set server timeout
    server.timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000;

    // Handle server errors
    server.on("error", (error) => {
      if (error.syscall !== "listen") {
        throw error;
      }

      const bind = typeof PORT === "string" ? "Pipe " + PORT : "Port " + PORT;

      switch (error.code) {
        case "EACCES":
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    return server;
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
