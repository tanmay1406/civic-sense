const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      trim: true,
      maxlength: [100, "Department name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: [true, "Department code is required"],
      uppercase: true,
      trim: true,
      maxlength: [10, "Department code cannot exceed 10 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    departmentHead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    contactInfo: {
      email: {
        type: String,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
          "Please enter a valid email",
        ],
      },
      phone: {
        type: String,
        trim: true,
      },
      emergencyPhone: {
        type: String,
        trim: true,
      },
      fax: String,
      website: {
        type: String,
        match: [/^https?:\/\/.+/, "Please enter a valid URL"],
      },
    },
    address: {
      line1: String,
      line2: String,
      city: {
        type: String,
        default: "Ranchi",
      },
      state: {
        type: String,
        default: "Jharkhand",
      },
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
    coverageAreas: [
      {
        name: String,
        boundaries: {
          type: {
            type: String,
            enum: ["Polygon"],
            default: "Polygon",
          },
          coordinates: [[[Number]]],
        },
        pincode: [String],
        landmarks: [String],
      },
    ],
    workingHours: {
      monday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
        closed: { type: Boolean, default: false },
      },
      tuesday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
        closed: { type: Boolean, default: false },
      },
      wednesday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
        closed: { type: Boolean, default: false },
      },
      thursday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
        closed: { type: Boolean, default: false },
      },
      friday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "17:00" },
        closed: { type: Boolean, default: false },
      },
      saturday: {
        start: { type: String, default: "09:00" },
        end: { type: String, default: "13:00" },
        closed: { type: Boolean, default: false },
      },
      sunday: {
        closed: { type: Boolean, default: true },
      },
    },
    emergencyAvailable: {
      type: Boolean,
      default: false,
    },
    emergencyHours: {
      type: String,
      default: "24/7",
    },
    handledCategories: [
      {
        category: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Category",
          required: true,
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        priority: {
          type: Number,
          default: 1,
          min: 1,
          max: 10,
        },
        averageResolutionTime: {
          type: Number,
          default: 0,
        },
      },
    ],
    capacity: {
      maxActiveIssues: {
        type: Number,
        default: 50,
      },
      currentActiveIssues: {
        type: Number,
        default: 0,
      },
      maxDailyIssues: {
        type: Number,
        default: 20,
      },
      currentDailyIssues: {
        type: Number,
        default: 0,
      },
    },
    staffing: {
      totalStaff: {
        type: Number,
        default: 0,
      },
      activeStaff: {
        type: Number,
        default: 0,
      },
      onLeaveStaff: {
        type: Number,
        default: 0,
      },
      fieldStaff: {
        type: Number,
        default: 0,
      },
    },
    performanceMetrics: {
      averageResolutionTime: {
        type: Number,
        default: 0,
      },
      resolutionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      citizenSatisfactionScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      responseTimeCompliance: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      escalationRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      reopenRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    statistics: {
      totalIssuesHandled: {
        type: Number,
        default: 0,
      },
      totalIssuesResolved: {
        type: Number,
        default: 0,
      },
      totalIssuesPending: {
        type: Number,
        default: 0,
      },
      totalIssuesEscalated: {
        type: Number,
        default: 0,
      },
      monthlyStats: [
        {
          month: Number,
          year: Number,
          issued: Number,
          resolved: Number,
          avgResolutionTime: Number,
          satisfactionScore: Number,
        },
      ],
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    budget: {
      annualBudget: {
        type: Number,
        default: 0,
      },
      budgetUtilized: {
        type: Number,
        default: 0,
      },
      budgetRemaining: {
        type: Number,
        default: 0,
      },
      lastBudgetUpdate: Date,
    },
    autoAssignment: {
      enabled: {
        type: Boolean,
        default: true,
      },
      algorithm: {
        type: String,
        enum: ["round_robin", "least_loaded", "skill_based", "location_based"],
        default: "least_loaded",
      },
      workloadBalancing: {
        type: Boolean,
        default: true,
      },
      maxAutoAssignments: {
        type: Number,
        default: 10,
      },
    },
    escalationRules: [
      {
        level: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        timeLimit: {
          value: Number,
          unit: {
            type: String,
            enum: ["minutes", "hours", "days"],
            default: "hours",
          },
        },
        escalateTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
        escalateToUser: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        conditions: [
          {
            field: String,
            operator: String,
            value: mongoose.Schema.Types.Mixed,
          },
        ],
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    notificationSettings: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      escalationNotifications: {
        type: Boolean,
        default: true,
      },
      dailyReports: {
        type: Boolean,
        default: true,
      },
      weeklyReports: {
        type: Boolean,
        default: true,
      },
      monthlyReports: {
        type: Boolean,
        default: true,
      },
    },
    integrations: {
      externalSystems: [
        {
          name: String,
          type: String,
          apiEndpoint: String,
          apiKey: String,
          isActive: Boolean,
        },
      ],
      gisMapping: {
        enabled: {
          type: Boolean,
          default: false,
        },
        mapLayers: [String],
        dataSync: Boolean,
      },
    },
    priorityLevel: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmergencyDepartment: {
      type: Boolean,
      default: false,
    },
    establishedDate: Date,
    parentDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    childDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    tags: [String],
    customFields: [
      {
        name: String,
        value: mongoose.Schema.Types.Mixed,
        type: String,
      },
    ],
    socialMedia: {
      twitter: String,
      facebook: String,
      instagram: String,
      linkedin: String,
    },
    certifications: [
      {
        name: String,
        issuedBy: String,
        validUntil: Date,
        certificateUrl: String,
      },
    ],
    operationalStatus: {
      type: String,
      enum: ["operational", "maintenance", "emergency_only", "closed"],
      default: "operational",
    },
    lastStatusUpdate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
departmentSchema.index({ name: 1 }, { unique: true });
departmentSchema.index({ code: 1 }, { unique: true });
departmentSchema.index({ isActive: 1 });
departmentSchema.index({ departmentHead: 1 });
departmentSchema.index({ location: "2dsphere" });
departmentSchema.index({ "handledCategories.category": 1 });
departmentSchema.index({ priorityLevel: -1 });
departmentSchema.index({ operationalStatus: 1 });
departmentSchema.index({ isEmergencyDepartment: 1 });
departmentSchema.index({ parentDepartment: 1 });

// Text search index
departmentSchema.index({
  name: "text",
  description: "text",
  tags: "text",
});

// Compound indexes
departmentSchema.index({ isActive: 1, operationalStatus: 1 });
departmentSchema.index({ "address.city": 1, "address.state": 1 });

// Virtuals
departmentSchema.virtual("staffMembers", {
  ref: "User",
  localField: "_id",
  foreignField: "department",
});

departmentSchema.virtual("assignedIssues", {
  ref: "Issue",
  localField: "_id",
  foreignField: "assignedDepartment",
});

departmentSchema.virtual("workloadPercentage").get(function () {
  if (this.capacity.maxActiveIssues === 0) return 0;
  return Math.round(
    (this.capacity.currentActiveIssues / this.capacity.maxActiveIssues) * 100,
  );
});

departmentSchema.virtual("budgetUtilizationPercentage").get(function () {
  if (this.budget.annualBudget === 0) return 0;
  return Math.round(
    (this.budget.budgetUtilized / this.budget.annualBudget) * 100,
  );
});

departmentSchema.virtual("efficiencyScore").get(function () {
  const resolutionScore = this.performanceMetrics.resolutionRate || 0;
  const satisfactionScore =
    (this.performanceMetrics.citizenSatisfactionScore || 0) * 20; // Convert to percentage
  const complianceScore = this.performanceMetrics.responseTimeCompliance || 0;

  return Math.round(
    (resolutionScore + satisfactionScore + complianceScore) / 3,
  );
});

// Instance methods
departmentSchema.methods.canHandleCategory = function (categoryId) {
  return this.handledCategories.some((cat) => cat.category.equals(categoryId));
};

departmentSchema.methods.isWithinCapacity = function () {
  return this.capacity.currentActiveIssues < this.capacity.maxActiveIssues;
};

departmentSchema.methods.canAcceptNewIssue = function () {
  return (
    this.isActive &&
    this.operationalStatus === "operational" &&
    this.isWithinCapacity()
  );
};

departmentSchema.methods.updateCapacity = function (increment = true) {
  if (increment) {
    this.capacity.currentActiveIssues += 1;
    this.capacity.currentDailyIssues += 1;
  } else {
    this.capacity.currentActiveIssues = Math.max(
      0,
      this.capacity.currentActiveIssues - 1,
    );
  }
  return this.save();
};

departmentSchema.methods.getWorkingStatus = function () {
  const now = new Date();
  const day = now.toLocaleLowerCase();
  const currentTime = now.toTimeString().slice(0, 5);

  const daySchedule = this.workingHours[day];
  if (!daySchedule || daySchedule.closed) {
    return { isOpen: false, status: "closed" };
  }

  if (currentTime >= daySchedule.start && currentTime <= daySchedule.end) {
    return { isOpen: true, status: "open" };
  }

  return { isOpen: false, status: "closed" };
};

departmentSchema.methods.updateStatistics = async function () {
  try {
    const Issue = mongoose.model("Issue");

    const stats = await Issue.aggregate([
      { $match: { assignedDepartment: this._id } },
      {
        $group: {
          _id: null,
          totalHandled: { $sum: 1 },
          totalResolved: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          totalPending: {
            $sum: {
              $cond: [
                { $in: ["$status", ["submitted", "assigned", "in_progress"]] },
                1,
                0,
              ],
            },
          },
          totalEscalated: {
            $sum: { $cond: [{ $gt: ["$escalationLevel", 0] }, 1, 0] },
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ["$status", "resolved"] },
                {
                  $divide: [
                    { $subtract: ["$actualResolutionDate", "$createdAt"] },
                    1000 * 60 * 60,
                  ],
                },
                null,
              ],
            },
          },
        },
      },
    ]);

    if (stats.length > 0) {
      const stat = stats[0];
      this.statistics.totalIssuesHandled = stat.totalHandled || 0;
      this.statistics.totalIssuesResolved = stat.totalResolved || 0;
      this.statistics.totalIssuesPending = stat.totalPending || 0;
      this.statistics.totalIssuesEscalated = stat.totalEscalated || 0;

      // Update performance metrics
      this.performanceMetrics.averageResolutionTime =
        stat.avgResolutionTime || 0;
      this.performanceMetrics.resolutionRate =
        stat.totalHandled > 0
          ? Math.round((stat.totalResolved / stat.totalHandled) * 100)
          : 0;

      this.statistics.lastUpdated = new Date();
      await this.save();
    }
  } catch (error) {
    console.error("Error updating department statistics:", error);
  }
};

// Static methods
departmentSchema.statics.getActiveDepartments = function () {
  return this.find({
    isActive: true,
    operationalStatus: "operational",
  }).sort({ name: 1 });
};

departmentSchema.statics.getEmergencyDepartments = function () {
  return this.find({
    isEmergencyDepartment: true,
    isActive: true,
    operationalStatus: { $in: ["operational", "emergency_only"] },
  }).sort({ priorityLevel: -1 });
};

departmentSchema.statics.getDepartmentsByCategory = function (categoryId) {
  return this.find({
    "handledCategories.category": categoryId,
    isActive: true,
    operationalStatus: "operational",
  }).sort({ "handledCategories.priority": 1 });
};

departmentSchema.statics.findBestDepartmentForIssue = async function (
  categoryId,
  location,
  priority,
) {
  const departments = await this.find({
    "handledCategories.category": categoryId,
    isActive: true,
    operationalStatus: "operational",
  }).populate("handledCategories.category");

  // Score departments based on various factors
  const scoredDepartments = departments.map((dept) => {
    let score = 0;

    // Category handling priority
    const categoryMapping = dept.handledCategories.find((cat) =>
      cat.category._id.equals(categoryId),
    );
    if (categoryMapping) {
      score += (11 - categoryMapping.priority) * 10; // Higher priority = higher score
      if (categoryMapping.isPrimary) score += 20;
    }

    // Capacity score
    const capacityRatio =
      dept.capacity.currentActiveIssues / dept.capacity.maxActiveIssues;
    score += (1 - capacityRatio) * 30; // Less loaded = higher score

    // Performance score
    score += dept.performanceMetrics.resolutionRate * 0.2;
    score += dept.performanceMetrics.citizenSatisfactionScore * 5;

    // Department priority
    score += dept.priorityLevel * 2;

    return { department: dept, score };
  });

  // Sort by score (highest first)
  scoredDepartments.sort((a, b) => b.score - a.score);

  return scoredDepartments.length > 0 ? scoredDepartments[0].department : null;
};

departmentSchema.statics.getDepartmentStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalDepartments: { $sum: 1 },
        activeDepartments: { $sum: { $cond: ["$isActive", 1, 0] } },
        emergencyDepartments: {
          $sum: { $cond: ["$isEmergencyDepartment", 1, 0] },
        },
        avgResolutionRate: { $avg: "$performanceMetrics.resolutionRate" },
        avgSatisfactionScore: {
          $avg: "$performanceMetrics.citizenSatisfactionScore",
        },
        totalStaff: { $sum: "$staffing.totalStaff" },
        totalBudget: { $sum: "$budget.annualBudget" },
        totalBudgetUtilized: { $sum: "$budget.budgetUtilized" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalDepartments: 0,
      activeDepartments: 0,
      emergencyDepartments: 0,
      avgResolutionRate: 0,
      avgSatisfactionScore: 0,
      totalStaff: 0,
      totalBudget: 0,
      totalBudgetUtilized: 0,
    }
  );
};

// Pre-save middleware
departmentSchema.pre("save", function (next) {
  // Calculate budget remaining
  this.budget.budgetRemaining =
    this.budget.annualBudget - this.budget.budgetUtilized;

  // Update last status update if operational status changed
  if (this.isModified("operationalStatus")) {
    this.lastStatusUpdate = new Date();
  }

  next();
});

module.exports = mongoose.model("Department", departmentSchema);
