import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunks for location operations
export const getCurrentLocation = createAsyncThunk(
  "location/getCurrentLocation",
  async (_, { rejectWithValue }) => {
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser");
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          }
        );
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const reverseGeocode = createAsyncThunk(
  "location/reverseGeocode",
  async ({ latitude, longitude }, { rejectWithValue }) => {
    try {
      // Using Nominatim API for reverse geocoding (free alternative to Google Maps)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error("Failed to get address information");
      }

      const data = await response.json();

      return {
        address: data.display_name || "Address not available",
        city: data.address?.city || data.address?.town || data.address?.village || "",
        state: data.address?.state || "",
        country: data.address?.country || "",
        pincode: data.address?.postcode || "",
        formatted: data.display_name || "",
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchPlaces = createAsyncThunk(
  "location/searchPlaces",
  async (query, { rejectWithValue }) => {
    try {
      if (!query || query.trim().length < 3) {
        return [];
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error("Failed to search places");
      }

      const data = await response.json();

      return data.map(place => ({
        id: place.place_id,
        name: place.display_name,
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        type: place.type,
        importance: place.importance,
      }));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Current location
  currentLocation: {
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
  },

  // Address information
  currentAddress: {
    address: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    formatted: "",
  },

  // Search results
  searchResults: [],
  searchQuery: "",

  // Loading states
  isLoadingLocation: false,
  isLoadingAddress: false,
  isSearching: false,

  // Error states
  locationError: null,
  addressError: null,
  searchError: null,

  // Permission status
  permissionStatus: null, // 'granted', 'denied', 'prompt'

  // Map settings
  mapCenter: {
    latitude: 28.6139, // Default to New Delhi
    longitude: 77.2090,
  },
  mapZoom: 13,

  // Location history (for recently used locations)
  recentLocations: [],
};

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    clearLocationError: (state) => {
      state.locationError = null;
    },

    clearAddressError: (state) => {
      state.addressError = null;
    },

    clearSearchError: (state) => {
      state.searchError = null;
    },

    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = "";
    },

    setMapCenter: (state, action) => {
      state.mapCenter = action.payload;
    },

    setMapZoom: (state, action) => {
      state.mapZoom = action.payload;
    },

    setPermissionStatus: (state, action) => {
      state.permissionStatus = action.payload;
    },

    addRecentLocation: (state, action) => {
      const newLocation = action.payload;

      // Remove if already exists
      state.recentLocations = state.recentLocations.filter(
        loc => !(loc.latitude === newLocation.latitude && loc.longitude === newLocation.longitude)
      );

      // Add to beginning
      state.recentLocations.unshift(newLocation);

      // Keep only last 10 locations
      if (state.recentLocations.length > 10) {
        state.recentLocations = state.recentLocations.slice(0, 10);
      }
    },

    clearRecentLocations: (state) => {
      state.recentLocations = [];
    },

    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },

    clearAll: (state) => {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    builder
      // getCurrentLocation
      .addCase(getCurrentLocation.pending, (state) => {
        state.isLoadingLocation = true;
        state.locationError = null;
      })
      .addCase(getCurrentLocation.fulfilled, (state, action) => {
        state.isLoadingLocation = false;
        state.currentLocation = action.payload;
        state.mapCenter = {
          latitude: action.payload.latitude,
          longitude: action.payload.longitude,
        };

        // Add to recent locations
        const locationData = {
          ...action.payload,
          name: "Current Location",
          type: "current",
        };

        state.recentLocations = state.recentLocations.filter(
          loc => loc.type !== "current"
        );
        state.recentLocations.unshift(locationData);
      })
      .addCase(getCurrentLocation.rejected, (state, action) => {
        state.isLoadingLocation = false;
        state.locationError = action.payload;
      })

      // reverseGeocode
      .addCase(reverseGeocode.pending, (state) => {
        state.isLoadingAddress = true;
        state.addressError = null;
      })
      .addCase(reverseGeocode.fulfilled, (state, action) => {
        state.isLoadingAddress = false;
        state.currentAddress = action.payload;
      })
      .addCase(reverseGeocode.rejected, (state, action) => {
        state.isLoadingAddress = false;
        state.addressError = action.payload;
      })

      // searchPlaces
      .addCase(searchPlaces.pending, (state, action) => {
        state.isSearching = true;
        state.searchError = null;
        state.searchQuery = action.meta.arg;
      })
      .addCase(searchPlaces.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
      })
      .addCase(searchPlaces.rejected, (state, action) => {
        state.isSearching = false;
        state.searchError = action.payload;
        state.searchResults = [];
      });
  },
});

export const {
  clearLocationError,
  clearAddressError,
  clearSearchError,
  clearSearchResults,
  setMapCenter,
  setMapZoom,
  setPermissionStatus,
  addRecentLocation,
  clearRecentLocations,
  setCurrentLocation,
  clearAll,
} = locationSlice.actions;

// Selectors
export const selectCurrentLocation = (state) => state.location.currentLocation;
export const selectCurrentAddress = (state) => state.location.currentAddress;
export const selectSearchResults = (state) => state.location.searchResults;
export const selectIsLoadingLocation = (state) => state.location.isLoadingLocation;
export const selectIsLoadingAddress = (state) => state.location.isLoadingAddress;
export const selectIsSearching = (state) => state.location.isSearching;
export const selectLocationError = (state) => state.location.locationError;
export const selectAddressError = (state) => state.location.addressError;
export const selectSearchError = (state) => state.location.searchError;
export const selectMapCenter = (state) => state.location.mapCenter;
export const selectMapZoom = (state) => state.location.mapZoom;
export const selectRecentLocations = (state) => state.location.recentLocations;
export const selectPermissionStatus = (state) => state.location.permissionStatus;

export default locationSlice.reducer;
