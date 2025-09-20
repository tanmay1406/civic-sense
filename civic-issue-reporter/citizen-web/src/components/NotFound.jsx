import React from "react";
import {
  Box,
  Typography,
  Button,
  Container,
  Paper,
  Stack,
} from "@mui/material";
import { Home, ArrowBack, SearchOff, ReportProblem } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        py: 8,
      }}
    >
      <Container maxWidth="md">
        <Paper
          sx={{
            p: { xs: 4, md: 6 },
            textAlign: "center",
            borderRadius: 4,
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background decoration */}
          <Box
            sx={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: "50%",
              bgcolor: "rgba(255, 255, 255, 0.1)",
              opacity: 0.3,
            }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: -30,
              left: -30,
              width: 150,
              height: 150,
              borderRadius: "50%",
              bgcolor: "rgba(255, 255, 255, 0.05)",
              opacity: 0.5,
            }}
          />

          <Box sx={{ position: "relative", zIndex: 1 }}>
            <SearchOff
              sx={{
                fontSize: { xs: 80, md: 120 },
                mb: 3,
                opacity: 0.9,
              }}
            />

            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "4rem", md: "6rem" },
                mb: 2,
                textShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
              }}
            >
              404
            </Typography>

            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 600,
                mb: 3,
                fontSize: { xs: "1.5rem", md: "2rem" },
              }}
            >
              Page Not Found
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mb: 4,
                opacity: 0.9,
                maxWidth: 500,
                mx: "auto",
                fontSize: { xs: "1rem", md: "1.1rem" },
                lineHeight: 1.6,
              }}
            >
              The page you're looking for doesn't exist or has been moved. Don't
              worry, you can still report civic issues and help improve your
              community!
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              justifyContent="center"
              sx={{ mb: 4 }}
            >
              <Button
                component={Link}
                to="/"
                variant="contained"
                size="large"
                startIcon={<Home />}
                sx={{
                  bgcolor: "white",
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: "grey.100",
                    transform: "translateY(-2px)",
                  },
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
              >
                Go Home
              </Button>

              <Button
                onClick={() => navigate(-1)}
                variant="outlined"
                size="large"
                startIcon={<ArrowBack />}
                sx={{
                  color: "white",
                  borderColor: "white",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "white",
                    transform: "translateY(-2px)",
                  },
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
              >
                Go Back
              </Button>

              <Button
                component={Link}
                to="/report"
                variant="outlined"
                size="large"
                startIcon={<ReportProblem />}
                sx={{
                  color: "white",
                  borderColor: "white",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 0.1)",
                    borderColor: "white",
                    transform: "translateY(-2px)",
                  },
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                }}
              >
                Report Issue
              </Button>
            </Stack>

            <Typography
              variant="caption"
              sx={{
                opacity: 0.7,
                fontSize: "0.9rem",
              }}
            >
              Error Code: 404 | Page Not Found
            </Typography>
          </Box>
        </Paper>

        {/* Quick Links */}
        <Box sx={{ mt: 6, textAlign: "center" }}>
          <Typography
            variant="h6"
            sx={{ mb: 3, color: "text.secondary", fontWeight: 600 }}
          >
            Quick Links
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            justifyContent="center"
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography
                component={Link}
                to="/report"
                variant="body2"
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                Report New Issue
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                Submit civic problems
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                component={Link}
                to="/my-issues"
                variant="body2"
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                My Issues
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                Track your reports
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="body2"
                sx={{
                  color: "primary.main",
                  textDecoration: "none",
                  fontWeight: 500,
                  cursor: "pointer",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
                onClick={() => (window.location.href = "tel:+916512234567")}
              >
                Emergency Contact
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                +91-651-223-4567
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFound;
