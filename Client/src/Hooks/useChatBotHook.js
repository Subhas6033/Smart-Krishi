/**
 * useChatBotHook.js
 *
 * FIXES in this version (on top of previous):
 *  1. chat:done handler ALWAYS calls finalizeLastAssistantMessage —
 *     the previous version skipped it when TTS chunks existed, but TTS
 *     is off by default so fullText was never written to the message.
 *  2. chat:tts:done no longer reads stale `messages` from closure —
 *     fullText is already set by chat:done, so we just play audio.
 *  3. Streaming state reset on mount (carry-over from last fix).
 *  4. socket.connected used directly (no manual boolean ref).
 */

import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";
import {
  addUserMessage,
  addAssistantPlaceholder,
  appendToken,
  finalizeLastAssistantMessage,
  startStreaming,
  stopStreaming,
  setRecording,
  setTranscript,
  setTTSPlaying,
  setError,
  clearError,
  clearMessages,
  setSessionId,
  setLanguage,
  setVoiceType,
  setSpeakingRate,
  toggleTTS,
  clearHistoryThunk,
  selectMessages,
  selectSessionId,
  selectLanguage,
  selectVoiceType,
  selectSpeakingRate,
  selectIsStreaming,
  selectIsRecording,
  selectTranscript,
  selectTTSPlaying,
  selectTTSEnabled,
  selectStatus,
  selectError,
} from "../Features/ChatbotSlice";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
const API_BASE = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/v1/chat`;

console.log("[KisanChat] SOCKET_URL:", SOCKET_URL);
console.log("[KisanChat] API_BASE:", API_BASE);

// ─── TTS player ───────────────────────────────────────────────────────────────
class TTSAudioPlayer {
  constructor() {
    this.chunks = [];
    this.audioCtx = null;
    this.src = null;
  }

  _ctx() {
    if (!this.audioCtx || this.audioCtx.state === "closed")
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return this.audioCtx;
  }

  addChunk(c) {
    this.chunks.push(c instanceof Uint8Array ? c : new Uint8Array(c));
  }

  async play(onStart, onEnd) {
    if (!this.chunks.length) return;
    const total = this.chunks.reduce((s, c) => s + c.byteLength, 0);
    const merged = new Uint8Array(total);
    let off = 0;
    for (const c of this.chunks) {
      merged.set(c, off);
      off += c.byteLength;
    }
    this.chunks = [];
    try {
      const ctx = this._ctx();
      const buf = await ctx.decodeAudioData(merged.buffer.slice(0));
      this.src = ctx.createBufferSource();
      this.src.buffer = buf;
      this.src.connect(ctx.destination);
      onStart?.();
      this.src.start(0);
      this.src.onended = () => onEnd?.();
    } catch (e) {
      console.error("[TTS]", e);
      onEnd?.();
    }
  }

  async playBase64(b64, onStart, onEnd) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    this.addChunk(bytes);
    await this.play(onStart, onEnd);
  }

  stop() {
    try {
      this.src?.stop();
    } catch (_) {}
    this.chunks = [];
  }
}

// ─── SSE consumer ─────────────────────────────────────────────────────────────
async function consumeSSE(response, dispatch, onAudio) {
  const reader = response.body.getReader();
  const dec = new TextDecoder();
  let buf = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });

    const parts = buf.split("\n\n");
    buf = parts.pop();

    for (const part of parts) {
      const line = part.replace(/^data:\s?/, "").trim();
      if (!line) continue;
      try {
        const evt = JSON.parse(line);
        console.log("[SSE]", evt.type);
        if (evt.type === "transcript") dispatch(setTranscript(evt.text));
        else if (evt.type === "token") dispatch(appendToken(evt.token));
        else if (evt.type === "done") {
          dispatch(setSessionId(evt.sessionId));
          dispatch(
            finalizeLastAssistantMessage({
              fullText: evt.fullText,
              audio: evt.audio || null,
              audioMime: evt.audioMime || null,
            })
          );
          dispatch(stopStreaming());
          if (evt.audio) onAudio?.(evt.audio);
        } else if (evt.type === "error") {
          dispatch(setError(evt.message));
          dispatch(stopStreaming());
        }
      } catch (_) {
        /* malformed line */
      }
    }
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useKisanChat() {
  const dispatch = useDispatch();

  const messages = useSelector(selectMessages);
  const sessionId = useSelector(selectSessionId);
  const language = useSelector(selectLanguage);
  const voiceType = useSelector(selectVoiceType);
  const speakingRate = useSelector(selectSpeakingRate);
  const isStreaming = useSelector(selectIsStreaming);
  const isRecording = useSelector(selectIsRecording);
  const transcript = useSelector(selectTranscript);
  const isTTSPlaying = useSelector(selectTTSPlaying);
  const ttsEnabled = useSelector(selectTTSEnabled);
  const status = useSelector(selectStatus);
  const error = useSelector(selectError);

  const socketRef = useRef(null);
  const mediaRecRef = useRef(null);
  const audioChunksRef = useRef([]);
  const ttsPlayerRef = useRef(new TTSAudioPlayer());
  const sessIdRef = useRef(sessionId);
  const langRef = useRef(language);
  const voiceRef = useRef(voiceType);
  const rateRef = useRef(speakingRate);
  const ttsRef = useRef(ttsEnabled);

  useEffect(() => {
    sessIdRef.current = sessionId;
  }, [sessionId]);
  useEffect(() => {
    langRef.current = language;
  }, [language]);
  useEffect(() => {
    voiceRef.current = voiceType;
  }, [voiceType]);
  useEffect(() => {
    rateRef.current = speakingRate;
  }, [speakingRate]);
  useEffect(() => {
    ttsRef.current = ttsEnabled;
  }, [ttsEnabled]);

  // ── Reset any stale streaming state on mount ──────────────────────────────
  useEffect(() => {
    dispatch(stopStreaming());
    dispatch(clearError());
    console.log("[KisanChat] mounted — streaming state reset");
  }, [dispatch]);

  // ── Shared TTS playback ───────────────────────────────────────────────────
  const playAudio = useCallback(
    async (b64) => {
      if (!b64) return;
      await ttsPlayerRef.current.playBase64(
        b64,
        () => dispatch(setTTSPlaying(true)),
        () => dispatch(setTTSPlaying(false))
      );
    },
    [dispatch]
  );

  // ── Socket.IO ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      timeout: 10000,
    });
    socketRef.current = socket;

    socket.on("connect", () =>
      console.log("[Socket] ✅ connected:", socket.id)
    );
    socket.on("disconnect", (r) => console.log("[Socket] ❌ disconnected:", r));
    socket.on("connect_error", (e) =>
      console.error("[Socket] ⛔ error:", e.message)
    );

    socket.on("chat:token", (token) => {
      dispatch(appendToken(token));
    });

    socket.on("chat:transcript", ({ text }) => {
      dispatch(setTranscript(text));
    });

    // ── KEY FIX: always finalize, don't skip based on TTS chunk presence ──
    socket.on("chat:done", ({ fullText, sessionId: sid }) => {
      console.log(
        "[Socket] chat:done — chars:",
        fullText?.length,
        "| preview:",
        fullText?.slice(0, 80)
      );
      dispatch(setSessionId(sid));
      // Always write fullText to the message — TTS is optional and independent
      dispatch(finalizeLastAssistantMessage({ fullText }));
      dispatch(stopStreaming());
    });

    socket.on("chat:tts:chunk", (chunk) => {
      ttsPlayerRef.current.addChunk(chunk);
    });

    // TTS audio arrives after chat:done — just play, don't re-finalize
    socket.on("chat:tts:done", async () => {
      await ttsPlayerRef.current.play(
        () => dispatch(setTTSPlaying(true)),
        () => dispatch(setTTSPlaying(false))
      );
    });

    socket.on("chat:error", ({ message: msg }) => {
      console.error("[Socket] chat:error:", msg);
      dispatch(setError(msg));
      dispatch(stopStreaming());
    });

    return () => {
      console.log("[Socket] cleaning up");
      socket.disconnect();
    };
  }, [dispatch]); // dispatch is stable, no stale closure risk

  // ── isSocketReady ─────────────────────────────────────────────────────────
  const isSocketReady = () => !!socketRef.current?.connected;

  // ── sendMessage ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      console.log(
        "[sendMessage] text:",
        text?.slice(0, 40),
        "| isStreaming:",
        isStreaming
      );
      if (!text?.trim()) return;
      if (isStreaming) {
        console.warn("[sendMessage] blocked — already streaming");
        return;
      }

      dispatch(clearError());
      dispatch(addUserMessage(text));
      dispatch(addAssistantPlaceholder());
      dispatch(startStreaming());

      const payload = {
        text,
        language: langRef.current,
        voiceType: voiceRef.current,
        speakingRate: rateRef.current,
        sessionId: sessIdRef.current,
        tts: ttsRef.current,
      };

      if (isSocketReady()) {
        console.log("[sendMessage] → socket emit");
        socketRef.current.emit("chat:message", payload);
        return;
      }

      // SSE REST fallback
      console.log("[sendMessage] → SSE REST");
      try {
        const res = await fetch(`${API_BASE}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        await consumeSSE(res, dispatch, ttsRef.current ? playAudio : null);
      } catch (err) {
        console.error("[sendMessage] SSE error:", err);
        dispatch(setError("Could not reach server: " + err.message));
        dispatch(stopStreaming());
      }
    },
    [dispatch, isStreaming, playAudio]
  );

  // ── Voice recording ───────────────────────────────────────────────────────
  const recordingStartTimeRef = useRef(null);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Record as webm+opus if supported, but strip the codec parameter
      // before sending to Sarvam STT — it only accepts the base MIME type.
      const recMimeType = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus"
      )
        ? "audio/webm;codecs=opus"
        : "audio/wav";
      const sendMimeType = recMimeType.split(";")[0]; // "audio/webm" or "audio/wav"

      const rec = new MediaRecorder(stream, { mimeType: recMimeType });
      mediaRecRef.current = rec;
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      rec.onstop = async () => {
        // Always release mic
        stream.getTracks().forEach((t) => t.stop());

        const duration = Date.now() - (recordingStartTimeRef.current || 0);
        const totalBytes = audioChunksRef.current.reduce(
          (s, c) => s + c.size,
          0
        );

        // Discard accidental taps (< 400ms) or silent/empty recordings (< 1 KB)
        if (duration < 400 || totalBytes < 1000) {
          console.log("[voice] discarded — too short or empty", {
            duration,
            totalBytes,
          });
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: recMimeType });
        const base64 = await blobToBase64(blob);

        // Dispatch placeholder only after confirming valid audio
        dispatch(addAssistantPlaceholder());
        dispatch(startStreaming());

        const payload = {
          audioBase64: base64,
          mimeType: sendMimeType,
          language: langRef.current,
          voiceType: voiceRef.current,
          speakingRate: rateRef.current,
          sessionId: sessIdRef.current,
          tts: ttsRef.current,
        };

        if (isSocketReady()) {
          console.log(
            "[voice] → socket emit | bytes:",
            totalBytes,
            "| ms:",
            duration
          );
          socketRef.current.emit("chat:voice", payload);
        } else {
          console.log("[voice] → SSE REST");
          try {
            const res = await fetch(`${API_BASE}/voice`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await consumeSSE(res, dispatch, ttsRef.current ? playAudio : null);
          } catch (err) {
            dispatch(setError("Voice failed: " + err.message));
            dispatch(stopStreaming());
          }
        }
      };

      rec.start(250);
      dispatch(setRecording(true));
    } catch (err) {
      dispatch(setError("Mic access denied: " + err.message));
    }
  }, [isRecording, dispatch, playAudio]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecRef.current) return;
    mediaRecRef.current.stop();
    dispatch(setRecording(false));
  }, [isRecording, dispatch]);

  // ── TTS ───────────────────────────────────────────────────────────────────
  const stopTTS = useCallback(() => {
    ttsPlayerRef.current.stop();
    dispatch(setTTSPlaying(false));
  }, [dispatch]);
  const playMessageAudio = useCallback((a) => playAudio(a), [playAudio]);

  // ── Session ───────────────────────────────────────────────────────────────
  const clearChat = useCallback(() => {
    ttsPlayerRef.current.stop();
    if (sessIdRef.current) dispatch(clearHistoryThunk(sessIdRef.current));
    dispatch(clearMessages());
  }, [dispatch]);

  const changeLanguage = useCallback(
    (v) => dispatch(setLanguage(v)),
    [dispatch]
  );
  const changeVoiceType = useCallback(
    (v) => dispatch(setVoiceType(v)),
    [dispatch]
  );
  const changeRate = useCallback(
    (v) => dispatch(setSpeakingRate(v)),
    [dispatch]
  );
  const toggleTTSMode = useCallback(() => dispatch(toggleTTS()), [dispatch]);
  const dismissError = useCallback(() => dispatch(clearError()), [dispatch]);

  return {
    messages,
    sessionId,
    language,
    voiceType,
    speakingRate,
    isStreaming,
    isRecording,
    transcript,
    isTTSPlaying,
    ttsEnabled,
    status,
    error,
    sendMessage,
    startRecording,
    stopRecording,
    stopTTS,
    playMessageAudio,
    clearChat,
    dismissError,
    changeLanguage,
    changeVoiceType,
    changeRate,
    toggleTTSMode,
  };
}

function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

export default useKisanChat;
