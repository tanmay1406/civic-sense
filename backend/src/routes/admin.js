const express = require("express");
const router = express.Router();

// GET /api/admin/dashboard - Get dashboard stats
router.get("/dashboard", (req, res) => {
  res.json({
    success: true,
    message: "Admin dashboard endpoint - coming soon",
    data: {
      totalIssues: 0,
      pendingIssues: 0,
      resolvedIssues: 0,
      departments: 0,
    },
  });
});

// GET /api/admin/issues - Get all issues for admin
router.get("/issues", (req, res) => {
  res.json({
    success: true,
    message: "Admin issues endpoint - coming soon",
    data: [],
  });
});

module.exports = router;
