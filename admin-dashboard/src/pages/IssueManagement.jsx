import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";

const statusColors = {
  resolved: "success",
  in_progress: "warning",
  submitted: "error",
};

const columns = [
  { field: "id", headerName: "ID", width: 90 },
  { field: "category", headerName: "Category", width: 130 },
  {
    field: "status",
    headerName: "Status",
    width: 120,
    renderCell: (params) => (
      <Chip
        label={params.value.replace(/_/g, " ")}
        color={statusColors[params.value] || "default"}
        size="small"
      />
    ),
  },
  {
    field: "createdAt",
    headerName: "Reported At",
    width: 180,
    valueGetter: (params) =>
      params.value ? new Date(params.value).toLocaleString() : "",
  },
  {
    field: "actions",
    headerName: "Actions",
    width: 180,
    renderCell: (params) => (
      <>
        <Button
          size="small"
          variant="outlined"
          onClick={() => params.row.onView(params.row)}
          sx={{ mr: 1 }}
        >
          View
        </Button>
        <Button
          size="small"
          variant="contained"
          color="secondary"
          onClick={() => params.row.onAssign(params.row)}
        >
          Assign
        </Button>
      </>
    ),
    sortable: false,
    filterable: false,
  },
];

const IssueManagement = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [assignIssue, setAssignIssue] = useState(null);
  const [snackbar, setSnackbar] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Assignment modal state
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  // Fetch issues
  const fetchIssues = useCallback(() => {
    setLoading(true);
    axios
      .get("/api/issues", {
        params: statusFilter !== "all" ? { status: statusFilter } : {},
      })
      .then((res) => {
        const rows = res.data.issues.map((issue) => ({
          ...issue,
          onView: setSelectedIssue,
          onAssign: setAssignIssue,
        }));
        setIssues(rows);
      })
      .catch(() => setSnackbar("Failed to fetch issues"))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    fetchIssues();
  }, [statusFilter, fetchIssues]);

  // Fetch departments when assign modal opens
  useEffect(() => {
    if (assignIssue) {
      axios
        .get("/api/departments")
        .then((res) => setDepartments(res.data))
        .catch(() => setDepartments([]));
      setSelectedDept("");
    }
  }, [assignIssue]);

  // Handle assign submit
  const handleAssign = () => {
    if (!assignIssue || !selectedDept) return;
    setAssignLoading(true);
    axios
      .patch(`/api/issues/${assignIssue.id}`, {
        assigned_department_id: selectedDept,
      })
      .then(() => {
        setSnackbar("Issue assigned successfully!");
        setAssignIssue(null);
        setSelectedDept("");
        fetchIssues();
      })
      .catch(() => setSnackbar("Failed to assign issue"))
      .finally(() => setAssignLoading(false));
  };

  return (
    <Box sx={{ p: 2, maxWidth: 1200, margin: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Issue Management
      </Typography>
      <Box sx={{ mb: 2, display: "flex", gap: 2 }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <DataGrid
          rows={issues}
          columns={columns}
          pageSize={10}
          autoHeight
          disableSelectionOnClick
          sx={{ background: "#fff", borderRadius: 2 }}
        />
      )}
      {/* View Issue Dialog */}
      <Dialog
        open={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Issue Details</DialogTitle>
        <DialogContent>
          {selectedIssue && (
            <Box>
              <Typography variant="subtitle1">
                <strong>Category:</strong> {selectedIssue.category}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Status:</strong> {selectedIssue.status}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Description:</strong> {selectedIssue.description}
              </Typography>
              {selectedIssue.photoUrl && (
                <Box sx={{ mt: 2 }}>
                  <img
                    src={selectedIssue.photoUrl}
                    alt="Issue"
                    style={{ width: "100%", maxWidth: 350, borderRadius: 8 }}
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
      {/* Assign Issue Dialog */}
      <Dialog
        open={!!assignIssue}
        onClose={() => setAssignIssue(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Assign Issue</DialogTitle>
        <DialogContent>
          {assignIssue && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Issue:</strong> {assignIssue.category} -{" "}
                {assignIssue.description}
              </Typography>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={selectedDept}
                  label="Department"
                  onChange={(e) => setSelectedDept(e.target.value)}
                  disabled={departments.length === 0}
                >
                  <MenuItem value="">
                    <em>Select department</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                }}
              >
                <Button
                  onClick={() => setAssignIssue(null)}
                  disabled={assignLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedDept || assignLoading}
                  variant="contained"
                  color="primary"
                >
                  {assignLoading ? <CircularProgress size={24} /> : "Assign"}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
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

export default IssueManagement;
