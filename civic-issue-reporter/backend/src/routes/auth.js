const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { User, Department } = require('../models');
const authMiddleware = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const router = express.Router();

// Rate limiting for auth endpoints - DISABLED FOR TESTING
const authRateLimit = (req, res, next) => next(); // Disabled

const registerRateLimit = (req, res, next) => next(); // Disabled

// Validation rules
const registerValidation = [
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters'),

  body('last_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2-50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters'),

  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),

  body('phone')
    .isMobilePhone('en-IN')
    .withMessage('Please provide a valid Indian mobile number'),

  body('role')
    .optional()
    .isIn(['citizen', 'department_staff', 'department_head'])
    .withMessage('Invalid role specified'),

  body('department_id')
    .optional()
    .isUUID()
    .withMessage('Invalid department ID'),

  body('employee_id')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Employee ID must be between 3-50 characters')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Email transporter setup
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

// Helper function to send emails
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      html
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

// Helper function to generate verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerRateLimit, registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      first_name,
      last_name,
      email,
      password,
      phone,
      role = 'citizen',
      department_id,
      employee_id
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        { phone }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        message: existingUser.email === email
          ? 'An account with this email already exists'
          : 'An account with this phone number already exists'
      });
    }

    // Validate department for staff roles
    if (role !== 'citizen' && !department_id) {
      return res.status(400).json({
        error: 'Department required',
        message: 'Department ID is required for staff roles'
      });
    }

    if (department_id) {
      const department = await Department.findById(department_id);
      if (!department || !department.isActive) {
        return res.status(400).json({
          error: 'Invalid department',
          message: 'Department not found or inactive'
        });
      }
    }

    // Validate employee ID for staff roles
    if (role !== 'citizen') {
      if (!employee_id) {
        return res.status(400).json({
          error: 'Employee ID required',
          message: 'Employee ID is required for staff roles'
        });
      }

      // Check if employee ID is already in use
      const existingEmployee = await User.findOne({
        employeeId: employee_id
      });

      if (existingEmployee) {
        return res.status(409).json({
          error: 'Employee ID exists',
          message: 'This employee ID is already in use'
        });
      }
    }

    // Generate verification tokens and OTP
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const phoneVerificationCode = generateVerificationCode();
    const emailOTP = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const user = await User.create({
      firstName: first_name,
      lastName: last_name,
      email,
      password, // Will be hashed by the model hook
      phone,
      role,
      department: department_id || null,
      employeeId: employee_id || null,
      emailVerificationToken: emailVerificationToken,
      phoneVerificationCode: phoneVerificationCode,
      phoneVerificationExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      emailOTP: emailOTP,
      emailOTPExpires: otpExpiry,
      isActive: true,
      isVerified: false
    });

    // Send verification email (optional - don't fail registration if email fails)
    let emailSent = false;
    try {
      emailSent = await sendEmail(
        email,
        'Verify Your Email - Civic Issue Reporter',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #007bff; text-align: center; margin-bottom: 30px;">Welcome to Civic Issue Reporter!</h2>
            <p style="font-size: 16px; color: #333;">Hi ${first_name},</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">Thank you for registering with Civic Issue Reporter. To complete your registration, please verify your email address using the OTP below:</p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h3 style="color: #007bff; margin-bottom: 10px;">Your Email Verification OTP</h3>
              <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; background-color: white; padding: 15px; border-radius: 5px; display: inline-block; border: 2px solid #007bff;">
                ${emailOTP}
              </div>
              <p style="color: #666; margin-top: 10px; font-size: 14px;">This OTP will expire in 10 minutes</p>
            </div>

            <p style="font-size: 14px; color: #666; line-height: 1.6;">Enter this OTP in the verification form to activate your account. If you didn't create this account, please ignore this email.</p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 14px; color: #666; text-align: center;">
              Best regards,<br>
              <strong>Civic Issue Reporter Team</strong>
            </p>
          </div>
        </div>
        `
      );
    } catch (emailError) {
      console.warn('Warning: Verification email could not be sent:', emailError.message);
      emailSent = false;
    }

    if (!emailSent) {
      console.log('Warning: Verification email could not be sent');
    }

    // Generate tokens
    const token = authMiddleware.generateToken(user);
    const refreshToken = authMiddleware.generateRefreshToken(user);

    // Return user data (without sensitive information)
    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
      isActive: user.isActive,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt
    };

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: userData,
        token,
        refreshToken
      },
      verification: {
        email_required: !user.emailVerified,
        phone_required: !user.phoneVerified,
        otp_sent: emailSent
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post('/login', authRateLimit, loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).populate('department', 'name code').select('+password');

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const lockTimeRemaining = Math.ceil((user.lockedUntil - new Date()) / (1000 * 60));
      return res.status(423).json({
        error: 'Account locked',
        message: `Account is temporarily locked. Try again in ${lockTimeRemaining} minutes.`
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        await user.save();

        return res.status(423).json({
          error: 'Account locked',
          message: 'Too many failed login attempts. Account locked for 30 minutes.'
        });
      }

      await user.save();

      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
        attempts_remaining: 5 - user.loginAttempts
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(401).json({
        error: 'Account blocked',
        message: user.blocked_reason || 'Your account has been blocked. Please contact support.'
      });
    }

    // Reset login attempts and update login info
    user.login_attempts = 0;
    user.locked_until = null;
    user.last_login_at = new Date();
    user.last_login_ip = req.ip;
    await user.save();

    // Generate tokens
    const token = authMiddleware.generateToken(user);
    const refreshToken = authMiddleware.generateRefreshToken(user);

    // Return user data (without sensitive information)
    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
      isActive: user.isActive,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt
    };

    // Update last login info
    user.lastLoginAt = new Date();
    user.lastLoginIP = req.ip;
    user.loginAttempts = 0; // Reset login attempts on successful login
    user.lockedUntil = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        message: 'Please provide a refresh token'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'The refresh token is invalid or expired'
      });
    }

    // Find user
    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active || decoded.version < user.token_version) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'User not found or token invalidated'
      });
    }

    // Generate new tokens
    const newToken = authMiddleware.generateToken(user);
    const newRefreshToken = authMiddleware.generateRefreshToken(user);

    res.json({
      message: 'Token refreshed successfully',
      token: newToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'An error occurred during token refresh'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate tokens
 * @access  Private
 */
router.post('/logout', authMiddleware.requireAuth, async (req, res) => {
  try {
    // Increment token version to invalidate all existing tokens
    await req.user.revokeTokens();

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      message: 'An error occurred during logout'
    });
  }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password', forgotPasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    const successResponse = {
      message: 'If an account with this email exists, a password reset link has been sent.'
    };

    if (!user) {
      return res.json(successResponse);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.reset_password_token = resetToken;
    user.reset_password_expires = resetExpires;
    await user.save();

    // Send reset email
    const emailSent = await sendEmail(
      email,
      'Password Reset - Civic Issue Reporter',
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>Hi ${user.first_name},</p>
        <p>You requested a password reset for your Civic Issue Reporter account.</p>
        <p>Click the button below to reset your password:</p>
        <p>
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}"
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all;">${process.env.FRONTEND_URL}/reset-password?token=${resetToken}</p>
        <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
        <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
        <p>Best regards,<br>Civic Issue Reporter Team</p>
      </div>
      `
    );

    res.json(successResponse);

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Request failed',
      message: 'An error occurred while processing your request'
    });
  }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password', resetPasswordValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token, password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Password reset token is invalid or has expired'
      });
    }

    // Update password
    user.password = password; // Will be hashed by model hook
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.tokenVersion += 1; // Invalidate existing tokens
    await user.save();

    res.json({
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      error: 'Reset failed',
      message: 'An error occurred while resetting your password'
    });
  }
});

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address using token
 * @access  Public
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token required',
        message: 'Verification token is required'
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token
    });

    if (!user) {
      return res.status(400).json({
        error: 'Invalid token',
        message: 'Email verification token is invalid'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Already verified',
        message: 'Email address is already verified'
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerificationToken = null;
    user.isVerified = user.emailVerified && user.phoneVerified;
    await user.save();

    res.json({
      message: 'Email verified successfully',
      verified: user.isVerified
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: 'An error occurred during email verification'
    });
  }
});

/**
 * @route   POST /api/auth/verify-email-otp
 * @desc    Verify email address using OTP
 * @access  Public
 */
router.post('/verify-email-otp', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase(),
      emailOTP: otp,
      emailOTPExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired OTP',
        message: 'The OTP you entered is invalid or has expired. Please request a new one.'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Already verified',
        message: 'This email address is already verified.'
      });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailOTP = null;
    user.emailOTPExpires = null;
    user.isVerified = user.emailVerified && user.phoneVerified;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        verified: user.isVerified,
        email_verified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: 'An error occurred during email verification'
    });
  }
});

/**
 * @route   POST /api/auth/resend-email-otp
 * @desc    Resend email verification OTP
 * @access  Public
 */
router.post('/resend-email-otp', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No account found with this email address.'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: 'Already verified',
        message: 'This email address is already verified.'
      });
    }

    // Generate new OTP
    const newOTP = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailOTP = newOTP;
    user.emailOTPExpires = otpExpiry;
    await user.save();

    // Send new OTP email
    let emailSent = false;
    try {
      emailSent = await sendEmail(
        email,
        'New Email Verification OTP - Civic Issue Reporter',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #007bff; text-align: center; margin-bottom: 30px;">New Verification OTP</h2>
            <p style="font-size: 16px; color: #333;">Hi ${user.firstName},</p>
            <p style="font-size: 16px; color: #333; line-height: 1.6;">You requested a new email verification OTP. Here's your new code:</p>

            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <h3 style="color: #007bff; margin-bottom: 10px;">Your New Verification OTP</h3>
              <div style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; background-color: white; padding: 15px; border-radius: 5px; display: inline-block; border: 2px solid #007bff;">
                ${newOTP}
              </div>
              <p style="color: #666; margin-top: 10px; font-size: 14px;">This OTP will expire in 10 minutes</p>
            </div>

            <p style="font-size: 14px; color: #666; line-height: 1.6;">Enter this OTP in the verification form to activate your account.</p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="font-size: 14px; color: #666; text-align: center;">
              Best regards,<br>
              <strong>Civic Issue Reporter Team</strong>
            </p>
          </div>
        </div>
        `
      );
    } catch (emailError) {
      console.warn('Warning: Could not send new OTP email:', emailError.message);
    }

    res.json({
      success: true,
      message: 'New OTP sent successfully!',
      data: {
        email_sent: emailSent,
        expires_in: '10 minutes'
      }
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Resend failed',
      message: 'An error occurred while sending new OTP'
    });
  }
});

/**
 * @route   POST /api/auth/verify-phone
 * @desc    Verify phone number using code
 * @access  Private
 */
router.post('/verify-phone', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        error: 'Code required',
        message: 'Verification code is required'
      });
    }

    const user = req.user;

    if (user.phone_verified) {
      return res.status(400).json({
        error: 'Already verified',
        message: 'Phone number is already verified'
      });
    }

    // Check if code is valid and not expired
    if (user.phone_verification_code !== code) {
      return res.status(400).json({
        error: 'Invalid code',
        message: 'Verification code is incorrect'
      });
    }

    if (user.phone_verification_expires && user.phone_verification_expires < new Date()) {
      return res.status(400).json({
        error: 'Code expired',
        message: 'Verification code has expired. Please request a new one.'
      });
    }

    // Mark phone as verified
    user.phone_verified = true;
    user.phone_verification_code = null;
    user.phone_verification_expires = null;
    user.is_verified = user.email_verified && user.phone_verified;
    await user.save();

    res.json({
      message: 'Phone verified successfully',
      verified: user.is_verified
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: 'An error occurred during phone verification'
    });
  }
});

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Resend verification email or phone code
 * @access  Private
 */
router.post('/resend-verification', authMiddleware.requireAuth, async (req, res) => {
  try {
    const { type } = req.body; // 'email' or 'phone'
    const user = req.user;

    if (type === 'email') {
      if (user.email_verified) {
        return res.status(400).json({
          error: 'Already verified',
          message: 'Email address is already verified'
        });
      }

      // Generate new verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      user.email_verification_token = emailVerificationToken;
      await user.save();

      // Send verification email
      const emailSent = await sendEmail(
        user.email,
        'Verify Your Email - Civic Issue Reporter',
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Hi ${user.first_name},</p>
          <p>Please verify your email address by clicking the link below:</p>
          <p>
            <a href="${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}"
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email Address
            </a>
          </p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>Civic Issue Reporter Team</p>
        </div>
        `
      );

      res.json({
        message: 'Verification email sent',
        email_sent: emailSent
      });

    } else if (type === 'phone') {
      if (user.phone_verified) {
        return res.status(400).json({
          error: 'Already verified',
          message: 'Phone number is already verified'
        });
      }

      // Generate new verification code
      const phoneVerificationCode = generateVerificationCode();
      user.phone_verification_code = phoneVerificationCode;
      user.phone_verification_expires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      // In a real implementation, you would send SMS here
      // For now, we'll just return the code (remove this in production)
      res.json({
        message: 'Verification code sent to your phone',
        // Remove this line in production:
        code: phoneVerificationCode
      });

    } else {
      return res.status(400).json({
        error: 'Invalid type',
        message: 'Type must be either "email" or "phone"'
      });
    }

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      error: 'Resend failed',
      message: 'An error occurred while resending verification'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authMiddleware.requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('department', 'name code phone email');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found'
      });
    }

    // Return user data (without sensitive information)
    const userData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      department: user.department,
      employeeId: user.employeeId,
      isActive: user.isActive,
      isVerified: user.isVerified,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt
    };

    res.json({
      success: true,
      data: {
        user: userData
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Profile fetch failed',
      message: 'An error occurred while fetching your profile'
    });
  }
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put('/change-password', authMiddleware.requireAuth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Verify current password
    const isCurrentPasswordValid = await user.checkPassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword; // Will be hashed by model hook
    user.token_version += 1; // Invalidate existing tokens
    await user.save();

    // Generate new tokens
    const token = authMiddleware.generateToken(user);
    const refreshToken = authMiddleware.generateRefreshToken(user);

    res.json({
      message: 'Password changed successfully',
      token,
      refreshToken
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      error: 'Password change failed',
      message: 'An error occurred while changing your password'
    });
  }
});

module.exports = router;
