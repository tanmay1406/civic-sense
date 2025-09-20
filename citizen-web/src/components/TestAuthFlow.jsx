import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import {
  Login,
  Logout,
  PersonAdd,
  ReportProblem,
  List,
  Home,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const TestAuthFlow = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom align="center">
        🔐 Authentication Flow Test
      </Typography>

      <Typography variant="body1" align="center" sx={{ mb: 4 }}>
        Test the authentication guards for protected routes
      </Typography>

      {/* Current Auth Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Current Authentication Status
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Chip
              label={isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
              color={isAuthenticated ? 'success' : 'default'}
              variant="filled"
            />
            {loading && <Chip label="Loading..." color="warning" size="small" />}
          </Stack>

          {isAuthenticated && user && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle2">Welcome back!</Typography>
              <Typography variant="body2">
                Name: {user.first_name || user.firstName || 'N/A'} {user.last_name || user.lastName || ''}
              </Typography>
              <Typography variant="body2">
                Email: {user.email || 'N/A'}
              </Typography>
              <Typography variant="body2">
                Role: {user.role || 'citizen'}
              </Typography>
            </Alert>
          )}

          {!isAuthenticated && (
            <Alert severity="info">
              You are not currently logged in. Try accessing protected routes to test the authentication flow.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Navigation Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Navigation Test
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Test protected routes - these should redirect to authentication if not logged in:
          </Typography>

          <Stack spacing={2}>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Button
                component={Link}
                to="/"
                startIcon={<Home />}
                variant="outlined"
                size="small"
              >
                Home (Public)
              </Button>

              <Button
                component={Link}
                to="/report"
                startIcon={<ReportProblem />}
                variant="contained"
                size="small"
                color="primary"
              >
                Report Issue (Protected)
              </Button>

              <Button
                component={Link}
                to="/my-issues"
                startIcon={<List />}
                variant="contained"
                size="small"
                color="secondary"
              >
                My Issues (Protected)
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Authentication Actions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Authentication Actions
          </Typography>

          <Stack spacing={2}>
            {!isAuthenticated ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Choose how to authenticate:
                </Typography>

                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Button
                    component={Link}
                    to="/auth"
                    startIcon={<Login />}
                    variant="contained"
                    color="primary"
                  >
                    Auth Selection
                  </Button>

                  <Button
                    component={Link}
                    to="/login"
                    startIcon={<Login />}
                    variant="outlined"
                  >
                    Direct Login
                  </Button>

                  <Button
                    component={Link}
                    to="/register"
                    startIcon={<PersonAdd />}
                    variant="outlined"
                  >
                    Direct Register
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  You are logged in. You can now access protected routes or logout:
                </Typography>

                <Button
                  onClick={handleLogout}
                  startIcon={<Logout />}
                  variant="outlined"
                  color="error"
                  disabled={loading}
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </Button>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Divider sx={{ my: 4 }} />

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom color="primary">
            🧪 How to Test the Authentication Flow
          </Typography>

          <Stack spacing={2}>
            <Typography variant="body2">
              <strong>Step 1:</strong> Start by clicking "Report Issue (Protected)" or "My Issues (Protected)"
              while not logged in. You should be redirected to the authentication selection page.
            </Typography>

            <Typography variant="body2">
              <strong>Step 2:</strong> Choose either Login or Register from the authentication selection page.
            </Typography>

            <Typography variant="body2">
              <strong>Step 3:</strong> Complete the authentication process. You should be redirected back
              to the original protected route you tried to access.
            </Typography>

            <Typography variant="body2">
              <strong>Step 4:</strong> Try logging out and accessing protected routes again to verify
              the authentication guard is working properly.
            </Typography>
          </Stack>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Since there's no backend running, actual authentication will fail.
              But you can test the redirect flow and UI components.
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TestAuthFlow;
