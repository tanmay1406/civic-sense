// API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class IssuesAPI {
  constructor() {
    this.baseURL = `${API_BASE_URL}/issues`;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('civic_token') || sessionStorage.getItem('civic_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // Helper method to get auth headers for multipart/form-data
  getMultipartAuthHeaders() {
    const token = localStorage.getItem('civic_token') || sessionStorage.getItem('civic_token');
    return {
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

  // Get issues with optional filters and pagination
  async getIssues({
    page = 1,
    limit = 20,
    category = null,
    status = null,
    priority = null,
    location = null,
    search = null,
    sortBy = 'created_at',
    sortOrder = 'desc',
    dateRange = null,
  } = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (category) params.append('category', category);
      if (status) params.append('status', status);
      if (priority) params.append('priority', priority);
      if (location) params.append('location', location);
      if (search) params.append('search', search);
      if (dateRange?.start) params.append('start_date', dateRange.start);
      if (dateRange?.end) params.append('end_date', dateRange.end);

      const response = await fetch(`${this.baseURL}?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        issues: data.issues || [],
        pagination: data.pagination || { page, limit, total: 0, pages: 0 },
        filters: data.filters || {},
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch issues');
    }
  }

  // Get a specific issue by ID
  async getIssue(issueId) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        issue: data.issue || data,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch issue');
    }
  }

  // Create a new issue
  async createIssue(issueData) {
    try {
      // Handle file uploads
      const formData = new FormData();

      // Add text fields
      Object.keys(issueData).forEach(key => {
        if (key !== 'images' && key !== 'attachments') {
          formData.append(key, issueData[key]);
        }
      });

      // Add images
      if (issueData.images && issueData.images.length > 0) {
        issueData.images.forEach((image, index) => {
          formData.append(`images`, image);
        });
      }

      // Add other attachments
      if (issueData.attachments && issueData.attachments.length > 0) {
        issueData.attachments.forEach((file, index) => {
          formData.append(`attachments`, file);
        });
      }

      const response = await fetch(`${this.baseURL}`, {
        method: 'POST',
        headers: this.getMultipartAuthHeaders(),
        body: formData,
      });

      const data = await this.handleResponse(response);

      return {
        issue: data.issue,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to create issue');
    }
  }

  // Update an existing issue
  async updateIssue(issueId, updateData) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const data = await this.handleResponse(response);

      return {
        issue: data.issue,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update issue');
    }
  }

  // Delete an issue
  async deleteIssue(issueId) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete issue');
    }
  }

  // Get user's own issues
  async getUserIssues({
    page = 1,
    limit = 20,
    status = null,
    category = null,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (status) params.append('status', status);
      if (category) params.append('category', category);

      const response = await fetch(`${this.baseURL}/my-issues?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        issues: data.issues || [],
        pagination: data.pagination || { page, limit, total: 0, pages: 0 },
        stats: data.stats || {},
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch user issues');
    }
  }

  // Get nearby issues
  async getNearbyIssues({ latitude, longitude, radius = 5000, limit = 50 } = {}) {
    try {
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lng: longitude.toString(),
        radius: radius.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseURL}/nearby?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        issues: data.issues || [],
        count: data.count || 0,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch nearby issues');
    }
  }

  // Vote on an issue (upvote/downvote)
  async voteOnIssue(issueId, voteType) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}/vote`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ vote_type: voteType }),
      });

      const data = await this.handleResponse(response);

      return {
        vote: data.vote,
        vote_count: data.vote_count,
        user_vote: data.user_vote,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to vote on issue');
    }
  }

  // Remove vote from an issue
  async removeVote(issueId) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}/vote`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        vote_count: data.vote_count,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to remove vote');
    }
  }

  // Follow/unfollow an issue
  async followIssue(issueId) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}/follow`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        following: data.following,
        followers_count: data.followers_count,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to follow issue');
    }
  }

  async unfollowIssue(issueId) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}/follow`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        following: data.following,
        followers_count: data.followers_count,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to unfollow issue');
    }
  }

  // Add comment to an issue
  async addComment(issueId, commentData) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}/comments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(commentData),
      });

      const data = await this.handleResponse(response);

      return {
        comment: data.comment,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to add comment');
    }
  }

  // Get comments for an issue
  async getComments(issueId, { page = 1, limit = 20 } = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseURL}/${issueId}/comments?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        comments: data.comments || [],
        pagination: data.pagination || { page, limit, total: 0, pages: 0 },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch comments');
    }
  }

  // Update comment
  async updateComment(issueId, commentId, commentData) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}/comments/${commentId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(commentData),
      });

      const data = await this.handleResponse(response);

      return {
        comment: data.comment,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update comment');
    }
  }

  // Delete comment
  async deleteComment(issueId, commentId) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        success: true,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to delete comment');
    }
  }

  // Get issue statistics
  async getIssueStats({ dateRange = null, category = null, location = null } = {}) {
    try {
      const params = new URLSearchParams();

      if (dateRange?.start) params.append('start_date', dateRange.start);
      if (dateRange?.end) params.append('end_date', dateRange.end);
      if (category) params.append('category', category);
      if (location) params.append('location', location);

      const response = await fetch(`${this.baseURL}/stats?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        stats: data.stats || {
          total: 0,
          by_status: {},
          by_category: {},
          by_priority: {},
          by_location: {},
          recent_trends: [],
        },
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch issue statistics');
    }
  }

  // Report inappropriate issue
  async reportIssue(issueId, reportData) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}/report`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(reportData),
      });

      const data = await this.handleResponse(response);

      return {
        report: data.report,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to report issue');
    }
  }

  // Share issue (get shareable link)
  async shareIssue(issueId) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}/share`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        share_url: data.share_url,
        share_token: data.share_token,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to generate share link');
    }
  }

  // Get trending issues
  async getTrendingIssues({ timeframe = 'week', limit = 10 } = {}) {
    try {
      const params = new URLSearchParams({
        timeframe,
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseURL}/trending?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        issues: data.issues || [],
        timeframe: data.timeframe,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch trending issues');
    }
  }

  // Search issues
  async searchIssues({ query, filters = {}, page = 1, limit = 20 } = {}) {
    try {
      const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        limit: limit.toString(),
      });

      // Add filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      const response = await fetch(`${this.baseURL}/search?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        issues: data.issues || [],
        pagination: data.pagination || { page, limit, total: 0, pages: 0 },
        suggestions: data.suggestions || [],
        query: data.query,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to search issues');
    }
  }

  // Export issues (for user data export)
  async exportIssues({ format = 'json', filters = {} } = {}) {
    try {
      const params = new URLSearchParams({ format });

      // Add filter parameters
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

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
          filename: response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || 'issues.csv',
        };
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to export issues');
    }
  }

  // Bulk operations
  async bulkUpdateIssues(issueIds, updateData) {
    try {
      const response = await fetch(`${this.baseURL}/bulk-update`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          issue_ids: issueIds,
          update_data: updateData,
        }),
      });

      const data = await this.handleResponse(response);

      return {
        updated_count: data.updated_count,
        failed_count: data.failed_count,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to bulk update issues');
    }
  }

  async bulkDeleteIssues(issueIds) {
    try {
      const response = await fetch(`${this.baseURL}/bulk-delete`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ issue_ids: issueIds }),
      });

      const data = await this.handleResponse(response);

      return {
        deleted_count: data.deleted_count,
        failed_count: data.failed_count,
        message: data.message,
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to bulk delete issues');
    }
  }

  // Get issue history/timeline
  async getIssueHistory(issueId) {
    try {
      const response = await fetch(`${this.baseURL}/${issueId}/history`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        history: data.history || [],
        timeline: data.timeline || [],
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch issue history');
    }
  }

  // Get similar issues
  async getSimilarIssues(issueId, { limit = 5 } = {}) {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseURL}/${issueId}/similar?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const data = await this.handleResponse(response);

      return {
        similar_issues: data.similar_issues || [],
        similarity_score: data.similarity_score || {},
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch similar issues');
    }
  }
}

// Create and export a singleton instance
const issuesAPI = new IssuesAPI();
export default issuesAPI;
