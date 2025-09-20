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
  Link as MuiLink,
  CircularProgress,
  useTheme,
  useMediaQuery,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Chip,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  LocationOn,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const Register = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loading, authError, clearError } = useAuth();

  // Get redirect path from location state
  const from = location.state?.from?.pathname || location.state?.from || "/";

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    {
      label: "Personal Information",
      description: "Enter your basic details",
    },
    {
      label: "Account Security",
      description: "Set up your login credentials",
    },
    {
      label: "Terms & Verification",
      description: "Accept terms and verify details",
    },
  ];

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

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Personal Information
        if (!formData.firstName.trim()) {
          newErrors.firstName = "First name is required";
        } else if (formData.firstName.trim().length < 2) {
          newErrors.firstName = "First name must be at least 2 characters";
        }

        if (!formData.lastName.trim()) {
          newErrors.lastName = "Last name is required";
        } else if (formData.lastName.trim().length < 2) {
          newErrors.lastName = "Last name must be at least 2 characters";
        }

        if (!formData.email.trim()) {
          newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }

        if (!formData.phone.trim()) {
          newErrors.phone = "Phone number is required";
        } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
          newErrors.phone = "Please enter a valid 10-digit mobile number";
        }
        break;

      case 1: // Account Security
        if (!formData.password) {
          newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
          newErrors.password = "Password must be at least 6 characters";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
          newErrors.password =
            "Password must contain at least one uppercase letter, one lowercase letter, and one number";
        }

        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
        break;

      case 2: // Terms & Verification
        if (!acceptTerms) {
          newErrors.acceptTerms = "You must accept the terms and conditions";
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all steps with debugging
    console.log("Starting registration submission...");
    console.log("Form data:", formData);

    const validationResults = [0, 1, 2].map((step) => {
      const isStepValid = validateStep(step);
      console.log(`Step ${step} validation:`, isStepValid ? "PASSED" : "FAILED");
      if (!isStepValid) {
        console.log(`Step ${step} errors:`, errors);
      }
      return isStepValid;
    });

    const isValid = validationResults.every(result => result);
    console.log("Overall validation:", isValid ? "PASSED" : "FAILED");

    if (!isValid) {
      console.log("Validation failed, not submitting");
      return;
    }

    try {
      console.log("Calling register function...");
      const success = await register?.(formData);
      if (success) {
        console.log("Registration successful, navigating to email verification...");
        navigate("/verify-email", {
          state: { email: formData.email },
          replace: true
        });
      } else {
        console.log("Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
    }
  };

  const handleTogglePasswordVisibility = (field) => {
    if (field === "password") {
      setShowPassword((prev) => !prev);
    } else {
      setShowConfirmPassword((prev) => !prev);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color={errors.firstName ? "error" : "action"} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color={errors.lastName ? "error" : "action"} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email || "This will be your login email"}
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
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                error={!!errors.phone}
                helperText={errors.phone || "10-digit mobile number starting with 6-9"}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color={errors.phone ? "error" : "action"} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              error={!!errors.password}
              helperText={
                errors.password ||
                "Must contain at least 6 characters with uppercase, lowercase, and number"
              }
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color={errors.password ? "error" : "action"} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => handleTogglePasswordVisibility("password")}
                      edge="end"
                      disabled={loading}
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

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color={errors.confirmPassword ? "error" : "action"} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        handleTogglePasswordVisibility("confirmPassword")
                      }
                      edge="end"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
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

            {/* Password Strength Indicator */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Password Strength:
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                {Array.from({ length: 4 }).map((_, index) => {
                  const strength = getPasswordStrength(formData.password);
                  return (
                    <Box
                      key={index}
                      sx={{
                        height: 4,
                        flex: 1,
                        borderRadius: 2,
                        bgcolor:
                          index < strength
                            ? strength < 2
                              ? "error.main"
                              : strength < 3
                                ? "warning.main"
                                : "success.main"
                            : "grey.300",
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          </Stack>
        );

      case 2:
        return (
          <Stack spacing={3}>
            <Paper sx={{ p: 3, bgcolor: "grey.50" }}>
              <Typography variant="h6" gutterBottom>
                Review Your Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Name:
                  </Typography>
                  <Typography variant="body1">
                    {formData.firstName} {formData.lastName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email:
                  </Typography>
                  <Typography variant="body1">{formData.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Phone:
                  </Typography>
                  <Typography variant="body1">{formData.phone || "Not provided"}</Typography>
                </Grid>
              </Grid>
            </Paper>

            <FormControlLabel
              control={
                <Checkbox
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{" "}
                  <MuiLink href="#" sx={{ textDecoration: "none" }}>
                    Terms of Service
                  </MuiLink>{" "}
                  and{" "}
                  <MuiLink href="#" sx={{ textDecoration: "none" }}>
                    Privacy Policy
                  </MuiLink>
                </Typography>
              }
              sx={{ alignItems: "flex-start" }}
            />

            {errors.acceptTerms && (
              <Alert severity="error">{errors.acceptTerms}</Alert>
            )}

            <Alert severity="info">
              <Typography variant="body2">
                <strong>Data Protection:</strong> Your personal information is
                encrypted and securely stored. We only use your data to provide
                civic services and will never share it with third parties
                without your consent.
              </Typography>
            </Alert>
          </Stack>
        );

      default:
        return null;
    }
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    return strength;
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
      <Container maxWidth="md">
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
              Join Our Community
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Create an account to start reporting civic issues
            </Typography>
          </Box>

          {/* Form Section */}
          <Box sx={{ p: 4 }}>
            {authError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
                {authError}
              </Alert>
            )}

            {/* Stepper */}
            <Stepper
              activeStep={activeStep}
              orientation={isMobile ? "vertical" : "horizontal"}
              sx={{ mb: 4 }}
            >
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepLabel>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {step.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: 4 }}>{renderStepContent(activeStep)}</Box>

              {/* Navigation Buttons */}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Button
                  color="inherit"
                  disabled={activeStep === 0 || loading}
                  onClick={handleBack}
                >
                  Back
                </Button>

                <Box sx={{ flex: "1 1 auto" }} />

                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                  >
                    {loading ? "Creating Account..." : "Complete Registration"}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </form>

            {/* Login Link */}
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Typography variant="body2">
                Already have an account?{" "}
                <MuiLink component={Link} to="/login" state={{ from }}>
                  Sign in here
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
