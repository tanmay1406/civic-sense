const Joi = require("joi");
const { BadRequest } = require("../utils/errors");

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Property to validate ('body', 'query', 'params')
 */
const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property]);

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");

      return next(new BadRequest(errorMessage));
    }

    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // User registration validation
  userRegistration: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(128).required(),
    phoneNumber: Joi.string()
      .pattern(/^\+?[\d\s-()]{10,15}$/)
      .required(),
    role: Joi.string()
      .valid("citizen", "admin", "department_staff")
      .default("citizen"),
  }),

  // User login validation
  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Issue creation validation
  issueCreation: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(1000).required(),
    categoryId: Joi.string().uuid().required(),
    location: Joi.object({
      latitude: Joi.number().min(-90).max(90).required(),
      longitude: Joi.number().min(-180).max(180).required(),
      address: Joi.string().max(500).optional(),
    }).required(),
    priority: Joi.string().valid("low", "medium", "high").default("medium"),
    isAnonymous: Joi.boolean().default(false),
  }),

  // Issue update validation
  issueUpdate: Joi.object({
    status: Joi.string()
      .valid("pending", "in_progress", "resolved", "rejected")
      .optional(),
    priority: Joi.string().valid("low", "medium", "high").optional(),
    assignedDepartmentId: Joi.string().uuid().optional(),
    adminNotes: Joi.string().max(500).optional(),
  }),

  // Status update validation
  statusUpdate: Joi.object({
    status: Joi.string()
      .valid("pending", "in_progress", "resolved", "rejected")
      .required(),
    message: Joi.string().min(5).max(500).required(),
    estimatedResolution: Joi.date().greater("now").optional(),
  }),

  // Category validation
  category: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    departmentId: Joi.string().uuid().required(),
    isActive: Joi.boolean().default(true),
  }),

  // Department validation
  department: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional(),
    email: Joi.string().email().required(),
    phoneNumber: Joi.string()
      .pattern(/^\+?[\d\s-()]{10,15}$/)
      .required(),
    isActive: Joi.boolean().default(true),
  }),

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),

  // UUID parameter validation
  uuidParam: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

module.exports = {
  validate,
  schemas,
};
