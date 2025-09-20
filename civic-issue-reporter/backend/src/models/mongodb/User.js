const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["citizen", "admin", "department_head", "staff", "super_admin"],
      default: "citizen",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },
    employeeId: {
      type: String,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: {
        type: String,
        default: "India",
      },
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedReason: String,
    blockedAt: Date,
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    notificationPreferences: {
      email: {
        type: Boolean,
        default: true,
      },
      push: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      issueUpdates: {
        type: Boolean,
        default: true,
      },
      departmentAnnouncements: {
        type: Boolean,
        default: false,
      },
      marketingEmails: {
        type: Boolean,
        default: false,
      },
    },
    languagePreference: {
      type: String,
      default: "en",
    },
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    passwordChangedAt: Date,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    emailVerificationToken: String,
    emailOTP: String,
    emailOTPExpires: Date,
    phoneVerificationCode: String,
    phoneVerificationExpires: Date,
    lastLoginAt: Date,
    lastLoginIP: String,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: Date,
    totalIssuesReported: {
      type: Number,
      default: 0,
    },
    totalIssuesResolved: {
      type: Number,
      default: 0,
    },
    reputationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    socialLogin: {
      google: {
        id: String,
        email: String,
      },
      facebook: {
        id: String,
        email: String,
      },
    },
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false,
      },
      secret: String,
      backupCodes: [String],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ phone: 1 }, { unique: true });
userSchema.index({ employeeId: 1 }, { unique: true, sparse: true });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ "address.city": 1, "address.state": 1 });
userSchema.index({ location: "2dsphere" });
userSchema.index({ createdAt: 1 });
userSchema.index({ lastLoginAt: -1 });

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for issues
userSchema.virtual("issues", {
  ref: "Issue",
  localField: "_id",
  foreignField: "reportedBy",
});

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to update passwordChangedAt
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password changed after JWT issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to increment token version (for logout all)
userSchema.methods.incrementTokenVersion = function () {
  this.tokenVersion += 1;
  return this.save({ validateBeforeSave: false });
};

// Instance method to check if account is locked
userSchema.methods.isLocked = function () {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
};

// Instance method to increment login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < Date.now()) {
    return this.updateOne({
      $unset: {
        lockedUntil: 1,
      },
      $set: {
        loginAttempts: 1,
      },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours

  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockedUntil: Date.now() + lockTime };
  }

  return this.updateOne(updates);
};

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: {
      loginAttempts: 1,
      lockedUntil: 1,
    },
  });
};

// Static method to find user by credentials
userSchema.statics.findByCredentials = async function (email, password) {
  const user = await this.findOne({
    email: email.toLowerCase(),
    isActive: true,
  }).select("+password");

  if (!user) {
    throw new Error("Invalid credentials");
  }

  if (user.isLocked()) {
    throw new Error("Account is temporarily locked. Please try again later.");
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    await user.incLoginAttempts();
    throw new Error("Invalid credentials");
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  return user;
};

// Static method to get user statistics
userSchema.statics.getStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: ["$isActive", 1, 0] } },
        verifiedUsers: { $sum: { $cond: ["$isVerified", 1, 0] } },
        citizenUsers: {
          $sum: { $cond: [{ $eq: ["$role", "citizen"] }, 1, 0] },
        },
        adminUsers: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
        staffUsers: { $sum: { $cond: [{ $eq: ["$role", "staff"] }, 1, 0] } },
      },
    },
  ]);

  return (
    stats[0] || {
      totalUsers: 0,
      activeUsers: 0,
      verifiedUsers: 0,
      citizenUsers: 0,
      adminUsers: 0,
      staffUsers: 0,
    }
  );
};

module.exports = mongoose.model("User", userSchema);
