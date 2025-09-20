import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Paper,
  Stack,
  Avatar,
  Chip,
  LinearProgress,
  Fab,
  Alert,
  Skeleton,
} from "@mui/material";
import {
  ReportProblem,
  List as ListIcon,
  TrendingUp,
  CheckCircle,
  Schedule,
  LocationOn,
  Phone,
  Email,
  ArrowForward,
  Add,
  Speed,
  Security,
  Public,
} from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchStats = async () => {
      // Simulate API call
      setTimeout(() => {
        setStats({
          totalIssues: 1247,
          resolvedIssues: 892,
          inProgress: 234,
          avgResolutionTime: "2.3 days",
          resolutionRate: 71.5,
        });
        setLoading(false);
      }, 1500);
    };

    fetchStats();
  }, []);

  const quickActions = [
    {
      title: "Report New Issue",
      description: "Submit a civic issue with photos and location",
      icon: <ReportProblem />,
      color: "primary",
      path: "/report",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      title: "My Issues",
      description: "Track status of your reported issues",
      icon: <ListIcon />,
      color: "secondary",
      path: "/my-issues",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      title: "View Statistics",
      description: "See community impact and resolution trends",
      icon: <TrendingUp />,
      color: "success",
      path: "/statistics",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
  ];

  const features = [
    {
      icon: <Speed />,
      title: "Quick Response",
      description:
        "Issues are routed to relevant departments automatically for faster resolution",
    },
    {
      icon: <LocationOn />,
      title: "GPS Location",
      description:
        "Precise location tracking helps authorities locate and resolve issues quickly",
    },
    {
      icon: <Security />,
      title: "Secure & Private",
      description:
        "Your personal information and issue details are kept secure and confidential",
    },
    {
      icon: <Public />,
      title: "Transparent Process",
      description:
        "Real-time updates and complete visibility into issue resolution progress",
    },
  ];

  const issueCategories = [
    {
      name: "Roads & Infrastructure",
      count: 456,
      icon: "🛣️",
      color: "#FF6B6B",
      issues: ["Potholes", "Street Lights", "Traffic Signals"],
    },
    {
      name: "Waste Management",
      count: 312,
      icon: "🗑️",
      color: "#4ECDC4",
      issues: ["Garbage Collection", "Illegal Dumping", "Recycling"],
    },
    {
      name: "Water & Sanitation",
      count: 234,
      icon: "💧",
      color: "#45B7D1",
      issues: ["Water Supply", "Drainage", "Sewage"],
    },
    {
      name: "Public Safety",
      count: 189,
      icon: "🛡️",
      color: "#96CEB4",
      issues: ["Street Crime", "Traffic Issues", "Emergency"],
    },
  ];

  const recentNews = [
    {
      title: "Smart City Initiative Launched",
      summary:
        "New digital platform improves citizen services and issue resolution",
      image: "/api/placeholder/300/200",
      date: "Dec 15, 2024",
    },
    {
      title: "Road Infrastructure Upgrades",
      summary:
        "Major roads in city center to be upgraded with better lighting and drainage",
      image: "/api/placeholder/300/200",
      date: "Dec 12, 2024",
    },
    {
      title: "Waste Management Improvements",
      summary:
        "New recycling centers opened in residential areas for better waste segregation",
      image: "/api/placeholder/300/200",
      date: "Dec 10, 2024",
    },
  ];

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton
            variant="rectangular"
            height={300}
            sx={{ borderRadius: 2, mb: 4 }}
          />
          <Grid container spacing={3}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} md={4} key={item}>
                <Skeleton
                  variant="rectangular"
                  height={200}
                  sx={{ borderRadius: 2 }}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          py: { xs: 6, md: 8 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                component="h1"
                sx={{
                  fontWeight: 700,
                  mb: 2,
                  fontSize: { xs: "2.5rem", md: "3.5rem" },
                }}
              >
                Make Your City Better
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  mb: 4,
                  opacity: 0.9,
                  fontWeight: 400,
                  fontSize: { xs: "1.1rem", md: "1.5rem" },
                }}
              >
                Report civic issues, track their progress, and contribute to
                your community's development
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button
                  component={Link}
                  to="/report"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: "white",
                    color: "primary.main",
                    "&:hover": {
                      bgcolor: "grey.100",
                    },
                    px: 4,
                    py: 1.5,
                  }}
                  startIcon={<ReportProblem />}
                >
                  Report Issue
                </Button>
                <Button
                  component={Link}
                  to="/my-issues"
                  variant="outlined"
                  size="large"
                  sx={{
                    color: "white",
                    borderColor: "white",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                      borderColor: "white",
                    },
                    px: 4,
                    py: 1.5,
                  }}
                  startIcon={<ListIcon />}
                >
                  My Issues
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: "center" }}>
                <img
                  src="/api/placeholder/500/400"
                  alt="Civic Services Illustration"
                  style={{
                    width: "100%",
                    maxWidth: 500,
                    height: "auto",
                    borderRadius: 16,
                    boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.2)",
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>

        {/* Floating Stats */}
        <Container maxWidth="lg" sx={{ mt: 6 }}>
          <Grid container spacing={2}>
            {[
              {
                label: "Total Issues",
                value: stats?.totalIssues.toLocaleString(),
                icon: <ReportProblem />,
              },
              {
                label: "Resolved",
                value: stats?.resolvedIssues.toLocaleString(),
                icon: <CheckCircle />,
              },
              {
                label: "In Progress",
                value: stats?.inProgress.toLocaleString(),
                icon: <Schedule />,
              },
              {
                label: "Avg Resolution",
                value: stats?.avgResolutionTime,
                icon: <Speed />,
              },
            ].map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Paper
                  sx={{
                    p: 2,
                    textAlign: "center",
                    bgcolor: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    borderRadius: 3,
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      mx: "auto",
                      mb: 1,
                      width: { xs: 40, md: 48 },
                      height: { xs: 40, md: 48 },
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: "text.primary",
                      fontSize: { xs: "1rem", md: "1.25rem" },
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ fontSize: { xs: "0.7rem", md: "0.75rem" } }}
                  >
                    {stat.label}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Quick Actions */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{ fontWeight: 700, mb: 4, textAlign: "center" }}
          >
            Quick Actions
          </Typography>
          <Grid container spacing={3}>
            {quickActions.map((action, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    background: action.gradient,
                    color: "white",
                    cursor: "pointer",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0px 20px 40px rgba(0, 0, 0, 0.2)",
                    },
                    borderRadius: 4,
                  }}
                  onClick={() => navigate(action.path)}
                >
                  <CardContent sx={{ p: 4, textAlign: "center" }}>
                    <Avatar
                      sx={{
                        bgcolor: "rgba(255, 255, 255, 0.2)",
                        mx: "auto",
                        mb: 3,
                        width: 64,
                        height: 64,
                      }}
                    >
                      {action.icon}
                    </Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      {action.title}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, mb: 3 }}>
                      {action.description}
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{
                        color: "white",
                        borderColor: "white",
                        "&:hover": {
                          bgcolor: "rgba(255, 255, 255, 0.1)",
                        },
                      }}
                      endIcon={<ArrowForward />}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Issue Categories */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{ fontWeight: 700, mb: 4, textAlign: "center" }}
          >
            Issue Categories
          </Typography>
          <Grid container spacing={3}>
            {issueCategories.map((category, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    cursor: "pointer",
                    transition: "transform 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                    },
                    borderRadius: 3,
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="h2" sx={{ mb: 2 }}>
                      {category.icon}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {category.name}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: category.color, mb: 2 }}
                    >
                      {category.count}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Issues Reported
                    </Typography>
                    <Stack spacing={1}>
                      {category.issues.map((issue, idx) => (
                        <Chip
                          key={idx}
                          label={issue}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: "0.7rem" }}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Features Section */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{ fontWeight: 700, mb: 6, textAlign: "center" }}
          >
            Why Choose Our Platform?
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                  <Avatar
                    sx={{
                      bgcolor: "primary.main",
                      mr: 3,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {feature.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ lineHeight: 1.7 }}
                    >
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Progress Overview */}
        <Paper sx={{ p: 4, mb: 8, borderRadius: 4 }}>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, mb: 4, textAlign: "center" }}
          >
            Community Impact
          </Typography>
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Issue Resolution Progress
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {stats?.resolutionRate}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={stats?.resolutionRate}
              sx={{ height: 10, borderRadius: 5 }}
            />
          </Box>
          <Grid container spacing={3} sx={{ textAlign: "center" }}>
            <Grid item xs={4}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "success.main" }}
              >
                {stats?.resolvedIssues.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Issues Resolved
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "warning.main" }}
              >
                {stats?.inProgress.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                In Progress
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography
                variant="h3"
                sx={{ fontWeight: 700, color: "primary.main" }}
              >
                {stats?.avgResolutionTime}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Resolution Time
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* Recent News */}
        <Box sx={{ mb: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            sx={{ fontWeight: 700, mb: 4, textAlign: "center" }}
          >
            Latest Updates
          </Typography>
          <Grid container spacing={3}>
            {recentNews.map((news, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: "100%", borderRadius: 3 }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={news.image}
                    alt={news.title}
                    sx={{ bgcolor: "grey.200" }}
                  />
                  <CardContent>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mb: 1, display: "block" }}
                    >
                      {news.date}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {news.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {news.summary}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Emergency Contact */}
        <Alert
          severity="info"
          sx={{
            mb: 6,
            borderRadius: 3,
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Emergency Issues?
              </Typography>
              <Typography variant="body2">
                For urgent civic issues requiring immediate attention
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<Phone />}
                href="tel:+916512234567"
                size="small"
              >
                Call Emergency
              </Button>
              <Button
                variant="outlined"
                startIcon={<Email />}
                href="mailto:emergency@civicissues.gov"
                size="small"
              >
                Email
              </Button>
            </Stack>
          </Box>
        </Alert>
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="report issue"
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
        onClick={() => navigate("/report")}
      >
        <Add />
      </Fab>
    </Box>
  );
};

export default Home;
