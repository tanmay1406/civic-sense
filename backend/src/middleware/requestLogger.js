/**
 * Request logging middleware for API monitoring and analytics
 * Logs all incoming requests with detailed information
 */

/**
 * Get client IP address from request
 * Handles various proxy configurations
 */
const getClientIP = (req) => {
  return (
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    "unknown"
  );
};

/**
 * Get request size in bytes
 */
const getRequestSize = (req) => {
  const contentLength = req.headers["content-length"];
  return contentLength ? parseInt(contentLength, 10) : 0;
};

/**
 * Get response size in bytes
 */
const getResponseSize = (res) => {
  const contentLength = res.get("Content-Length");
  return contentLength ? parseInt(contentLength, 10) : 0;
};

/**
 * Sanitize sensitive headers
 */
const sanitizeHeaders = (headers) => {
  const sensitiveHeaders = [
    "authorization",
    "cookie",
    "x-api-key",
    "x-auth-token",
  ];
  const sanitized = { ...headers };

  sensitiveHeaders.forEach((header) => {
    if (sanitized[header]) {
      sanitized[header] = "[REDACTED]";
    }
  });

  return sanitized;
};

/**
 * Extract relevant user information for logging
 */
const getUserInfo = (req) => {
  if (!req.user) return null;

  return {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    department_id: req.user.department_id || null,
  };
};

/**
 * Determine log level based on status code
 */
const getLogLevel = (statusCode) => {
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  if (statusCode >= 300) return "info";
  return "info";
};

/**
 * Format log message for different environments
 */
const formatLogMessage = (logData) => {
  const { method, url, statusCode, responseTime, userAgent, ip, user, error } =
    logData;

  if (process.env.NODE_ENV === "development") {
    return `${method} ${url} ${statusCode} ${responseTime}ms - ${ip} - ${userAgent}`;
  }

  // Production format - more structured
  return JSON.stringify({
    request: {
      method,
      url,
      ip,
      userAgent: userAgent?.substring(0, 200), // Truncate long user agents
    },
    response: {
      statusCode,
      responseTime,
    },
    user: user || null,
    error: error || null,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Check if request should be logged
 */
const shouldLogRequest = (req) => {
  const skipPaths = ["/health", "/favicon.ico", "/robots.txt"];
  const skipExtensions = [
    ".css",
    ".js",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".ico",
    ".svg",
  ];

  // Skip health checks and static files
  if (skipPaths.includes(req.path)) return false;

  // Skip requests with certain extensions
  if (skipExtensions.some((ext) => req.path.endsWith(ext))) return false;

  // Skip if logging is disabled
  if (process.env.ENABLE_REQUEST_LOGGING === "false") return false;

  return true;
};

/**
 * Main request logging middleware
 */
const requestLogger = (req, res, next) => {
  // Skip logging for certain requests
  if (!shouldLogRequest(req)) {
    return next();
  }

  const startTime = Date.now();
  const startHrTime = process.hrtime();

  // Extract request information
  const requestInfo = {
    id:
      req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
    query: req.query,
    ip: getClientIP(req),
    userAgent: req.get("User-Agent") || "unknown",
    referer: req.get("Referer") || null,
    requestSize: getRequestSize(req),
    headers:
      process.env.LOG_HEADERS === "true"
        ? sanitizeHeaders(req.headers)
        : undefined,
    timestamp: new Date().toISOString(),
  };

  // Add request ID to request object for downstream use
  req.requestId = requestInfo.id;

  // Override res.end to capture response information
  const originalEnd = res.end;
  let responseLogged = false;

  res.end = function (chunk, encoding) {
    // Prevent double logging
    if (responseLogged) {
      return originalEnd.call(this, chunk, encoding);
    }
    responseLogged = true;

    // Calculate response time
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    const hrResponseTime = process.hrtime(startHrTime);
    const preciseResponseTime =
      hrResponseTime[0] * 1000 + hrResponseTime[1] * 1e-6;

    // Capture response information
    const responseInfo = {
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      responseTime: Math.round(preciseResponseTime),
      responseSize: getResponseSize(res),
      contentType: res.get("Content-Type") || null,
    };

    // Capture user information if available
    const userInfo = getUserInfo(req);

    // Prepare log data
    const logData = {
      ...requestInfo,
      ...responseInfo,
      user: userInfo,
      error: res.locals.error || null,
    };

    // Determine log level
    const logLevel = getLogLevel(res.statusCode);

    // Format log message
    const logMessage = formatLogMessage(logData);

    // Log the request
    console.log(`[${logLevel.toUpperCase()}] ${logMessage}`, {
      requestId: requestInfo.id,
      method: requestInfo.method,
      url: requestInfo.url,
      statusCode: responseInfo.statusCode,
      responseTime: responseInfo.responseTime,
      ip: requestInfo.ip,
      userAgent: requestInfo.userAgent,
      user: userInfo,
      ...(res.locals.error && { error: res.locals.error }),
    });

    // Log slow requests separately
    if (
      responseInfo.responseTime >
      (parseInt(process.env.SLOW_REQUEST_THRESHOLD) || 1000)
    ) {
      console.warn("[WARN] Slow request detected", {
        requestId: requestInfo.id,
        method: requestInfo.method,
        url: requestInfo.url,
        responseTime: responseInfo.responseTime,
        user: userInfo,
      });
    }

    // Log large responses
    if (
      responseInfo.responseSize >
      (parseInt(process.env.LARGE_RESPONSE_THRESHOLD) || 1000000)
    ) {
      // 1MB
      console.warn("[WARN] Large response detected", {
        requestId: requestInfo.id,
        method: requestInfo.method,
        url: requestInfo.url,
        responseSize: responseInfo.responseSize,
        user: userInfo,
      });
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  // Handle errors
  const originalNextFunction = next;
  next = function (err) {
    if (err) {
      res.locals.error = {
        message: err.message,
        name: err.name,
        statusCode: err.statusCode || 500,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      };
    }
    originalNextFunction(err);
  };

  next();
};

/**
 * Security event logger for suspicious activities
 */
const logSecurityEvent = (req, eventType, details = {}) => {
  console.warn("[WARN] Security event detected", {
    eventType,
    requestId: req.requestId,
    ip: getClientIP(req),
    userAgent: req.get("User-Agent"),
    url: req.originalUrl,
    method: req.method,
    user: getUserInfo(req),
    details,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Middleware to log authentication attempts
 */
const logAuthAttempt = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (data) {
    // Log failed authentication attempts
    if (res.statusCode === 401 || res.statusCode === 403) {
      logSecurityEvent(req, "auth_failure", {
        statusCode: res.statusCode,
        email: req.body?.email,
        reason: data?.message || data?.error,
      });
    }

    // Log successful logins
    if (req.path.includes("/login") && res.statusCode === 200) {
      console.log("[INFO] Successful login", {
        requestId: req.requestId,
        ip: getClientIP(req),
        userAgent: req.get("User-Agent"),
        email: req.body?.email,
        timestamp: new Date().toISOString(),
      });
    }

    originalJson.call(this, data);
  };

  next();
};

/**
 * Generate request correlation ID
 */
const generateRequestId = (req, res, next) => {
  req.requestId =
    req.headers["x-request-id"] ||
    `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  res.setHeader("X-Request-ID", req.requestId);
  next();
};

/**
 * Log API usage statistics
 */
const logAPIUsage = (endpoint, user, action = "access") => {
  console.log("[INFO] API usage", {
    endpoint,
    user: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      : null,
    action,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  requestLogger,
  logSecurityEvent,
  logAuthAttempt,
  generateRequestId,
  logAPIUsage,
  getClientIP,
  getUserInfo,
};
