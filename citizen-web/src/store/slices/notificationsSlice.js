import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import notificationsAPI from '../../services/notificationsAPI';

// Initial state
const initialState = {
  // Notification lists
  notifications: [],
  unreadCount: 0,
  pushNotifications: [],
  inAppNotifications: [],
  emailNotifications: [],

  // Notification categories
  categories: {
    issue_updates: [],
    department_news: [],
    system_alerts: [],
    reminders: [],
    social: [],
  },

  // Notification settings
  settings: {
    push: {
      enabled: true,
      sound: true,
      vibration: true,
      badge: true,
      categories: {
        issue_updates: true,
        department_news: false,
        system_alerts: true,
        reminders: true,
        social: false,
      },
    },
    email: {
      enabled: true,
      frequency: 'instant', // 'instant' | 'daily' | 'weekly' | 'never'
      categories: {
        issue_updates: true,
        department_news: true,
        system_alerts: true,
        reminders: false,
        social: false,
      },
    },
    inApp: {
      enabled: true,
      autoMarkRead: false,
      showPreview: true,
      playSound: true,
    },
  },

  // Push notification permissions and tokens
  permissions: {
    granted: false,
    denied: false,
    default: true,
  },
  fcmToken: null,
  deviceToken: null,

  // Notification scheduling
  scheduled: [],
  reminders: [],

  // Loading states
  isLoading: false,
  isSendingTest: false,
  isUpdatingSettings: false,
  isMarkingRead: false,

  // Error states
  error: null,
  permissionError: null,

  // Filters and search
  filters: {
    category: 'all',
    status: 'all', // 'all' | 'read' | 'unread'
    dateRange: 'all',
  },
  searchQuery: '',

  // Pagination
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },

  // Real-time connection
  connected: false,
  lastSync: null,

  // Statistics
  stats: {
    totalReceived: 0,
    totalRead: 0,
    averageResponseTime: 0,
    mostActiveCategory: null,
  },
};

// Async thunks
export const requestNotificationPermission = createAsyncThunk(
  'notifications/requestPermission',
  async (_, { rejectWithValue }) => {
    try {
      if (!('Notification' in window)) {
        throw new Error('Browser does not support notifications');
      }

      if (Notification.permission === 'granted') {
        return { permission: 'granted' };
      }

      if (Notification.permission === 'denied') {
        throw new Error('Notification permission denied');
      }

      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        // Register for push notifications
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.REACT_APP_VAPID_PUBLIC_KEY,
          });

          // Send subscription to server
          await notificationsAPI.registerDevice({
            subscription,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          });

          return {
            permission: 'granted',
            subscription: subscription.toJSON(),
          };
        }

        return { permission: 'granted' };
      }

      throw new Error(`Notification permission ${permission}`);
    } catch (error) {
      toast.error('Unable to enable notifications: ' + error.message);
      return rejectWithValue({
        message: error.message,
        permission: 'denied',
      });
    }
  }
);

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 20, filters = {} }, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.getNotifications({
        page,
        limit,
        ...filters,
      });

      return {
        notifications: response.notifications,
        pagination: response.pagination,
        unreadCount: response.unread_count,
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch notifications',
      });
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to mark notification as read',
      });
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.markAllAsRead();
      toast.success('All notifications marked as read');
      return response.marked_count;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to mark all as read';
      toast.error(errorMessage);
      return rejectWithValue({ message: errorMessage });
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notifications/updateSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.updateSettings(settings);
      toast.success('Notification settings updated');
      return response.settings;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update settings';
      toast.error(errorMessage);
      return rejectWithValue({ message: errorMessage });
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      await notificationsAPI.deleteNotification(notificationId);
      return notificationId;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to delete notification',
      });
    }
  }
);

export const sendTestNotification = createAsyncThunk(
  'notifications/sendTest',
  async ({ type = 'push', message = 'Test notification' }, { rejectWithValue }) => {
    try {
      await notificationsAPI.sendTestNotification({ type, message });
      toast.success(`Test ${type} notification sent!`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send test notification';
      toast.error(errorMessage);
      return rejectWithValue({ message: errorMessage });
    }
  }
);

export const scheduleNotification = createAsyncThunk(
  'notifications/schedule',
  async ({ message, scheduledTime, type = 'reminder' }, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.scheduleNotification({
        message,
        scheduled_time: scheduledTime,
        type,
      });

      toast.success('Notification scheduled successfully');
      return response.notification;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to schedule notification';
      toast.error(errorMessage);
      return rejectWithValue({ message: errorMessage });
    }
  }
);

export const fetchNotificationStats = createAsyncThunk(
  'notifications/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsAPI.getStats();
      return response.stats;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch notification stats',
      });
    }
  }
);

// Notifications slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    // Add new notification (for real-time updates)
    addNotification: (state, action) => {
      const notification = {
        id: action.payload.id || Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false,
        ...action.payload,
      };

      state.notifications.unshift(notification);

      // Categorize notification
      if (notification.category && state.categories[notification.category]) {
        state.categories[notification.category].unshift(notification);
      }

      // Update unread count
      if (!notification.read) {
        state.unreadCount += 1;
      }

      // Update stats
      state.stats.totalReceived += 1;

      // Keep only last 100 notifications in memory
      if (state.notifications.length > 100) {
        const removed = state.notifications.pop();
        // Remove from category as well
        if (removed.category && state.categories[removed.category]) {
          state.categories[removed.category] = state.categories[removed.category]
            .filter(n => n.id !== removed.id);
        }
      }
    },

    // Mark notification as read locally
    markAsReadLocal: (state, action) => {
      const notificationId = action.payload;

      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        notification.read_at = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.stats.totalRead += 1;
      }

      // Update in categories
      Object.values(state.categories).forEach(category => {
        const catNotification = category.find(n => n.id === notificationId);
        if (catNotification && !catNotification.read) {
          catNotification.read = true;
          catNotification.read_at = new Date().toISOString();
        }
      });
    },

    // Remove notification locally
    removeNotification: (state, action) => {
      const notificationId = action.payload;

      const notificationIndex = state.notifications.findIndex(n => n.id === notificationId);
      if (notificationIndex !== -1) {
        const notification = state.notifications[notificationIndex];

        // Update unread count if notification was unread
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }

        // Remove from main list
        state.notifications.splice(notificationIndex, 1);

        // Remove from category
        if (notification.category && state.categories[notification.category]) {
          state.categories[notification.category] = state.categories[notification.category]
            .filter(n => n.id !== notificationId);
        }
      }
    },

    // Clear all notifications
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      Object.keys(state.categories).forEach(category => {
        state.categories[category] = [];
      });
    },

    // Update notification settings locally
    updateSettingsLocal: (state, action) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    // Set FCM token
    setFCMToken: (state, action) => {
      state.fcmToken = action.payload;
    },

    // Set device token
    setDeviceToken: (state, action) => {
      state.deviceToken = action.payload;
    },

    // Update permission status
    setPermissionStatus: (state, action) => {
      const permission = action.payload;
      state.permissions = {
        granted: permission === 'granted',
        denied: permission === 'denied',
        default: permission === 'default',
      };
    },

    // Set filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    // Set search query
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },

    // Update connection status
    setConnectionStatus: (state, action) => {
      state.connected = action.payload;
    },

    // Update last sync time
    setLastSync: (state, action) => {
      state.lastSync = action.payload || new Date().toISOString();
    },

    // Add scheduled notification
    addScheduledNotification: (state, action) => {
      const scheduled = {
        id: action.payload.id || Date.now().toString(),
        created_at: new Date().toISOString(),
        ...action.payload,
      };
      state.scheduled.push(scheduled);
    },

    // Remove scheduled notification
    removeScheduledNotification: (state, action) => {
      const id = action.payload;
      state.scheduled = state.scheduled.filter(n => n.id !== id);
    },

    // Update notification counts
    updateCounts: (state, action) => {
      const { total, unread } = action.payload;
      state.pagination.total = total;
      state.unreadCount = unread;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
      state.permissionError = null;
    },

    // Clear all state
    clearAll: (state) => {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    builder
      // Request notification permission
      .addCase(requestNotificationPermission.pending, (state) => {
        state.isLoading = true;
        state.permissionError = null;
      })
      .addCase(requestNotificationPermission.fulfilled, (state, action) => {
        state.isLoading = false;
        state.permissions.granted = action.payload.permission === 'granted';
        state.permissions.denied = action.payload.permission === 'denied';
        state.permissions.default = action.payload.permission === 'default';

        if (action.payload.subscription) {
          // Store push subscription info if available
          state.deviceToken = JSON.stringify(action.payload.subscription);
        }
      })
      .addCase(requestNotificationPermission.rejected, (state, action) => {
        state.isLoading = false;
        state.permissionError = action.payload;
        state.permissions.denied = true;
        state.permissions.granted = false;
      })

      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;

        const { notifications, pagination, unreadCount } = action.payload;

        // Replace or append notifications based on page
        if (pagination.page === 1) {
          state.notifications = notifications;

          // Re-categorize notifications
          Object.keys(state.categories).forEach(category => {
            state.categories[category] = notifications.filter(n => n.category === category);
          });
        } else {
          state.notifications = [...state.notifications, ...notifications];

          // Add to categories
          notifications.forEach(notification => {
            if (notification.category && state.categories[notification.category]) {
              state.categories[notification.category].push(notification);
            }
          });
        }

        state.pagination = pagination;
        state.unreadCount = unreadCount;
        state.lastSync = new Date().toISOString();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Mark as read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.isMarkingRead = true;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        state.isMarkingRead = false;

        const notificationId = action.payload;
        const notification = state.notifications.find(n => n.id === notificationId);

        if (notification && !notification.read) {
          notification.read = true;
          notification.read_at = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          state.stats.totalRead += 1;
        }
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.isMarkingRead = false;
        state.error = action.payload;
      })

      // Mark all as read
      .addCase(markAllAsRead.pending, (state) => {
        state.isMarkingRead = true;
      })
      .addCase(markAllAsRead.fulfilled, (state, action) => {
        state.isMarkingRead = false;

        const markedCount = action.payload;

        // Mark all notifications as read
        state.notifications.forEach(notification => {
          if (!notification.read) {
            notification.read = true;
            notification.read_at = new Date().toISOString();
          }
        });

        // Mark in categories as well
        Object.values(state.categories).forEach(category => {
          category.forEach(notification => {
            if (!notification.read) {
              notification.read = true;
              notification.read_at = new Date().toISOString();
            }
          });
        });

        state.unreadCount = 0;
        state.stats.totalRead += markedCount;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.isMarkingRead = false;
        state.error = action.payload;
      })

      // Update settings
      .addCase(updateNotificationSettings.pending, (state) => {
        state.isUpdatingSettings = true;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.isUpdatingSettings = false;
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.isUpdatingSettings = false;
        state.error = action.payload;
      })

      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notificationId = action.payload;

        const notificationIndex = state.notifications.findIndex(n => n.id === notificationId);
        if (notificationIndex !== -1) {
          const notification = state.notifications[notificationIndex];

          if (!notification.read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }

          state.notifications.splice(notificationIndex, 1);

          // Remove from category
          if (notification.category && state.categories[notification.category]) {
            state.categories[notification.category] = state.categories[notification.category]
              .filter(n => n.id !== notificationId);
          }
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Send test notification
      .addCase(sendTestNotification.pending, (state) => {
        state.isSendingTest = true;
      })
      .addCase(sendTestNotification.fulfilled, (state) => {
        state.isSendingTest = false;
      })
      .addCase(sendTestNotification.rejected, (state, action) => {
        state.isSendingTest = false;
        state.error = action.payload;
      })

      // Schedule notification
      .addCase(scheduleNotification.fulfilled, (state, action) => {
        const scheduled = action.payload;
        state.scheduled.push(scheduled);
      })

      // Fetch stats
      .addCase(fetchNotificationStats.fulfilled, (state, action) => {
        state.stats = { ...state.stats, ...action.payload };
      });
  },
});

// Export actions
export const {
  addNotification,
  markAsReadLocal,
  removeNotification,
  clearAllNotifications,
  updateSettingsLocal,
  setFCMToken,
  setDeviceToken,
  setPermissionStatus,
  setFilters,
  setSearchQuery,
  setConnectionStatus,
  setLastSync,
  addScheduledNotification,
  removeScheduledNotification,
  updateCounts,
  clearError,
  clearAll,
} = notificationsSlice.actions;

// Selectors
export const selectNotifications = (state) => state.notifications;
export const selectAllNotifications = (state) => state.notifications.notifications;
export const selectUnreadCount = (state) => state.notifications.unreadCount;
export const selectNotificationCategories = (state) => state.notifications.categories;
export const selectNotificationSettings = (state) => state.notifications.settings;
export const selectPermissions = (state) => state.notifications.permissions;
export const selectFCMToken = (state) => state.notifications.fcmToken;
export const selectIsLoading = (state) => state.notifications.isLoading;
export const selectError = (state) => state.notifications.error;
export const selectFilters = (state) => state.notifications.filters;
export const selectSearchQuery = (state) => state.notifications.searchQuery;
export const selectScheduledNotifications = (state) => state.notifications.scheduled;
export const selectNotificationStats = (state) => state.notifications.stats;
export const selectConnectionStatus = (state) => state.notifications.connected;

// Complex selectors
export const selectUnreadNotifications = (state) =>
  state.notifications.notifications.filter(n => !n.read);

export const selectNotificationsByCategory = (state, category) =>
  state.notifications.categories[category] || [];

export const selectFilteredNotifications = (state) => {
  const { notifications, filters, searchQuery } = state.notifications;

  return notifications.filter(notification => {
    // Filter by category
    if (filters.category !== 'all' && notification.category !== filters.category) {
      return false;
    }

    // Filter by status (read/unread)
    if (filters.status === 'read' && !notification.read) {
      return false;
    }
    if (filters.status === 'unread' && notification.read) {
      return false;
    }

    // Filter by search query
    if (searchQuery && !notification.title?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.message?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const notificationDate = new Date(notification.created_at);
      const daysDiff = Math.floor((now - notificationDate) / (1000 * 60 * 60 * 24));

      switch (filters.dateRange) {
        case 'today':
          if (daysDiff > 0) return false;
          break;
        case 'week':
          if (daysDiff > 7) return false;
          break;
        case 'month':
          if (daysDiff > 30) return false;
          break;
        default:
          break;
      }
    }

    return true;
  });
};

export const selectRecentNotifications = (state, limit = 5) =>
  state.notifications.notifications
    .slice(0, limit)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

export default notificationsSlice.reducer;
