// API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class NotificationsAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/notifications`;
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

  // Get notifications with optional filters and pagination
  async getNotifications({ page = 1, limit = 20, type = null, read = null, category = null } = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (type) params.append('type', type);
      if (read !== null) params.append('read', read.toString());
      if (category) params.append('category', category);

      const response = await fetch(`${this.baseURL}?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        notifications: data.notifications || [],
        pagination: data.pagination || { page, limit, total: 0, pages: 0 },
        unread_count: data.unread_count || 0,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch notifications');
    }
  }

  // Get a specific notification by ID
  async getNotification(notificationId) {
    try {
      const response = await fetch(`${this.baseURL}/${notificationId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        notification: data.notification || data,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch notification');
    }
  }

  // Mark a notification as read
  async markAsRead(notificationId) {
    try {
      const response = await fetch(`${this.baseURL}/${notificationId}/read`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        notification: data.notification,
        success: true,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to mark notification as read');
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await fetch(`${this.baseURL}/mark-all-read`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        marked_count: data.marked_count || 0,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to mark all notifications as read');
    }
  }

  // Delete a notification
  async deleteNotification(notificationId) {
    try {
      const response = await fetch(`${this.baseURL}/${notificationId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete notification');
    }
  }

  // Delete all notifications
  async deleteAllNotifications() {
    try {
      const response = await fetch(`${this.baseURL}/delete-all`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        deleted_count: data.deleted_count || 0,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete all notifications');
    }
  }

  // Get notification settings
  async getSettings() {
    try {
      const response = await fetch(`${this.baseURL}/settings`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        settings: data.settings || {},
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch notification settings');
    }
  }

  // Update notification settings
  async updateSettings(settings) {
    try {
      const response = await fetch(`${this.baseURL}/settings`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ settings }),
      });

      const data = await this.handleResponse(response);

      return {
        settings: data.settings,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update notification settings');
    }
  }

  // Register device for push notifications
  async registerDevice({ subscription, userAgent, deviceType = 'web' }) {
    try {
      const response = await fetch(`${this.baseURL}/devices/register`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          subscription,
          user_agent: userAgent,
          device_type: deviceType,
          registered_at: new Date().toISOString(),
        }),
      });

      const data = await this.handleResponse(response);

      return {
        device: data.device,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to register device for push notifications');
    }
  }

  // Unregister device for push notifications
  async unregisterDevice(deviceId) {
    try {
      const response = await fetch(`${this.baseURL}/devices/${deviceId}/unregister`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to unregister device');
    }
  }

  // Send test notification
  async sendTestNotification({ type = 'info', message = 'This is a test notification' }) {
    try {
      const response = await fetch(`${this.baseURL}/test`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          type,
          message,
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await this.handleResponse(response);

      return {
        notification: data.notification,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to send test notification');
    }
  }

  // Schedule a notification
  async scheduleNotification({ message, scheduled_time, type = 'info', data = {} }) {
    try {
      const response = await fetch(`${this.baseURL}/schedule`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          message,
          scheduled_time,
          type,
          data,
        }),
      });

      const responseData = await this.handleResponse(response);

      return {
        notification: responseData.notification,
        message: responseData.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to schedule notification');
    }
  }

  // Get notification statistics
  async getStats() {
    try {
      const response = await fetch(`${this.baseURL}/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        stats: data.stats || {
          total: 0,
          unread: 0,
          read: 0,
          today: 0,
          this_week: 0,
          this_month: 0,
          by_type: {},
          by_category: {},
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch notification statistics');
    }
  }

  // Get notification templates (for admin use)
  async getTemplates() {
    try {
      const response = await fetch(`${this.baseURL}/templates`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        templates: data.templates || [],
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch notification templates');
    }
  }

  // Create notification template (for admin use)
  async createTemplate(templateData) {
    try {
      const response = await fetch(`${this.baseURL}/templates`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(templateData),
      });

      const data = await this.handleResponse(response);

      return {
        template: data.template,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to create notification template');
    }
  }

  // Send bulk notifications (for admin use)
  async sendBulkNotification({ recipients, message, type = 'info', data = {} }) {
    try {
      const response = await fetch(`${this.baseURL}/bulk`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          recipients,
          message,
          type,
          data,
        }),
      });

      const responseData = await this.handleResponse(response);

      return {
        sent_count: responseData.sent_count,
        failed_count: responseData.failed_count,
        message: responseData.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to send bulk notifications');
    }
  }

  // Get unread notification count
  async getUnreadCount() {
    try {
      const response = await fetch(`${this.baseURL}/unread-count`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        unread_count: data.unread_count || 0,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch unread notification count');
    }
  }

  // Export notifications (for user data export)
  async exportNotifications({ format = 'json', date_range = null } = {}) {
    try {
      const params = new URLSearchParams({ format });
      if (date_range) {
        params.append('start_date', date_range.start);
        params.append('end_date', date_range.end);
      }

      const response = await fetch(`${this.baseURL}/export?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Handle different response types based on format
      if (format === 'json') {
        return await response.json();
      } else {
        // For CSV, PDF, etc., return as blob
        const blob = await response.blob();
        return {
          data: blob,
          filename: response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || 'notifications.csv',
        };
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to export notifications');
    }
  }

  // Real-time notification subscription using WebSocket or SSE
  async subscribeToNotifications(callback) {
    try {
      const token = this.getAuthHeaders().Authorization?.replace('Bearer ', '');

      if ('EventSource' in window) {
        const eventSource = new EventSource(`${this.baseURL}/stream?token=${token}`);

        eventSource.onmessage = (event) => {
          try {
            const notification = JSON.parse(event.data);
            callback(notification);
          } catch (error) {
            console.error('Failed to parse notification data:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('Notification stream error:', error);
        };

        return {
          unsubscribe: () => eventSource.close(),
          connection: eventSource,
        };
      } else {
        throw new Error('EventSource not supported in this browser');
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to subscribe to notifications');
    }
  }
}

// Create and export a singleton instance
const notificationsAPI = new NotificationsAPI();
export default notificationsAPI;
