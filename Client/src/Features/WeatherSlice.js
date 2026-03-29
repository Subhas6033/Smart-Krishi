import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ==========================================
// Async Thunks
// ==========================================

export const fetchCurrentWeather = createAsyncThunk(
  "weather/fetchCurrent",
  async (cityName, { rejectWithValue }) => {
    try {
      const [wRes, aRes] = await Promise.all([
        fetch(`/api/weather/current?city=${encodeURIComponent(cityName)}`),
        fetch(`/api/weather/advisory?city=${encodeURIComponent(cityName)}`),
      ]);

      if (!wRes.ok) {
        const d = await wRes.json();
        return rejectWithValue(d.error || "City not found");
      }

      const [wData, aData] = await Promise.all([wRes.json(), aRes.json()]);

      return { weather: wData, advisory: aData };
    } catch {
      return rejectWithValue("Failed to fetch weather data");
    }
  }
);

export const fetchWeatherByCoords = createAsyncThunk(
  "weather/fetchByCoords",
  async ({ lat, lon }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/weather/by-coords?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (!res.ok) return rejectWithValue(data.error || "Location not found");

      const aRes = await fetch(
        `/api/weather/advisory?city=${encodeURIComponent(data.city)}`
      );
      const aData = await aRes.json();

      return { weather: data, advisory: aData };
    } catch {
      return rejectWithValue("Failed to fetch weather by location");
    }
  }
);

// ==========================================
// Slice
// ==========================================

const weatherSlice = createSlice({
  name: "weather",
  initialState: {
    weather: null,
    forecast: [],
    advisory: null,
    loading: false,
    locLoading: false,
    error: "",
  },
  reducers: {
    clearError(state) {
      state.error = "";
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchCurrentWeather
    builder
      .addCase(fetchCurrentWeather.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchCurrentWeather.fulfilled, (state, action) => {
        state.loading = false;
        state.weather = action.payload.weather;
        state.forecast = action.payload.weather.forecast || [];
        state.advisory = action.payload.advisory;
      })
      .addCase(fetchCurrentWeather.rejected, (state, action) => {
        state.loading = false;
        state.weather = null;
        state.error = action.payload || "Something went wrong";
      });

    // fetchWeatherByCoords
    builder
      .addCase(fetchWeatherByCoords.pending, (state) => {
        state.locLoading = true;
        state.error = "";
      })
      .addCase(fetchWeatherByCoords.fulfilled, (state, action) => {
        state.locLoading = false;
        state.weather = action.payload.weather;
        state.forecast = action.payload.weather.forecast || [];
        state.advisory = action.payload.advisory;
      })
      .addCase(fetchWeatherByCoords.rejected, (state, action) => {
        state.locLoading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export const { clearError } = weatherSlice.actions;
export default weatherSlice.reducer;
