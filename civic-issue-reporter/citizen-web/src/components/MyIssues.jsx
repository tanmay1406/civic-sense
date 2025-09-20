import React, {
  useEffect,
  useState,
  useRef,
  useContext,
  useCallback,
} from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
  Snackbar,
  Typography,
  Alert,
  Grid,
  DialogActions,
  Container,
  Card,
  CardContent,
  CardActions,
  Stack,
  IconButton,
  Fab,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Skeleton,
  Fade,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Add,
  Search,
  FilterList,
  Refresh,
  Timeline,
  LocationOn,
  CalendarToday,
  MoreVert,
  Visibility,
  Delete,
  Share,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import IssueProgressTracker from "./IssueProgressTracker";

const MyIssues = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const { apiRequest, isAuthenticated } = useAuth();

  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [notification, setNotification] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [actionMenuItem, setActionMenuItem] = useState(null);
  const prevIssuesRef = useRef([]);

  // Fetch issues from backend
  const fetchIssues = useCallback(async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/issues/my-issues");
      const issuesList = data.issues || data.data || data || [];

      // Compare with previous issues for status changes
      prevIssuesRef.current.forEach((prevIssue) => {
        const updated = issuesList.find((i) => i.id === prevIssue.id);
        if (updated && updated.status !== prevIssue.status) {
          setNotification(
            `Status of "${updated.title || updated.category}" changed to "${updated.status.replace(/_/g, " ")}"`,
          );
        }
      });

      prevIssuesRef.current = issuesList;
      setIssues(issuesList);
    } catch (err) {
      console.error("Error fetching issues:", err);
      setError(err.message || "Failed to fetch issues.");
      // Set mock data for development
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, navigate, apiRequest]);

  useEffect(() => {
    fetchIssues();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchIssues, 30000);
    return () => clearInterval(interval);
  }, [fetchIssues]);

  // Filter and sort issues
  useEffect(() => {
    let filtered = [...issues];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (issue) =>
          (issue.title || issue.category || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (issue.description || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (issue.category || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((issue) => issue.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((issue) => issue.priority === priorityFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "status":
          return a.status.localeCompare(b.status);
        case "priority":
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return (
            (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
          );
        default:
          return 0;
      }
    });

    setFilteredIssues(filtered);
  }, [issues, searchQuery, statusFilter, priorityFilter, sortBy]);

  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleActionMenuOpen = (event, issue) => {
    setActionMenuAnchor(event.currentTarget);
    setActionMenuItem(issue);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setActionMenuItem(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "resolved":
      case "verified":
        return "success";
      case "in_progress":
        return "primary";
      case "assigned":
        return "info";
      case "submitted":
      case "under_review":
        return "warning";
      case "rejected":
      case "closed":
        return "error";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Please log in to view your issues
        </Typography>
        <Button variant="contained" onClick={() => navigate("/login")}>
          Login
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                My Issues
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track and manage your reported civic issues
              </Typography>
            </Box>
            {!isMobile && (
              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchIssues}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate("/report")}
                >
                  Report New Issue
                </Button>
              </Stack>
            )}
          </Box>

          {/* Search and Filter Bar */}
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems="center"
            >
              <TextField
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ flexGrow: 1, minWidth: { xs: "100%", md: 300 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                onClick={handleFilterMenuOpen}
                size="small"
              >
                Filters
              </Button>
            </Stack>

            {/* Active Filters */}
            {(statusFilter !== "all" || priorityFilter !== "all") && (
              <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
                {statusFilter !== "all" && (
                  <Chip
                    label={`Status: ${statusFilter.replace(/_/g, " ")}`}
                    size="small"
                    onDelete={() => setStatusFilter("all")}
                    color="primary"
                    variant="outlined"
                  />
                )}
                {priorityFilter !== "all" && (
                  <Chip
                    label={`Priority: ${priorityFilter}`}
                    size="small"
                    onDelete={() => setPriorityFilter("all")}
                    color="secondary"
                    variant="outlined"
                  />
                )}
              </Stack>
            )}
          </Paper>
        </Box>

        {/* Loading State */}
        {loading && (
          <Grid container spacing={3}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item}>
                <Card>
                  <CardContent>
                    <Skeleton
                      variant="rectangular"
                      height={60}
                      sx={{ mb: 2 }}
                    />
                    <Skeleton variant="text" sx={{ mb: 1 }} />
                    <Skeleton variant="text" width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Error State */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={fetchIssues}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && issues.length === 0 && (
          <Paper sx={{ p: 6, textAlign: "center", borderRadius: 3 }}>
            <Timeline sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No Issues Reported Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Start making a difference in your community by reporting civic
              issues.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate("/report")}
              size="large"
            >
              Report Your First Issue
            </Button>
          </Paper>
        )}

        {/* Issues Grid */}
        {!loading && !error && filteredIssues.length > 0 && (
          <Grid container spacing={3}>
            {filteredIssues.map((issue, index) => (
              <Grid item xs={12} md={6} lg={4} key={issue.id}>
                <Fade in={true} timeout={300 + index * 100}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: theme.shadows[8],
                      },
                    }}
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          mb: 2,
                        }}
                      >
                        <Box sx={{ flexGrow: 1, mr: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 600, mb: 0.5 }}
                            noWrap
                          >
                            {issue.title || issue.category}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            {issue.category}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionMenuOpen(e, issue);
                          }}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>

                      {issue.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {issue.description}
                        </Typography>
                      )}

                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mb: 2 }}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Chip
                          label={issue.status.replace(/_/g, " ")}
                          color={getStatusColor(issue.status)}
                          size="small"
                          sx={{ textTransform: "capitalize" }}
                        />
                        {issue.priority && (
                          <Chip
                            label={issue.priority}
                            color={getPriorityColor(issue.priority)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          color: "text.secondary",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <CalendarToday sx={{ fontSize: 16 }} />
                          <Typography variant="caption">
                            {getTimeAgo(issue.createdAt)}
                          </Typography>
                        </Box>
                        {issue.location && (
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <LocationOn sx={{ fontSize: 16 }} />
                            <Typography variant="caption">Located</Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>

                    <CardActions sx={{ pt: 0 }}>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIssue(issue);
                        }}
                      >
                        View Details
                      </Button>
                      <Button
                        size="small"
                        startIcon={<Timeline />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIssue(issue);
                        }}
                      >
                        Track Progress
                      </Button>
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        )}

        {/* No Results from Filter */}
        {!loading &&
          !error &&
          issues.length > 0 &&
          filteredIssues.length === 0 && (
            <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
              <Search sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No issues match your search
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Try adjusting your filters or search terms
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </Paper>
          )}
        {/* Filter Menu */}
        <Menu
          anchorEl={filterMenuAnchor}
          open={Boolean(filterMenuAnchor)}
          onClose={handleFilterMenuClose}
          PaperProps={{ sx: { width: 250, p: 1 } }}
        >
          <Typography
            variant="subtitle2"
            sx={{ px: 2, py: 1, color: "text.secondary" }}
          >
            Filter by Status
          </Typography>
          {[
            "all",
            "submitted",
            "under_review",
            "assigned",
            "in_progress",
            "resolved",
            "verified",
          ].map((status) => (
            <MenuItem
              key={status}
              selected={statusFilter === status}
              onClick={() => {
                setStatusFilter(status);
                handleFilterMenuClose();
              }}
            >
              {status === "all" ? "All Statuses" : status.replace(/_/g, " ")}
            </MenuItem>
          ))}

          <Typography
            variant="subtitle2"
            sx={{ px: 2, py: 1, mt: 1, color: "text.secondary" }}
          >
            Filter by Priority
          </Typography>
          {["all", "low", "medium", "high", "critical"].map((priority) => (
            <MenuItem
              key={priority}
              selected={priorityFilter === priority}
              onClick={() => {
                setPriorityFilter(priority);
                handleFilterMenuClose();
              }}
            >
              {priority === "all" ? "All Priorities" : priority}
            </MenuItem>
          ))}

          <Typography
            variant="subtitle2"
            sx={{ px: 2, py: 1, mt: 1, color: "text.secondary" }}
          >
            Sort by
          </Typography>
          {[
            { value: "newest", label: "Newest First" },
            { value: "oldest", label: "Oldest First" },
            { value: "status", label: "Status" },
            { value: "priority", label: "Priority" },
          ].map((sort) => (
            <MenuItem
              key={sort.value}
              selected={sortBy === sort.value}
              onClick={() => {
                setSortBy(sort.value);
                handleFilterMenuClose();
              }}
            >
              {sort.label}
            </MenuItem>
          ))}
        </Menu>

        {/* Action Menu */}
        <Menu
          anchorEl={actionMenuAnchor}
          open={Boolean(actionMenuAnchor)}
          onClose={handleActionMenuClose}
        >
          <MenuItem
            onClick={() => {
              setSelectedIssue(actionMenuItem);
              handleActionMenuClose();
            }}
          >
            <Visibility sx={{ mr: 1 }} />
            View Details
          </MenuItem>
          <MenuItem
            onClick={() => {
              setSelectedIssue(actionMenuItem);
              handleActionMenuClose();
            }}
          >
            <Timeline sx={{ mr: 1 }} />
            Track Progress
          </MenuItem>
          <MenuItem
            onClick={() => {
              // TODO: Implement share functionality
              handleActionMenuClose();
            }}
          >
            <Share sx={{ mr: 1 }} />
            Share
          </MenuItem>
        </Menu>

        {/* Issue Details Dialog */}
        <Dialog
          open={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
          maxWidth="lg"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Issue Details & Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedIssue?.title || selectedIssue?.category}
                </Typography>
              </Box>
              <IconButton onClick={() => setSelectedIssue(null)}>
                <Delete />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            {selectedIssue && (
              <Grid container spacing={3} sx={{ p: 3 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3, height: "100%" }}>
                    <Typography variant="h6" gutterBottom>
                      Issue Information
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle1">
                        <strong>Category:</strong> {selectedIssue.category}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ mt: 1 }}>
                        <strong>Status:</strong>{" "}
                        <Chip
                          label={selectedIssue.status.replace(/_/g, " ")}
                          color={getStatusColor(selectedIssue.status)}
                          size="small"
                          sx={{ textTransform: "capitalize" }}
                        />
                      </Typography>
                      <Typography variant="subtitle1" sx={{ mt: 1 }}>
                        <strong>Reported At:</strong>{" "}
                        {selectedIssue.createdAt
                          ? new Date(selectedIssue.createdAt).toLocaleString()
                          : ""}
                      </Typography>
                      {selectedIssue.location && (
                        <Typography variant="subtitle1" sx={{ mt: 1 }}>
                          <strong>Location:</strong>{" "}
                          {`${selectedIssue.location.lat || selectedIssue.location.latitude}, ${selectedIssue.location.lng || selectedIssue.location.longitude}`}
                        </Typography>
                      )}
                      {selectedIssue.assignedDepartment && (
                        <Typography variant="subtitle1" sx={{ mt: 1 }}>
                          <strong>Assigned Department:</strong>{" "}
                          {selectedIssue.assignedDepartment}
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="subtitle1" sx={{ mt: 2 }}>
                      <strong>Description:</strong>
                    </Typography>
                    <Typography variant="body2" gutterBottom sx={{ mb: 2 }}>
                      {selectedIssue.description || (
                        <em>No description provided.</em>
                      )}
                    </Typography>

                    {selectedIssue.photoUrl && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Attached Photo:
                        </Typography>
                        <img
                          src={selectedIssue.photoUrl}
                          alt="Issue"
                          style={{
                            width: "100%",
                            maxWidth: 400,
                            borderRadius: 8,
                            border: "1px solid #eee",
                          }}
                        />
                      </Box>
                    )}

                    {selectedIssue.voiceTranscription && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Voice Recording Transcription:
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                          <Typography variant="body2">
                            {selectedIssue.voiceTranscription}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                  </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                  <IssueProgressTracker
                    issueId={selectedIssue.id}
                    issue={selectedIssue}
                    onRefresh={fetchIssues}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedIssue(null)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Floating Action Button for mobile */}
        {isMobile && (
          <Fab
            color="primary"
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
            }}
            onClick={() => navigate("/report")}
          >
            <Add />
          </Fab>
        )}

        {/* Snackbar Notification */}
        <Snackbar
          open={!!notification}
          autoHideDuration={4000}
          onClose={() => setNotification("")}
          message={notification}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        />
      </Container>
    </Box>
  );
};

export default MyIssues;
