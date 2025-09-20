import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { combineReducers } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";

// Slices
import authSlice from "./slices/authSlice";
import issuesSlice from "./slices/issuesSlice";
import uiSlice from "./slices/uiSlice";
import notificationsSlice from "./slices/notificationsSlice";
import locationSlice from "./slices/locationSlice";
import categoriesSlice from "./slices/categoriesSlice";

// Persist configuration
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "ui"], // Only persist auth and ui state
  blacklist: ["issues", "notifications", "location", "categories"], // Don't persist these (fetch fresh)
};

const authPersistConfig = {
  key: "auth",
  storage,
  whitelist: ["token", "refreshToken", "user", "isAuthenticated"], // Persist auth data
};

const uiPersistConfig = {
  key: "ui",
  storage,
  whitelist: ["theme", "language", "preferences"], // Persist UI preferences
};

// Root reducer
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authSlice),
  issues: issuesSlice,
  ui: persistReducer(uiPersistConfig, uiSlice),
  notifications: notificationsSlice,
  location: locationSlice,
  categories: categoriesSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Custom middleware for handling auth errors
const authErrorMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // Handle 401 errors globally
  if (action.type?.endsWith("/rejected") && action.payload?.status === 401) {
    store.dispatch({ type: "auth/logout" });
  }

  return result;
};

// Custom middleware for logging in development
const loggerMiddleware = (store) => (next) => (action) => {
  if (process.env.NODE_ENV === "development") {
    console.group(`Action: ${action.type}`);
    console.log("Previous State:", store.getState());
    console.log("Action:", action);
  }

  const result = next(action);

  if (process.env.NODE_ENV === "development") {
    console.log("New State:", store.getState());
    console.groupEnd();
  }

  return result;
};

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "persist/PAUSE",
          "persist/PURGE",
          "persist/REGISTER",
          "persist/FLUSH",
        ],
        ignoredPaths: ["register", "rehydrate"],
      },
      thunk: {
        extraArgument: {
          // Add any extra services here (API client, etc.)
        },
      },
    })
      .concat(authErrorMiddleware)
      .concat(process.env.NODE_ENV === "development" ? loggerMiddleware : []),
  devTools: process.env.NODE_ENV !== "production",
  preloadedState: undefined,
  enhancers: (defaultEnhancers) => defaultEnhancers,
});

// Persistor for redux-persist
export const persistor = persistStore(store);

// Export hooks for use throughout the app
export const useAppDispatch = () => useDispatch();
export const useAppSelector = useSelector;

// Action creators for common operations
export const clearAllData = () => (dispatch) => {
  dispatch({ type: "issues/clearAll" });
  dispatch({ type: "notifications/clearAll" });
  dispatch({ type: "location/clearAll" });
  dispatch({ type: "categories/clearAll" });
};

export const resetAppState = () => (dispatch) => {
  dispatch({ type: "auth/logout" });
  dispatch(clearAllData());
};

// Selectors
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthToken = (state) => state.auth.token;
export const selectIsLoading = (state) => state.ui.isLoading;
export const selectTheme = (state) => state.ui.theme;

// Store subscription for analytics
if (typeof window !== "undefined") {
  store.subscribe(() => {
    const state = store.getState();

    // Track authentication state changes
    if (window.gtag) {
      const isAuthenticated = selectIsAuthenticated(state);
      const user = selectCurrentUser(state);

      if (isAuthenticated && user) {
        window.gtag("set", {
          user_id: user.id,
          custom_map: {
            dimension1: user.role,
            dimension2: user.city,
          },
        });
      }
    }
  });
}

// Hot module replacement for development
if (process.env.NODE_ENV === "development" && module.hot) {
  module.hot.accept("./slices/authSlice", () => {
    store.replaceReducer(persistedReducer);
  });
}

export default store;
