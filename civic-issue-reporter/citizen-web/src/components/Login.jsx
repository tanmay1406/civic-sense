import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  Stack,
  Divider,
  Link as MuiLink,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  LocationOn,
  Login as LoginIcon,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loading, authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Get redirect path from location state
  const from = location.state?.from?.pathname || location.state?.from || "/";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear auth errors
    if (authError) {
      clearError?.();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const success = await login?.(formData.email, formData.password);
      if (success) {
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

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
      <Container maxWidth="sm">
        <Paper
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
              Welcome Back
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Sign in to report and track civic issues
            </Typography>
          </Box>

          {/* Form Section */}
          <Box sx={{ p: 4 }}>
            {(authError || Object.keys(errors).length > 0) && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
                {authError || "Please fix the errors below"}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color={errors.email ? "error" : "action"} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  autoComplete="current-password"
                  placeholder=""
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={
                    loading ? <CircularProgress size={20} /> : <LoginIcon />
                  }
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </Stack>
            </form>

            <Box sx={{ mt: 3, textAlign: "center" }}>
              <MuiLink
                component="button"
                variant="body2"
                sx={{ textDecoration: "none" }}
                onClick={() => {
                  // TODO: Implement forgot password
                  console.log("Forgot password clicked");
                }}
              >
                Forgot your password?
              </MuiLink>
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            <Box sx={{ textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Don't have an account?
              </Typography>
              <Button
                component={Link}
                to="/register"
                variant="outlined"
                fullWidth
                size="large"
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                }}
              >
                Create New Account
              </Button>
            </Box>

            {/* Quick Demo Login */}
            {process.env.NODE_ENV === "development" && (
              <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 2 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 1 }}
                >
                  Demo Credentials:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
                >
                  Email: citizen@demo.com
                  <br />
                  Password: demo123
                </Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => {
                    setFormData({
                      email: "citizen@demo.com",
                      password: "demo123",
                    });
                  }}
                  sx={{ mt: 1, fontSize: "0.75rem" }}
                >
                  Fill Demo Data
                </Button>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Footer Links */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            flexWrap="wrap"
          >
            <MuiLink
              component={Link}
              to="/"
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: "none" }}
            >
              Back to Home
            </MuiLink>
            <Typography variant="body2" color="text.secondary">
              •
            </Typography>
            <MuiLink
              href="tel:+916512234567"
              variant="body2"
              color="text.secondary"
              sx={{ textDecoration: "none" }}
            >
              Emergency: +91-651-223-4567
            </MuiLink>
          </Stack>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            Municipal Civic Issues Portal - Secure Login
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
