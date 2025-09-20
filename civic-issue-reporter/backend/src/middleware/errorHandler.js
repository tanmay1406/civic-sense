/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle different types of database errors
 */
const handleDatabaseError = (error) => {
  let message = "Database operation failed";
  let statusCode = 500;

  // Sequelize validation errors
  if (error.name === "SequelizeValidationError") {
    const errors = error.errors.map((err) => ({
      field: err.path,
      message: err.message,
      value: err.value,
    }));

    return new AppError("Validation failed", 400, true, errors);
  }

  // Sequelize unique constraint error
  if (error.name === "SequelizeUniqueConstraintError") {
    const field = error.errors[0]?.path || "field";
    message = `${field} already exists`;
    statusCode = 409;

    return new AppError(message, statusCode);
  }

  // Foreign key constraint error
  if (error.name === "SequelizeForeignKeyConstraintError") {
    message = "Referenced resource does not exist";
    statusCode = 400;

    return new AppError(message, statusCode);
  }

  // Connection error
  if (error.name === "SequelizeConnectionError") {
    message = "Database connection failed";
    statusCode = 503;

    return new AppError(message, statusCode);
  }

  // Database timeout
  if (error.name === "SequelizeTimeoutError") {
    message = "Database operation timed out";
    statusCode = 504;

    return new AppError(message, statusCode);
  }

  return new AppError(message, statusCode);
};

/**
 * Handle JWT authentication errors
 */
const handleJWTError = (error) => {
  if (error.name === "JsonWebTokenError") {
    return new AppError("Invalid authentication token", 401);
  }

  if (error.name === "TokenExpiredError") {
    return new AppError("Authentication token has expired", 401);
  }

  return new AppError("Authentication failed", 401);
};

/**
 * Handle validation errors
 */
const handleValidationError = (error) => {
  const errors = error.array().map((err) => ({
    field: err.param || err.path,
    message: err.msg,
    value: err.value,
  }));

  return {
    message: "Validation failed",
    statusCode: 400,
    errors,
  };
};

/**
 * Handle Multer file upload errors
 */
const handleMulterError = (error) => {
  let message = "File upload failed";
  let statusCode = 400;

  if (error.code === "LIMIT_FILE_SIZE") {
    message = "File size too large";
    statusCode = 413;
  } else if (error.code === "LIMIT_FILE_COUNT") {
    message = "Too many files uploaded";
    statusCode = 400;
  } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
    message = "Unexpected file field";
    statusCode = 400;
  }

  return new AppError(message, statusCode);
};

/**
 * Handle rate limiting errors
 */
const handleRateLimitError = (error) => {
  return new AppError("Too many requests, please try again later", 429);
};

/**
 * Send error response in development mode
 */
const sendErrorDev = (err, req, res) => {
  // Log error details
  console.error("Error occurred:", {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  const errorResponse = {
    status: err.status || "error",
    error: err,
    message: err.message,
    stack: err.stack,
    details: err.details || null,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  res.status(err.statusCode || 500).json(errorResponse);
};

/**
 * Send error response in production mode
 */
const sendErrorProd = (err, req, res) => {
  // Log error for monitoring
  console.error("Production error:", {
    message: err.message,
    statusCode: err.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || "anonymous",
  });

  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const errorResponse = {
      status: err.status || "error",
      message: err.message,
      timestamp: new Date().toISOString(),
      ...(err.details && { details: err.details }),
    };

    res.status(err.statusCode || 500).json(errorResponse);
  } else {
    // Programming or other unknown error: don't leak error details
    console.error("Unknown error:", err);

    const errorResponse = {
      status: "error",
      message: "Something went wrong. Please try again later.",
      timestamp: new Date().toISOString(),
      error_id: generateErrorId(),
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Generate unique error ID for tracking
 */
const generateErrorId = () => {
  return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Main error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Handle specific error types
  if (err.name && err.name.startsWith("Sequelize")) {
    error = handleDatabaseError(err);
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    error = handleJWTError(err);
  }

  if (err.name === "MulterError") {
    error = handleMulterError(err);
  }

  if (err.type === "rate_limit_exceeded") {
    error = handleRateLimitError(err);
  }

  // Handle async errors
  if (err.name === "CastError") {
    const message = "Invalid resource ID format";
    error = new AppError(message, 400);
  }

  // Set default values
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  // Send appropriate error response
  if (process.env.NODE_ENV === "development") {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

/**
 * Catch async errors wrapper
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle 404 errors for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Cannot ${req.method} ${req.originalUrl} on this server`,
    404,
  );
  next(error);
};

/**
 * Handle unhandled promise rejections
 */
const handleUnhandledRejection = () => {
  process.on("unhandledRejection", (err, promise) => {
    console.error("Unhandled Promise Rejection:", {
      error: err.message,
      stack: err.stack,
      promise: promise,
    });

    // Close server & exit process
    process.exit(1);
  });
};

/**
 * Handle uncaught exceptions
 */
const handleUncaughtException = () => {
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", {
      error: err.message,
      stack: err.stack,
    });

    // Close server & exit process
    process.exit(1);
  });
};

/**
 * API response helper for consistent success responses
 */
const sendResponse = (res, statusCode, data, message = "Success") => {
  const response = {
    status: "success",
    message,
    timestamp: new Date().toISOString(),
    data,
  };

  res.status(statusCode).json(response);
};

/**
 * Pagination helper
 */
const getPaginationInfo = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    current_page: page,
    total_pages: totalPages,
    total_items: total,
    items_per_page: limit,
    has_next: hasNext,
    has_prev: hasPrev,
    next_page: hasNext ? page + 1 : null,
    prev_page: hasPrev ? page - 1 : null,
  };
};

module.exports = {
  AppError,
  errorHandler,
  catchAsync,
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  sendResponse,
  getPaginationInfo,
  handleValidationError,
  generateErrorId,
};
