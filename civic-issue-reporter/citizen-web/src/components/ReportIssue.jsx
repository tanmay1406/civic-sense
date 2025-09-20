import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  TextField,
  Typography,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Stack,
  Divider,
  Container,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Avatar,
  IconButton,
  Fade,
  Zoom,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  PhotoCamera,
  MyLocation,
  Send,
  CheckCircle,
  Error,
  Delete,
  LocationOn,
  Description,
  Image,
  ArrowBack,
  ArrowForward,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import VoiceRecorder from "./VoiceRecorder";

const ReportIssue = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { apiRequest, isAuthenticated } = useAuth();

  // Form states
  const [activeStep, setActiveStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState("");
  const [audioFile, setAudioFile] = useState(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState(null);

  const priorityOptions = [
    {
      value: "low",
      label: "Low Priority",
      color: "success",
      description: "Non-urgent issues",
    },
    {
      value: "medium",
      label: "Medium Priority",
      color: "warning",
      description: "Regular maintenance",
    },
    {
      value: "high",
      label: "High Priority",
      color: "error",
      description: "Urgent issues",
    },
    {
      value: "critical",
      label: "Critical",
      color: "error",
      description: "Emergency situations",
    },
  ];

  const steps = [
    {
      label: "Issue Details",
      description: "Provide basic information about the issue",
      icon: <Description />,
    },
    {
      label: "Add Media",
      description: "Upload photos or record voice description",
      icon: <Image />,
    },
    {
      label: "Location",
      description: "Set the precise location of the issue",
      icon: <LocationOn />,
    },
    {
      label: "Review & Submit",
      description: "Review your report and submit",
      icon: <Send />,
    },
  ];

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await apiRequest("/categories/active");
        if (data && data.data && Array.isArray(data.data.categories)) {
          setCategories(data.data.categories);
        } else {
          // Fallback categories
          setCategories([
            {
              _id: 1,
              name: "Road and Infrastructure",
              description: "Potholes, street lights, traffic signals",
              icon: "🚗",
              color: "#FF6B6B",
            },
            {
              _id: 2,
              name: "Waste Management",
              description: "Garbage collection, illegal dumping",
              icon: "🗑️",
              color: "#96CEB4",
            },
            {
              _id: 3,
              name: "Water and Sanitation",
              description: "Water supply, drainage issues",
              icon: "💧",
              color: "#4ECDC4",
            },
            {
              _id: 4,
              name: "Electricity",
              description: "Power outages, street lights",
              icon: "💡",
              color: "#45B7D1",
            },
            {
              _id: 5,
              name: "Public Safety",
              description: "Security, emergency situations",
              icon: "🚨",
              color: "#FFEAA7",
            },
          ]);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        // Fallback categories on error
        setCategories([
          { _id: 1, name: "Road and Infrastructure", icon: "🚗" },
          { _id: 2, name: "Waste Management", icon: "🗑️" },
          { _id: 3, name: "Water and Sanitation", icon: "💧" },
          { _id: 4, name: "Electricity", icon: "💡" },
          { _id: 5, name: "Public Safety", icon: "🚨" },
        ]);
      }
    };

    if (isAuthenticated) {
      fetchCategories();
    }
  }, [apiRequest, isAuthenticated]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError(
              "Location permission denied. Please enable location access.",
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setError("Location information unavailable.");
            break;
          case error.TIMEOUT:
            setError("Location request timed out.");
            break;
          default:
            setError("An unknown error occurred while retrieving location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size should be less than 10MB.");
        return;
      }

      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleVoiceTranscription = (transcription) => {
    setVoiceTranscription(transcription);
    if (!description.trim()) {
      setDescription(transcription);
    } else {
      setDescription(
        (prev) => prev + "\n\n[Voice Recording]: " + transcription,
      );
    }
  };

  const handleAudioFile = (blob) => {
    setAudioFile(blob);
  };

  const validateStep = (step) => {
    switch (step) {
      case 0: // Issue Details
        if (!category) {
          setError("Please select a category.");
          return false;
        }
        if (!title.trim()) {
          setError("Please provide a title for the issue.");
          return false;
        }
        if (!description.trim()) {
          setError("Please provide a description of the issue.");
          return false;
        }
        break;
      case 1: // Add Media (optional)
        break;
      case 2: // Location
        if (!location) {
          setError("Please set the location of the issue.");
          return false;
        }
        break;
      case 3: // Review
        break;
      default:
        break;
    }
    setError("");
    return true;
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

    if (!isAuthenticated) {
      setError("Please log in to report an issue.");
      navigate("/login");
      return;
    }

    if (!validateStep(2)) return;

    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData();
    // Find the selected category object to get its id
    const selectedCategory = categories.find(
      (cat) => cat.name === category || cat._id === category || cat.id === category
    );
    if (selectedCategory && (selectedCategory.id || selectedCategory._id)) {
      formData.append("category_id", selectedCategory.id || selectedCategory._id);
    } else {
      setError("Please select a valid category.");
      setLoading(false);
      return;
    }
    formData.append("title", title);
    formData.append("description", description);
    formData.append("priority", priority);

    if (photo) formData.append("photo", photo);
    if (audioFile) formData.append("audio", audioFile, "voice_recording.webm");
    if (voiceTranscription)
      formData.append("voiceTranscription", voiceTranscription);

    if (location) {
      formData.append("latitude", location.latitude);
      formData.append("longitude", location.longitude);
      if (location.accuracy) formData.append("accuracy", location.accuracy);
    }

    try {
      const data = await apiRequest("/issues", {
        method: "POST",
        body: formData,
      });

      if (!data.success && !data.issue && !data.id) {
        throw new Error(
          data.message || data.error || "Failed to submit issue.",
        );
      }

      setSuccess(true);
      setSubmissionId(data.issue?.id || data.id);

      // Reset form
      setCategory("");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setPhoto(null);
      setPhotoPreview(null);
      setLocation(null);
      setVoiceTranscription("");
      setAudioFile(null);
      setActiveStep(0);
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel id="category-label">Category *</InputLabel>
              <Select
                labelId="category-label"
                value={category}
                label="Category *"
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((cat) => (
                    <MenuItem
                      key={cat._id || cat.id || cat.name}
                      value={cat.name}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {cat.icon && <span>{cat.icon}</span>}
                        <Box>
                          <Typography variant="body1">{cat.name}</Typography>
                          {cat.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {cat.description}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      Loading categories...
                    </Typography>
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            <TextField
              label="Issue Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              fullWidth
              placeholder="Brief description of the issue"
              helperText="Provide a clear, concise title for the issue"
            />

            <TextField
              label="Detailed Description *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              multiline
              rows={4}
              fullWidth
              placeholder="Describe the issue in detail"
              helperText="Include specific details, impact, and any relevant context"
            />

            <FormControl fullWidth>
              <InputLabel id="priority-label">Priority Level</InputLabel>
              <Select
                labelId="priority-label"
                value={priority}
                label="Priority Level"
                onChange={(e) => setPriority(e.target.value)}
              >
                {priorityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Chip
                        size="small"
                        label={option.label}
                        color={option.color}
                        sx={{ mr: 2 }}
                      />
                      <Typography variant="caption">
                        {option.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        );

      case 1:
        return (
          <Stack spacing={3}>
            {/* Photo Upload */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Photo Evidence
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Add a photo to help authorities understand the issue better
                </Typography>

                {!photoPreview ? (
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<PhotoCamera />}
                    fullWidth
                    sx={{ py: 2 }}
                  >
                    Upload Photo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handlePhotoChange}
                    />
                  </Button>
                ) : (
                  <Box sx={{ position: "relative" }}>
                    <img
                      src={photoPreview}
                      alt="Issue preview"
                      style={{
                        width: "100%",
                        maxHeight: 300,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                    <IconButton
                      onClick={removePhoto}
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        bgcolor: "error.main",
                        color: "white",
                        "&:hover": { bgcolor: "error.dark" },
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Divider sx={{ my: 2 }}>
              <Typography variant="body2" color="text.secondary">
                OR
              </Typography>
            </Divider>

            {/* Voice Recording */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Voice Description
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Record a voice message to describe the issue
                </Typography>
                <VoiceRecorder
                  onTranscription={handleVoiceTranscription}
                  onAudioFile={handleAudioFile}
                  disabled={loading}
                />
              </CardContent>
            </Card>
          </Stack>
        );

      case 2:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Issue Location
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Set the precise location where the issue is occurring
              </Typography>

              <Button
                variant={location ? "outlined" : "contained"}
                color={location ? "success" : "primary"}
                onClick={handleGetLocation}
                disabled={locationLoading}
                fullWidth
                startIcon={
                  locationLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <MyLocation />
                  )
                }
                sx={{ mb: 2, py: 1.5 }}
              >
                {locationLoading
                  ? "Getting Location..."
                  : location
                    ? "Location Set - Click to Update"
                    : "Get Current Location"}
              </Button>

              {location && (
                <Paper sx={{ p: 2, bgcolor: "success.50" }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <CheckCircle color="success" />
                    <Typography variant="subtitle2" color="success.main">
                      Location Captured
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Latitude: {location.latitude.toFixed(6)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Longitude: {location.longitude.toFixed(6)}
                  </Typography>
                  {location.accuracy && (
                    <Typography variant="caption" color="text.secondary">
                      Accuracy: ±{Math.round(location.accuracy)}m
                    </Typography>
                  )}
                </Paper>
              )}

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Privacy Note:</strong> Location data is used only to
                  help authorities locate and resolve the issue. It will not be
                  shared with third parties.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Review Your Report
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please review all details before submitting
              </Typography>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1">{category}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Title
                  </Typography>
                  <Typography variant="body1">{title}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1">{description}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Priority
                  </Typography>
                  <Chip
                    label={
                      priorityOptions.find((p) => p.value === priority)?.label
                    }
                    color={
                      priorityOptions.find((p) => p.value === priority)?.color
                    }
                    size="small"
                  />
                </Box>

                {photoPreview && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Photo Attached
                    </Typography>
                    <img
                      src={photoPreview}
                      alt="Issue"
                      style={{
                        width: "100%",
                        maxHeight: 200,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  </Box>
                )}

                {voiceTranscription && (
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      Voice Transcription
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography variant="body2">
                        {voiceTranscription}
                      </Typography>
                    </Paper>
                  </Box>
                )}

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body2">
                    {location
                      ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                      : "No location set"}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  if (success) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Zoom in={success}>
          <Paper
            sx={{
              p: 4,
              textAlign: "center",
              borderRadius: 3,
              background: "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
              color: "white",
            }}
          >
            <CheckCircle sx={{ fontSize: 80, mb: 3 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
              Issue Reported Successfully!
            </Typography>
            <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
              Thank you for reporting this civic issue. Your submission helps
              make our community better.
            </Typography>
            {submissionId && (
              <Typography variant="body2" sx={{ mb: 4, opacity: 0.8 }}>
                Reference ID: #{submissionId}
              </Typography>
            )}
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                onClick={() => navigate("/my-issues")}
                sx={{ bgcolor: "white", color: "success.main" }}
              >
                Track Progress
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setSuccess(false);
                  setActiveStep(0);
                }}
                sx={{ color: "white", borderColor: "white" }}
              >
                Report Another Issue
              </Button>
            </Stack>
          </Paper>
        </Zoom>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ overflow: "hidden", borderRadius: 3 }}>
        <Box
          sx={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Report Civic Issue
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Help improve your community by reporting civic issues
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          {error && (
            <Fade in={!!error}>
              <Alert
                severity="error"
                onClose={() => setError("")}
                sx={{ mb: 3 }}
                icon={<Error />}
              >
                {error}
              </Alert>
            </Fade>
          )}

          <Stepper
            activeStep={activeStep}
            orientation={isMobile ? "vertical" : "horizontal"}
          >
            {steps.map((step, index) => (
              <Step key={index}>
                <StepLabel
                  icon={
                    <Avatar
                      sx={{
                        bgcolor:
                          index <= activeStep ? "primary.main" : "grey.300",
                        width: 40,
                        height: 40,
                      }}
                    >
                      {step.icon}
                    </Avatar>
                  }
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {step.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepLabel>
                {isMobile && (
                  <StepContent>
                    <Box sx={{ mt: 2 }}>{renderStepContent(index)}</Box>
                  </StepContent>
                )}
              </Step>
            ))}
          </Stepper>

          {!isMobile && (
            <Box sx={{ mt: 4 }}>{renderStepContent(activeStep)}</Box>
          )}

          <Box sx={{ display: "flex", flexDirection: "row", pt: 4 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<ArrowBack />}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Box sx={{ flex: "1 1 auto" }} />

            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Send />}
                size="large"
                sx={{ px: 4 }}
              >
                {loading ? "Submitting..." : "Submit Issue"}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                size="large"
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ReportIssue;
