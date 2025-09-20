const socketIO = require("socket.io");
const jwt = require("jsonwebtoken");

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map();
  }

  /**
   * Initialize Socket.IO server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.CORS_ORIGIN
          ? process.env.CORS_ORIGIN.split(",")
          : ["http://localhost:3000", "http://localhost:3001"],
        credentials: true,
      },
    });

    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userRole = decoded.role;

        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication failed"));
      }
    });

    // Handle socket connections
    this.io.on("connection", (socket) => {
      this.handleConnection(socket);
    });

    console.log("Socket.IO server initialized");
  }

  /**
   * Handle new socket connection
   * @param {Object} socket - Socket instance
   */
  handleConnection(socket) {
    const { userId, userRole } = socket;

    console.log(`User ${userId} connected with role ${userRole}`);

    // Store user connection
    this.connectedUsers.set(userId, {
      socketId: socket.id,
      role: userRole,
      connectedAt: new Date(),
    });

    // Join user to appropriate rooms based on role
    if (userRole === "admin") {
      socket.join("admin-room");
    } else if (userRole === "department_staff") {
      socket.join("department-room");
    }
    socket.join(`user-${userId}`);

    // Handle socket events
    this.registerEventHandlers(socket);

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
      this.connectedUsers.delete(userId);
    });
  }

  /**
   * Register socket event handlers
   * @param {Object} socket - Socket instance
   */
  registerEventHandlers(socket) {
    // Handle issue updates subscription
    socket.on("subscribe-issue-updates", (issueId) => {
      socket.join(`issue-${issueId}`);
      console.log(
        `User ${socket.userId} subscribed to issue ${issueId} updates`,
      );
    });

    // Handle issue updates unsubscription
    socket.on("unsubscribe-issue-updates", (issueId) => {
      socket.leave(`issue-${issueId}`);
      console.log(
        `User ${socket.userId} unsubscribed from issue ${issueId} updates`,
      );
    });

    // Handle location updates for real-time tracking
    socket.on("location-update", (data) => {
      if (socket.userRole === "department_staff") {
        socket.to("admin-room").emit("staff-location-update", {
          userId: socket.userId,
          ...data,
        });
      }
    });
  }

  /**
   * Emit issue status update to relevant users
   * @param {string} issueId - Issue ID
   * @param {Object} update - Status update data
   */
  emitIssueUpdate(issueId, update) {
    if (!this.io) return;

    this.io.to(`issue-${issueId}`).emit("issue-updated", {
      issueId,
      ...update,
      timestamp: new Date(),
    });

    console.log(`Emitted issue update for issue ${issueId}`);
  }

  /**
   * Emit new issue notification to admins
   * @param {Object} issue - New issue data
   */
  emitNewIssueToAdmins(issue) {
    if (!this.io) return;

    this.io.to("admin-room").emit("new-issue", {
      ...issue,
      timestamp: new Date(),
    });

    console.log(`Emitted new issue notification to admins`);
  }

  /**
   * Emit notification to specific user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   */
  emitNotificationToUser(userId, notification) {
    if (!this.io) return;

    this.io.to(`user-${userId}`).emit("notification", {
      ...notification,
      timestamp: new Date(),
    });

    console.log(`Emitted notification to user ${userId}`);
  }

  /**
   * Emit assignment notification to department staff
   * @param {string} departmentId - Department ID
   * @param {Object} assignment - Assignment data
   */
  emitAssignmentToDepartment(departmentId, assignment) {
    if (!this.io) return;

    // Find connected department staff and emit to them
    for (const [userId, userInfo] of this.connectedUsers) {
      if (userInfo.role === "department_staff") {
        // In a real implementation, you would check if the user belongs to the department
        this.io.to(`user-${userId}`).emit("issue-assigned", {
          ...assignment,
          timestamp: new Date(),
        });
      }
    }

    console.log(
      `Emitted assignment notification to department ${departmentId}`,
    );
  }

  /**
   * Get connected users count
   * @returns {number} Number of connected users
   */
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  /**
   * Get connected users by role
   * @param {string} role - User role
   * @returns {Array} Array of connected users with specified role
   */
  getConnectedUsersByRole(role) {
    const users = [];
    for (const [userId, userInfo] of this.connectedUsers) {
      if (userInfo.role === role) {
        users.push({ userId, ...userInfo });
      }
    }
    return users;
  }
}

// Export singleton instance
module.exports = new SocketService();
