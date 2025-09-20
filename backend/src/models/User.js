const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');

class User extends Model {
  // Instance method to check password
  async checkPassword(password) {
    return bcrypt.compare(password, this.password);
  }

  // Instance method to generate JWT token
  generateAuthToken() {
    return jwt.sign(
      {
        id: this.id,
        email: this.email,
        role: this.role,
        department_id: this.department_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
  }

  // Instance method to generate refresh token
  generateRefreshToken() {
    return jwt.sign(
      { id: this.id, version: this.token_version },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  // Instance method to get user profile (without sensitive data)
  getProfile() {
    const profile = this.toJSON();
    delete profile.password;
    delete profile.token_version;
    delete profile.reset_password_token;
    delete profile.reset_password_expires;
    return profile;
  }

  // Static method to find user by email
  static async findByEmail(email) {
    return this.findOne({
      where: { email: email.toLowerCase() },
      include: ['department']
    });
  }

  // Static method to find user by phone
  static async findByPhone(phone) {
    return this.findOne({
      where: { phone },
      include: ['department']
    });
  }

  // Instance method to increment token version (for logout)
  async revokeTokens() {
    this.token_version += 1;
    await this.save();
  }

  // Check if user has permission
  hasPermission(permission) {
    const rolePermissions = {
      'super_admin': ['*'],
      'admin': [
        'view_all_issues',
        'assign_issues',
        'update_issue_status',
        'view_analytics',
        'manage_departments',
        'manage_users'
      ],
      'department_head': [
        'view_department_issues',
        'assign_department_issues',
        'update_issue_status',
        'view_department_analytics'
      ],
      'department_staff': [
        'view_assigned_issues',
        'update_issue_status',
        'add_issue_updates'
      ],
      'citizen': [
        'create_issue',
        'view_own_issues',
        'update_own_issues'
      ]
    };

    const permissions = rolePermissions[this.role] || [];
    return permissions.includes('*') || permissions.includes(permission);
  }
}

// Initialize the User model
User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },

  // Basic Information
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'First name is required' },
      len: { args: [2, 50], msg: 'First name must be between 2-50 characters' },
      isAlpha: { msg: 'First name can only contain letters' }
    }
  },

  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Last name is required' },
      len: { args: [2, 50], msg: 'Last name must be between 2-50 characters' },
      isAlpha: { msg: 'Last name can only contain letters' }
    }
  },

  full_name: {
    type: DataTypes.VIRTUAL,
    get() {
      return `${this.first_name} ${this.last_name}`;
    }
  },

  // Authentication
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'Email address already exists'
    },
    validate: {
      isEmail: { msg: 'Please provide a valid email address' },
      notEmpty: { msg: 'Email is required' }
    },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    }
  },

  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Password is required' },
      len: { args: [8, 255], msg: 'Password must be at least 8 characters long' }
    }
  },

  // Contact Information
  phone: {
    type: DataTypes.STRING(15),
    allowNull: false,
    unique: {
      name: 'unique_phone',
      msg: 'Phone number already exists'
    },
    validate: {
      notEmpty: { msg: 'Phone number is required' },
      is: {
        args: /^[+]?[\d\s\-()]+$/,
        msg: 'Please provide a valid phone number'
      }
    }
  },

  phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  // Role and Department
  role: {
    type: DataTypes.ENUM('citizen', 'department_staff', 'department_head', 'admin', 'super_admin'),
    allowNull: false,
    defaultValue: 'citizen',
    validate: {
      isIn: {
        args: [['citizen', 'department_staff', 'department_head', 'admin', 'super_admin']],
        msg: 'Invalid role specified'
      }
    }
  },

  department_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'departments',
      key: 'id'
    },
    validate: {
      isUUID: { args: 4, msg: 'Invalid department ID format' }
    }
  },

  employee_id: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    validate: {
      len: { args: [3, 50], msg: 'Employee ID must be between 3-50 characters' }
    }
  },

  // Profile Information
  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: { msg: 'Avatar must be a valid URL' }
    }
  },

  date_of_birth: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: { msg: 'Please provide a valid date of birth' },
      isBefore: {
        args: new Date().toISOString(),
        msg: 'Date of birth must be in the past'
      }
    }
  },

  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true
  },

  // Address Information
  address_line_1: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: { args: [5, 255], msg: 'Address must be between 5-255 characters' }
    }
  },

  address_line_2: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: { args: [0, 255], msg: 'Address line 2 cannot exceed 255 characters' }
    }
  },

  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: { args: [2, 100], msg: 'City must be between 2-100 characters' }
    }
  },

  state: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: { args: [2, 100], msg: 'State must be between 2-100 characters' }
    }
  },

  pincode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      is: {
        args: /^\d{6}$/,
        msg: 'Pincode must be 6 digits'
      }
    }
  },

  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
    defaultValue: 'India'
  },

  // Location coordinates
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: { args: -90, msg: 'Latitude must be between -90 and 90' },
      max: { args: 90, msg: 'Latitude must be between -90 and 90' }
    }
  },

  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: { args: -180, msg: 'Longitude must be between -180 and 180' },
      max: { args: 180, msg: 'Longitude must be between -180 and 180' }
    }
  },

  // Account Status
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },

  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  is_blocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  blocked_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  blocked_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Preferences and Settings
  notification_preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      email_notifications: true,
      push_notifications: true,
      sms_notifications: false,
      issue_updates: true,
      department_announcements: false,
      marketing_emails: false
    }
  },

  language_preference: {
    type: DataTypes.STRING(10),
    defaultValue: 'en',
    validate: {
      isIn: {
        args: [['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'or', 'pa']],
        msg: 'Invalid language preference'
      }
    }
  },

  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Asia/Kolkata'
  },

  // Security
  token_version: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  password_changed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  reset_password_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },

  email_verification_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },

  phone_verification_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  },

  phone_verification_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Login tracking
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  last_login_ip: {
    type: DataTypes.INET,
    allowNull: true
  },

  login_attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  locked_until: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Statistics
  total_issues_reported: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  total_issues_resolved: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  reputation_score: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    validate: {
      min: { args: 0, msg: 'Reputation score cannot be negative' },
      max: { args: 100, msg: 'Reputation score cannot exceed 100' }
    }
  }

}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  paranoid: true, // Soft deletes
  timestamps: true,
  indexes: [
    { fields: ['email'], unique: true },
    { fields: ['phone'], unique: true },
    { fields: ['role'] },
    { fields: ['department_id'] },
    { fields: ['is_active'] },
    { fields: ['is_verified'] },
    { fields: ['city', 'state'] },
    { fields: ['created_at'] },
    { fields: ['last_login_at'] },
    {
      fields: ['latitude', 'longitude'],
      name: 'user_location_idx'
    }
  ],
  hooks: {
    // Hash password before saving
    beforeSave: async (user) => {
      if (user.changed('password')) {
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        user.password = await bcrypt.hash(user.password, saltRounds);
        user.password_changed_at = new Date();
      }

      // Update full address if address components changed
      if (user.changed(['address_line_1', 'city', 'state', 'pincode'])) {
        // Could trigger geocoding here if needed
      }
    },

    // Clean up sensitive data before validation
    beforeValidate: (user) => {
      if (user.email) {
        user.email = user.email.toLowerCase().trim();
      }
      if (user.phone) {
        user.phone = user.phone.replace(/\s+/g, '').trim();
      }
    },

    // Update statistics after creation
    afterCreate: (user) => {
      // Could trigger welcome email, analytics events, etc.
    }
  },

  scopes: {
    // Exclude sensitive information
    public: {
      attributes: {
        exclude: [
          'password',
          'token_version',
          'reset_password_token',
          'reset_password_expires',
          'email_verification_token',
          'phone_verification_code',
          'phone_verification_expires'
        ]
      }
    },

    // Only active users
    active: {
      where: {
        is_active: true,
        is_blocked: false
      }
    },

    // Only verified users
    verified: {
      where: { is_verified: true }
    },

    // Department staff only
    departmentStaff: {
      where: {
        role: ['department_staff', 'department_head']
      },
      include: ['department']
    },

    // Citizens only
    citizens: {
      where: { role: 'citizen' }
    },

    // Admins only
    admins: {
      where: {
        role: ['admin', 'super_admin']
      }
    }
  }
});

module.exports = User;
