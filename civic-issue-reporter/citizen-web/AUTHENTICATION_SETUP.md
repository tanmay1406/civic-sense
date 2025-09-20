# Authentication Setup Documentation

## Overview

This document explains the authentication system implemented in the Civic Issue Reporter citizen web application. The system provides secure authentication guards that redirect users to login/register when they try to access protected routes.

## 🔐 Authentication Flow

### How It Works

1. **User tries to access a protected route** (e.g., `/report` or `/my-issues`)
2. **ProtectedRoute component checks authentication status**
3. **If not authenticated**: Redirects to `/auth` (AuthSelection page)
4. **User chooses Login or Register**
5. **After successful authentication**: Redirects back to the original destination

## 🚀 Quick Start Testing

### Method 1: Direct URL Access
1. Open your browser and go to: `http://localhost:3000/report`
2. Since you're not logged in, you'll be redirected to the authentication selection page
3. Choose "Login" or "Register"
4. Complete the authentication process
5. You'll be redirected back to `/report`

### Method 2: Using Test Page
1. Go to: `http://localhost:3000/test-auth`
2. This page provides a complete testing interface for the authentication flow
3. Click on protected route buttons to test redirects
4. Monitor your authentication status in real-time

## 📁 File Structure

```
src/
├── components/
│   ├── AuthContext.jsx         # Authentication context and logic
│   ├── ProtectedRoute.jsx      # Route protection component
│   ├── AuthSelection.jsx       # Authentication choice page
│   ├── Login.jsx              # Login form component
│   ├── Register.jsx           # Registration form component
│   └── TestAuthFlow.jsx       # Testing utility component
├── services/
│   ├── authAPI.js             # Authentication API service
│   ├── issuesAPI.js           # Issues management API
│   └── notificationsAPI.js    # Notifications API
└── App.jsx                    # Main app with protected routes
```

## 🛡️ Protected Routes

The following routes are protected and require authentication:

- `/report` - Report new civic issues
- `/my-issues` - View user's reported issues

### Public Routes

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/auth` - Authentication selection page
- `/test-auth` - Testing utility page

## ⚙️ Key Components

### AuthContext

Provides application-wide authentication state management:

```javascript
const { 
  user,              // Current user object
  isAuthenticated,   // Boolean authentication status
  loading,           // Loading state
  login,             // Login function
  register,          // Register function
  logout,            // Logout function
  authError,         // Authentication error messages
  clearError         // Clear error function
} = useAuth();
```

### ProtectedRoute

Wrapper component that guards routes:

```javascript
<ProtectedRoute redirectTo="/auth">
  <YourProtectedComponent />
</ProtectedRoute>
```

### AuthSelection

User-friendly authentication choice interface that allows users to:
- Choose between Login and Register
- View the destination they'll be redirected to
- Navigate back to home if needed

## 🔧 Configuration

### API Base URL

Set your backend API URL in environment variables:

```bash
REACT_APP_API_URL=http://localhost:3001/api
```

### Authentication Storage

The system uses both localStorage and sessionStorage:
- **localStorage**: For "Remember Me" logins
- **sessionStorage**: For session-only logins

## 🧪 Testing Scenarios

### Scenario 1: First-Time User
1. Visit `http://localhost:3000/report`
2. Get redirected to `/auth`
3. Choose "Create New Account"
4. Complete registration
5. Get redirected to `/report`

### Scenario 2: Returning User
1. Visit `http://localhost:3000/my-issues`
2. Get redirected to `/auth`
3. Choose "Login to Your Account"
4. Enter credentials
5. Get redirected to `/my-issues`

### Scenario 3: Direct Navigation
1. Navigate directly to `/login` or `/register`
2. Complete authentication
3. Get redirected to home (`/`) by default

## 🔍 Debugging

### Common Issues

1. **Infinite redirect loops**
   - Check that public routes don't have ProtectedRoute wrapper
   - Verify AuthContext is properly initialized

2. **Authentication state not persisting**
   - Check browser storage (localStorage/sessionStorage)
   - Verify token format and expiration

3. **Redirect not working**
   - Check location.state is being passed correctly
   - Verify redirect logic in login/register components

### Debug Tools

Use the test page at `/test-auth` to:
- Monitor authentication state in real-time
- Test protected route access
- View user information
- Test logout functionality

## 📱 Mobile Responsiveness

The authentication system is fully responsive:
- Mobile-optimized layouts for all auth components
- Touch-friendly buttons and forms
- Responsive navigation and spacing

## 🔒 Security Features

- JWT token-based authentication
- Automatic token validation and refresh
- Secure password requirements
- Form validation and error handling
- Protection against common attacks (XSS, CSRF)

## 🚦 Status Indicators

The system provides visual feedback for:
- ✅ Authentication success
- ❌ Authentication errors
- ⏳ Loading states
- 🔄 Redirect progress

## 📞 Backend Integration

The authentication system is designed to work with RESTful APIs:

### Expected Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/refresh` - Token refresh

### Request/Response Format

**Login Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Successful Response:**
```json
{
  "token": "jwt_token_here",
  "refreshToken": "refresh_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "citizen"
  }
}
```

## 🎯 Next Steps

To fully implement the authentication system:

1. **Set up backend API** with the expected endpoints
2. **Configure environment variables** with your API URL
3. **Test with real authentication data**
4. **Implement additional features** like password reset, email verification
5. **Add role-based access control** if needed

## 🆘 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify your API endpoints are working
3. Test with the `/test-auth` page
4. Check network tab for API call failures
5. Verify environment variables are set correctly

---

**Ready to test?** Start your development server and visit:
- `http://localhost:3000/test-auth` - For comprehensive testing
- `http://localhost:3000/report` - To test the actual flow

The authentication system is now fully configured and ready for use! 🎉