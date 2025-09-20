const nodemailer = require("nodemailer");

/**
 * Notification Service for handling email, SMS, and push notifications
 * Supports multiple notification channels and templates
 */
class NotificationService {
  constructor() {
    this.emailTransporter = null;
    this.notificationQueue = [];
    this.isProcessingQueue = false;
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Initialize notification service
   */
  async initialize() {
    try {
      await this.initializeEmail();

      // Start processing notification queue
      this.startQueueProcessor();

      console.log("Notification service initialized successfully");
    } catch (error) {
      console.error("Failed to initialize notification service:", error);
      throw error;
    }
  }

  /**
   * Initialize email transporter
   */
  async initializeEmail() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.warn(
        "Email configuration not found, email notifications disabled",
      );
      return;
    }

    try {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Verify connection
      await this.emailTransporter.verify();
      console.log("Email transporter initialized successfully");
    } catch (error) {
      console.error("Failed to initialize email transporter:", error);
      this.emailTransporter = null;
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(to, subject, html, attachments = null) {
    if (!this.emailTransporter) {
      console.warn("Email transporter not available");
      return { success: false, error: "Email service not configured" };
    }

    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || "Civic Issue Reporter"}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        attachments,
      };

      const result = await this.emailTransporter.sendMail(mailOptions);

      console.log("Email sent successfully", {
        to,
        subject,
        messageId: result.messageId,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send notification to user through email only
   */
  async sendNotification(user, type, data, options = {}) {
    const notifications = [];

    // Email notification only
    if (user.notificationPreferences?.email && this.emailTransporter) {
      const emailTemplate = this.getEmailTemplate(type, data);
      if (emailTemplate) {
        notifications.push({
          type: "email",
          recipient: user.email,
          subject: emailTemplate.subject,
          content: emailTemplate.html,
          priority: options.priority || "normal",
        });
      }
    }

    // Queue notifications for processing
    notifications.forEach((notification) => {
      this.queueNotification(notification);
    });

    return notifications.length;
  }

  /**
   * Issue created notification
   */
  async sendIssueCreatedNotification(issue) {
    const user = issue.reportedBy;
    if (!user) return;

    const data = {
      issue,
      issueNumber: issue.issue_number,
      issueTitle: issue.title,
      categoryName: issue.category?.name,
      userName: user.full_name,
    };

    return await this.sendNotification(user, "issue_created", data, {
      priority: "normal",
    });
  }

  /**
   * Status update notification
   */
  async sendStatusUpdateNotification(issue, newStatus) {
    const user = issue.reportedBy;
    if (!user || issue.anonymous_report) return;

    const data = {
      issue,
      newStatus,
      issueNumber: issue.issue_number,
      issueTitle: issue.title,
      categoryName: issue.category?.name,
      departmentName: issue.assignedDepartment?.name,
      userName: user.full_name,
    };

    return await this.sendNotification(user, "status_update", data, {
      priority: newStatus === "resolved" ? "high" : "normal",
    });
  }

  /**
   * Issue assigned notification (for department staff)
   */
  async sendIssueAssignedNotification(issue, assignedUser) {
    if (!assignedUser) return;

    const data = {
      issue,
      issueNumber: issue.issue_number,
      issueTitle: issue.title,
      categoryName: issue.category?.name,
      assignedUserName: assignedUser.full_name,
      reporterName: issue.reportedBy?.full_name,
    };

    return await this.sendNotification(assignedUser, "issue_assigned", data, {
      priority: issue.priority === "critical" ? "high" : "normal",
    });
  }

  /**
   * SLA breach notification
   */
  async sendSLABreachNotification(issue, departmentStaff) {
    const notifications = [];

    for (const staff of departmentStaff) {
      const data = {
        issue,
        issueNumber: issue.issue_number,
        issueTitle: issue.title,
        categoryName: issue.category?.name,
        overdueDuration: this.calculateOverdueDuration(issue),
        staffName: staff.full_name,
      };

      const count = await this.sendNotification(staff, "sla_breach", data, {
        priority: "high",
      });

      notifications.push({ user: staff.id, count });
    }

    return notifications;
  }

  /**
   * Daily digest notification
   */
  async sendDailyDigest(user, stats) {
    const data = {
      userName: user.full_name,
      stats,
      date: new Date().toLocaleDateString(),
    };

    return await this.sendNotification(user, "daily_digest", data, {
      priority: "low",
    });
  }

  /**
   * Queue notification for processing
   */
  queueNotification(notification) {
    notification.id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    notification.createdAt = new Date();
    notification.attempts = 0;
    notification.status = "queued";

    this.notificationQueue.push(notification);

    console.log("Notification queued", {
      id: notification.id,
      type: notification.type,
      priority: notification.priority,
    });
  }

  /**
   * Start notification queue processor
   */
  startQueueProcessor() {
    if (this.isProcessingQueue) return;

    this.isProcessingQueue = true;
    this.processQueue();
  }

  /**
   * Process notification queue
   */
  async processQueue() {
    while (this.isProcessingQueue) {
      try {
        if (this.notificationQueue.length === 0) {
          await this.delay(1000); // Wait 1 second
          continue;
        }

        // Sort by priority and creation time
        this.notificationQueue.sort((a, b) => {
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          const aPriority = priorityOrder[a.priority] || 2;
          const bPriority = priorityOrder[b.priority] || 2;

          if (aPriority !== bPriority) {
            return bPriority - aPriority; // Higher priority first
          }

          return a.createdAt - b.createdAt; // Older first
        });

        const notification = this.notificationQueue.shift();
        await this.processNotification(notification);
      } catch (error) {
        console.error("Error processing notification queue:", error);
        await this.delay(5000); // Wait 5 seconds on error
      }
    }
  }

  /**
   * Process individual notification
   */
  async processNotification(notification) {
    try {
      notification.attempts++;
      notification.lastAttempt = new Date();

      let result;

      switch (notification.type) {
        case "email":
          result = await this.sendEmail(
            notification.recipient,
            notification.subject,
            notification.content,
          );
          break;

        default:
          throw new Error(`Unknown notification type: ${notification.type}`);
      }

      if (result.success) {
        notification.status = "sent";
        notification.sentAt = new Date();

        console.log("Notification sent successfully", {
          id: notification.id,
          type: notification.type,
          attempts: notification.attempts,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Failed to send notification", {
        id: notification.id,
        type: notification.type,
        attempts: notification.attempts,
        error: error.message,
      });

      // Retry logic
      if (notification.attempts < this.retryAttempts) {
        notification.status = "retry";

        // Re-queue with delay
        setTimeout(() => {
          this.notificationQueue.push(notification);
        }, this.retryDelay * notification.attempts);
      } else {
        notification.status = "failed";
        notification.failedAt = new Date();
        notification.lastError = error.message;

        console.error("Notification failed after maximum retries", {
          id: notification.id,
          type: notification.type,
          recipient: notification.recipient,
        });
      }
    }
  }

  /**
   * Get email template
   */
  getEmailTemplate(type, data) {
    const templates = {
      issue_created: {
        subject: `Issue Reported: ${data.issueNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Issue Reported Successfully</h2>
            <p>Hi ${data.userName},</p>
            <p>Your issue has been reported successfully and assigned number <strong>${data.issueNumber}</strong>.</p>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Issue Details:</h3>
              <p><strong>Title:</strong> ${data.issueTitle}</p>
              <p><strong>Category:</strong> ${data.categoryName}</p>
              <p><strong>Reported:</strong> ${new Date(data.issue.created_at).toLocaleString()}</p>
            </div>

            <p>We will keep you updated on the progress of your issue.</p>
            <p>Thank you for helping improve our city!</p>

            <hr>
            <p style="font-size: 12px; color: #666;">
              Civic Issue Reporter<br>
              ${process.env.FRONTEND_URL}
            </p>
          </div>
        `,
      },

      status_update: {
        subject: `Issue Update: ${data.issueNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Issue Status Update</h2>
            <p>Hi ${data.userName},</p>
            <p>There's an update on your issue <strong>${data.issueNumber}</strong>.</p>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Title:</strong> ${data.issueTitle}</p>
              <p><strong>New Status:</strong> <span style="color: #007bff; font-weight: bold;">${data.newStatus.toUpperCase()}</span></p>
              ${data.departmentName ? `<p><strong>Handled by:</strong> ${data.departmentName}</p>` : ""}
            </div>

            ${
              data.newStatus === "resolved"
                ? "<p>🎉 Great news! Your issue has been resolved. Please check and provide feedback if you're satisfied with the resolution.</p>"
                : "<p>We'll continue to keep you updated on the progress.</p>"
            }

            <p>
              <a href="${process.env.FRONTEND_URL}/issues/${data.issue.id}"
                 style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Issue Details
              </a>
            </p>

            <hr>
            <p style="font-size: 12px; color: #666;">
              Civic Issue Reporter<br>
              ${process.env.FRONTEND_URL}
            </p>
          </div>
        `,
      },

      issue_assigned: {
        subject: `New Issue Assigned: ${data.issueNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Issue Assigned</h2>
            <p>Hi ${data.assignedUserName},</p>
            <p>A new issue has been assigned to you.</p>

            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Issue Details:</h3>
              <p><strong>Number:</strong> ${data.issueNumber}</p>
              <p><strong>Title:</strong> ${data.issueTitle}</p>
              <p><strong>Category:</strong> ${data.categoryName}</p>
              <p><strong>Reported by:</strong> ${data.reporterName}</p>
              <p><strong>Priority:</strong> ${data.issue.priority.toUpperCase()}</p>
            </div>

            <p>Please review and take appropriate action.</p>

            <p>
              <a href="${process.env.ADMIN_URL}/issues/${data.issue.id}"
                 style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                View Issue
              </a>
            </p>

            <hr>
            <p style="font-size: 12px; color: #666;">
              Civic Issue Reporter Admin<br>
              ${process.env.ADMIN_URL}
            </p>
          </div>
        `,
      },
    };

    return templates[type] || null;
  }

  /**
   * Calculate overdue duration
   */
  calculateOverdueDuration(issue) {
    if (!issue.sla_deadline) return "unknown";

    const now = new Date();
    const deadline = new Date(issue.sla_deadline);
    const overdueDuration = now - deadline;

    const hours = Math.floor(overdueDuration / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day(s)`;
    } else {
      return `${hours} hour(s)`;
    }
  }

  /**
   * Stop queue processor
   */
  stopQueueProcessor() {
    this.isProcessingQueue = false;
    console.log("Notification queue processor stopped");
  }

  /**
   * Get queue statistics
   */
  getQueueStats() {
    const stats = {
      total: this.notificationQueue.length,
      queued: 0,
      retry: 0,
      failed: 0,
    };

    this.notificationQueue.forEach((notification) => {
      stats[notification.status] = (stats[notification.status] || 0) + 1;
    });

    return stats;
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new NotificationService();
