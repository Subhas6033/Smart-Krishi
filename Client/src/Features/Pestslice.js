import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import i18n from "../i18n";

// ── Async Thunks ──────────────────────────────────────────────────────────────

export const detectPest = createAsyncThunk(
  "pest/detect",
  async (imageFile, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      fd.append("image", imageFile);
      fd.append("language", i18n.language);
      const res = await fetch("/api/pest/detect", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Detection failed");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const fetchPestLibrary = createAsyncThunk(
  "pest/fetchLibrary",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/pest/library");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch library");
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// ── Slice ─────────────────────────────────────────────────────────────────────

const pestSlice = createSlice({
  name: "pest",
  initialState: {
    result: null,
    loading: false,
    error: "",
    library: [],
    libraryLoading: false,
  },
  reducers: {
    clearPestResult(state) {
      state.result = null;
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    // detect
    builder
      .addCase(detectPest.pending, (state) => {
        state.loading = true;
        state.error = "";
        state.result = null;
      })
      .addCase(detectPest.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
      })
      .addCase(detectPest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Detection failed";
      });

    // library
    builder
      .addCase(fetchPestLibrary.pending, (state) => {
        state.libraryLoading = true;
      })
      .addCase(fetchPestLibrary.fulfilled, (state, action) => {
        state.libraryLoading = false;
        state.library = action.payload.library || [];
      })
      .addCase(fetchPestLibrary.rejected, (state) => {
        state.libraryLoading = false;
      });
  },
});

export const { clearPestResult } = pestSlice.actions;

// ── Selectors ─────────────────────────────────────────────────────────────────

export const selectPestResult = (state) => state.pest.result;
export const selectPestLoading = (state) => state.pest.loading;
export const selectPestError = (state) => state.pest.error;
export const selectPestLibrary = (state) => state.pest.library;

export default pestSlice.reducer;
