/**
 * ChatbotSlice.js
 *
 * CRITICAL BUG FIXED:
 *   [...state.messages].reverse().find(...)  inside an Immer reducer is broken.
 *   The spread `[...state.messages]` creates a shallow array of Immer draft
 *   proxies. `.reverse()` then mutates that array's ORDER in place, which
 *   corrupts the Immer draft and causes the wrong element to be updated.
 *
 *   Fix: use findLastIndex() to get the index, then mutate via index directly.
 *   This is the correct pattern for Immer draft arrays.
 */

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE = `${import.meta.env.VITE_BACKEND_URL}/api/v1/chat`;

// ─── Async Thunks ──────────────────────────────────────────────────────────

export const sendTextMessage = createAsyncThunk(
  "kisanChat/sendTextMessage",
  async (
    { text, language, voiceType, speakingRate, sessionId, tts = false },
    thunkAPI
  ) => {
    try {
      const { data } = await axios.post(`${API_BASE}/message`, {
        text,
        language,
        voiceType,
        speakingRate,
        sessionId,
        tts,
      });
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const sendVoiceMessage = createAsyncThunk(
  "kisanChat/sendVoiceMessage",
  async (
    {
      audioBase64,
      mimeType,
      language,
      voiceType,
      speakingRate,
      sessionId,
      tts = true,
    },
    thunkAPI
  ) => {
    try {
      const { data } = await axios.post(`${API_BASE}/voice`, {
        audioBase64,
        mimeType,
        language,
        voiceType,
        speakingRate,
        sessionId,
        tts,
      });
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const fetchHistory = createAsyncThunk(
  "kisanChat/fetchHistory",
  async (sessionId, thunkAPI) => {
    try {
      const { data } = await axios.get(`${API_BASE}/history/${sessionId}`);
      return data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

export const clearHistoryThunk = createAsyncThunk(
  "kisanChat/clearHistory",
  async (sessionId, thunkAPI) => {
    try {
      await axios.delete(`${API_BASE}/history/${sessionId}`);
      return sessionId;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.error || err.message);
    }
  }
);

// ─── Helper ────────────────────────────────────────────────────────────────
// Safe last-index finder for Immer draft arrays.
// NEVER use [...draft].reverse().find() — it mutates the draft proxy order.
function lastAssistantIndex(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return i;
  }
  return -1;
}

// ─── Initial State ─────────────────────────────────────────────────────────
const initialState = {
  sessionId: null,
  language: "hindi",
  voiceType: "female-warm",
  speakingRate: 1.0,

  messages: [], // { id, role, text, timestamp, isStreaming, audio?, audioMime?, isVoice? }
  streamingText: "",
  isStreaming: false,

  isRecording: false,
  transcript: "",

  isTTSPlaying: false,
  ttsEnabled: true,

  status: "idle", // idle | loading | streaming | recording | error
  error: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────
const kisanChatSlice = createSlice({
  name: "kisanChat",
  initialState,
  reducers: {
    // ── Session ──────────────────────────────────────────────────────────
    setSessionId(state, action) {
      state.sessionId = action.payload;
    },
    setLanguage(state, action) {
      state.language = action.payload;
    },
    setVoiceType(state, action) {
      state.voiceType = action.payload;
    },
    setSpeakingRate(state, action) {
      state.speakingRate = action.payload;
    },
    toggleTTS(state) {
      state.ttsEnabled = !state.ttsEnabled;
    },

    // ── Messages ─────────────────────────────────────────────────────────
    addUserMessage(state, action) {
      state.messages.push({
        id: `msg_${Date.now()}_user`,
        role: "user",
        text: action.payload,
        timestamp: Date.now(),
        isStreaming: false,
      });
    },

    addAssistantPlaceholder(state) {
      state.messages.push({
        id: `msg_${Date.now()}_bot`,
        role: "assistant",
        text: "",
        timestamp: Date.now(),
        isStreaming: true,
      });
    },

    // ── appendToken: use index, never .reverse() on Immer draft ──────────
    appendToken(state, action) {
      state.streamingText += action.payload;
      const idx = lastAssistantIndex(state.messages);
      if (idx !== -1) {
        state.messages[idx].text = state.streamingText;
      }
    },

    // ── finalizeLastAssistantMessage: same fix ────────────────────────────
    finalizeLastAssistantMessage(state, action) {
      const { fullText, audio, audioMime } = action.payload;
      const idx = lastAssistantIndex(state.messages);
      if (idx !== -1) {
        state.messages[idx].text = fullText;
        state.messages[idx].isStreaming = false;
        if (audio) {
          state.messages[idx].audio = audio;
          state.messages[idx].audioMime = audioMime;
        }
      }
      state.streamingText = "";
      state.isStreaming = false;
    },

    updateLastAssistantMessage(state, action) {
      const idx = lastAssistantIndex(state.messages);
      if (idx !== -1) state.messages[idx].text = action.payload;
    },

    // ── Streaming ────────────────────────────────────────────────────────
    startStreaming(state) {
      state.isStreaming = true;
      state.streamingText = "";
      state.status = "streaming";
      state.error = null;
    },
    stopStreaming(state) {
      state.isStreaming = false;
      state.status = "idle";
    },

    // ── Voice recording ──────────────────────────────────────────────────
    setRecording(state, action) {
      state.isRecording = action.payload;
      state.status = action.payload ? "recording" : "idle";
    },
    setTranscript(state, action) {
      state.transcript = action.payload;
    },

    // ── TTS ──────────────────────────────────────────────────────────────
    setTTSPlaying(state, action) {
      state.isTTSPlaying = action.payload;
    },

    // ── Error / reset ────────────────────────────────────────────────────
    setError(state, action) {
      state.error = action.payload;
      state.status = "error";
      state.isStreaming = false;
      state.isRecording = false;
    },
    clearError(state) {
      state.error = null;
      state.status = "idle";
    },
    clearMessages(state) {
      state.messages = [];
      state.streamingText = "";
      state.transcript = "";
      state.sessionId = null;
      state.status = "idle";
      state.error = null;
    },
  },

  // ── Extra reducers ────────────────────────────────────────────────────
  extraReducers: (builder) => {
    // sendTextMessage
    builder
      .addCase(sendTextMessage.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(sendTextMessage.fulfilled, (state, action) => {
        const { reply, sessionId, audio, audioMime } = action.payload;
        state.sessionId = sessionId;
        state.status = "idle";
        const idx = lastAssistantIndex(state.messages);
        if (idx !== -1 && state.messages[idx].isStreaming) {
          state.messages[idx].text = reply;
          state.messages[idx].isStreaming = false;
          if (audio) {
            state.messages[idx].audio = audio;
            state.messages[idx].audioMime = audioMime;
          }
        } else {
          state.messages.push({
            id: `msg_${Date.now()}_bot`,
            role: "assistant",
            text: reply,
            timestamp: Date.now(),
            isStreaming: false,
            audio,
            audioMime,
          });
        }
      })
      .addCase(sendTextMessage.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload;
      });

    // sendVoiceMessage
    builder
      .addCase(sendVoiceMessage.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(sendVoiceMessage.fulfilled, (state, action) => {
        const { transcript, reply, sessionId, audio, audioMime } =
          action.payload;
        state.sessionId = sessionId;
        state.transcript = transcript;
        state.status = "idle";
        state.messages.push({
          id: `msg_${Date.now()}_user`,
          role: "user",
          text: transcript,
          timestamp: Date.now(),
          isVoice: true,
        });
        state.messages.push({
          id: `msg_${Date.now()}_bot`,
          role: "assistant",
          text: reply,
          timestamp: Date.now(),
          isStreaming: false,
          audio,
          audioMime,
        });
      })
      .addCase(sendVoiceMessage.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload;
      });

    // fetchHistory
    builder.addCase(fetchHistory.fulfilled, (state, action) => {
      const { messages, sessionId } = action.payload;
      state.sessionId = sessionId;
      state.messages = messages.map((m, i) => ({
        id: `hist_${i}`,
        role: m.role,
        text: m.content,
        timestamp: Date.now() - (messages.length - i) * 1000,
        isStreaming: false,
      }));
    });

    // clearHistoryThunk
    builder.addCase(clearHistoryThunk.fulfilled, (state) => {
      state.messages = [];
      state.sessionId = null;
      state.transcript = "";
      state.status = "idle";
    });
  },
});

export const {
  setSessionId,
  setLanguage,
  setVoiceType,
  setSpeakingRate,
  toggleTTS,
  addUserMessage,
  addAssistantPlaceholder,
  updateLastAssistantMessage,
  finalizeLastAssistantMessage,
  appendToken,
  startStreaming,
  stopStreaming,
  setRecording,
  setTranscript,
  setTTSPlaying,
  setError,
  clearError,
  clearMessages,
} = kisanChatSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────
export const selectMessages = (state) => state.kisanChat.messages;
export const selectSessionId = (state) => state.kisanChat.sessionId;
export const selectLanguage = (state) => state.kisanChat.language;
export const selectVoiceType = (state) => state.kisanChat.voiceType;
export const selectSpeakingRate = (state) => state.kisanChat.speakingRate;
export const selectIsStreaming = (state) => state.kisanChat.isStreaming;
export const selectIsRecording = (state) => state.kisanChat.isRecording;
export const selectTranscript = (state) => state.kisanChat.transcript;
export const selectTTSPlaying = (state) => state.kisanChat.isTTSPlaying;
export const selectTTSEnabled = (state) => state.kisanChat.ttsEnabled;
export const selectStatus = (state) => state.kisanChat.status;
export const selectError = (state) => state.kisanChat.error;

export default kisanChatSlice.reducer;
