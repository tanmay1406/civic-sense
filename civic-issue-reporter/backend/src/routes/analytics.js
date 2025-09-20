const express = require("express");
const router = express.Router();
const { Issue, User, Department, Category } = require("../models");
const { Op } = require("sequelize");

// GET /api/analytics - Get analytics data
router.get("/", async (req, res) => {
  try {
    const { timeframe = "30" } = req.query; // days
    const daysAgo = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Total counts
    const totalIssues = await Issue.count();
    const totalUsers = await User.count({ where: { role: "citizen" } });
    const totalDepartments = await Department.count();

    // Issues by status
    const issuesByStatus = await Issue.findAll({
      attributes: [
        "status",
        [Issue.sequelize.fn("COUNT", Issue.sequelize.col("id")), "count"],
      ],
      group: ["status"],
      raw: true,
    });

    // Issues by category
    const issuesByCategory = await Issue.findAll({
      attributes: [
        "category",
        [Issue.sequelize.fn("COUNT", Issue.sequelize.col("id")), "count"],
      ],
      group: ["category"],
      raw: true,
      order: [[Issue.sequelize.literal("count"), "DESC"]],
      limit: 10,
    });

    // Recent issues trend (last 7 days)
    const recentIssuesTrend = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const count = await Issue.count({
          where: {
            createdAt: {
              [Op.gte]: startOfDay,
              [Op.lt]: endOfDay,
            },
          },
        });

        return {
          date: startOfDay.toISOString().split("T")[0],
          count,
        };
      }),
    );

    // Resolution time statistics
    const resolvedIssues = await Issue.findAll({
      where: { status: "resolved" },
      attributes: ["createdAt", "updatedAt"],
      raw: true,
    });

    const resolutionTimes = resolvedIssues.map((issue) => {
      const created = new Date(issue.createdAt);
      const resolved = new Date(issue.updatedAt);
      return Math.floor((resolved - created) / (1000 * 60 * 60 * 24)); // days
    });

    const avgResolutionTime =
      resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

    // Issues in selected timeframe
    const recentIssues = await Issue.count({
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
      },
    });

    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(previousPeriodStart.getDate() - daysAgo * 2);
    previousPeriodStart.setDate(previousPeriodStart.getDate() + daysAgo);

    const previousIssues = await Issue.count({
      where: {
        createdAt: {
          [Op.gte]: previousPeriodStart,
          [Op.lt]: startDate,
        },
      },
    });

    const issuesGrowthRate =
      previousIssues > 0
        ? ((recentIssues - previousIssues) / previousIssues) * 100
        : 0;

    // Department performance
    const departmentPerformance = await Department.findAll({
      attributes: [
        "name",
        [
          Issue.sequelize.literal(`(
            SELECT COUNT(*)
            FROM issues
            WHERE issues.assignedDepartment = departments.name
          )`),
          "totalAssigned",
        ],
        [
          Issue.sequelize.literal(`(
            SELECT COUNT(*)
            FROM issues
            WHERE issues.assignedDepartment = departments.name
            AND issues.status = 'resolved'
          )`),
          "resolved",
        ],
      ],
      raw: true,
    });

    // Add resolution rate to department performance
    const departmentStats = departmentPerformance.map((dept) => ({
      name: dept.name,
      totalAssigned: parseInt(dept.totalAssigned) || 0,
      resolved: parseInt(dept.resolved) || 0,
      resolutionRate:
        dept.totalAssigned > 0
          ? ((dept.resolved / dept.totalAssigned) * 100).toFixed(1)
          : 0,
    }));

    // Priority distribution
    const priorityDistribution = await Issue.findAll({
      attributes: [
        "priority",
        [Issue.sequelize.fn("COUNT", Issue.sequelize.col("id")), "count"],
      ],
      group: ["priority"],
      raw: true,
    });

    const analytics = {
      summary: {
        totalIssues,
        totalUsers,
        totalDepartments,
        recentIssues,
        issuesGrowthRate: parseFloat(issuesGrowthRate.toFixed(2)),
        avgResolutionTime: parseFloat(avgResolutionTime.toFixed(1)),
      },
      charts: {
        issuesByStatus: issuesByStatus.map((item) => ({
          status: item.status,
          count: parseInt(item.count),
        })),
        issuesByCategory: issuesByCategory.map((item) => ({
          category: item.category,
          count: parseInt(item.count),
        })),
        recentIssuesTrend: recentIssuesTrend.reverse(),
        priorityDistribution: priorityDistribution.map((item) => ({
          priority: item.priority || "medium",
          count: parseInt(item.count),
        })),
      },
      departmentPerformance: departmentStats,
      timeframe: {
        days: daysAgo,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics data",
      error: error.message,
    });
  }
});

// GET /api/analytics/summary - Get quick summary stats
router.get("/summary", async (req, res) => {
  try {
    const [totalIssues, pendingIssues, resolvedIssues, inProgressIssues] =
      await Promise.all([
        Issue.count(),
        Issue.count({ where: { status: "submitted" } }),
        Issue.count({ where: { status: "resolved" } }),
        Issue.count({ where: { status: "in_progress" } }),
      ]);

    res.json({
      success: true,
      data: {
        totalIssues,
        pendingIssues,
        resolvedIssues,
        inProgressIssues,
        resolutionRate:
          totalIssues > 0
            ? ((resolvedIssues / totalIssues) * 100).toFixed(1)
            : 0,
      },
    });
  } catch (error) {
    console.error("Analytics summary error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics summary",
      error: error.message,
    });
  }
});

module.exports = router;
