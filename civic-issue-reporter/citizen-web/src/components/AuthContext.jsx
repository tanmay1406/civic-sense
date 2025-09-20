import React, { createContext, useContext, useState, useEffect } from "react";

// Create the AuthContext
const AuthContext = createContext();

// API base URL - configure based on environment
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Token storage keys
const TOKEN_KEY = "civic_auth_token";
const REFRESH_TOKEN_KEY = "civic_refresh_token";
const USER_KEY = "civic_user_data";

// Create AuthProvider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedToken = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);

        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Clear corrupted data
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Save auth data to localStorage
  const saveAuthData = (token, refreshToken, userData) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error("Error saving auth data:", error);
    }
  };

  // Clear auth data from localStorage
  const clearAuthData = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  // API request helper with error handling
  const apiRequest = async (endpoint, options = {}) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`Making API request to: ${url}`);

      const config = {
        ...options,
      };

      // Set default headers only if not FormData
      if (!(options.body instanceof FormData)) {
        config.headers = {
          "Content-Type": "application/json",
          ...options.headers,
        };
      } else {
        // For FormData, don't set Content-Type (let browser set it with boundary)
        config.headers = {
          ...options.headers,
        };
      }

      // Add auth token if available
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(url, config);

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // If not JSON, try to get text response for debugging
        const textResponse = await response.text();
        console.error("Non-JSON response received:", textResponse);
        throw new Error(
          `Server returned non-JSON response. Status: ${response.status}`,
        );
      }

      if (!response.ok) {
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          data: data,
        });

        // Include validation details in error message if available
        let errorMessage =
          data.message || `HTTP ${response.status}: ${response.statusText}`;
        if (data.details && Array.isArray(data.details)) {
          const validationErrors = data.details
            .map((err) => `${err.param || err.path}: ${err.msg}`)
            .join(", ");
          errorMessage += ` (Validation: ${validationErrors})`;
        }

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, {
        error: error.message,
        url: `${API_BASE_URL}${endpoint}`,
        type: error.name,
      });
      throw error;
    }
  };

  // Clear any existing auth errors
  const clearError = () => {
    setAuthError("");
  };

  // Login function
  const login = async (email, password) => {
    if (!email || !password) {
      setAuthError("Email and password are required");
      return false;
    }

    setLoading(true);
    setAuthError("");

    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (response.success && response.data) {
        const {
          token: authToken,
          refreshToken,
          user: userData,
        } = response.data;

        setToken(authToken);
        setUser(userData);
        saveAuthData(authToken, refreshToken, userData);

        console.log("Login successful");
        return true;
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please check your credentials.";

      if (error.message.includes("fetch")) {
        errorMessage =
          "Unable to connect to server. Please check your internet connection.";
      } else if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        errorMessage = "Invalid email or password.";
      } else if (error.message.includes("400")) {
        errorMessage = "Please provide valid email and password.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setAuthError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    const { firstName, lastName, email, password, confirmPassword, phone } =
      userData;

    // Basic validation
    if (!firstName || !lastName || !email || !password || !phone) {
      setAuthError("All fields are required");
      return false;
    }

    if (password !== confirmPassword) {
      setAuthError("Passwords do not match");
      return false;
    }

    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters long");
      return false;
    }

    setLoading(true);
    setAuthError("");

    try {
      // Format phone number for Indian mobile validation
      let formattedPhone = phone;
      if (phone && !phone.startsWith("+91")) {
        formattedPhone = `+91${phone}`;
      }

      const registrationData = {
        firstName,
        lastName,
        email,
        password,
        phone: formattedPhone,
      };

      console.log("Registration attempt with data:", registrationData);

      const response = await apiRequest("/auth/register", {
        method: "POST",
        body: JSON.stringify(registrationData),
      });

      console.log("Registration response:", response);

      if (response.success && response.data) {
        const { token: authToken, refreshToken, user: newUser } = response.data;

        setToken(authToken);
        setUser(newUser);
        saveAuthData(authToken, refreshToken, newUser);

        console.log("Registration successful");
        return true;
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error details:", {
        error: error,
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      let errorMessage = "Registration failed. Please try again.";

      // Check for network/connection errors first
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        errorMessage =
          "❌ Cannot connect to server. Please make sure the backend is running on http://localhost:3001";
      } else if (
        error.message.includes("NetworkError") ||
        error.message.includes("Failed to fetch")
      ) {
        errorMessage =
          "❌ Network error. Please check if the backend server is running.";
      } else if (
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("Connection refused")
      ) {
        errorMessage =
          "❌ Backend server is not running. Please start it with: cd backend && npm start";
      } else if (error.message.includes("fetch")) {
        errorMessage =
          "❌ Unable to connect to server. Please check your internet connection and ensure the backend is running.";
      } else if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        errorMessage = "An account with this email already exists.";
      } else if (error.message.includes("409")) {
        errorMessage =
          "An account with this email or phone number already exists.";
      } else if (error.message.includes("400")) {
        // Try to extract more specific error information
        if (error.message.includes("Validation failed")) {
          errorMessage = "Validation Error: " + error.message;
        } else {
          errorMessage =
            "Please provide valid registration information. " + error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.log("Setting error message:", errorMessage);
      setAuthError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);

    try {
      // Attempt to notify server of logout
      if (token) {
        await apiRequest("/auth/logout", {
          method: "POST",
        });
      }
    } catch (error) {
      console.warn("Logout request failed:", error);
      // Continue with local logout even if server request fails
    } finally {
      // Clear local auth state
      setToken(null);
      setUser(null);
      setAuthError("");
      clearAuthData();
      setLoading(false);
      console.log("Logged out successfully");
    }
  };

  // Refresh token function
  const refreshAuthToken = async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await apiRequest("/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });

      if (response.success && response.data) {
        const { token: newToken, refreshToken: newRefreshToken } =
          response.data;
        setToken(newToken);
        saveAuthData(newToken, newRefreshToken, user);
        return newToken;
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      // If refresh fails, logout user
      logout();
      return null;
    }
  };

  // Update user profile
  const updateProfile = async (updateData) => {
    if (!token || !user) {
      setAuthError("Please log in to update your profile");
      return false;
    }

    setLoading(true);
    setAuthError("");

    try {
      const response = await apiRequest("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      if (response.success && response.data) {
        const updatedUser = { ...user, ...response.data };
        setUser(updatedUser);
        saveAuthData(
          token,
          localStorage.getItem(REFRESH_TOKEN_KEY),
          updatedUser,
        );
        return true;
      } else {
        throw new Error(response.message || "Profile update failed");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setAuthError(error.message || "Failed to update profile");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = !!(token && user);

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Get user's full name
  const getUserDisplayName = () => {
    if (!user) return "";
    return (
      `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
    );
  };

  // Auth context value
  const contextValue = {
    // State
    user,
    token,
    loading,
    authError,
    isInitialized,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    refreshAuthToken,
    clearError,

    // Utilities
    isAuthenticated,
    hasRole,
    getUserDisplayName,
    apiRequest,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
