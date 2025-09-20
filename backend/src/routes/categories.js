const express = require("express");
const { body, query, param, validationResult } = require("express-validator");
const { Category, Department } = require("../models");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

// Validation rules
const createCategoryValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ max: 100 })
    .withMessage("Category name cannot exceed 100 characters"),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Category code is required")
    .isLength({ max: 10 })
    .withMessage("Category code cannot exceed 10 characters")
    .matches(/^[A-Z_]+$/)
    .withMessage(
      "Category code must contain only uppercase letters and underscores",
    ),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("icon")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage("Icon cannot exceed 10 characters"),
  body("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Color must be a valid hex color code"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Priority must be one of: low, medium, high, critical"),
  body("estimatedResolutionTime.value")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Estimated resolution time value must be a positive integer"),
  body("estimatedResolutionTime.unit")
    .optional()
    .isIn(["hours", "days", "weeks"])
    .withMessage(
      "Estimated resolution time unit must be one of: hours, days, weeks",
    ),
];

const updateCategoryValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty")
    .isLength({ max: 100 })
    .withMessage("Category name cannot exceed 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("icon")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage("Icon cannot exceed 10 characters"),
  body("color")
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage("Color must be a valid hex color code"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Priority must be one of: low, medium, high, critical"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

/**
 * @route GET /api/categories
 * @desc Get all active categories
 * @access Public (but might want to protect later)
 */
router.get("/", async (req, res) => {
  try {
    const { includeInactive = false, includeStats = false } = req.query;

    const whereCondition = includeInactive === "true" ? {} : { isActive: true };

    const categories = await Category.find(whereCondition)
      .populate({
        path: "departmentMapping.department",
        select: "name code contactInfo",
      })
      .sort({ order: 1, name: 1 });

    // Include statistics if requested
    let categoriesWithStats = categories;
    if (includeStats === "true") {
      categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          await category.updateStatistics();
          return category;
        }),
      );
    }

    res.json({
      success: true,
      data: {
        categories: categoriesWithStats,
        total: categoriesWithStats.length,
      },
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/categories/active
 * @desc Get only active and visible categories
 * @access Public
 */
router.get("/active", async (req, res) => {
  try {
    const categories = await Category.getActiveCategories();

    res.json({
      success: true,
      data: {
        categories,
        total: categories.length,
      },
    });
  } catch (error) {
    console.error("Error fetching active categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active categories",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/categories/emergency
 * @desc Get emergency categories
 * @access Public
 */
router.get("/emergency", async (req, res) => {
  try {
    const categories = await Category.getEmergencyCategories();

    res.json({
      success: true,
      data: {
        categories,
        total: categories.length,
      },
    });
  } catch (error) {
    console.error("Error fetching emergency categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch emergency categories",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/categories/search
 * @desc Search categories by query
 * @access Public
 */
router.get(
  "/search",
  [
    query("q")
      .trim()
      .notEmpty()
      .withMessage("Search query is required")
      .isLength({ min: 2 })
      .withMessage("Search query must be at least 2 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { q } = req.query;
      const categories = await Category.searchCategories(q);

      res.json({
        success: true,
        data: {
          categories,
          total: categories.length,
          query: q,
        },
      });
    } catch (error) {
      console.error("Error searching categories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search categories",
        error: error.message,
      });
    }
  },
);

/**
 * @route GET /api/categories/department/:departmentId
 * @desc Get categories handled by a specific department
 * @access Protected
 */
router.get(
  "/department/:departmentId",
  authMiddleware.requireAuth,
  [param("departmentId").isMongoId().withMessage("Invalid department ID")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { departmentId } = req.params;
      const categories = await Category.getCategoriesByDepartment(departmentId);

      res.json({
        success: true,
        data: {
          categories,
          total: categories.length,
          departmentId,
        },
      });
    } catch (error) {
      console.error("Error fetching categories by department:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories for department",
        error: error.message,
      });
    }
  },
);

/**
 * @route GET /api/categories/suggest
 * @desc Auto-suggest category based on title and description
 * @access Protected
 */
router.get(
  "/suggest",
  authMiddleware.requireAuth,
  [
    query("title")
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage("Title must be at least 3 characters"),
    query("description")
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage("Description must be at least 10 characters"),
  ],
  async (req, res) => {
    try {
      const { title = "", description = "" } = req.query;

      if (!title && !description) {
        return res.status(400).json({
          success: false,
          message: "Either title or description is required for suggestion",
        });
      }

      const suggestions = await Category.suggestCategory(title, description);

      res.json({
        success: true,
        data: {
          suggestions,
          total: suggestions.length,
        },
      });
    } catch (error) {
      console.error("Error suggesting categories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to suggest categories",
        error: error.message,
      });
    }
  },
);

/**
 * @route GET /api/categories/stats
 * @desc Get category statistics
 * @access Protected (Admin only)
 */
router.get(
  "/stats",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["admin", "super_admin"]),
  async (req, res) => {
    try {
      const stats = await Category.getCategoryStatistics();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Error fetching category statistics:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch category statistics",
        error: error.message,
      });
    }
  },
);

/**
 * @route GET /api/categories/:id
 * @desc Get single category by ID
 * @access Public
 */
router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid category ID")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const category = await Category.findById(req.params.id)
        .populate({
          path: "departmentMapping.department",
          select: "name code contactInfo",
        })
        .populate("parentCategory", "name code")
        .populate("createdBy", "firstName lastName email")
        .populate("updatedBy", "firstName lastName email");

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      res.json({
        success: true,
        data: { category },
      });
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch category",
        error: error.message,
      });
    }
  },
);

/**
 * @route POST /api/categories
 * @desc Create new category
 * @access Protected (Admin only)
 */
router.post(
  "/",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["admin", "super_admin"]),
  createCategoryValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const categoryData = {
        ...req.body,
        createdBy: req.user.id,
      };

      const category = new Category(categoryData);
      await category.save();

      res.status(201).json({
        success: true,
        message: "Category created successfully",
        data: { category },
      });
    } catch (error) {
      console.error("Error creating category:", error);

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
          success: false,
          message: `Category ${field} already exists`,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to create category",
        error: error.message,
      });
    }
  },
);

/**
 * @route PUT /api/categories/:id
 * @desc Update category
 * @access Protected (Admin only)
 */
router.put(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["admin", "super_admin"]),
  [param("id").isMongoId().withMessage("Invalid category ID")],
  updateCategoryValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const updateData = {
        ...req.body,
        updatedBy: req.user.id,
      };

      const category = await Category.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true },
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      res.json({
        success: true,
        message: "Category updated successfully",
        data: { category },
      });
    } catch (error) {
      console.error("Error updating category:", error);

      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
          success: false,
          message: `Category ${field} already exists`,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to update category",
        error: error.message,
      });
    }
  },
);

/**
 * @route POST /api/categories/:id/subcategory
 * @desc Add subcategory to a category
 * @access Protected (Admin only)
 */
router.post(
  "/:id/subcategory",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["admin", "super_admin"]),
  [
    param("id").isMongoId().withMessage("Invalid category ID"),
    body("name").trim().notEmpty().withMessage("Subcategory name is required"),
    body("description").optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      await category.addSubcategory(req.body);

      res.status(201).json({
        success: true,
        message: "Subcategory added successfully",
        data: { category },
      });
    } catch (error) {
      console.error("Error adding subcategory:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add subcategory",
        error: error.message,
      });
    }
  },
);

/**
 * @route DELETE /api/categories/:id
 * @desc Delete category (soft delete - mark as inactive)
 * @access Protected (Admin only)
 */
router.delete(
  "/:id",
  authMiddleware.requireAuth,
  authMiddleware.requireRole(["admin", "super_admin"]),
  [param("id").isMongoId().withMessage("Invalid category ID")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const category = await Category.findByIdAndUpdate(
        req.params.id,
        {
          isActive: false,
          isVisible: false,
          updatedBy: req.user.id,
        },
        { new: true },
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }

      res.json({
        success: true,
        message: "Category deactivated successfully",
        data: { category },
      });
    } catch (error) {
      console.error("Error deactivating category:", error);
      res.status(500).json({
        success: false,
        message: "Failed to deactivate category",
        error: error.message,
      });
    }
  },
);

module.exports = router;
