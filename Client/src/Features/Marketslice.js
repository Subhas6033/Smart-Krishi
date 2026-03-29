import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const fetchMarketPrices = createAsyncThunk(
  "market/fetchPrices",
  async ({ crops, state: selectedState }, { rejectWithValue }) => {
    try {
      const res = await fetch(
        `/api/market/prices?crops=${crops}&state=${encodeURIComponent(selectedState)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load prices");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMarketMSP = createAsyncThunk(
  "market/fetchMSP",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/crop-profit/msp");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load MSP");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const marketSlice = createSlice({
  name: "market",
  initialState: {
    prices: [],
    loading: false,
    error: "",
    lastUpdated: null,
    msp: {},
    mspLoading: false,
  },
  reducers: {
    clearMarketError(state) {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    // market prices
    builder
      .addCase(fetchMarketPrices.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(fetchMarketPrices.fulfilled, (state, action) => {
        state.loading = false;
        state.prices = action.payload.prices || [];
        state.lastUpdated = action.payload.lastUpdated || null;
      })
      .addCase(fetchMarketPrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load prices";
      });

    // MSP
    builder
      .addCase(fetchMarketMSP.pending, (state) => {
        state.mspLoading = true;
      })
      .addCase(fetchMarketMSP.fulfilled, (state, action) => {
        state.mspLoading = false;
        state.msp = action.payload.msp || {};
      })
      .addCase(fetchMarketMSP.rejected, (state) => {
        state.mspLoading = false;
      });
  },
});

export const { clearMarketError } = marketSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectMarketPrices = (state) => state.market.prices;
export const selectMarketLoading = (state) => state.market.loading;
export const selectMarketError = (state) => state.market.error;
export const selectMarketLastUpdated = (state) => state.market.lastUpdated;
export const selectMarketMSP = (state) => state.market.msp;

export default marketSlice.reducer;
