const mongoose = require("mongoose");
const { mongoConnection } = require("../../config/mongodb");

// Import all models
const User = require("./User");
const Issue = require("./Issue");
const Category = require("./Category");
const Department = require("./Department");

// Create Notification model inline since it's simpler
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "error", "system"],
      default: "info",
    },
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Issue",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    data: mongoose.Schema.Types.Mixed,
    channels: [
      {
        type: String,
        enum: ["email", "push", "sms", "in_app"],
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  },
);

// Indexes for Notification
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.model("Notification", notificationSchema);

// Initialize database connection and seed data
const initializeDatabase = async () => {
  try {
    console.log("Initializing MongoDB connection...");

    // Connect to MongoDB
    await mongoConnection.connect();

    // Create indexes
    await mongoConnection.createIndexes();

    // Seed initial data
    await seedInitialData();

    console.log("Database initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    throw error;
  }
};

// Seed initial data
const seedInitialData = async () => {
  try {
    await mongoConnection.seedInitialData();

    // Seed default categories if they don't exist
    await seedDefaultCategories();

    // Seed default departments if they don't exist
    await seedDefaultDepartments();

    console.log("Initial data seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding initial data:", error);
  }
};

// Seed default categories
const seedDefaultCategories = async () => {
  try {
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        {
          name: "Road & Traffic",
          code: "ROAD_TRAFFIC",
          description:
            "Issues related to roads, traffic signals, potholes, and transportation",
          icon: "🚗",
          color: "#FF6B6B",
          priority: "high",
          estimatedResolutionTime: { value: 7, unit: "days" },
          keywords: [
            "road",
            "traffic",
            "pothole",
            "signal",
            "street",
            "highway",
          ],
          tags: ["infrastructure", "transport", "public works"],
          isEmergencyCategory: false,
          requiresMediaEvidence: true,
        },
        {
          name: "Water & Drainage",
          code: "WATER_DRAIN",
          description:
            "Water supply issues, drainage problems, and sewage-related concerns",
          icon: "💧",
          color: "#4ECDC4",
          priority: "high",
          estimatedResolutionTime: { value: 3, unit: "days" },
          keywords: ["water", "drainage", "sewage", "pipe", "leak", "flood"],
          tags: ["utilities", "sanitation", "public health"],
          isEmergencyCategory: true,
          requiresMediaEvidence: true,
        },
        {
          name: "Electricity & Street Lights",
          code: "ELECTRICITY",
          description:
            "Power outages, street lighting issues, and electrical problems",
          icon: "💡",
          color: "#45B7D1",
          priority: "medium",
          estimatedResolutionTime: { value: 2, unit: "days" },
          keywords: ["electricity", "power", "light", "outage", "transformer"],
          tags: ["utilities", "infrastructure", "safety"],
          isEmergencyCategory: false,
          requiresMediaEvidence: false,
        },
        {
          name: "Garbage & Sanitation",
          code: "GARBAGE",
          description:
            "Waste management, garbage collection, and sanitation issues",
          icon: "🗑️",
          color: "#96CEB4",
          priority: "medium",
          estimatedResolutionTime: { value: 1, unit: "days" },
          keywords: [
            "garbage",
            "waste",
            "sanitation",
            "collection",
            "cleaning",
          ],
          tags: ["sanitation", "public health", "environment"],
          isEmergencyCategory: false,
          requiresMediaEvidence: true,
        },
        {
          name: "Public Safety",
          code: "SAFETY",
          description:
            "Security concerns, safety hazards, and emergency situations",
          icon: "🚨",
          color: "#FFEAA7",
          priority: "critical",
          estimatedResolutionTime: { value: 1, unit: "hours" },
          keywords: ["safety", "security", "emergency", "crime", "hazard"],
          tags: ["safety", "emergency", "security"],
          isEmergencyCategory: true,
          requiresMediaEvidence: true,
        },
        {
          name: "Parks & Recreation",
          code: "PARKS",
          description:
            "Public parks, playgrounds, and recreational facility issues",
          icon: "🌳",
          color: "#DDA0DD",
          priority: "low",
          estimatedResolutionTime: { value: 5, unit: "days" },
          keywords: [
            "park",
            "playground",
            "recreation",
            "garden",
            "maintenance",
          ],
          tags: ["recreation", "environment", "community"],
          isEmergencyCategory: false,
          requiresMediaEvidence: false,
        },
        {
          name: "Public Buildings",
          code: "BUILDINGS",
          description:
            "Issues with government buildings, offices, and public facilities",
          icon: "🏢",
          color: "#98D8C8",
          priority: "medium",
          estimatedResolutionTime: { value: 3, unit: "days" },
          keywords: ["building", "office", "facility", "maintenance", "repair"],
          tags: ["infrastructure", "public facilities"],
          isEmergencyCategory: false,
          requiresMediaEvidence: true,
        },
        {
          name: "Noise & Environment",
          code: "ENVIRONMENT",
          description:
            "Noise pollution, environmental concerns, and air quality issues",
          icon: "🌍",
          color: "#F7DC6F",
          priority: "low",
          estimatedResolutionTime: { value: 7, unit: "days" },
          keywords: ["noise", "pollution", "environment", "air", "quality"],
          tags: ["environment", "pollution", "public health"],
          isEmergencyCategory: false,
          requiresMediaEvidence: false,
        },
        {
          name: "Animal Control",
          code: "ANIMALS",
          description:
            "Stray animals, animal welfare, and wildlife-related issues",
          icon: "🐕",
          color: "#BB8FCE",
          priority: "medium",
          estimatedResolutionTime: { value: 1, unit: "days" },
          keywords: ["animal", "stray", "wildlife", "pet", "control"],
          tags: ["animal welfare", "public safety"],
          isEmergencyCategory: false,
          requiresMediaEvidence: true,
        },
        {
          name: "Other",
          code: "OTHER",
          description: "Issues that don't fit into other categories",
          icon: "❓",
          color: "#AED6F1",
          priority: "low",
          estimatedResolutionTime: { value: 7, unit: "days" },
          keywords: ["other", "miscellaneous", "general"],
          tags: ["general"],
          isEmergencyCategory: false,
          requiresMediaEvidence: false,
        },
      ];

      await Category.insertMany(defaultCategories);
      console.log(" Default categories created");
    }
  } catch (error) {
    console.error("❌ Error seeding categories:", error);
  }
};

// Seed default departments
const seedDefaultDepartments = async () => {
  try {
    const departmentCount = await Department.countDocuments();
    if (departmentCount === 0) {
      const defaultDepartments = [
        {
          name: "Public Works Department",
          code: "PWD",
          description:
            "Responsible for road maintenance, infrastructure development, and public facilities",
          contactInfo: {
            email: "pwd@ranchi.gov.in",
            phone: "+91-651-2234567",
            emergencyPhone: "+91-651-2234568",
          },
          address: {
            line1: "PWD Office, Main Road",
            city: "Ranchi",
            state: "Jharkhand",
            pincode: "834001",
          },
          emergencyAvailable: false,
          capacity: {
            maxActiveIssues: 100,
            maxDailyIssues: 50,
          },
          priorityLevel: 8,
        },
        {
          name: "Water Works Department",
          code: "WWD",
          description:
            "Manages water supply, drainage systems, and sewage treatment",
          contactInfo: {
            email: "water@ranchi.gov.in",
            phone: "+91-651-2234569",
            emergencyPhone: "+91-651-2234570",
          },
          address: {
            line1: "Water Works Office, Sector 2",
            city: "Ranchi",
            state: "Jharkhand",
            pincode: "834002",
          },
          emergencyAvailable: true,
          capacity: {
            maxActiveIssues: 80,
            maxDailyIssues: 40,
          },
          priorityLevel: 9,
        },
        {
          name: "Electricity Board",
          code: "JSEB",
          description:
            "Handles electrical supply, street lighting, and power infrastructure",
          contactInfo: {
            email: "electricity@ranchi.gov.in",
            phone: "+91-651-2234571",
            emergencyPhone: "+91-651-2234572",
          },
          address: {
            line1: "Electricity Board Office, Power House",
            city: "Ranchi",
            state: "Jharkhand",
            pincode: "834003",
          },
          emergencyAvailable: true,
          capacity: {
            maxActiveIssues: 60,
            maxDailyIssues: 30,
          },
          priorityLevel: 7,
        },
        {
          name: "Sanitation Department",
          code: "SANIT",
          description:
            "Responsible for waste management, garbage collection, and cleanliness",
          contactInfo: {
            email: "sanitation@ranchi.gov.in",
            phone: "+91-651-2234573",
          },
          address: {
            line1: "Sanitation Office, Municipal Corporation",
            city: "Ranchi",
            state: "Jharkhand",
            pincode: "834001",
          },
          emergencyAvailable: false,
          capacity: {
            maxActiveIssues: 120,
            maxDailyIssues: 60,
          },
          priorityLevel: 6,
        },
        {
          name: "Police Department",
          code: "POLICE",
          description:
            "Handles public safety, security, and emergency response",
          contactInfo: {
            email: "police@ranchi.gov.in",
            phone: "+91-651-2234574",
            emergencyPhone: "100",
          },
          address: {
            line1: "Police Station, Main Road",
            city: "Ranchi",
            state: "Jharkhand",
            pincode: "834001",
          },
          emergencyAvailable: true,
          emergencyHours: "24/7",
          capacity: {
            maxActiveIssues: 200,
            maxDailyIssues: 100,
          },
          priorityLevel: 10,
          isEmergencyDepartment: true,
        },
      ];

      const createdDepartments =
        await Department.insertMany(defaultDepartments);

      // Map categories to departments
      await mapCategoriesToDepartments(createdDepartments);

      console.log("Default departments created");
    }
  } catch (error) {
    console.error("❌ Error seeding departments:", error);
  }
};

// Map categories to departments
const mapCategoriesToDepartments = async (departments) => {
  try {
    const categories = await Category.find({});

    const mappings = {
      ROAD_TRAFFIC: ["PWD"],
      WATER_DRAIN: ["WWD"],
      ELECTRICITY: ["JSEB"],
      GARBAGE: ["SANIT"],
      SAFETY: ["POLICE"],
      PARKS: ["PWD"],
      BUILDINGS: ["PWD"],
      ENVIRONMENT: ["SANIT"],
      ANIMALS: ["PWD"],
      OTHER: ["PWD"],
    };

    for (const category of categories) {
      const deptCodes = mappings[category.code] || ["PWD"];

      for (const deptCode of deptCodes) {
        const department = departments.find((dept) => dept.code === deptCode);
        if (department) {
          // Add category to department
          if (
            !department.handledCategories.some((hc) =>
              hc.category.equals(category._id),
            )
          ) {
            department.handledCategories.push({
              category: category._id,
              isPrimary: true,
              priority: 1,
            });
          }

          // Add department to category
          if (
            !category.departmentMapping.some((dm) =>
              dm.department.equals(department._id),
            )
          ) {
            category.departmentMapping.push({
              department: department._id,
              isPrimary: true,
              priority: 1,
            });
          }
        }
      }

      await category.save();
    }

    // Save all departments
    await Promise.all(departments.map((dept) => dept.save()));

    console.log("Categories mapped to departments");
  } catch (error) {
    console.error("❌ Error mapping categories to departments:", error);
  }
};

// Health check function
const healthCheck = async () => {
  try {
    return await mongoConnection.healthCheck();
  } catch (error) {
    return {
      status: "unhealthy",
      message: error.message,
      timestamp: new Date(),
    };
  }
};

// Graceful shutdown
const closeConnection = async () => {
  try {
    await mongoConnection.disconnect();
    console.log("Database connection closed gracefully");
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
  }
};

// Export models and utilities
module.exports = {
  // Models
  User,
  Issue,
  Category,
  Department,
  Notification,

  // Connection utilities
  mongoose,
  initializeDatabase,
  seedDatabase: seedInitialData,
  healthCheck,
  closeConnection,

  // Individual seed functions
  seedDefaultCategories,
  seedDefaultDepartments,

  // Database connection
  connection: mongoConnection,
};
