const express = require("express");
const { body, query, param, validationResult } = require("express-validator");
const { Op } = require("sequelize");
const multer = require("multer");
const path = require("path");
const {
  Issue,
  User,
  Department,
  Category,
  StatusUpdate,
} = require("../models");
const authMiddleware = require("../middleware/auth");
const uploadService = require("../services/UploadService");
const notificationService = require("../services/NotificationService");

const router = express.Router();



// Multer configuration for file uploads (accept any file field name and type)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files
  }
});

// Validation rules
const createIssueValidation = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5-200 characters"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description must be between 10-5000 characters"),

  body("category_id").isUUID().withMessage("Valid category ID is required"),

  body("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid priority level"),

  body("address_line_1")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Address line 1 cannot exceed 255 characters"),

  body("landmark")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Landmark cannot exceed 100 characters"),

  body("anonymous_report")
    .optional()
    .isBoolean()
    .withMessage("Anonymous report must be a boolean"),
];

const updateIssueValidation = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5-200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Description must be between 10-5000 characters"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid priority level"),
];

const statusUpdateValidation = [
  body("status")
    .isIn([
      "open",
      "acknowledged",
      "in_progress",
      "pending",
      "resolved",
      "closed",
      "rejected",
      "duplicate",
      "reopened",
      "escalated",
    ])
    .withMessage("Invalid status"),

  body("notes")
    .optional()
    .isLength({ max: 2000 })
    .withMessage("Notes cannot exceed 2000 characters"),

  body("resolution_notes")
    .optional()
    .isLength({ max: 5000 })
    .withMessage("Resolution notes cannot exceed 5000 characters"),
];

const assignIssueValidation = [
  body("assigned_department_id")
    .optional()
    .isUUID()
    .withMessage("Valid department ID is required"),

  body("assigned_user_id")
    .optional()
    .isUUID()
    .withMessage("Valid user ID is required"),

  body("notes")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Notes cannot exceed 1000 characters"),
];

/**
 * @route   GET /api/issues
 * @desc    Get all issues with filtering and pagination
 * @access  Private
 */
router.get(
  "/",
  authMiddleware.requireAuth,
  [
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Page must be a positive integer"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit must be between 1-100"),
    // ...existing code...
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const {
        page = 1,
        limit = 20,
        status,
        priority,
        category_id,
        assigned_department_id,
        assigned_user_id,
        city,
        search,
        sort_by = "created_at",
        sort_order = "DESC",
        my_issues,
        overdue,
        recent,
        location_lat,
        location_lng,
        radius = 5,
      } = req.query;

      // Build where conditions
      const whereConditions = {};

      // Filter by status
      if (status) {
        whereConditions.status = status;
      }

      // Filter by priority
      if (priority) {
        whereConditions.priority = priority;
      }

      // Filter by category
      if (category_id) {
        whereConditions.category_id = category_id;
      }

      // ...existing code for filtering, pagination, and response...
    } catch (error) {
      console.error("Get issues error:", error);
      res.status(500).json({
        error: "Failed to fetch issues",
        message: "An error occurred while fetching issues",
      });
    }
  }
);

/**
 * @route   GET /api/issues/community
 * @desc    Get issues within 2km of user's location
 * @access  Public
 */
router.get("/community", async (req, res) => {
  try {
    const { lat, lng, range = 2 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat/lng" });
    }
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(range);

    // Simple bounding box calculation
    const latRange = radiusKm / 111; // 1 degree lat ≈ 111 km
    const lngRange = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    // Find issues within bounding box
    const issues = await Issue.findAll({
      where: {
        latitude: { [Op.between]: [latitude - latRange, latitude + latRange] },
        longitude: { [Op.between]: [longitude - lngRange, longitude + lngRange] },
      },
      order: [["created_at", "DESC"]],
      limit: 50,
    });

    // Optionally, calculate actual distance for each issue
    const haversine = (lat1, lon1, lat2, lon2) => {
      const toRad = (v) => (v * Math.PI) / 180;
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    const filtered = issues
      .map((issue) => {
        const distance = haversine(latitude, longitude, issue.latitude, issue.longitude);
        return { ...issue.toJSON(), distance };
      })
      .filter((issue) => issue.distance <= radiusKm);

    res.json(filtered);
  } catch (err) {
    console.error("Community issues error:", err);
    res.status(500).json({ error: "Failed to fetch community issues" });
  }
});

/**
 * @route   POST /api/issues
 * @desc    Create a new issue
 * @access  Private
 */
router.post(
  "/",
  authMiddleware.requireAuth,
  upload.any(),
  createIssueValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const {
        title,
        description,
        category_id,
        latitude,
        longitude,
        address_line_1,
        address_line_2,
        landmark,
        city = "Ranchi",
        state = "Jharkhand",
        pincode,
        area,
        ward_number,
        priority,
        anonymous_report = false,
        voice_transcript,
        custom_fields,
        tags,
      } = req.body;

      // Validate category exists and is active
      const category = await Category.findOne({
        where: {
          id: category_id,
          is_active: true,
          is_public: true,
        },
        include: [
          {
            model: Department,
            as: "primaryDepartment",
            attributes: ["id", "name", "max_capacity", "current_workload"],
          },
        ],
      });

      if (!category) {
        return res.status(400).json({
          error: "Invalid category",
          message: "Category not found or not available for public reporting",
        });
      }

      // Check for potential duplicates
      const duplicates = await Issue.findPotentialDuplicates({
        category_id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      });

      // Upload media files if provided
      let mediaUrls = [];
      if (req.files && req.files.length > 0) {
        try {
          const uploadPromises = req.files.map((file) =>
            uploadService.uploadFile(file, "issues"),
          );
          mediaUrls = await Promise.all(uploadPromises);
        } catch (uploadError) {
          console.error("Media upload error:", uploadError);
          return res.status(400).json({
            error: "Media upload failed",
            message: "Failed to upload media files",
          });
        }
      }

      // Create the issue
      const issueData = {
        title,
        description,
        category_id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address_line_1,
        address_line_2,
        landmark,
        city,
        state,
        pincode,
        area,
        ward_number,
        priority: priority || category.default_priority,
        reported_by_id: req.user.id,
        anonymous_report,
        voice_transcript,
        media_urls: mediaUrls,
        custom_fields: custom_fields ? JSON.parse(custom_fields) : null,
        tags: tags ? JSON.parse(tags) : [],
        reported_via: "mobile_app", // or detect from headers
        device_info: {
          user_agent: req.get("User-Agent"),
          ip_address: req.ip,
        },
      };

      const issue = await Issue.create(issueData);

      // Load full issue data with relations
      const fullIssue = await Issue.findByPk(issue.id, {
        include: [
          {
            model: User,
            as: "reportedBy",
            attributes: ["id", "first_name", "last_name", "phone"],
          },
          {
            model: Category,
            as: "category",
            attributes: [
              "id",
              "name",
              "code",
              "color_code",
              "icon",
              "sla_hours",
            ],
          },
          {
            model: Department,
            as: "assignedDepartment",
            attributes: ["id", "name", "code", "phone", "email"],
            required: false,
          },
        ],
      });

      // Send notifications
      // Notify users in the same pincode (excluding the reporter)
      try {
        const UserModel = require('../models/mongodb/User');
        const NotificationService = require('../services/NotificationService');
        const usersInRange = await UserModel.find({ 'address.pincode': fullIssue.pincode, _id: { $ne: fullIssue.reported_by_id } });
        for (const user of usersInRange) {
          await NotificationService.sendNotification(user, 'issue_created', { issue: fullIssue });
        }
      } catch (notificationError) {
        console.error("Notification error:", notificationError);
      }

      res.status(201).json({
        message: "Issue created successfully",
        issue: fullIssue,
        potential_duplicates: duplicates.length,
        duplicates: duplicates.length > 0 ? duplicates.slice(0, 3) : [],
      });
    } catch (error) {
      console.error("Create issue error:", error);
      res.status(500).json({
        error: "Failed to create issue",
        message: "An error occurred while creating the issue",
      });
    }
  },
);

/**
 * @route   GET /api/issues/:id
 * @desc    Get a specific issue
 * @access  Private
 */
router.get(
  "/:id",
  authMiddleware.requireAuth,
  [param("id").isUUID().withMessage("Invalid issue ID")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const issue = await Issue.findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: "reportedBy",
            attributes: [
              "id",
              "first_name",
              "last_name",
              "phone",
              "reputation_score",
            ],
          },
          {
            model: Category,
            as: "category",
            attributes: [
              "id",
              "name",
              "code",
              "color_code",
              "icon",
              "sla_hours",
            ],
          },
          {
            model: Category,
            as: "subcategory",
            attributes: ["id", "name", "code"],
            required: false,
          },
          {
            model: Department,
            as: "assignedDepartment",
            attributes: ["id", "name", "code", "phone", "email"],
            required: false,
          },
          {
            model: User,
            as: "assignedUser",
            attributes: ["id", "first_name", "last_name", "phone", "email"],
            required: false,
          },
          {
            model: User,
            as: "resolvedBy",
            attributes: ["id", "first_name", "last_name"],
            required: false,
          },
          {
            model: StatusUpdate,
            as: "statusUpdates",
            where: { public_update: true },
            required: false,
            order: [["created_at", "ASC"]],
            include: [
              {
                model: User,
                as: "updatedBy",
                attributes: ["id", "first_name", "last_name", "role"],
              },
            ],
          },
        ],
      });

      if (!issue) {
        return res.status(404).json({
          error: "Issue not found",
          message: "The requested issue does not exist",
        });
      }

      // Check access permissions
      const canView =
        req.user.role === "citizen"
          ? issue.reported_by_id === req.user.id || !issue.anonymous_report
          : ["admin", "super_admin"].includes(req.user.role) ||
            issue.assigned_department_id === req.user.department_id ||
            issue.assigned_user_id === req.user.id;

      if (!canView) {
        return res.status(403).json({
          error: "Access denied",
          message: "You do not have permission to view this issue",
        });
      }

      // Increment view count
      await issue.increment("view_count");

      // Hide sensitive information for anonymous reports
      if (
        issue.anonymous_report &&
        req.user.role === "citizen" &&
        issue.reported_by_id !== req.user.id
      ) {
        issue.reportedBy = null;
      }

      res.json({
        issue,
      });
    } catch (error) {
      console.error("Get issue error:", error);
      res.status(500).json({
        error: "Failed to fetch issue",
        message: "An error occurred while fetching the issue",
      });
    }
  },
);

/**
 * @route   PUT /api/issues/:id
 * @desc    Update an issue
 * @access  Private
 */
router.put(
  "/:id",
  authMiddleware.requireAuth,
  [
    param("id").isUUID().withMessage("Invalid issue ID"),
    ...updateIssueValidation,
  ],
  authMiddleware.requireOwnership("reported_by_id"),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const issue = await Issue.findByPk(req.params.id);

      if (!issue) {
        return res.status(404).json({
          error: "Issue not found",
          message: "The requested issue does not exist",
        });
      }

      // Check if issue can be updated
      if (["resolved", "closed", "rejected"].includes(issue.status)) {
        return res.status(400).json({
          error: "Cannot update issue",
          message: "This issue has been resolved and cannot be updated",
        });
      }

      const { title, description, priority } = req.body;

      // Update issue
      await issue.update({
        title: title || issue.title,
        description: description || issue.description,
        priority: priority || issue.priority,
      });

      // Load updated issue with relations
      const updatedIssue = await Issue.findByPk(issue.id, {
        include: [
          {
            model: User,
            as: "reportedBy",
            attributes: ["id", "first_name", "last_name", "phone"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "code", "color_code", "icon"],
          },
        ],
      });

      res.json({
        message: "Issue updated successfully",
        issue: updatedIssue,
      });
    } catch (error) {
      console.error("Update issue error:", error);
      res.status(500).json({
        error: "Failed to update issue",
        message: "An error occurred while updating the issue",
      });
    }
  },
);

/**
 * @route   POST /api/issues/:id/status
 * @desc    Update issue status
 * @access  Private (Department staff and above)
 */
router.post(
  "/:id/status",
  authMiddleware.requireAuth,
  [
    param("id").isUUID().withMessage("Invalid issue ID"),
    ...statusUpdateValidation,
  ],
  authMiddleware.requireRole([
    "department_staff",
    "department_head",
    "admin",
    "super_admin",
  ]),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const issue = await Issue.findByPk(req.params.id, {
        include: [
          {
            model: Category,
            as: "category",
          },
        ],
      });

      if (!issue) {
        return res.status(404).json({
          error: "Issue not found",
          message: "The requested issue does not exist",
        });
      }

      // Check department access
      if (["department_staff", "department_head"].includes(req.user.role)) {
        if (issue.assigned_department_id !== req.user.department_id) {
          return res.status(403).json({
            error: "Access denied",
            message: "You can only update issues assigned to your department",
          });
        }
      }

      const { status, notes, resolution_notes } = req.body;

      // Update issue status
      await issue.updateStatus(status, req.user.id, notes);

      // Add resolution notes if provided
      if (status === "resolved" && resolution_notes) {
        issue.resolution_notes = resolution_notes;
        issue.resolved_by_id = req.user.id;
        await issue.save();
      }

      // Load updated issue
      const updatedIssue = await Issue.findByPk(issue.id, {
        include: [
          {
            model: User,
            as: "reportedBy",
            attributes: ["id", "first_name", "last_name", "phone"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "code", "color_code"],
          },
          {
            model: Department,
            as: "assignedDepartment",
            attributes: ["id", "name", "code"],
            required: false,
          },
        ],
      });

      // Send notifications
      try {
        await notificationService.sendStatusUpdateNotification(
          updatedIssue,
          status,
        );
      } catch (notificationError) {
        console.error("Notification error:", notificationError);
      }

      res.json({
        message: "Issue status updated successfully",
        issue: updatedIssue,
      });
    } catch (error) {
      console.error("Update status error:", error);
      res.status(500).json({
        error: "Failed to update status",
        message: "An error occurred while updating the issue status",
      });
    }
  },
);

/**
 * @route   POST /api/issues/:id/assign
 * @desc    Assign issue to department or user
 * @access  Private (Department head, Admin)
 */
router.post(
  "/:id/assign",
  authMiddleware.requireAuth,
  [
    param("id").isUUID().withMessage("Invalid issue ID"),
    ...assignIssueValidation,
  ],
  authMiddleware.requireRole(["department_head", "admin", "super_admin"]),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const issue = await Issue.findByPk(req.params.id);

      if (!issue) {
        return res.status(404).json({
          error: "Issue not found",
          message: "The requested issue does not exist",
        });
      }

      const { assigned_department_id, assigned_user_id, notes } = req.body;

      // Validate department
      if (assigned_department_id) {
        const department = await Department.findByPk(assigned_department_id);
        if (!department || !department.is_active) {
          return res.status(400).json({
            error: "Invalid department",
            message: "Department not found or inactive",
          });
        }

        // Check if department head can assign to this department
        if (
          req.user.role === "department_head" &&
          req.user.department_id !== assigned_department_id
        ) {
          return res.status(403).json({
            error: "Access denied",
            message: "You can only assign issues to your own department",
          });
        }
      }

      // Validate user
      if (assigned_user_id) {
        const assignedUser = await User.findByPk(assigned_user_id);
        if (!assignedUser || !assignedUser.is_active) {
          return res.status(400).json({
            error: "Invalid user",
            message: "User not found or inactive",
          });
        }

        // Ensure user belongs to the assigned department
        if (
          assigned_department_id &&
          assignedUser.department_id !== assigned_department_id
        ) {
          return res.status(400).json({
            error: "Invalid assignment",
            message: "User does not belong to the assigned department",
          });
        }
      }

      // Assign issue
      await issue.assignTo(
        assigned_department_id,
        req.user.id,
        assigned_user_id,
      );

      // Add assignment note
      if (notes) {
        await StatusUpdate.create({
          issue_id: issue.id,
          status: issue.status,
          previous_status: issue.status,
          updated_by_id: req.user.id,
          notes,
          change_reason: "assignment",
          assigned_department_id,
          assigned_to_id: assigned_user_id,
        });
      }

      // Load updated issue
      const updatedIssue = await Issue.findByPk(issue.id, {
        include: [
          {
            model: User,
            as: "reportedBy",
            attributes: ["id", "first_name", "last_name", "phone"],
          },
          {
            model: Category,
            as: "category",
            attributes: ["id", "name", "code", "color_code"],
          },
          {
            model: Department,
            as: "assignedDepartment",
            attributes: ["id", "name", "code", "phone"],
            required: false,
          },
          {
            model: User,
            as: "assignedUser",
            attributes: ["id", "first_name", "last_name", "phone"],
            required: false,
          },
        ],
      });

      res.json({
        message: "Issue assigned successfully",
        issue: updatedIssue,
      });
    } catch (error) {
      console.error("Assign issue error:", error);
      res.status(500).json({
        error: "Failed to assign issue",
        message: "An error occurred while assigning the issue",
      });
    }
  },
);

/**
 * @route   GET /api/issues/nearby
 * @desc    Find nearby issues
 * @access  Private
 */
router.get(
  "/nearby",
  authMiddleware.requireAuth,
  [
    query("latitude")
      .isFloat({ min: -90, max: 90 })
      .withMessage("Invalid latitude"),
    query("longitude")
      .isFloat({ min: -180, max: 180 })
      .withMessage("Invalid longitude"),
    query("radius")
      .optional()
      .isFloat({ min: 0.1, max: 50 })
      .withMessage("Radius must be between 0.1-50 km"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { latitude, longitude, radius = 5, limit = 10 } = req.query;

      const nearbyIssues = await Issue.findNearby(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius),
        {
          limit: parseInt(limit),
          include: [
            {
              model: Category,
              as: "category",
              attributes: ["id", "name", "code", "color_code", "icon"],
            },
            {
              model: Department,
              as: "assignedDepartment",
              attributes: ["id", "name", "code"],
              required: false,
            },
          ],
          order: [["created_at", "DESC"]],
        },
      );

      // Calculate distances
      const issuesWithDistance = nearbyIssues.map((issue) => ({
        ...issue.toJSON(),
        distance_km: issue.getDistanceFrom(
          parseFloat(latitude),
          parseFloat(longitude),
        ),
      }));

      res.json({
        issues: issuesWithDistance,
        search_params: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          radius: parseFloat(radius),
        },
      });
    } catch (error) {
      console.error("Nearby issues error:", error);
      res.status(500).json({
        error: "Failed to fetch nearby issues",
        message: "An error occurred while fetching nearby issues",
      });
    }
  },
);

/**
 * @route   POST /api/issues/:id/feedback
 * @desc    Submit feedback and rating for resolved issue
 * @access  Private
 */
router.post(
  "/:id/feedback",
  authMiddleware.requireAuth,
  [
    param("id").isUUID().withMessage("Invalid issue ID"),
    body("rating")
      .isInt({ min: 1, max: 5 })
      .withMessage("Rating must be between 1-5"),
    body("feedback")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Feedback cannot exceed 1000 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const issue = await Issue.findByPk(req.params.id);

      if (!issue) {
        return res.status(404).json({
          error: "Issue not found",
          message: "The requested issue does not exist",
        });
      }

      // Only the reporter can give feedback
      if (issue.reported_by_id !== req.user.id) {
        return res.status(403).json({
          error: "Access denied",
          message: "You can only provide feedback for your own issues",
        });
      }

      // Issue must be resolved to give feedback
      if (issue.status !== "resolved") {
        return res.status(400).json({
          error: "Issue not resolved",
          message: "Feedback can only be provided for resolved issues",
        });
      }

      // Check if feedback already given
      if (issue.citizen_rating) {
        return res.status(400).json({
          error: "Feedback already provided",
          message: "You have already provided feedback for this issue",
        });
      }

      const { rating, feedback } = req.body;

      // Update issue with feedback
      await issue.update({
        citizen_rating: rating,
        citizen_feedback: feedback,
        feedback_given_at: new Date(),
      });

      // Update user reputation score
      const user = await User.findByPk(req.user.id);
      if (user) {
        const newScore = Math.min(
          user.reputation_score + (rating >= 4 ? 1 : 0),
          100,
        );
        await user.update({ reputation_score: newScore });
      }

      res.json({
        message: "Feedback submitted successfully",
        rating,
        feedback,
      });
    } catch (error) {
      console.error("Submit feedback error:", error);
      res.status(500).json({
        error: "Failed to submit feedback",
        message: "An error occurred while submitting feedback",
      });
    }
  },
);

/**
 * @route   DELETE /api/issues/:id
 * @desc    Delete an issue (soft delete)
 * @access  Private
 */
router.delete(
  "/:id",
  authMiddleware.requireAuth,
  [param("id").isUUID().withMessage("Invalid issue ID")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const issue = await Issue.findByPk(req.params.id);

      if (!issue) {
        return res.status(404).json({
          error: "Issue not found",
          message: "The requested issue does not exist",
        });
      }

      // Check permissions
      const canDelete =
        req.user.role === "citizen"
          ? issue.reported_by_id === req.user.id &&
            ["draft", "open"].includes(issue.status)
          : ["admin", "super_admin"].includes(req.user.role);

      if (!canDelete) {
        return res.status(403).json({
          error: "Access denied",
          message: "You do not have permission to delete this issue",
        });
      }

      // Soft delete the issue
      await issue.destroy();

      res.json({
        message: "Issue deleted successfully",
      });
    } catch (error) {
      console.error("Delete issue error:", error);
      res.status(500).json({
        error: "Failed to delete issue",
        message: "An error occurred while deleting the issue",
      });
    }
  },
);

/**
 * @route   POST /api/issues/:id/duplicate
 * @desc    Mark issue as duplicate
 * @access  Private (Department staff and above)
 */
router.post(
  "/:id/duplicate",
  authMiddleware.requireAuth,
  [
    param("id").isUUID().withMessage("Invalid issue ID"),
    body("original_issue_id")
      .isUUID()
      .withMessage("Valid original issue ID is required"),
    body("notes")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Notes cannot exceed 1000 characters"),
  ],
  authMiddleware.requireRole([
    "department_staff",
    "department_head",
    "admin",
    "super_admin",
  ]),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const issue = await Issue.findByPk(req.params.id);
      const originalIssue = await Issue.findByPk(req.body.original_issue_id);

      if (!issue) {
        return res.status(404).json({
          error: "Issue not found",
          message: "The requested issue does not exist",
        });
      }

      if (!originalIssue) {
        return res.status(404).json({
          error: "Original issue not found",
          message: "The original issue does not exist",
        });
      }

      // Update issue as duplicate
      await issue.update({
        status: "duplicate",
        is_duplicate: true,
        original_issue_id: req.body.original_issue_id,
      });

      // Increment duplicate count on original issue
      await originalIssue.increment("duplicate_count");

      // Create status update
      await StatusUpdate.create({
        issue_id: issue.id,
        status: "duplicate",
        previous_status: issue.status,
        updated_by_id: req.user.id,
        notes:
          req.body.notes ||
          `Marked as duplicate of issue ${originalIssue.issue_number}`,
        change_reason: "duplicate_found",
      });

      res.json({
        message: "Issue marked as duplicate successfully",
        original_issue: {
          id: originalIssue.id,
          issue_number: originalIssue.issue_number,
          title: originalIssue.title,
        },
      });
    } catch (error) {
      console.error("Mark duplicate error:", error);
      res.status(500).json({
        error: "Failed to mark as duplicate",
        message: "An error occurred while marking the issue as duplicate",
      });
    }
  },
);

// Add my-issues route
router.get("/my-issues", authMiddleware.requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const issues = await Issue.findAll({
      where: { reported_by_id: userId },
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "icon", "color"],
        },
        {
          model: Department,
          as: "assignedDepartment",
          attributes: ["id", "name", "contactInfo"],
        },
        {
          model: StatusUpdate,
          as: "statusUpdates",
          order: [["createdAt", "DESC"]],
          limit: 1,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const stats = {
      total: issues.length,
      submitted: issues.filter((i) => i.status === "submitted").length,
      in_progress: issues.filter((i) => i.status === "in_progress").length,
      resolved: issues.filter((i) => i.status === "resolved").length,
      closed: issues.filter((i) => i.status === "closed").length,
    };

    res.json({
      success: true,
      data: {
        issues,
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching user issues:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch issues",
      error: error.message,
    });
  }
});

module.exports = router;
