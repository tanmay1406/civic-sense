import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Chip,
  Button,
  Avatar,
  Divider,
  LinearProgress,
  Stack,
  Alert,
  IconButton,
  Collapse,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from "@mui/lab";
import {
  CheckCircle,
  RadioButtonUnchecked,
  Schedule,
  Assignment,
  Build,
  Verified,
  Person,
  Phone,
  Email,
  ExpandMore,
  ExpandLess,
  Refresh,
  Comment,
} from "@mui/icons-material";

const IssueProgressTracker = ({ issueId, issue, onRefresh }) => {
  const [statusUpdates, setStatusUpdates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedDetails, setExpandedDetails] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const statusConfig = {
    submitted: {
      label: "Submitted",
      color: "info",
      icon: <Schedule />,
      description: "Your issue has been submitted and is awaiting review.",
    },
    under_review: {
      label: "Under Review",
      color: "warning",
      icon: <Assignment />,
      description: "Municipal authorities are reviewing your issue.",
    },
    assigned: {
      label: "Assigned",
      color: "secondary",
      icon: <Person />,
      description: "Issue has been assigned to the relevant department.",
    },
    in_progress: {
      label: "In Progress",
      color: "primary",
      icon: <Build />,
      description: "Department is actively working on resolving the issue.",
    },
    resolved: {
      label: "Resolved",
      color: "success",
      icon: <CheckCircle />,
      description: "Issue has been resolved by the department.",
    },
    verified: {
      label: "Verified",
      color: "success",
      icon: <Verified />,
      description: "Resolution has been verified and confirmed.",
    },
    closed: {
      label: "Closed",
      color: "default",
      icon: <CheckCircle />,
      description: "Issue is officially closed.",
    },
  };

  const steps = useMemo(
    () => [
      "submitted",
      "under_review",
      "assigned",
      "in_progress",
      "resolved",
      "verified",
    ],
    [],
  );

  const fetchStatusUpdates = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/issues/${issueId}/status-updates`);
      if (!response.ok) {
        throw new Error("Failed to fetch status updates");
      }

      const data = await response.json();
      setStatusUpdates(data.statusUpdates || []);
    } catch (err) {
      console.error("Error fetching status updates:", err);
      setError("Failed to load status updates");
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    if (issueId) {
      fetchStatusUpdates();
    }
  }, [issueId, fetchStatusUpdates]);

  useEffect(() => {
    if (issue?.status) {
      const currentStepIndex = steps.indexOf(issue.status);
      setActiveStep(currentStepIndex >= 0 ? currentStepIndex : 0);
    }
  }, [issue?.status, steps]);

  const getProgressPercentage = () => {
    if (!issue?.status) return 0;
    const stepIndex = steps.indexOf(issue.status);
    return stepIndex >= 0 ? ((stepIndex + 1) / steps.length) * 100 : 0;
  };

  const getStatusColor = (status) => {
    return statusConfig[status]?.color || "default";
  };

  const getStatusIcon = (status) => {
    return statusConfig[status]?.icon || <RadioButtonUnchecked />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffMinutes > 0)
      return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const getEstimatedResolutionTime = () => {
    if (!issue?.category || !issue?.createdAt) return null;

    // Mock SLA times based on category (in hours)
    const slaHours = {
      "Road and Infrastructure": 48,
      "Waste Management": 24,
      "Water and Sanitation": 12,
      Electricity: 8,
      "Public Safety": 2,
    };

    const categoryHours = slaHours[issue.category] || 48;
    const createdDate = new Date(issue.createdAt);
    const estimatedResolution = new Date(
      createdDate.getTime() + categoryHours * 60 * 60 * 1000,
    );

    return estimatedResolution;
  };

  const isOverdue = () => {
    const estimatedTime = getEstimatedResolutionTime();
    if (
      !estimatedTime ||
      issue?.status === "resolved" ||
      issue?.status === "verified"
    ) {
      return false;
    }
    return new Date() > estimatedTime;
  };

  if (!issue) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Issue Progress Tracker
          </Typography>
          <Typography color="text.secondary">No issue selected</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Issue Progress Tracker</Typography>
          <IconButton
            onClick={onRefresh || fetchStatusUpdates}
            disabled={loading}
          >
            <Refresh />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {/* Issue Summary */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Issue #{issue.id}: {issue.title || issue.category}
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            sx={{ mb: 2 }}
          >
            <Chip
              icon={getStatusIcon(issue.status)}
              label={statusConfig[issue.status]?.label || issue.status}
              color={getStatusColor(issue.status)}
              variant="outlined"
            />
            {issue.priority && (
              <Chip
                label={`${issue.priority} Priority`}
                color={
                  issue.priority === "high"
                    ? "error"
                    : issue.priority === "medium"
                      ? "warning"
                      : "default"
                }
                size="small"
              />
            )}
            {isOverdue() && <Chip label="Overdue" color="error" size="small" />}
          </Stack>

          {/* Progress Bar */}
          <Box sx={{ mb: 2 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Math.round(getProgressPercentage())}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={getProgressPercentage()}
              sx={{ height: 8, borderRadius: 4 }}
              color={isOverdue() ? "error" : "primary"}
            />
          </Box>

          {statusConfig[issue.status]?.description && (
            <Typography variant="body2" color="text.secondary">
              {statusConfig[issue.status].description}
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Status Timeline */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Status Timeline
          </Typography>

          <Stepper
            activeStep={activeStep}
            orientation="vertical"
            sx={{ mt: 2 }}
          >
            {steps.map((step, index) => {
              const isCompleted = steps.indexOf(issue.status) >= index;
              const isCurrent = steps.indexOf(issue.status) === index;

              return (
                <Step key={step} completed={isCompleted}>
                  <StepLabel
                    icon={getStatusIcon(step)}
                    sx={{
                      "& .MuiStepLabel-iconContainer": {
                        color: isCompleted
                          ? `${getStatusColor(step)}.main`
                          : "text.disabled",
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      color={isCompleted ? "text.primary" : "text.secondary"}
                    >
                      {statusConfig[step]?.label}
                    </Typography>
                  </StepLabel>
                  {isCurrent && (
                    <StepContent>
                      <Typography variant="caption" color="text.secondary">
                        Current status since {formatDate(issue.updatedAt)}
                      </Typography>
                    </StepContent>
                  )}
                </Step>
              );
            })}
          </Stepper>
        </Box>

        {/* Estimated Resolution Time */}
        {getEstimatedResolutionTime() &&
          issue.status !== "resolved" &&
          issue.status !== "verified" && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Estimated Resolution
              </Typography>
              <Typography
                variant="body2"
                color={isOverdue() ? "error.main" : "text.secondary"}
              >
                {isOverdue() ? "Overdue by " : "Expected by "}
                {formatDate(getEstimatedResolutionTime())}
              </Typography>
            </Box>
          )}

        {/* Assigned Department/Person */}
        {issue.assignedDepartment && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Assigned To
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: "primary.main" }}>
                <Person />
              </Avatar>
              <Box>
                <Typography variant="body2">
                  {issue.assignedDepartment}
                </Typography>
                {issue.assignedUser && (
                  <Typography variant="caption" color="text.secondary">
                    {issue.assignedUser.name}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        )}

        {/* Detailed Updates */}
        {statusUpdates.length > 0 && (
          <Box>
            <Button
              startIcon={expandedDetails ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setExpandedDetails(!expandedDetails)}
              sx={{ mb: 2 }}
            >
              Detailed Updates ({statusUpdates.length})
            </Button>

            <Collapse in={expandedDetails}>
              <Timeline>
                {statusUpdates.map((update, index) => (
                  <TimelineItem key={update.id || index}>
                    <TimelineSeparator>
                      <TimelineDot color={getStatusColor(update.status)}>
                        {getStatusIcon(update.status)}
                      </TimelineDot>
                      {index < statusUpdates.length - 1 && (
                        <TimelineConnector />
                      )}
                    </TimelineSeparator>
                    <TimelineContent>
                      <Paper sx={{ p: 2, mb: 1 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {statusConfig[update.status]?.label || update.status}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          gutterBottom
                        >
                          {formatDate(update.createdAt)} (
                          {getTimeAgo(update.createdAt)})
                        </Typography>
                        {update.comment && (
                          <Box
                            sx={{
                              mt: 1,
                              p: 1,
                              bgcolor: "grey.50",
                              borderRadius: 1,
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="flex-start"
                            >
                              <Comment fontSize="small" color="action" />
                              <Typography variant="body2">
                                {update.comment}
                              </Typography>
                            </Stack>
                          </Box>
                        )}
                        {update.updatedBy && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mt: 1, display: "block" }}
                          >
                            Updated by:{" "}
                            {update.updatedBy.name || update.updatedBy.email}
                          </Typography>
                        )}
                      </Paper>
                    </TimelineContent>
                  </TimelineItem>
                ))}
              </Timeline>
            </Collapse>
          </Box>
        )}

        {/* Contact Information */}
        {issue.assignedDepartment && (
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" gutterBottom>
              Need Help?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Contact the assigned department for updates:
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <Button
                size="small"
                startIcon={<Phone />}
                variant="outlined"
                onClick={() => window.open("tel:+916512234567")}
              >
                Call
              </Button>
              <Button
                size="small"
                startIcon={<Email />}
                variant="outlined"
                onClick={() => window.open("mailto:support@civicissues.gov")}
              >
                Email
              </Button>
            </Stack>
          </Box>
        )}

        {loading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ mt: 1 }}
            >
              Loading updates...
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default IssueProgressTracker;
