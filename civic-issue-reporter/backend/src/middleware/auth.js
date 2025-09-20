const jwt = require('jsonwebtoken');
const { User, Department } = require('../models');

/**
 * Authentication and Authorization Middleware
 * Handles JWT token validation, user authentication, and role-based access control
 */

/**
 * Extract JWT token from request headers
 * @param {Object} req - Express request object
 * @returns {string|null} - JWT token or null if not found
 */
const extractToken = (req) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // Also check for token in cookies (for web dashboard)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // Check for token in query params (for websocket connections)
  if (req.query && req.query.token) {
    return req.query.token;
  }

  return null;
};

/**
 * Verify JWT token and decode payload
 * @param {string} token - JWT token
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Middleware to require authentication
 * Validates JWT token and attaches user to request object
 */
const requireAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Find user in database
    const user = await User.scope('public').findByPk(decoded.id, {
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'code', 'is_active']
      }]
    });

    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated'
      });
    }

    // Check if user is blocked
    if (user.is_blocked) {
      return res.status(401).json({
        error: 'Account blocked',
        message: user.blocked_reason || 'Your account has been blocked'
      });
    }

    // Check token version for logout functionality
    if (decoded.version !== undefined && decoded.version < user.token_version) {
      return res.status(401).json({
        error: 'Token invalidated',
        message: 'Please login again'
      });
    }

    // Update last login info
    user.last_login_at = new Date();
    user.last_login_ip = req.ip;
    user.login_attempts = 0; // Reset failed attempts on successful auth
    await user.save({ hooks: false });

    // Attach user to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    if (error.message.includes('expired')) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired, please login again'
      });
    }

    if (error.message.includes('invalid') || error.message.includes('malformed')) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication failed'
      });
    }

    return res.status(500).json({
      error: 'Authentication error',
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if valid token is provided, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return next(); // No token provided, continue without user
    }

    // Verify token
    const decoded = verifyToken(token);

    // Find user in database
    const user = await User.scope('public').findByPk(decoded.id, {
      include: [{
        model: Department,
        as: 'department',
        attributes: ['id', 'name', 'code', 'is_active']
      }]
    });

    if (user && user.is_active && !user.is_blocked) {
      // Check token version
      if (decoded.version === undefined || decoded.version >= user.token_version) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // If there's an error with optional auth, just continue without user
    next();
  }
};

/**
 * Middleware to require specific roles
 * @param {Array<string>} allowedRoles - Array of allowed roles
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    if (!Array.isArray(allowedRoles)) {
      allowedRoles = [allowedRoles];
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `This resource requires one of the following roles: ${allowedRoles.join(', ')}`,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware to require specific permissions
 * @param {string} permission - Required permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        error: 'Access denied',
        message: `You don't have permission to ${permission}`,
        requiredPermission: permission
      });
    }

    next();
  };
};

/**
 * Middleware to check if user owns resource or has admin privileges
 * @param {string} resourceUserIdField - Field name containing the user ID (e.g., 'reported_by_id')
 */
const requireOwnership = (resourceUserIdField = 'reported_by_id') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    // Admin and super_admin can access any resource
    if (['admin', 'super_admin'].includes(req.user.role)) {
      return next();
    }

    try {
      // Check if resource exists and user owns it
      const resourceId = req.params.id;
      if (!resourceId) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Resource ID is required'
        });
      }

      // This would need to be adapted based on the specific resource model
      // For now, we'll check if the resource user ID matches the current user
      if (req.resource && req.resource[resourceUserIdField]) {
        if (req.resource[resourceUserIdField] === req.user.id) {
          return next();
        }
      }

      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        error: 'Authorization error',
        message: 'Failed to verify resource ownership'
      });
    }
  };
};

/**
 * Middleware to check department access
 * Ensures user can only access resources from their department (unless admin)
 */
const requireDepartmentAccess = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }

  // Admin and super_admin can access any department
  if (['admin', 'super_admin'].includes(req.user.role)) {
    return next();
  }

  // Citizens don't have department restrictions for most operations
  if (req.user.role === 'citizen') {
    return next();
  }

  // Department staff can only access resources from their department
  if (!req.user.department_id) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You must be assigned to a department to access this resource'
    });
  }

  // Check if the resource belongs to the user's department
  const departmentId = req.params.departmentId || req.body.assigned_department_id;

  if (departmentId && departmentId !== req.user.department_id) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only access resources from your department'
    });
  }

  next();
};

/**
 * Middleware to check if user's account is verified
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please login to access this resource'
    });
  }

  if (!req.user.is_verified) {
    return res.status(403).json({
      error: 'Account verification required',
      message: 'Please verify your account to access this resource'
    });
  }

  next();
};

/**
 * Middleware to rate limit based on user role
 */
const roleBasedRateLimit = () => {
  return (req, res, next) => {
    if (!req.user) {
      return next(); // Will be handled by general rate limiting
    }

    // Different rate limits based on user role
    const rateLimits = {
      'citizen': parseInt(process.env.CITIZEN_RATE_LIMIT) || 50,
      'department_staff': parseInt(process.env.DEPARTMENT_RATE_LIMIT) || 100,
      'department_head': parseInt(process.env.DEPARTMENT_RATE_LIMIT) || 100,
      'admin': parseInt(process.env.ADMIN_RATE_LIMIT) || 200,
      'super_admin': parseInt(process.env.ADMIN_RATE_LIMIT) || 200
    };

    const userLimit = rateLimits[req.user.role] || 50;

    // Set custom rate limit for this user
    req.rateLimit = {
      limit: userLimit,
      current: req.rateLimit?.current || 0,
      remaining: Math.max(0, userLimit - (req.rateLimit?.current || 0))
    };

    next();
  };
};

/**
 * Generate JWT token for user
 * @param {Object} user - User object
 * @param {Object} options - Token options
 * @returns {string} - JWT token
 */
const generateToken = (user, options = {}) => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    role: user.role,
    department_id: user.department || user.department_id,
    version: user.tokenVersion || user.token_version || 0
  };

  const tokenOptions = {
    expiresIn: options.expiresIn || process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'civic-issue-reporter',
    audience: 'civic-issue-reporter-client'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, tokenOptions);
};

/**
 * Generate refresh token for user
 * @param {Object} user - User object
 * @returns {string} - Refresh JWT token
 */
const generateRefreshToken = (user) => {
  const payload = {
    id: user._id || user.id,
    version: user.tokenVersion || user.token_version || 0,
    type: 'refresh'
  };

  const tokenOptions = {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'civic-issue-reporter',
    audience: 'civic-issue-reporter-refresh'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, tokenOptions);
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
  requirePermission,
  requireOwnership,
  requireDepartmentAccess,
  requireVerified,
  roleBasedRateLimit,
  generateToken,
  generateRefreshToken,
  extractToken,
  verifyToken
};
