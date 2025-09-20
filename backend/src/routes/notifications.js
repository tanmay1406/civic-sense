const express = require("express");
const router = express.Router();
const { User, Issue, Notification } = require("../models");
const { requireAuth } = require("../middleware/auth");

// GET /api/notifications - Get user notifications
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    const whereCondition = { userId };
    if (unreadOnly === "true") {
      whereCondition.isRead = false;
    }

    const notifications = await Notification.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Issue,
          as: "issue",
          attributes: ["id", "title", "category", "status"],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        notifications: notifications.rows,
        total: notifications.count,
        unreadCount: await Notification.count({
          where: { userId, isRead: false },
        }),
      },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
});

// POST /api/notifications/mark-read - Mark notifications as read
router.post("/mark-read", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds, markAll = false } = req.body;

    if (markAll) {
      await Notification.update(
        { isRead: true },
        { where: { userId, isRead: false } },
      );
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await Notification.update(
        { isRead: true },
        {
          where: {
            id: notificationIds,
            userId,
          },
        },
      );
    } else {
      return res.status(400).json({
        success: false,
        message: "Please provide notificationIds array or set markAll to true",
      });
    }

    res.json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as read",
      error: error.message,
    });
  }
});

// POST /api/notifications/mark-unread - Mark notifications as unread
router.post("/mark-unread", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: "Please provide notificationIds array",
      });
    }

    await Notification.update(
      { isRead: false },
      {
        where: {
          id: notificationIds,
          userId,
        },
      },
    );

    res.json({
      success: true,
      message: "Notifications marked as unread",
    });
  } catch (error) {
    console.error("Mark notifications unread error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark notifications as unread",
      error: error.message,
    });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;

    const deleted = await Notification.destroy({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
});

// GET /api/notifications/unread-count - Get unread notifications count
router.get("/unread-count", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.count({
      where: { userId, isRead: false },
    });

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
});

// POST /api/notifications/create - Create a notification (admin/system use)
router.post("/create", requireAuth, async (req, res) => {
  try {
    // Only allow admin users to create notifications
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const { userId, title, message, type = "info", issueId } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "userId, title, and message are required",
      });
    }

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      issueId,
      isRead: false,
    });

    res.status(201).json({
      success: true,
      data: notification,
      message: "Notification created successfully",
    });
  } catch (error) {
    console.error("Create notification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notification",
      error: error.message,
    });
  }
});

// POST /api/notifications/bulk-create - Create notifications for multiple users
router.post("/bulk-create", requireAuth, async (req, res) => {
  try {
    // Only allow admin users to create notifications
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin role required.",
      });
    }

    const { userIds, title, message, type = "info", issueId } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "userIds array, title, and message are required",
      });
    }

    const notifications = userIds.map((userId) => ({
      userId,
      title,
      message,
      type,
      issueId,
      isRead: false,
    }));

    const createdNotifications = await Notification.bulkCreate(notifications);

    res.status(201).json({
      success: true,
      data: createdNotifications,
      message: `${createdNotifications.length} notifications created successfully`,
    });
  } catch (error) {
    console.error("Bulk create notifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create notifications",
      error: error.message,
    });
  }
});

module.exports = router;
