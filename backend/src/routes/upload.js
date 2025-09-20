const express = require("express");
const router = express.Router();

// POST /api/upload - Upload files
router.post("/", (req, res) => {
  res.json({
    success: true,
    message: "File upload endpoint - coming soon",
  });
});

module.exports = router;
