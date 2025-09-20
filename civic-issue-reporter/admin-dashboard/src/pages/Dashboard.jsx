import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

const Dashboard = () => {
  const [stats, setStats] = useState([
    { title: "Total Issues", value: 0, color: "#1976d2" },
    { title: "Pending Issues", value: 0, color: "#ff9800" },
    { title: "Resolved Issues", value: 0, color: "#4caf50" },
    { title: "Active Departments", value: 0, color: "#9c27b0" },
  ]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch stats and recent issues from backend API
    Promise.all([
      axios.get("/api/analytics/overview"), // Example endpoint for stats
      axios.get("/api/issues", { params: { limit: 5, sort: "desc" } }),
    ])
      .then(([statsRes, issuesRes]) => {
        const overview = statsRes.data;
        setStats([
          {
            title: "Total Issues",
            value: overview.totalIssues,
            color: "#1976d2",
          },
          {
            title: "Pending Issues",
            value: overview.pendingIssues,
            color: "#ff9800",
          },
          {
            title: "Resolved Issues",
            value: overview.resolvedIssues,
            color: "#4caf50",
          },
          {
            title: "Active Departments",
            value: overview.activeDepartments,
            color: "#9c27b0",
          },
        ]);
        setRecentIssues(issuesRes.data);
      })
      .catch(() => {
        setRecentIssues([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {stat.title}
                </Typography>
                <Typography
                  variant="h4"
                  component="div"
                  sx={{ color: stat.color }}
                >
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Issues
            </Typography>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Location</TableCell>
                      <TableCell>Reported At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentIssues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No recent issues found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentIssues.map((issue) => (
                        <TableRow key={issue.id}>
                          <TableCell>{issue.id}</TableCell>
                          <TableCell>{issue.category}</TableCell>
                          <TableCell>{issue.status}</TableCell>
                          <TableCell>
                            {issue.location
                              ? `${issue.location.lat}, ${issue.location.lng}`
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {issue.createdAt
                              ? new Date(issue.createdAt).toLocaleString()
                              : ""}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Quick action buttons will be displayed here
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
