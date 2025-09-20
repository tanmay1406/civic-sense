// API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class AuthAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/auth`;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('civic_token') || sessionStorage.getItem('civic_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  // Login user
  async login({ email, password, rememberMe = false }) {
    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await this.handleResponse(response);

      // Return standardized response
      return {
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      };
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await this.handleResponse(response);

      return {
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  // Logout user
  async logout() {
    try {
      const response = await fetch(`${this.baseURL}/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      // Don't throw error if logout fails on server - still clear local storage
      if (response.ok) {
        await this.handleResponse(response);
      }

      // Clear tokens from storage
      localStorage.removeItem('civic_token');
      localStorage.removeItem('civic_refresh_token');
      sessionStorage.removeItem('civic_token');
      sessionStorage.removeItem('civic_refresh_token');

      return { success: true };
    } catch (error) {
      // Still clear local storage even if server request fails
      localStorage.removeItem('civic_token');
      localStorage.removeItem('civic_refresh_token');
      sessionStorage.removeItem('civic_token');
      sessionStorage.removeItem('civic_refresh_token');

      console.warn('Logout request failed, but local tokens cleared:', error.message);
      return { success: true };
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      const response = await fetch(`${this.baseURL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await this.handleResponse(response);

      return {
        token: data.token,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      };
    } catch (error) {
      throw new Error(error.message || 'Token refresh failed');
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseURL}/me`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        user: data.user || data,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to get user profile');
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${this.baseURL}/profile`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(profileData),
      });

      const data = await this.handleResponse(response);

      return {
        user: data.user,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Profile update failed');
    }
  }

  // Change password
  async changePassword({ currentPassword, newPassword }) {
    try {
      const response = await fetch(`${this.baseURL}/change-password`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await this.handleResponse(response);

      return {
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Password change failed');
    }
  }

  // Forgot password
  async forgotPassword({ email }) {
    try {
      const response = await fetch(`${this.baseURL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await this.handleResponse(response);

      return {
        message: data.message,
        email,
      };
    } catch (error) {
      throw new Error(error.message || 'Forgot password request failed');
    }
  }

  // Reset password
  async resetPassword({ token, password }) {
    try {
      const response = await fetch(`${this.baseURL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await this.handleResponse(response);

      return {
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Password reset failed');
    }
  }

  // Verify email
  async verifyEmail({ token }) {
    try {
      const response = await fetch(`${this.baseURL}/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await this.handleResponse(response);

      return {
        message: data.message,
        verified: true,
      };
    } catch (error) {
      throw new Error(error.message || 'Email verification failed');
    }
  }

  // Resend verification email
  async resendVerificationEmail() {
    try {
      const response = await fetch(`${this.baseURL}/resend-verification`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to resend verification email');
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('civic_token') || sessionStorage.getItem('civic_token');
    return !!token;
  }

  // Get stored token
  getToken() {
    return localStorage.getItem('civic_token') || sessionStorage.getItem('civic_token');
  }

  // Get stored refresh token
  getRefreshToken() {
    return localStorage.getItem('civic_refresh_token') || sessionStorage.getItem('civic_refresh_token');
  }

  // Check if token is expired (basic check)
  isTokenExpired(token) {
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true; // If we can't parse the token, consider it expired
    }
  }

  // Social login (Google, Facebook, etc.)
  async socialLogin({ provider, token }) {
    try {
      const response = await fetch(`${this.baseURL}/social/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await this.handleResponse(response);

      return {
        user: data.user,
        token: data.token,
        refreshToken: data.refreshToken,
        isNewUser: data.isNewUser,
      };
    } catch (error) {
      throw new Error(error.message || 'Social login failed');
    }
  }

  // Two-factor authentication
  async enableTwoFactor() {
    try {
      const response = await fetch(`${this.baseURL}/2fa/enable`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        qrCode: data.qrCode,
        backupCodes: data.backupCodes,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to enable two-factor authentication');
    }
  }

  async verifyTwoFactor({ code }) {
    try {
      const response = await fetch(`${this.baseURL}/2fa/verify`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ code }),
      });

      const data = await this.handleResponse(response);

      return {
        verified: data.verified,
        backupCodes: data.backupCodes,
      };
    } catch (error) {
      throw new Error(error.message || 'Two-factor verification failed');
    }
  }

  async disableTwoFactor({ password }) {
    try {
      const response = await fetch(`${this.baseURL}/2fa/disable`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ password }),
      });

      const data = await this.handleResponse(response);

      return {
        disabled: data.disabled,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to disable two-factor authentication');
    }
  }
}

// Create and export a singleton instance
const authAPI = new AuthAPI();
export default authAPI;
