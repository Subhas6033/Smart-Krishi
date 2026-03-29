import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import i18n from "../i18n";

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const predictCropProfit = createAsyncThunk(
  "cropProfit/predict",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/crop-profit/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, language: i18n.language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchMSP = createAsyncThunk(
  "cropProfit/fetchMSP",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/crop-profit/msp");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch MSP");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchBenchmark = createAsyncThunk(
  "cropProfit/fetchBenchmark",
  async (crop, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/crop-profit/benchmark/${crop}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No benchmark data");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const cropProfitSlice = createSlice({
  name: "cropProfit",
  initialState: {
    result: null,
    loading: false,
    error: "",
    msp: {},
    mspLoading: false,
    benchmark: null,
    benchmarkLoading: false,
  },
  reducers: {
    clearCropProfitResult(state) {
      state.result = null;
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    // predict
    builder
      .addCase(predictCropProfit.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.result = null;
      })
      .addCase(predictCropProfit.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(predictCropProfit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Prediction failed";
      });

    // MSP
    builder
      .addCase(fetchMSP.pending, (state) => {
        state.mspLoading = true;
      })
      .addCase(fetchMSP.fulfilled, (state, action) => {
        state.mspLoading = false;
        state.msp = action.payload.msp || {};
      })
      .addCase(fetchMSP.rejected, (state) => {
        state.mspLoading = false;
      });

    // Benchmark
    builder
      .addCase(fetchBenchmark.pending, (state) => {
        state.benchmarkLoading = true;
      })
      .addCase(fetchBenchmark.fulfilled, (state, action) => {
        state.benchmarkLoading = false;
        state.benchmark = action.payload;
      })
      .addCase(fetchBenchmark.rejected, (state) => {
        state.benchmarkLoading = false;
      });
  },
});

export const { clearCropProfitResult } = cropProfitSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectCropProfitResult = (state) => state.cropProfit.result;
export const selectCropProfitLoading = (state) => state.cropProfit.loading;
export const selectCropProfitError = (state) => state.cropProfit.error;
export const selectMSP = (state) => state.cropProfit.msp;
export const selectBenchmark = (state) => state.cropProfit.benchmark;

export default cropProfitSlice.reducer;
