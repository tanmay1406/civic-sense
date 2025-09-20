import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// API endpoints (update these based on your backend)
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Async thunks for category operations
export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`);

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCategoryById = createAsyncThunk(
  "categories/fetchCategoryById",
  async (categoryId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch category");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (categoryData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create category");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async ({ categoryId, categoryData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update category");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (categoryId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await fetch(`${API_BASE_URL}/categories/${categoryId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete category");
      }

      return categoryId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Default categories for fallback
const defaultCategories = [
  {
    id: 1,
    name: "Road & Traffic",
    description: "Issues related to roads, traffic signals, potholes, and transportation",
    icon: "🚗",
    color: "#FF6B6B",
    priority: "high",
    department: "Public Works Department",
    estimatedResolutionTime: "7-14 days",
    isActive: true,
  },
  {
    id: 2,
    name: "Water & Drainage",
    description: "Water supply issues, drainage problems, and sewage-related concerns",
    icon: "💧",
    color: "#4ECDC4",
    priority: "high",
    department: "Water Works Department",
    estimatedResolutionTime: "3-7 days",
    isActive: true,
  },
  {
    id: 3,
    name: "Electricity & Street Lights",
    description: "Power outages, street lighting issues, and electrical problems",
    icon: "💡",
    color: "#45B7D1",
    priority: "medium",
    department: "Electrical Department",
    estimatedResolutionTime: "2-5 days",
    isActive: true,
  },
  {
    id: 4,
    name: "Garbage & Sanitation",
    description: "Waste management, garbage collection, and sanitation issues",
    icon: "🗑️",
    color: "#96CEB4",
    priority: "medium",
    department: "Sanitation Department",
    estimatedResolutionTime: "1-3 days",
    isActive: true,
  },
  {
    id: 5,
    name: "Public Safety",
    description: "Security concerns, safety hazards, and emergency situations",
    icon: "🚨",
    color: "#FFEAA7",
    priority: "high",
    department: "Police Department",
    estimatedResolutionTime: "Immediate - 24 hours",
    isActive: true,
  },
  {
    id: 6,
    name: "Parks & Recreation",
    description: "Public parks, playgrounds, and recreational facility issues",
    icon: "🌳",
    color: "#DDA0DD",
    priority: "low",
    department: "Parks & Recreation Department",
    estimatedResolutionTime: "5-10 days",
    isActive: true,
  },
  {
    id: 7,
    name: "Public Buildings",
    description: "Issues with government buildings, offices, and public facilities",
    icon: "🏢",
    color: "#98D8C8",
    priority: "medium",
    department: "Building Maintenance Department",
    estimatedResolutionTime: "3-7 days",
    isActive: true,
  },
  {
    id: 8,
    name: "Noise & Environment",
    description: "Noise pollution, environmental concerns, and air quality issues",
    icon: "🌍",
    color: "#F7DC6F",
    priority: "low",
    department: "Environmental Department",
    estimatedResolutionTime: "5-14 days",
    isActive: true,
  },
  {
    id: 9,
    name: "Animal Control",
    description: "Stray animals, animal welfare, and wildlife-related issues",
    icon: "🐕",
    color: "#BB8FCE",
    priority: "medium",
    department: "Animal Control Department",
    estimatedResolutionTime: "1-5 days",
    isActive: true,
  },
  {
    id: 10,
    name: "Other",
    description: "Issues that don't fit into other categories",
    icon: "❓",
    color: "#AED6F1",
    priority: "low",
    department: "General Administration",
    estimatedResolutionTime: "7-14 days",
    isActive: true,
  },
];

const initialState = {
  // Categories data
  categories: [],
  selectedCategory: null,

  // Loading states
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,

  // Error states
  error: null,
  createError: null,
  updateError: null,
  deleteError: null,

  // Filters and search
  searchTerm: "",
  filterBy: "all", // 'all', 'active', 'inactive', 'high-priority', etc.
  sortBy: "name", // 'name', 'priority', 'department', 'createdAt'
  sortOrder: "asc", // 'asc', 'desc'

  // UI state
  isInitialized: false,
  lastFetched: null,
};

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    clearCreateError: (state) => {
      state.createError = null;
    },

    clearUpdateError: (state) => {
      state.updateError = null;
    },

    clearDeleteError: (state) => {
      state.deleteError = null;
    },

    clearAllErrors: (state) => {
      state.error = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
    },

    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },

    clearSelectedCategory: (state) => {
      state.selectedCategory = null;
    },

    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },

    setFilterBy: (state, action) => {
      state.filterBy = action.payload;
    },

    setSortBy: (state, action) => {
      state.sortBy = action.payload;
    },

    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },

    initializeWithDefaults: (state) => {
      if (!state.isInitialized) {
        state.categories = defaultCategories;
        state.isInitialized = true;
        state.lastFetched = Date.now();
      }
    },

    clearAll: (state) => {
      return { ...initialState, categories: defaultCategories, isInitialized: true };
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchCategories
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload.length > 0 ? action.payload : defaultCategories;
        state.isInitialized = true;
        state.lastFetched = Date.now();
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // Use default categories as fallback
        if (!state.isInitialized) {
          state.categories = defaultCategories;
          state.isInitialized = true;
        }
      })

      // fetchCategoryById
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.selectedCategory = action.payload;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.error = action.payload;
      })

      // createCategory
      .addCase(createCategory.pending, (state) => {
        state.isCreating = true;
        state.createError = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.isCreating = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.isCreating = false;
        state.createError = action.payload;
      })

      // updateCategory
      .addCase(updateCategory.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.categories.findIndex(cat => cat.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        if (state.selectedCategory?.id === action.payload.id) {
          state.selectedCategory = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload;
      })

      // deleteCategory
      .addCase(deleteCategory.pending, (state) => {
        state.isDeleting = true;
        state.deleteError = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.categories = state.categories.filter(cat => cat.id !== action.payload);
        if (state.selectedCategory?.id === action.payload) {
          state.selectedCategory = null;
        }
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isDeleting = false;
        state.deleteError = action.payload;
      });
  },
});

export const {
  clearError,
  clearCreateError,
  clearUpdateError,
  clearDeleteError,
  clearAllErrors,
  setSelectedCategory,
  clearSelectedCategory,
  setSearchTerm,
  setFilterBy,
  setSortBy,
  setSortOrder,
  initializeWithDefaults,
  clearAll,
} = categoriesSlice.actions;

// Selectors
export const selectAllCategories = (state) => state.categories.categories;
export const selectActiveCategories = (state) =>
  state.categories.categories.filter(cat => cat.isActive);
export const selectSelectedCategory = (state) => state.categories.selectedCategory;
export const selectCategoriesLoading = (state) => state.categories.isLoading;
export const selectCategoriesError = (state) => state.categories.error;
export const selectIsCreating = (state) => state.categories.isCreating;
export const selectIsUpdating = (state) => state.categories.isUpdating;
export const selectIsDeleting = (state) => state.categories.isDeleting;
export const selectSearchTerm = (state) => state.categories.searchTerm;
export const selectFilterBy = (state) => state.categories.filterBy;
export const selectSortBy = (state) => state.categories.sortBy;
export const selectSortOrder = (state) => state.categories.sortOrder;
export const selectIsInitialized = (state) => state.categories.isInitialized;

// Computed selectors
export const selectFilteredAndSortedCategories = (state) => {
  const categories = state.categories.categories;
  const searchTerm = state.categories.searchTerm.toLowerCase();
  const filterBy = state.categories.filterBy;
  const sortBy = state.categories.sortBy;
  const sortOrder = state.categories.sortOrder;

  // Filter categories
  let filtered = categories;

  if (searchTerm) {
    filtered = categories.filter(cat =>
      cat.name.toLowerCase().includes(searchTerm) ||
      cat.description.toLowerCase().includes(searchTerm) ||
      cat.department.toLowerCase().includes(searchTerm)
    );
  }

  if (filterBy !== "all") {
    switch (filterBy) {
      case "active":
        filtered = filtered.filter(cat => cat.isActive);
        break;
      case "inactive":
        filtered = filtered.filter(cat => !cat.isActive);
        break;
      case "high-priority":
        filtered = filtered.filter(cat => cat.priority === "high");
        break;
      case "medium-priority":
        filtered = filtered.filter(cat => cat.priority === "medium");
        break;
      case "low-priority":
        filtered = filtered.filter(cat => cat.priority === "low");
        break;
      default:
        break;
    }
  }

  // Sort categories
  const sorted = [...filtered].sort((a, b) => {
    let aVal, bVal;

    switch (sortBy) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        aVal = priorityOrder[a.priority] || 0;
        bVal = priorityOrder[b.priority] || 0;
        break;
      case "department":
        aVal = a.department.toLowerCase();
        bVal = b.department.toLowerCase();
        break;
      case "createdAt":
        aVal = new Date(a.createdAt || 0);
        bVal = new Date(b.createdAt || 0);
        break;
      default:
        aVal = a.id;
        bVal = b.id;
    }

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
};

export const selectCategoryById = (state, categoryId) =>
  state.categories.categories.find(cat => cat.id === categoryId);

export const selectCategoriesByDepartment = (state, department) =>
  state.categories.categories.filter(cat => cat.department === department);

export const selectHighPriorityCategories = (state) =>
  state.categories.categories.filter(cat => cat.priority === "high" && cat.isActive);

export default categoriesSlice.reducer;
