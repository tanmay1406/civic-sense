import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore,
  BugReport,
  Send,
  CheckCircle,
  Error,
  Info,
} from '@mui/icons-material';
import { useAuth } from './AuthContext';

const RegistrationDebugger = () => {
  const { register, authError, loading } = useAuth();
  const [debugData, setDebugData] = useState({
    firstName: "Rahul",
    lastName: "Kumar",
    email: "jaiyankargupta@gmail.com",
    password: "Rustyn@123",
    confirmPassword: "Rustyn@123",
    phone: "8340334929"
  });
  const [apiLogs, setApiLogs] = useState([]);
  const [testResult, setTestResult] = useState(null);

  const addLog = (type, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setApiLogs(prev => [...prev, {
      id: Date.now(),
      type,
      message,
      data,
      timestamp
    }]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDebugData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const testRegistration = async () => {
    setApiLogs([]);
    setTestResult(null);

    addLog('info', 'Starting registration test...');
    addLog('info', 'Form data being sent:', debugData);

    // Validate frontend data
    const validationErrors = [];
    if (!debugData.firstName) validationErrors.push('First name is required');
    if (!debugData.lastName) validationErrors.push('Last name is required');
    if (!debugData.email) validationErrors.push('Email is required');
    if (!debugData.password) validationErrors.push('Password is required');
    if (debugData.password !== debugData.confirmPassword) validationErrors.push('Passwords do not match');
    if (!debugData.phone) validationErrors.push('Phone is required');

    if (validationErrors.length > 0) {
      addLog('error', 'Frontend validation failed:', validationErrors);
      setTestResult({ success: false, message: 'Validation errors found' });
      return;
    }

    addLog('success', 'Frontend validation passed');

    // Test backend connection first
    try {
      addLog('info', 'Testing backend connection...');
      const healthResponse = await fetch('http://localhost:3001/api/health');

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        addLog('success', 'Backend is running', healthData);
      } else {
        addLog('error', `Backend health check failed: ${healthResponse.status}`);
        setTestResult({
          success: false,
          message: 'Backend is not responding properly'
        });
        return;
      }
    } catch (error) {
      addLog('error', 'Cannot connect to backend', error.message);
      setTestResult({
        success: false,
        message: 'Backend server is not running. Please start it with: cd backend && npm start'
      });
      return;
    }

    // Now test the actual registration
    try {
      addLog('info', 'Calling registration API...');

      const result = await register(debugData);

      if (result) {
        addLog('success', 'Registration completed successfully!');
        setTestResult({
          success: true,
          message: 'Registration was successful! You should now be logged in.'
        });
      } else {
        addLog('error', 'Registration failed', authError);
        setTestResult({
          success: false,
          message: authError || 'Registration failed for unknown reason'
        });
      }
    } catch (error) {
      addLog('error', 'Registration threw an error', error.message);
      setTestResult({
        success: false,
        message: `Registration error: ${error.message}`
      });
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      case 'info': return <Info color="info" />;
      default: return <Info />;
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReport /> Registration API Debugger
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This tool helps debug registration issues by testing the complete flow and logging all API calls.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>Test Data</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={debugData.firstName}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={debugData.lastName}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={debugData.email}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={debugData.phone}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={debugData.password}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={debugData.confirmPassword}
                onChange={handleInputChange}
                size="small"
              />
            </Grid>
          </Grid>

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Send />}
            onClick={testRegistration}
            disabled={loading}
            size="large"
          >
            {loading ? 'Testing...' : 'Test Registration API'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Result */}
      {testResult && (
        <Alert
          severity={testResult.success ? 'success' : 'error'}
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {testResult.success ? 'Test Passed!' : 'Test Failed!'}
          </Typography>
          <Typography variant="body2">
            {testResult.message}
          </Typography>
        </Alert>
      )}

      {/* API Logs */}
      {apiLogs.length > 0 && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">
              API Call Logs ({apiLogs.length} entries)
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
              {apiLogs.map((log) => (
                <Box
                  key={log.id}
                  sx={{
                    mb: 2,
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: log.type === 'error' ? 'error.lighter' :
                             log.type === 'success' ? 'success.lighter' :
                             'background.default'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getLogIcon(log.type)}
                    <Chip
                      label={log.type.toUpperCase()}
                      color={getLogColor(log.type)}
                      size="small"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {log.timestamp}
                    </Typography>
                  </Box>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {log.message}
                  </Typography>

                  {log.data && (
                    <Box
                      component="pre"
                      sx={{
                        fontSize: '0.75rem',
                        bgcolor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 200
                      }}
                    >
                      {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Instructions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>How to use this debugger:</Typography>
          <Typography variant="body2" component="div">
            <ol>
              <li><strong>Start the backend:</strong> Open terminal and run <code>cd backend && npm start</code></li>
              <li><strong>Modify test data:</strong> Update the form fields above if needed</li>
              <li><strong>Click "Test Registration API":</strong> This will simulate clicking "Complete Registration"</li>
              <li><strong>Check the logs:</strong> All API calls and responses will be logged below</li>
              <li><strong>Identify issues:</strong> Look for error messages in red to see what's failing</li>
            </ol>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegistrationDebugger;
