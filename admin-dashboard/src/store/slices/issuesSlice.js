import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  issues: [],
  selectedIssue: null,
  filters: {
    status: "all",
    category: "all",
    department: "all",
  },
  loading: false,
  error: null,
};

const issuesSlice = createSlice({
  name: "issues",
  initialState,
  reducers: {
    fetchIssuesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchIssuesSuccess: (state, action) => {
      state.loading = false;
      state.issues = action.payload;
    },
    fetchIssuesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedIssue: (state, action) => {
      state.selectedIssue = action.payload;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
  },
});

export const {
  fetchIssuesStart,
  fetchIssuesSuccess,
  fetchIssuesFailure,
  setSelectedIssue,
  updateFilters,
} = issuesSlice.actions;
export default issuesSlice.reducer;
