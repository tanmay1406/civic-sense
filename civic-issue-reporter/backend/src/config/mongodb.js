const mongoose = require("mongoose");

require("dotenv").config();

class MongoDBConnection {
  constructor() {
    this.isConnected = false;
    this.connectionOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
  }

  async connect() {
    try {
      const mongoUri =
        process.env.MONGODB_URI ;

      console.log("Connecting to MongoDB...");

      await mongoose.connect(mongoUri, this.connectionOptions);

      this.isConnected = true;
      console.log("MongoDB connected successfully");
      // Set up event listeners
      this.setupEventListeners();

      return true;
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error.message);
      this.isConnected = false;
      throw error;
    }
  }

  setupEventListeners() {
    mongoose.connection.on("connected", () => {
      console.log("Mongoose connected to MongoDB");
      this.isConnected = true;
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err);
      this.isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Mongoose disconnected from MongoDB");
      this.isConnected = false;
    });

    process.on("SIGINT", async () => {
      console.log("Received SIGINT. Closing MongoDB connection gracefully...");
      await this.disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("Received SIGTERM. Closing MongoDB connection gracefully...");
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log("MongoDB connection closed gracefully");
      this.isConnected = false;
    } catch (error) {
      console.error("❌ Error closing MongoDB connection:", error);
    }
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: "disconnected",
          message: "MongoDB is not connected",
          timestamp: new Date(),
        };
      }

      // Test the connection
      await mongoose.connection.db.admin().ping();

      return {
        status: "healthy",
        message: "MongoDB is connected and responsive",
        timestamp: new Date(),
        database: mongoose.connection.name,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: error.message,
        timestamp: new Date(),
      };
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name,
    };
  }

  // Create indexes for better performance
  async createIndexes() {
    try {
      console.log("Creating MongoDB indexes...");

      // User indexes
      if (mongoose.models.User) {
        await mongoose.models.User.createIndexes();
      }

      // Issue indexes
      if (mongoose.models.Issue) {
        await mongoose.models.Issue.createIndexes();
      }

      // Department indexes
      if (mongoose.models.Department) {
        await mongoose.models.Department.createIndexes();
      }

      console.log("MongoDB indexes created successfully");
    } catch (error) {
      console.error("❌ Error creating MongoDB indexes:", error);
    }
  }

  // Seed initial data
  async seedInitialData() {
    try {
      if (process.env.AUTO_CREATE_DEMO_DATA !== "true") {
        return;
      }

      console.log("Seeding initial data...");

      // Create admin user if it doesn't exist
      const User = mongoose.models.User;
      if (User) {
        const adminExists = await User.findOne({
          email: process.env.ADMIN_EMAIL,
        });
        if (!adminExists && process.env.ADMIN_EMAIL) {
          const bcrypt = require("bcryptjs");
          const hashedPassword = await bcrypt.hash(
            process.env.ADMIN_PASSWORD || "admin123",
            12,
          );

          await User.create({
            firstName: process.env.ADMIN_FIRST_NAME || "System",
            lastName: process.env.ADMIN_LAST_NAME || "Administrator",
            email: process.env.ADMIN_EMAIL,
            password: hashedPassword,
            role: "admin",
            phone: "+91-9999999999",
            isVerified: true,
            isActive: true,
          });

          console.log("Admin user created");
        }

        // Create demo user if it doesn't exist
        const demoExists = await User.findOne({
          email: process.env.DEMO_EMAIL,
        });
        if (!demoExists && process.env.DEMO_EMAIL) {
          const bcrypt = require("bcryptjs");
          const hashedPassword = await bcrypt.hash(
            process.env.DEMO_PASSWORD || "demo123",
            12,
          );

          await User.create({
            firstName: process.env.DEMO_FIRST_NAME || "Demo",
            lastName: process.env.DEMO_LAST_NAME || "User",
            email: process.env.DEMO_EMAIL,
            password: hashedPassword,
            role: "citizen",
            phone: "+91-8888888888",
            isVerified: true,
            isActive: true,
          });

          console.log("Demo user created");
        }
      }

      console.log("Initial data seeded successfully");
    } catch (error) {
      console.error("❌ Error seeding initial data:", error);
    }
  }
}

// Create and export singleton instance
const mongoConnection = new MongoDBConnection();

module.exports = {
  mongoConnection,
  mongoose,
  connect: () => mongoConnection.connect(),
  disconnect: () => mongoConnection.disconnect(),
  healthCheck: () => mongoConnection.healthCheck(),
  getConnectionStatus: () => mongoConnection.getConnectionStatus(),
  createIndexes: () => mongoConnection.createIndexes(),
  seedInitialData: () => mongoConnection.seedInitialData(),
};
