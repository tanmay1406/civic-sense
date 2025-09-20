import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import issuesAPI from '../../services/issuesAPI';

// Initial state
const initialState = {
  // Issues data
  issues: [],
  myIssues: [],
  nearbyIssues: [],
  currentIssue: null,
  searchResults: [],

  // Filters and pagination
  filters: {
    status: 'all',
    priority: 'all',
    category: 'all',
    dateRange: 'all',
    search: '',
    location: null,
    radius: 5,
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },

  // Loading states
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  isFetchingNearby: false,
  isSearching: false,

  // Error states
  error: null,
  createError: null,
  updateError: null,

  // UI states
  selectedIssues: [],
  sortBy: 'created_at',
  sortOrder: 'DESC',

  // Real-time updates
  lastUpdate: null,
  pendingUpdates: [],

  // Cache
  cache: {
    categories: new Map(),
    locations: new Map(),
    lastFetch: null,
  },

  // Statistics
  stats: {
    totalReported: 0,
    totalResolved: 0,
    avgResolutionTime: 0,
    mostCommonCategory: null,
  },
};

// Async thunks
export const createIssue = createAsyncThunk(
  'issues/createIssue',
  async (issueData, { rejectWithValue }) => {
    try {
      const formData = new FormData();

      // Add text fields
      Object.keys(issueData).forEach(key => {
        if (key !== 'media' && issueData[key] !== null && issueData[key] !== undefined) {
          if (typeof issueData[key] === 'object') {
            formData.append(key, JSON.stringify(issueData[key]));
          } else {
            formData.append(key, issueData[key]);
          }
        }
      });

      // Add media files
      if (issueData.media && issueData.media.length > 0) {
        issueData.media.forEach((file, index) => {
          formData.append('media', file);
        });
      }

      const response = await issuesAPI.createIssue(formData);

      toast.success(`Issue #${response.issue.issue_number} created successfully!`);

      return response.issue;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create issue';
      toast.error(errorMessage);
      return rejectWithValue({
        message: errorMessage,
        status: error.response?.status,
        details: error.response?.data?.details,
      });
    }
  }
);

export const fetchIssues = createAsyncThunk(
  'issues/fetchIssues',
  async ({ page = 1, limit = 20, filters = {} }, { rejectWithValue }) => {
    try {
      const params = {
        page,
        limit,
        ...filters,
      };

      const response = await issuesAPI.getIssues(params);

      return {
        issues: response.issues,
        pagination: response.pagination,
        filters: params,
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch issues',
      });
    }
  }
);

export const fetchMyIssues = createAsyncThunk(
  'issues/fetchMyIssues',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const params = {
        page,
        limit,
        my_issues: 'true',
      };

      const response = await issuesAPI.getIssues(params);

      return {
        issues: response.issues,
        pagination: response.pagination,
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch your issues',
      });
    }
  }
);

export const fetchNearbyIssues = createAsyncThunk(
  'issues/fetchNearbyIssues',
  async ({ latitude, longitude, radius = 5, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await issuesAPI.getNearbyIssues({
        latitude,
        longitude,
        radius,
        limit,
      });

      return response.issues;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch nearby issues',
      });
    }
  }
);

export const fetchIssueById = createAsyncThunk(
  'issues/fetchIssueById',
  async (issueId, { rejectWithValue }) => {
    try {
      const response = await issuesAPI.getIssueById(issueId);
      return response.issue;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch issue details',
      });
    }
  }
);

export const updateIssue = createAsyncThunk(
  'issues/updateIssue',
  async ({ issueId, updates }, { rejectWithValue }) => {
    try {
      const response = await issuesAPI.updateIssue(issueId, updates);

      toast.success('Issue updated successfully');

      return response.issue;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update issue';
      toast.error(errorMessage);
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const deleteIssue = createAsyncThunk(
  'issues/deleteIssue',
  async (issueId, { rejectWithValue }) => {
    try {
      await issuesAPI.deleteIssue(issueId);

      toast.success('Issue deleted successfully');

      return issueId;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete issue';
      toast.error(errorMessage);
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const submitFeedback = createAsyncThunk(
  'issues/submitFeedback',
  async ({ issueId, rating, feedback }, { rejectWithValue }) => {
    try {
      await issuesAPI.submitFeedback(issueId, { rating, feedback });

      toast.success('Thank you for your feedback!');

      return { issueId, rating, feedback };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit feedback';
      toast.error(errorMessage);
      return rejectWithValue({
        message: errorMessage,
      });
    }
  }
);

export const searchIssues = createAsyncThunk(
  'issues/searchIssues',
  async ({ query, filters = {} }, { rejectWithValue }) => {
    try {
      const params = {
        search: query,
        ...filters,
        limit: 50,
      };

      const response = await issuesAPI.getIssues(params);

      return {
        results: response.issues,
        query,
        total: response.pagination.total_items,
      };
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Search failed',
      });
    }
  }
);

export const fetchIssueStats = createAsyncThunk(
  'issues/fetchIssueStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await issuesAPI.getUserStats();
      return response.stats;
    } catch (error) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Failed to fetch statistics',
      });
    }
  }
);

// Issues slice
const issuesSlice = createSlice({
  name: 'issues',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearFilters: (state) => {
      state.filters = initialState.filters;
    },

    setSorting: (state, action) => {
      const { sortBy, sortOrder } = action.payload;
      state.sortBy = sortBy;
      state.sortOrder = sortOrder;
    },

    setCurrentIssue: (state, action) => {
      state.currentIssue = action.payload;
    },

    clearCurrentIssue: (state) => {
      state.currentIssue = null;
    },

    selectIssue: (state, action) => {
      const issueId = action.payload;
      if (!state.selectedIssues.includes(issueId)) {
        state.selectedIssues.push(issueId);
      }
    },

    deselectIssue: (state, action) => {
      const issueId = action.payload;
      state.selectedIssues = state.selectedIssues.filter(id => id !== issueId);
    },

    selectAllIssues: (state) => {
      state.selectedIssues = state.issues.map(issue => issue.id);
    },

    clearSelection: (state) => {
      state.selectedIssues = [];
    },

    updateIssueInList: (state, action) => {
      const updatedIssue = action.payload;

      // Update in main issues list
      const issueIndex = state.issues.findIndex(issue => issue.id === updatedIssue.id);
      if (issueIndex !== -1) {
        state.issues[issueIndex] = updatedIssue;
      }

      // Update in my issues list
      const myIssueIndex = state.myIssues.findIndex(issue => issue.id === updatedIssue.id);
      if (myIssueIndex !== -1) {
        state.myIssues[myIssueIndex] = updatedIssue;
      }

      // Update current issue if it matches
      if (state.currentIssue?.id === updatedIssue.id) {
        state.currentIssue = updatedIssue;
      }
    },

    removeIssueFromList: (state, action) => {
      const issueId = action.payload;

      state.issues = state.issues.filter(issue => issue.id !== issueId);
      state.myIssues = state.myIssues.filter(issue => issue.id !== issueId);
      state.selectedIssues = state.selectedIssues.filter(id => id !== issueId);

      if (state.currentIssue?.id === issueId) {
        state.currentIssue = null;
      }
    },

    addPendingUpdate: (state, action) => {
      const update = {
        ...action.payload,
        timestamp: new Date().toISOString(),
      };
      state.pendingUpdates.push(update);
    },

    processPendingUpdates: (state) => {
      state.pendingUpdates.forEach(update => {
        if (update.type === 'status_change') {
          const issue = state.issues.find(i => i.id === update.issueId);
          if (issue) {
            issue.status = update.newStatus;
            issue.last_status_update = update.timestamp;
          }
        }
      });

      state.pendingUpdates = [];
      state.lastUpdate = new Date().toISOString();
    },

    clearSearchResults: (state) => {
      state.searchResults = [];
    },

    updateCache: (state, action) => {
      const { key, data, type } = action.payload;
      if (type === 'categories') {
        state.cache.categories.set(key, data);
      } else if (type === 'locations') {
        state.cache.locations.set(key, data);
      }
      state.cache.lastFetch = new Date().toISOString();
    },

    clearCache: (state) => {
      state.cache = initialState.cache;
    },

    clearAll: (state) => {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    builder
      // Create Issue
      .addCase(createIssue.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createIssue.fulfilled, (state, action) => {
        state.isCreating = false;
        state.createError = null;

        // Add new issue to the beginning of lists
        state.issues.unshift(action.payload);
        state.myIssues.unshift(action.payload);

        // Update stats
        state.stats.totalReported += 1;
      })
      .addCase(createIssue.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload;
      })

      // Fetch Issues
      .addCase(fetchIssues.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIssues.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;

        const { issues, pagination, filters } = action.payload;

        // Replace or append based on page number
        if (pagination.current_page === 1) {
          state.issues = issues;
        } else {
          state.issues = [...state.issues, ...issues];
        }

        state.pagination = pagination;
        state.filters = { ...state.filters, ...filters };
      })
      .addCase(fetchIssues.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch My Issues
      .addCase(fetchMyIssues.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMyIssues.fulfilled, (state, action) => {
        state.isLoading = false;

        const { issues, pagination } = action.payload;

        if (pagination.current_page === 1) {
          state.myIssues = issues;
        } else {
          state.myIssues = [...state.myIssues, ...issues];
        }
      })
      .addCase(fetchMyIssues.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Nearby Issues
      .addCase(fetchNearbyIssues.pending, (state) => {
        state.isFetchingNearby = true;
      })
      .addCase(fetchNearbyIssues.fulfilled, (state, action) => {
        state.isFetchingNearby = false;
        state.nearbyIssues = action.payload;
      })
      .addCase(fetchNearbyIssues.rejected, (state, action) => {
        state.isFetchingNearby = false;
        state.error = action.payload;
      })

      // Fetch Issue by ID
      .addCase(fetchIssueById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchIssueById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentIssue = action.payload;
        state.error = null;
      })
      .addCase(fetchIssueById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Issue
      .addCase(updateIssue.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(updateIssue.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.updateError = null;

        const updatedIssue = action.payload;

        // Update in all relevant lists
        const updateInList = (list) => {
          const index = list.findIndex(issue => issue.id === updatedIssue.id);
          if (index !== -1) {
            list[index] = updatedIssue;
          }
        };

        updateInList(state.issues);
        updateInList(state.myIssues);
        updateInList(state.nearbyIssues);

        if (state.currentIssue?.id === updatedIssue.id) {
          state.currentIssue = updatedIssue;
        }
      })
      .addCase(updateIssue.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload;
      })

      // Delete Issue
      .addCase(deleteIssue.pending, (state) => {
        state.isDeleting = true;
      })
      .addCase(deleteIssue.fulfilled, (state, action) => {
        state.isDeleting = false;

        const deletedIssueId = action.payload;

        // Remove from all lists
        state.issues = state.issues.filter(issue => issue.id !== deletedIssueId);
        state.myIssues = state.myIssues.filter(issue => issue.id !== deletedIssueId);
        state.nearbyIssues = state.nearbyIssues.filter(issue => issue.id !== deletedIssueId);
        state.selectedIssues = state.selectedIssues.filter(id => id !== deletedIssueId);

        if (state.currentIssue?.id === deletedIssueId) {
          state.currentIssue = null;
        }

        // Update stats
        state.stats.totalReported = Math.max(0, state.stats.totalReported - 1);
      })
      .addCase(deleteIssue.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload;
      })

      // Submit Feedback
      .addCase(submitFeedback.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.isUpdating = false;

        const { issueId, rating, feedback } = action.payload;

        // Update the issue with feedback
        const updateFeedback = (issue) => {
          if (issue.id === issueId) {
            issue.citizen_rating = rating;
            issue.citizen_feedback = feedback;
            issue.feedback_given_at = new Date().toISOString();
          }
        };

        state.issues.forEach(updateFeedback);
        state.myIssues.forEach(updateFeedback);

        if (state.currentIssue?.id === issueId) {
          state.currentIssue.citizen_rating = rating;
          state.currentIssue.citizen_feedback = feedback;
          state.currentIssue.feedback_given_at = new Date().toISOString();
        }
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // Search Issues
      .addCase(searchIssues.pending, (state) => {
        state.isSearching = true;
      })
      .addCase(searchIssues.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload.results;
      })
      .addCase(searchIssues.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload;
      })

      // Fetch Issue Stats
      .addCase(fetchIssueStats.fulfilled, (state, action) => {
        state.stats = { ...state.stats, ...action.payload };
      });
  },
});

// Export actions
export const {
  clearError,
  setFilters,
  clearFilters,
  setSorting,
  setCurrentIssue,
  clearCurrentIssue,
  selectIssue,
  deselectIssue,
  selectAllIssues,
  clearSelection,
  updateIssueInList,
  removeIssueFromList,
  addPendingUpdate,
  processPendingUpdates,
  clearSearchResults,
  updateCache,
  clearCache,
  clearAll,
} = issuesSlice.actions;

// Selectors
export const selectIssues = (state) => state.issues;
export const selectIssuesList = (state) => state.issues.issues;
export const selectMyIssues = (state) => state.issues.myIssues;
export const selectNearbyIssues = (state) => state.issues.nearbyIssues;
export const selectCurrentIssue = (state) => state.issues.currentIssue;
export const selectSearchResults = (state) => state.issues.searchResults;
export const selectFilters = (state) => state.issues.filters;
export const selectPagination = (state) => state.issues.pagination;
export const selectSelectedIssues = (state) => state.issues.selectedIssues;
export const selectIsLoading = (state) => state.issues.isLoading;
export const selectIsCreating = (state) => state.issues.isCreating;
export const selectIsUpdating = (state) => state.issues.isUpdating;
export const selectError = (state) => state.issues.error;
export const selectCreateError = (state) => state.issues.createError;
export const selectIssueStats = (state) => state.issues.stats;

// Complex selectors
export const selectFilteredIssues = (state) => {
  const { issues, filters } = state.issues;

  return issues.filter(issue => {
    if (filters.status !== 'all' && issue.status !== filters.status) {
      return false;
    }
    if (filters.priority !== 'all' && issue.priority !== filters.priority) {
      return false;
    }
    if (filters.category !== 'all' && issue.category_id !== filters.category) {
      return false;
    }
    if (filters.search && !issue.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !issue.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }

    return true;
  });
};

export const selectIssueById = (state, issueId) => {
  return state.issues.issues.find(issue => issue.id === issueId) ||
         state.issues.myIssues.find(issue => issue.id === issueId) ||
         state.issues.nearbyIssues.find(issue => issue.id === issueId);
};

export const selectIssuesByStatus = (state, status) => {
  return state.issues.issues.filter(issue => issue.status === status);
};

export const selectOverdueIssues = (state) => {
  const now = new Date();
  return state.issues.myIssues.filter(issue => {
    if (!issue.sla_deadline) return false;
    return new Date(issue.sla_deadline) < now &&
           !['resolved', 'closed'].includes(issue.status);
  });
};

export default issuesSlice.reducer;
