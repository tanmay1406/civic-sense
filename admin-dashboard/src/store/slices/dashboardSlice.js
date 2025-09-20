import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  stats: {
    totalIssues: 0,
    pendingIssues: 0,
    resolvedIssues: 0,
    departments: 0,
  },
  recentIssues: [],
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    fetchStatsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchStatsSuccess: (state, action) => {
      state.loading = false;
      state.stats = action.payload.stats;
      state.recentIssues = action.payload.recentIssues;
    },
    fetchStatsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchStatsStart, fetchStatsSuccess, fetchStatsFailure } =
  dashboardSlice.actions;
export default dashboardSlice.reducer;
