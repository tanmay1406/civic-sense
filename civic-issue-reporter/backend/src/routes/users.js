const express = require("express");
const router = express.Router();

// GET /api/users - Get all users (admin only)
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Users endpoint - coming soon",
    data: [],
  });
});

// GET /api/users/profile - Get current user profile
router.get("/profile", (req, res) => {
  res.json({
    success: true,
    message: "User profile endpoint - coming soon",
    data: {},
  });
});

// PUT /api/users/profile - Update current user profile
router.put("/profile", (req, res) => {
  res.json({
    success: true,
    message: "Update user profile endpoint - coming soon",
  });
});

module.exports = router;
