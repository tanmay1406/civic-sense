import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  // Theme and appearance
  theme: 'light', // 'light' | 'dark' | 'auto'
  colorScheme: 'default', // 'default' | 'colorblind' | 'high-contrast'
  fontSize: 'medium', // 'small' | 'medium' | 'large'

  // Language and localization
  language: 'en', // 'en' | 'hi' | 'bn' | etc.
  rtl: false, // Right-to-left layout

  // Layout states
  sidebarOpen: false,
  sidebarCollapsed: false,
  sidebarPersistent: false,
  bottomNavVisible: true,
  headerVisible: true,

  // Modal and dialog states
  modals: {
    issueDetails: { open: false, data: null },
    imageViewer: { open: false, images: [], currentIndex: 0 },
    confirmDialog: { open: false, title: '', message: '', onConfirm: null },
    locationPicker: { open: false, currentLocation: null, onSelect: null },
    categoryPicker: { open: false, selectedCategory: null, onSelect: null },
    filterDialog: { open: false, filters: {} },
    profileEdit: { open: false },
    feedbackDialog: { open: false, issueId: null },
    shareDialog: { open: false, content: null },
  },

  // Loading states
  globalLoading: false,
  loadingStates: {
    location: false,
    upload: false,
    submit: false,
    delete: false,
    share: false,
  },

  // Progress tracking
  progress: {
    upload: { visible: false, value: 0, total: 0 },
    sync: { visible: false, value: 0, total: 0 },
  },

  // Form states
  forms: {
    issueForm: {
      dirty: false,
      valid: false,
      step: 1,
      maxSteps: 4,
      data: {},
    },
    profileForm: {
      dirty: false,
      valid: false,
      data: {},
    },
  },

  // Navigation and routing
  navigation: {
    currentTab: 'home',
    previousRoute: null,
    canGoBack: false,
    breadcrumbs: [],
  },

  // Search and filters
  search: {
    query: '',
    suggestions: [],
    recentSearches: [],
    showSuggestions: false,
  },

  // Notifications and alerts
  notifications: [],
  alerts: {
    networkStatus: { show: false, online: true },
    locationPermission: { show: false },
    installPrompt: { show: false, deferred: null },
    updateAvailable: { show: false },
  },

  // Device and responsive states
  device: {
    type: 'mobile', // 'mobile' | 'tablet' | 'desktop'
    orientation: 'portrait', // 'portrait' | 'landscape'
    online: true,
    batteryLevel: null,
    isLowPowerMode: false,
  },

  // Accessibility
  accessibility: {
    screenReader: false,
    reducedMotion: false,
    highContrast: false,
    focusVisible: true,
  },

  // User preferences
  preferences: {
    autoLocation: true,
    pushNotifications: true,
    emailNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
    savePhotos: false,
    defaultCategory: null,
    mapStyle: 'default', // 'default' | 'satellite' | 'terrain'
  },

  // Error handling
  errors: {
    global: null,
    network: null,
    permission: null,
    location: null,
    camera: null,
    upload: null,
  },

  // Feature flags and experiments
  features: {
    voiceInput: true,
    aiSuggestions: false,
    realTimeUpdates: true,
    offlineMode: true,
    advancedFilters: true,
  },

  // Tutorial and onboarding
  onboarding: {
    completed: false,
    currentStep: 0,
    totalSteps: 5,
    skipAvailable: true,
    showTips: true,
  },

  // Cache and performance
  cache: {
    lastCleared: null,
    size: 0,
    limit: 50 * 1024 * 1024, // 50MB
  },

  // Debug information (development only)
  debug: {
    enabled: false,
    logs: [],
    performance: {},
  },
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme actions
    setTheme: (state, action) => {
      state.theme = action.payload;

      // Apply theme to document
      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute('data-theme', action.payload);
      }
    },

    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';

      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute('data-theme', state.theme);
      }
    },

    setColorScheme: (state, action) => {
      state.colorScheme = action.payload;
    },

    setFontSize: (state, action) => {
      state.fontSize = action.payload;
    },

    // Language actions
    setLanguage: (state, action) => {
      state.language = action.payload;
      state.rtl = ['ar', 'fa', 'he', 'ur'].includes(action.payload);
    },

    // Layout actions
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },

    setSidebarCollapsed: (state, action) => {
      state.sidebarCollapsed = action.payload;
    },

    setSidebarPersistent: (state, action) => {
      state.sidebarPersistent = action.payload;
    },

    setBottomNavVisible: (state, action) => {
      state.bottomNavVisible = action.payload;
    },

    setHeaderVisible: (state, action) => {
      state.headerVisible = action.payload;
    },

    // Modal actions
    openModal: (state, action) => {
      const { modalName, data = null } = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName].open = true;
        state.modals[modalName].data = data;
      }
    },

    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName].open = false;
        state.modals[modalName].data = null;
      }
    },

    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(modalName => {
        state.modals[modalName].open = false;
        state.modals[modalName].data = null;
      });
    },

    updateModalData: (state, action) => {
      const { modalName, data } = action.payload;
      if (state.modals[modalName]) {
        state.modals[modalName].data = { ...state.modals[modalName].data, ...data };
      }
    },

    // Loading actions
    setGlobalLoading: (state, action) => {
      state.globalLoading = action.payload;
    },

    setLoadingState: (state, action) => {
      const { key, loading } = action.payload;
      state.loadingStates[key] = loading;
    },

    setProgress: (state, action) => {
      const { type, visible, value, total } = action.payload;
      state.progress[type] = { visible, value, total };
    },

    // Form actions
    setFormState: (state, action) => {
      const { formName, updates } = action.payload;
      if (state.forms[formName]) {
        state.forms[formName] = { ...state.forms[formName], ...updates };
      }
    },

    setFormData: (state, action) => {
      const { formName, data } = action.payload;
      if (state.forms[formName]) {
        state.forms[formName].data = data;
        state.forms[formName].dirty = true;
      }
    },

    resetForm: (state, action) => {
      const formName = action.payload;
      if (state.forms[formName]) {
        state.forms[formName] = {
          dirty: false,
          valid: false,
          step: 1,
          data: {},
        };
      }
    },

    // Navigation actions
    setCurrentTab: (state, action) => {
      state.navigation.currentTab = action.payload;
    },

    setPreviousRoute: (state, action) => {
      state.navigation.previousRoute = action.payload;
    },

    setCanGoBack: (state, action) => {
      state.navigation.canGoBack = action.payload;
    },

    setBreadcrumbs: (state, action) => {
      state.navigation.breadcrumbs = action.payload;
    },

    // Search actions
    setSearchQuery: (state, action) => {
      state.search.query = action.payload;
    },

    setSearchSuggestions: (state, action) => {
      state.search.suggestions = action.payload;
    },

    addRecentSearch: (state, action) => {
      const query = action.payload;
      state.search.recentSearches = [
        query,
        ...state.search.recentSearches.filter(q => q !== query)
      ].slice(0, 10); // Keep only last 10 searches
    },

    clearRecentSearches: (state) => {
      state.search.recentSearches = [];
    },

    setShowSuggestions: (state, action) => {
      state.search.showSuggestions = action.payload;
    },

    // Notification actions
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...action.payload,
      };
      state.notifications.unshift(notification);

      // Keep only last 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },

    removeNotification: (state, action) => {
      const id = action.payload;
      state.notifications = state.notifications.filter(n => n.id !== id);
    },

    markNotificationRead: (state, action) => {
      const id = action.payload;
      const notification = state.notifications.find(n => n.id === id);
      if (notification) {
        notification.read = true;
      }
    },

    clearNotifications: (state) => {
      state.notifications = [];
    },

    // Alert actions
    setAlert: (state, action) => {
      const { type, data } = action.payload;
      if (state.alerts[type]) {
        state.alerts[type] = { ...state.alerts[type], ...data };
      }
    },

    hideAlert: (state, action) => {
      const type = action.payload;
      if (state.alerts[type]) {
        state.alerts[type].show = false;
      }
    },

    // Device actions
    setDeviceInfo: (state, action) => {
      state.device = { ...state.device, ...action.payload };
    },

    setOnlineStatus: (state, action) => {
      state.device.online = action.payload;
    },

    setOrientation: (state, action) => {
      state.device.orientation = action.payload;
    },

    // Accessibility actions
    setAccessibilitySettings: (state, action) => {
      state.accessibility = { ...state.accessibility, ...action.payload };
    },

    // Preferences actions
    updatePreferences: (state, action) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },

    resetPreferences: (state) => {
      state.preferences = initialState.preferences;
    },

    // Error actions
    setError: (state, action) => {
      const { type, error } = action.payload;
      state.errors[type] = error;
    },

    clearError: (state, action) => {
      const type = action.payload;
      state.errors[type] = null;
    },

    clearAllErrors: (state) => {
      state.errors = initialState.errors;
    },

    // Feature flags
    setFeature: (state, action) => {
      const { feature, enabled } = action.payload;
      state.features[feature] = enabled;
    },

    // Onboarding actions
    setOnboardingStep: (state, action) => {
      state.onboarding.currentStep = action.payload;
    },

    completeOnboarding: (state) => {
      state.onboarding.completed = true;
      state.onboarding.currentStep = state.onboarding.totalSteps;
    },

    resetOnboarding: (state) => {
      state.onboarding = initialState.onboarding;
    },

    // Cache actions
    updateCacheInfo: (state, action) => {
      state.cache = { ...state.cache, ...action.payload };
    },

    clearCache: (state) => {
      state.cache.lastCleared = new Date().toISOString();
      state.cache.size = 0;
    },

    // Debug actions (development only)
    setDebugEnabled: (state, action) => {
      state.debug.enabled = action.payload;
    },

    addDebugLog: (state, action) => {
      if (state.debug.enabled) {
        state.debug.logs.unshift({
          timestamp: new Date().toISOString(),
          ...action.payload,
        });

        // Keep only last 100 logs
        if (state.debug.logs.length > 100) {
          state.debug.logs = state.debug.logs.slice(0, 100);
        }
      }
    },

    updatePerformanceMetrics: (state, action) => {
      state.debug.performance = { ...state.debug.performance, ...action.payload };
    },

    // Reset all UI state
    resetUI: (state) => {
      // Keep theme and language preferences
      const { theme, language, preferences, onboarding } = state;
      return {
        ...initialState,
        theme,
        language,
        preferences,
        onboarding,
      };
    },
  },
});

// Export actions
export const {
  // Theme
  setTheme,
  toggleTheme,
  setColorScheme,
  setFontSize,

  // Language
  setLanguage,

  // Layout
  toggleSidebar,
  setSidebarOpen,
  setSidebarCollapsed,
  setSidebarPersistent,
  setBottomNavVisible,
  setHeaderVisible,

  // Modals
  openModal,
  closeModal,
  closeAllModals,
  updateModalData,

  // Loading
  setGlobalLoading,
  setLoadingState,
  setProgress,

  // Forms
  setFormState,
  setFormData,
  resetForm,

  // Navigation
  setCurrentTab,
  setPreviousRoute,
  setCanGoBack,
  setBreadcrumbs,

  // Search
  setSearchQuery,
  setSearchSuggestions,
  addRecentSearch,
  clearRecentSearches,
  setShowSuggestions,

  // Notifications
  addNotification,
  removeNotification,
  markNotificationRead,
  clearNotifications,

  // Alerts
  setAlert,
  hideAlert,

  // Device
  setDeviceInfo,
  setOnlineStatus,
  setOrientation,

  // Accessibility
  setAccessibilitySettings,

  // Preferences
  updatePreferences,
  resetPreferences,

  // Errors
  setError,
  clearError,
  clearAllErrors,

  // Features
  setFeature,

  // Onboarding
  setOnboardingStep,
  completeOnboarding,
  resetOnboarding,

  // Cache
  updateCacheInfo,
  clearCache,

  // Debug
  setDebugEnabled,
  addDebugLog,
  updatePerformanceMetrics,

  // Reset
  resetUI,
} = uiSlice.actions;

// Selectors
export const selectUI = (state) => state.ui;
export const selectTheme = (state) => state.ui.theme;
export const selectLanguage = (state) => state.ui.language;
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectModals = (state) => state.ui.modals;
export const selectModal = (state, modalName) => state.ui.modals[modalName];
export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectLoadingState = (state, key) => state.ui.loadingStates[key];
export const selectProgress = (state, type) => state.ui.progress[type];
export const selectForm = (state, formName) => state.ui.forms[formName];
export const selectNavigation = (state) => state.ui.navigation;
export const selectCurrentTab = (state) => state.ui.navigation.currentTab;
export const selectSearch = (state) => state.ui.search;
export const selectNotifications = (state) => state.ui.notifications;
export const selectUnreadNotifications = (state) =>
  state.ui.notifications.filter(n => !n.read);
export const selectAlerts = (state) => state.ui.alerts;
export const selectDevice = (state) => state.ui.device;
export const selectIsOnline = (state) => state.ui.device.online;
export const selectAccessibility = (state) => state.ui.accessibility;
export const selectPreferences = (state) => state.ui.preferences;
export const selectErrors = (state) => state.ui.errors;
export const selectError = (state, type) => state.ui.errors[type];
export const selectFeatures = (state) => state.ui.features;
export const selectFeature = (state, feature) => state.ui.features[feature];
export const selectOnboarding = (state) => state.ui.onboarding;
export const selectCache = (state) => state.ui.cache;
export const selectDebug = (state) => state.ui.debug;

export default uiSlice.reducer;
