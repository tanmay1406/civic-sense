import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authAPI from '../../services/authAPI';
import { toast } from 'react-toastify';

// Initial state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isRegistering: false,
  isLoggingIn: false,
  isRefreshing: false,
  error: null,
  lastLoginAt: null,
  loginAttempts: 0,
  maxLoginAttempts: 5,
  accountLocked: false,
  lockUntil: null,
  emailVerified: false,
  phoneVerified: false,
  twoFactorEnabled: false,
  preferences: {
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    language: 'en',
    theme: 'light',
  },
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password, rememberMe = false }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login({ email, password, rememberMe });

      // Store tokens in localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('civic_token', response.token);
        localStorage.setItem('civic_refresh_token', response.refreshToken);
      } else {
        // Use sessionStorage for session-only login
        sessionStorage.setItem('civic_token', response.token);
        sessionStorage.setItem('civic_refresh_token', response.refreshToken);
      }

      toast.success(`Welcome back, ${response.user.first_name}!`);

      return {
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
        rememberMe,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
      return rejectWithValue({
        message: errorMessage,
        status: error.response?.status,
        details: error.response?.data?.details,
      });
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);

      // Auto-login after successful registration
      if (response.token) {
        sessionStorage.setItem('civic_token', response.token);
        sessionStorage.setItem('civic_refresh_token', response.refreshToken);
      }

      toast.success('Registration successful! Please verify your email address.');

      return {
        user: response.user,
        token: response.token,
        refreshToken: response.refreshToken,
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
      return rejectWithValue({
        message: errorMessage,
        status: error.response?.status,
        details: error.response?.data?.details,
      });
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState }) => {
    try {
      const state = getState();
      const token = state.auth.token;

      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage regardless of API call success
      localStorage.removeItem('civic_token');
      localStorage.removeItem('civic_refresh_token');
      sessionStorage.removeItem('civic_token');
      sessionStorage.removeItem('civic_refresh_token');

      toast.info('You have been logged out');
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const currentRefreshToken = state.auth.refreshToken;

      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authAPI.refreshToken(currentRefreshToken);

      // Update stored tokens
      const storage = localStorage.getItem('civic_token') ? localStorage : sessionStorage;
      storage.setItem('civic_token', response.token);
      storage.setItem('civic_refresh_token', response.refreshToken);

      return {
        token: response.token,
        refreshToken: response.refreshToken,
      };
    } catch (error) {
      // If refresh fails, force logout
      localStorage.removeItem('civic_token');
      localStorage.removeItem('civic_refresh_token');
      sessionStorage.removeItem('civic_token');
      sessionStorage.removeItem('civic_refresh_token');

      return rejectWithValue({
        message: 'Session expired. Please log in again.',
      });
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser();
      return response.user;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to get user data',
      });
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      toast.success('Profile updated successfully');
      return response.user;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Profile update failed';
      toast.error(errorMessage);
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password change failed';
      toast.error(errorMessage);
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async ({ email }, { rejectWithValue }) => {
    try {
      await authAPI.forgotPassword({ email });
      toast.success('Password reset instructions sent to your email');
      return { email };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email';
      toast.error(errorMessage);
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async ({ token, password }, { rejectWithValue }) => {
    try {
      await authAPI.resetPassword({ token, password });
      toast.success('Password reset successfully. Please log in with your new password.');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed';
      toast.error(errorMessage);
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async ({ token }, { rejectWithValue }) => {
    try {
      await authAPI.verifyEmail({ token });
      toast.success('Email verified successfully!');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Email verification failed';
      toast.error(errorMessage);
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerificationEmail',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.resendVerificationEmail();
      toast.success('Verification email sent');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send verification email';
      toast.error(errorMessage);
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuthData: (state) => {
      return { ...initialState };
    },
    setCredentials: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.lastLoginAt = new Date().toISOString();
    },
    updateUserPreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
      if (state.user) {
        state.user.notification_preferences = action.payload.notifications;
      }
    },
    setEmailVerified: (state, action) => {
      state.emailVerified = action.payload;
      if (state.user) {
        state.user.email_verified = action.payload;
      }
    },
    setPhoneVerified: (state, action) => {
      state.phoneVerified = action.payload;
      if (state.user) {
        state.user.phone_verified = action.payload;
      }
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      if (state.loginAttempts >= state.maxLoginAttempts) {
        state.accountLocked = true;
        state.lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
      }
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.accountLocked = false;
      state.lockUntil = null;
    },
    checkAccountLock: (state) => {
      if (state.lockUntil && new Date() > new Date(state.lockUntil)) {
        state.accountLocked = false;
        state.lockUntil = null;
        state.loginAttempts = 0;
      }
    },
    initializeAuth: (state) => {
      // Check for stored tokens
      const token = localStorage.getItem('civic_token') || sessionStorage.getItem('civic_token');
      const refreshToken = localStorage.getItem('civic_refresh_token') || sessionStorage.getItem('civic_refresh_token');

      if (token && refreshToken) {
        state.token = token;
        state.refreshToken = refreshToken;
        // Don't set isAuthenticated here, wait for user data fetch
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.isLoggingIn = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLoggingIn = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.lastLoginAt = new Date().toISOString();
        state.loginAttempts = 0;
        state.accountLocked = false;
        state.lockUntil = null;
        state.emailVerified = action.payload.user.email_verified;
        state.phoneVerified = action.payload.user.phone_verified;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoggingIn = false;
        state.error = action.payload;
        state.loginAttempts += 1;

        if (state.loginAttempts >= state.maxLoginAttempts) {
          state.accountLocked = true;
          state.lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        }
      })

      // Register cases
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.isRegistering = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRegistering = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.emailVerified = action.payload.user.email_verified;
        state.phoneVerified = action.payload.user.phone_verified;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isRegistering = false;
        state.error = action.payload;
      })

      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        return { ...initialState };
      })

      // Refresh token cases
      .addCase(refreshToken.pending, (state) => {
        state.isRefreshing = true;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isRefreshing = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.isRefreshing = false;
        state.error = action.payload;
        // Force logout on refresh failure
        return { ...initialState, error: action.payload };
      })

      // Get current user cases
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.emailVerified = action.payload.email_verified;
        state.phoneVerified = action.payload.phone_verified;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // If getting user fails, likely token is invalid
        if (action.payload?.status === 401) {
          return { ...initialState, error: action.payload };
        }
      })

      // Update profile cases
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Change password cases
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Forgot password cases
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Reset password cases
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Email verification cases
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.emailVerified = true;
        if (state.user) {
          state.user.email_verified = true;
        }
        state.error = null;
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Resend verification email cases
      .addCase(resendVerificationEmail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(resendVerificationEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resendVerificationEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  clearError,
  clearAuthData,
  setCredentials,
  updateUserPreferences,
  setEmailVerified,
  setPhoneVerified,
  incrementLoginAttempts,
  resetLoginAttempts,
  checkAccountLock,
  initializeAuth,
} = authSlice.actions;

// Selectors
export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsLoading = (state) => state.auth.isLoading;
export const selectAuthError = (state) => state.auth.error;
export const selectToken = (state) => state.auth.token;
export const selectEmailVerified = (state) => state.auth.emailVerified;
export const selectPhoneVerified = (state) => state.auth.phoneVerified;
export const selectUserPreferences = (state) => state.auth.preferences;

export default authSlice.reducer;
