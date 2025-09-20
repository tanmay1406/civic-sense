import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Refresh,
  Close,
  Warning,
} from '@mui/icons-material';

const ConnectionStatus = () => {
  const [status, setStatus] = useState('checking'); // 'checking', 'connected', 'disconnected', 'error'
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  const checkConnection = async () => {
    setStatus('checking');
    setError('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setStatus('connected');
        setLastChecked(new Date());
      } else {
        setStatus('error');
        setError(`Server responded with status ${response.status}`);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setStatus('disconnected');
        setError('Connection timeout - server may be down');
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setStatus('disconnected');
        setError('Cannot connect to backend server');
      } else {
        setStatus('error');
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    checkConnection();
    // Removed interval polling, only check once on mount
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'checking':
        return {
          severity: 'info',
          icon: <CircularProgress size={20} />,
          title: 'Checking Connection...',
          message: 'Verifying backend server status',
          action: null,
        };

      case 'connected':
        return {
          severity: 'success',
          icon: <CheckCircle />,
          title: 'Backend Connected',
          message: `Server is running properly${lastChecked ? ` (Last checked: ${lastChecked.toLocaleTimeString()})` : ''}`,
          action: null,
        };

      case 'disconnected':
        return {
          severity: 'error',
          icon: <Error />,
          title: 'Backend Disconnected',
          message: error || 'Cannot connect to backend server',
          action: (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                To fix this issue:
              </Typography>
              <Typography variant="body2" component="div" sx={{ pl: 2 }}>
                1. Open terminal in the backend folder<br/>
                2. Run: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px' }}>npm start</code><br/>
                3. Wait for "Server running on port 3001"
              </Typography>
              <Button
                size="small"
                variant="outlined"
                startIcon={<Refresh />}
                onClick={checkConnection}
                sx={{ mt: 1 }}
              >
                Retry Connection
              </Button>
            </Box>
          ),
        };

      case 'error':
        return {
          severity: 'warning',
          icon: <Warning />,
          title: 'Connection Error',
          message: error || 'Unknown connection error',
          action: (
            <Button
              size="small"
              variant="outlined"
              startIcon={<Refresh />}
              onClick={checkConnection}
              sx={{ mt: 1 }}
            >
              Retry Connection
            </Button>
          ),
        };

      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config || (status === 'connected' && !isVisible)) {
    return null;
  }

  return (
    <Collapse in={isVisible}>
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, maxWidth: 400 }}>
        <Alert
          severity={config.severity}
          icon={config.icon}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setIsVisible(false)}
            >
              <Close fontSize="inherit" />
            </IconButton>
          }
          sx={{
            boxShadow: 3,
            '& .MuiAlert-message': {
              flex: 1,
            },
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {config.title}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {config.message}
          </Typography>
          {config.action}
        </Alert>
      </Box>
    </Collapse>
  );
};

export default ConnectionStatus;
