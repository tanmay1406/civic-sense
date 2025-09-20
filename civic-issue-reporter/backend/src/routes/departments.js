const express = require("express");
const router = express.Router();

// GET /api/departments - Get all departments
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Departments endpoint - coming soon",
    data: [],
  });
});

// POST /api/departments - Create new department (admin only)
router.post("/", (req, res) => {
  res.json({
    success: true,
    message: "Create department endpoint - coming soon",
  });
});

module.exports = router;
