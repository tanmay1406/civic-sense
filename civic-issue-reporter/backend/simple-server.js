const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Simple test server is running',
    port: PORT
  });
});

// Registration endpoint for testing
app.post('/api/auth/register', (req, res) => {
  console.log('Registration request received:');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  const { first_name, last_name, email, password, phone } = req.body;

  // Basic validation
  if (!first_name || !last_name || !email || !password) {
    console.log('Validation failed - missing required fields');
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Missing required fields',
      details: [
        { field: 'first_name', required: !!first_name },
        { field: 'last_name', required: !!last_name },
        { field: 'email', required: !!email },
        { field: 'password', required: !!password }
      ]
    });
  }

  // Check if email already exists (mock check)
  if (email === 'existing@example.com') {
    console.log('User already exists');
    return res.status(409).json({
      success: false,
      error: 'User already exists',
      message: 'An account with this email already exists'
    });
  }

  // Mock successful registration
  console.log('Registration successful for:', email);
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user: {
        id: Date.now(),
        first_name,
        last_name,
        email,
        phone,
        role: 'citizen',
        created_at: new Date().toISOString()
      }
    }
  });
});

// Login endpoint for testing
app.post('/api/auth/login', (req, res) => {
  console.log('Login request received:');
  console.log('Body:', req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Email and password are required'
    });
  }

  // Mock login
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token: 'mock-jwt-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      user: {
        id: 123,
        first_name: 'Test',
        last_name: 'User',
        email,
        role: 'citizen'
      }
    }
  });
});

// Catch all for API routes
app.all('/api/*', (req, res) => {
  console.log(`Unhandled API route: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API endpoint ${req.method} ${req.path} not found`
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Simple Test Server',
    status: 'running',
    endpoints: {
      health: '/api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'Something went wrong on the server'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Simple Test Server Started!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
  console.log(`📝 Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`🔑 Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log('=================================');
  console.log('Server is ready to accept connections...');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
