const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: [true, "Category code is required"],
      uppercase: true,
      trim: true,
      maxlength: [10, "Category code cannot exceed 10 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    icon: {
      type: String,
      default: "📋",
    },
    color: {
      type: String,
      default: "#6B7280",
      match: [
        /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
        "Please enter a valid hex color code",
      ],
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    subcategories: [
      {
        name: String,
        code: String,
        description: String,
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    departmentMapping: [
      {
        department: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
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
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    estimatedResolutionTime: {
      value: {
        type: Number,
        required: true,
        min: 1,
      },
      unit: {
        type: String,
        enum: ["hours", "days", "weeks"],
        default: "days",
      },
    },
    sla: {
      responseTime: {
        value: Number,
        unit: {
          type: String,
          enum: ["minutes", "hours", "days"],
          default: "hours",
        },
      },
      resolutionTime: {
        value: Number,
        unit: {
          type: String,
          enum: ["hours", "days", "weeks"],
          default: "days",
        },
      },
      escalationRules: [
        {
          level: Number,
          timeLimit: {
            value: Number,
            unit: String,
          },
          escalateTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
          },
        },
      ],
    },
    workflowTemplate: [
      {
        stepName: {
          type: String,
          required: true,
        },
        description: String,
        assignedRole: {
          type: String,
          enum: ["admin", "department_head", "staff", "field_officer"],
          required: true,
        },
        estimatedDuration: {
          value: Number,
          unit: String,
        },
        isRequired: {
          type: Boolean,
          default: true,
        },
        order: {
          type: Number,
          required: true,
        },
      },
    ],
    keywords: [
      {
        type: String,
        lowercase: true,
      },
    ],
    tags: [
      {
        type: String,
        lowercase: true,
      },
    ],
    isEmergencyCategory: {
      type: Boolean,
      default: false,
    },
    requiresMediaEvidence: {
      type: Boolean,
      default: false,
    },
    requiresLocationAccuracy: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    allowAnonymousReporting: {
      type: Boolean,
      default: true,
    },
    publicVisibility: {
      type: Boolean,
      default: true,
    },
    autoAssignmentRules: {
      enabled: {
        type: Boolean,
        default: true,
      },
      criteria: [
        {
          field: String,
          operator: {
            type: String,
            enum: ["equals", "contains", "in_range"],
          },
          value: mongoose.Schema.Types.Mixed,
          weight: Number,
        },
      ],
      loadBalancing: {
        type: String,
        enum: ["round_robin", "least_loaded", "expertise_based"],
        default: "least_loaded",
      },
    },
    notifications: {
      citizenUpdates: {
        type: Boolean,
        default: true,
      },
      departmentAlerts: {
        type: Boolean,
        default: true,
      },
      escalationNotifications: {
        type: Boolean,
        default: true,
      },
      completionNotifications: {
        type: Boolean,
        default: true,
      },
    },
    statistics: {
      totalIssues: {
        type: Number,
        default: 0,
      },
      resolvedIssues: {
        type: Number,
        default: 0,
      },
      avgResolutionTime: {
        type: Number,
        default: 0,
      },
      satisfactionScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    customFields: [
      {
        name: String,
        type: {
          type: String,
          enum: ["text", "number", "boolean", "date", "select", "multiselect"],
          default: "text",
        },
        label: String,
        placeholder: String,
        required: {
          type: Boolean,
          default: false,
        },
        options: [String], // For select and multiselect types
        validation: {
          minLength: Number,
          maxLength: Number,
          min: Number,
          max: Number,
          pattern: String,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
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
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ code: 1 }, { unique: true });
categorySchema.index({ isActive: 1 });
categorySchema.index({ isVisible: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ priority: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ keywords: 1 });
categorySchema.index({ tags: 1 });
categorySchema.index({ "departmentMapping.department": 1 });

// Text index for search
categorySchema.index({
  name: "text",
  description: "text",
  keywords: "text",
  tags: "text",
});

// Virtual for issues count
categorySchema.virtual("issuesCount", {
  ref: "Issue",
  localField: "_id",
  foreignField: "category",
  count: true,
});

// Virtual for subcategories count
categorySchema.virtual("subcategoriesCount").get(function () {
  return this.subcategories
    ? this.subcategories.filter((sub) => sub.isActive).length
    : 0;
});

// Virtual for primary department
categorySchema.virtual("primaryDepartment").get(function () {
  const primary = this.departmentMapping.find((dept) => dept.isPrimary);
  return primary ? primary.department : null;
});

// Virtual for resolution time in hours
categorySchema.virtual("resolutionTimeInHours").get(function () {
  const { value, unit } = this.estimatedResolutionTime;
  switch (unit) {
    case "hours":
      return value;
    case "days":
      return value * 24;
    case "weeks":
      return value * 24 * 7;
    default:
      return value;
  }
});

// Pre-save middleware to ensure order
categorySchema.pre("save", async function (next) {
  if (this.isNew && this.order === 0) {
    const maxOrder = await this.constructor
      .findOne({}, { order: 1 })
      .sort({ order: -1 });
    this.order = maxOrder ? maxOrder.order + 1 : 1;
  }
  next();
});

// Pre-save middleware to validate subcategories
categorySchema.pre("save", function (next) {
  if (this.subcategories && this.subcategories.length > 0) {
    this.subcategories.forEach((sub, index) => {
      if (!sub.code) {
        sub.code = `${this.code}_SUB_${index + 1}`;
      }
    });
  }
  next();
});

// Instance method to add subcategory
categorySchema.methods.addSubcategory = function (subcategoryData) {
  const newSubcategory = {
    ...subcategoryData,
    code:
      subcategoryData.code ||
      `${this.code}_SUB_${this.subcategories.length + 1}`,
  };

  this.subcategories.push(newSubcategory);
  return this.save();
};

// Instance method to update statistics
categorySchema.methods.updateStatistics = async function () {
  try {
    const Issue = mongoose.model("Issue");

    const stats = await Issue.aggregate([
      { $match: { category: this._id } },
      {
        $group: {
          _id: null,
          totalIssues: { $sum: 1 },
          resolvedIssues: {
            $sum: { $cond: [{ $eq: ["$status", "resolved"] }, 1, 0] },
          },
          avgResolutionTime: {
            $avg: {
              $cond: [
                { $eq: ["$status", "resolved"] },
                {
                  $divide: [
                    { $subtract: ["$actualResolutionDate", "$createdAt"] },
                    1000 * 60 * 60, // Convert to hours
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
      const { totalIssues, resolvedIssues, avgResolutionTime } = stats[0];

      this.statistics.totalIssues = totalIssues || 0;
      this.statistics.resolvedIssues = resolvedIssues || 0;
      this.statistics.avgResolutionTime = avgResolutionTime || 0;
      this.statistics.lastUpdated = new Date();

      await this.save();
    }
  } catch (error) {
    console.error("Error updating category statistics:", error);
  }
};

// Static method to get active categories
categorySchema.statics.getActiveCategories = function () {
  return this.find({
    isActive: true,
    isVisible: true,
  }).sort({ order: 1, name: 1 });
};

// Static method to get categories by department
categorySchema.statics.getCategoriesByDepartment = function (departmentId) {
  return this.find({
    "departmentMapping.department": departmentId,
    isActive: true,
  }).sort({ order: 1, name: 1 });
};

// Static method to get emergency categories
categorySchema.statics.getEmergencyCategories = function () {
  return this.find({
    isEmergencyCategory: true,
    isActive: true,
  }).sort({ priority: -1, order: 1 });
};

// Static method to search categories
categorySchema.statics.searchCategories = function (query) {
  return this.find(
    {
      $text: { $search: query },
      isActive: true,
      isVisible: true,
    },
    { score: { $meta: "textScore" } },
  ).sort({ score: { $meta: "textScore" } });
};

// Static method to get category statistics
categorySchema.statics.getCategoryStatistics = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalCategories: { $sum: 1 },
        activeCategories: { $sum: { $cond: ["$isActive", 1, 0] } },
        emergencyCategories: {
          $sum: { $cond: ["$isEmergencyCategory", 1, 0] },
        },
        avgResolutionTime: { $avg: "$statistics.avgResolutionTime" },
        totalIssues: { $sum: "$statistics.totalIssues" },
        totalResolved: { $sum: "$statistics.resolvedIssues" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalCategories: 0,
      activeCategories: 0,
      emergencyCategories: 0,
      avgResolutionTime: 0,
      totalIssues: 0,
      totalResolved: 0,
    }
  );
};

// Static method to auto-suggest category based on keywords
categorySchema.statics.suggestCategory = function (title, description) {
  const searchText = `${title} ${description}`.toLowerCase();

  return this.find({
    keywords: { $in: searchText.split(" ") },
    isActive: true,
  })
    .sort({ "statistics.totalIssues": -1 })
    .limit(3);
};

module.exports = mongoose.model("Category", categorySchema);
