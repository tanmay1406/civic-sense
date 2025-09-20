import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Divider,
  Container,
  Fade,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Login as LoginIcon,
  PersonAdd,
  LocationOn,
  ArrowBack,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";

const AuthSelection = () => {
  const [selectedAuth, setSelectedAuth] = useState(null); // null, 'login', 'register'
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const location = useLocation();

  // Get the original destination from location state
  const from =
    location.state?.from?.pathname || location.state?.from || "/report";

  const handleBackToSelection = () => {
    setSelectedAuth(null);
  };

  // If user selected login or register, show the respective component
  if (selectedAuth === "login") {
    return (
      <Box>
        <Box sx={{ p: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackToSelection}
            sx={{ mb: 2 }}
          >
            Back to options
          </Button>
        </Box>
        <Login />
      </Box>
    );
  }

  if (selectedAuth === "register") {
    return (
      <Box>
        <Box sx={{ p: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBackToSelection}
            sx={{ mb: 2 }}
          >
            Back to options
          </Button>
        </Box>
        <Register />
      </Box>
    );
  }

  // Default auth selection screen
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Fade in timeout={800}>
          <Card
            elevation={3}
            sx={{
              borderRadius: 4,
              overflow: "hidden",
              background: "white",
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                p: 4,
                textAlign: "center",
              }}
            >
              <LocationOn sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                Authentication Required
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Please login or create an account to continue
              </Typography>
              {from !== "/" && (
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  You'll be redirected to: {from}
                </Typography>
              )}
            </Box>

            {/* Auth Options Section */}
            <CardContent sx={{ p: 4 }}>
              <Stack spacing={3}>
                {/* Login Option */}
                <Card
                  variant="outlined"
                  sx={{
                    p: 3,
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      boxShadow: 2,
                      transform: "translateY(-2px)",
                      borderColor: "primary.main",
                    },
                  }}
                  onClick={() => setSelectedAuth("login")}
                >
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "primary.main",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <LoginIcon fontSize="large" />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        Login to Your Account
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Already have an account? Sign in with your email and
                        password
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                <Divider>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>

                {/* Register Option */}
                <Card
                  variant="outlined"
                  sx={{
                    p: 3,
                    cursor: "pointer",
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      boxShadow: 2,
                      transform: "translateY(-2px)",
                      borderColor: "secondary.main",
                    },
                  }}
                  onClick={() => setSelectedAuth("register")}
                >
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "secondary.main",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PersonAdd fontSize="large" />
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        Create New Account
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        New to our platform? Create an account to start
                        reporting civic issues
                      </Typography>
                    </Box>
                  </Stack>
                </Card>

                {/* Quick Action Buttons */}
                <Box sx={{ mt: 4 }}>
                  <Stack
                    direction={isMobile ? "column" : "row"}
                    spacing={2}
                    sx={{ mt: 3 }}
                  >
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth={isMobile}
                      startIcon={<LoginIcon />}
                      onClick={() => setSelectedAuth("login")}
                      sx={{
                        py: 1.5,
                        fontWeight: 600,
                      }}
                    >
                      Login
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      fullWidth={isMobile}
                      startIcon={<PersonAdd />}
                      onClick={() => setSelectedAuth("register")}
                      sx={{
                        py: 1.5,
                        fontWeight: 600,
                      }}
                    >
                      Register
                    </Button>
                  </Stack>
                </Box>

                {/* Additional Info */}
                <Box
                  sx={{
                    mt: 4,
                    p: 3,
                    bgcolor: "grey.50",
                    borderRadius: 2,
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy. Your civic engagement helps build a better
                    community.
                  </Typography>
                </Box>

                {/* Go Back to Home */}
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <Button
                    component={Link}
                    to="/"
                    variant="text"
                    color="inherit"
                    sx={{ textTransform: "none" }}
                  >
                    ← Back to Home
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
};

export default AuthSelection;
