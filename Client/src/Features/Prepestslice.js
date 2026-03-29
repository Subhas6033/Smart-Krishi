import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import i18n from "../i18n";

// ── Async Thunk ───────────────────────────────────────────────────────────────

export const analyzePrePestRisk = createAsyncThunk(
  "prePest/analyze",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/pest/pre-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, language: i18n.language }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const prePestSlice = createSlice({
  name: "prePest",
  initialState: {
    result: null,
    loading: false,
    error: "",
  },
  reducers: {
    clearPrePestResult(state) {
      state.result = null;
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzePrePestRisk.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.result = null;
      })
      .addCase(analyzePrePestRisk.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(analyzePrePestRisk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Analysis failed";
      });
  },
});

export const { clearPrePestResult } = prePestSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectPrePestResult = (state) => state.prePest.result;
export const selectPrePestLoading = (state) => state.prePest.loading;
export const selectPrePestError = (state) => state.prePest.error;

export default prePestSlice.reducer;
