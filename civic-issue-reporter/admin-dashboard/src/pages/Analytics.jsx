import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Grid,
  Snackbar,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import axios from "axios";

const COLORS = [
  "#1976d2",
  "#ff9800",
  "#4caf50",
  "#9c27b0",
  "#e91e63",
  "#00bcd4",
];

const Analytics = () => {
  const [categoryData, setCategoryData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [deptPerfData, setDeptPerfData] = useState([]);
  const [resolutionTimeData, setResolutionTimeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      axios.get("/api/analytics/categories"),
      axios.get("/api/analytics/resolution"),
      axios.get("/api/analytics/trends"),
      axios.get("/api/analytics/department-performance"),
      axios.get("/api/analytics/resolution-times"),
    ])
      .then(([catRes, statusRes, trendRes, deptPerfRes, resTimeRes]) => {
        setCategoryData(catRes.data || []);
        setStatusData(statusRes.data || []);
        setTrendData(trendRes.data || []);
        setDeptPerfData(deptPerfRes.data || []);
        setResolutionTimeData(resTimeRes.data || []);
      })
      .catch(() => setSnackbar("Failed to fetch analytics data"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ mt: 2, maxWidth: 1200, margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Analytics & Reports
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Issues by Category
            </Typography>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <XAxis dataKey="category" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Issue Resolution Status
            </Typography>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Issues Reported Over Time
            </Typography>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid stroke="#ccc" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#1976d2" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Department Performance (Resolved Issues)
            </Typography>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptPerfData}>
                  <XAxis dataKey="department" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="resolved" fill="#4caf50" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Average Resolution Time (hrs) by Category
            </Typography>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={resolutionTimeData}>
                  <XAxis dataKey="category" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="avgResolutionHours" fill="#ff9800" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar("")}
        message={snackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

export default Analytics;
