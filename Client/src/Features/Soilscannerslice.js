import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import i18n from "../i18n";

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const analyzeSoil = createAsyncThunk(
  "soilScanner/analyze",
  async (imageFile, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      fd.append("language", i18n.language);
      const res = await fetch("/api/soil-scanner/analyze", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchSoilGuide = createAsyncThunk(
  "soilScanner/fetchGuide",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/soil-scanner/guide");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch guide");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchSoilNorms = createAsyncThunk(
  "soilScanner/fetchNorms",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/soil-scanner/norms");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch norms");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const soilScannerSlice = createSlice({
  name: "soilScanner",
  initialState: {
    result: null,
    loading: false,
    error: "",
    guide: null,
    guideLoading: false,
    norms: null,
    normsLoading: false,
  },
  reducers: {
    clearSoilResult(state) {
      state.result = null;
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    // analyze
    builder
      .addCase(analyzeSoil.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.result = null;
      })
      .addCase(analyzeSoil.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(analyzeSoil.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Analysis failed";
      });

    // guide
    builder
      .addCase(fetchSoilGuide.pending, (state) => {
        state.guideLoading = true;
      })
      .addCase(fetchSoilGuide.fulfilled, (state, action) => {
        state.guideLoading = false;
        state.guide = action.payload;
      })
      .addCase(fetchSoilGuide.rejected, (state) => {
        state.guideLoading = false;
      });

    // norms
    builder
      .addCase(fetchSoilNorms.pending, (state) => {
        state.normsLoading = true;
      })
      .addCase(fetchSoilNorms.fulfilled, (state, action) => {
        state.normsLoading = false;
        state.norms = action.payload;
      })
      .addCase(fetchSoilNorms.rejected, (state) => {
        state.normsLoading = false;
      });
  },
});

export const { clearSoilResult } = soilScannerSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectSoilResult = (state) => state.soilScanner.result;
export const selectSoilLoading = (state) => state.soilScanner.loading;
export const selectSoilError = (state) => state.soilScanner.error;
export const selectSoilGuide = (state) => state.soilScanner.guide;
export const selectSoilNorms = (state) => state.soilScanner.norms;

export default soilScannerSlice.reducer;
