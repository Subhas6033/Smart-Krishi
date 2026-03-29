/**
 * useTTS.js
 *
 * Bridges i18next language → Sarvam TTS voice via socket.io streaming.
 *
 * Usage:
 *   const { play, stop, state, progress } = useTTS(textOrLines);
 *
 * `textOrLines` can be:
 *   - a plain string  → spoken as-is
 *   - a string[]      → joined with ". " before sending
 *
 * The hook reads i18n.language automatically — no language prop needed.
 */

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSocket } from "./useSocketHook";

// ── i18next code  →  voice.config key ──────────────────────────────────────
// "ur" is not supported by Sarvam — falls back to English.
const LANG_MAP = {
  en: "english",
  hi: "hindi",
  ta: "tamil",
  te: "telugu",
  kn: "kannada",
  ml: "malayalam",
  bn: "bengali",
  gu: "gujarati",
  pa: "punjabi",
  mr: "marathi",
  or: "odia",
  ur: "english", // Sarvam doesn't support Urdu — graceful fallback
};

// Default voice type per language (can be overridden via options)
const DEFAULT_VOICE = "female-warm";

export function useTTS(textOrLines, options = {}) {
  const { i18n } = useTranslation();
  const socket = useSocket();

  const { voiceType = DEFAULT_VOICE, speakingRate = 1.0 } = options;

  const [state, setState] = useState("idle"); // idle | loading | playing | error
  const [progress, setProgress] = useState(0);

  // Audio assembly refs
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const urlRef = useRef(null);

  // Always-points-to-current ref — avoids stale closures in restart/toggle
  const playRef = useRef(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  const resolveText = useCallback(() => {
    if (Array.isArray(textOrLines))
      return textOrLines.filter(Boolean).join(". ");
    return typeof textOrLines === "string" ? textOrLines : "";
  }, [textOrLines]);

  const resolveLanguage = useCallback(() => {
    const code = i18n.language?.split("-")[0] || "en"; // handle "en-IN" style codes
    return LANG_MAP[code] || "english";
  }, [i18n.language]);

  const revokeURL = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }, []);

  // ── stop ─────────────────────────────────────────────────────────────────

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    revokeURL();
    chunksRef.current = [];
    setState("idle");
    setProgress(0);
  }, [revokeURL]);

  // ── play ─────────────────────────────────────────────────────────────────

  const play = useCallback(() => {
    if (!socket) {
      console.warn("[useTTS] Socket not ready");
      return;
    }

    const text = resolveText();
    if (!text.trim()) return;

    // Abort previous playback
    stop();
    setState("loading");
    chunksRef.current = [];

    const language = resolveLanguage();

    // ── Remove any previous listeners to avoid stacking ──
    socket.off("tts:chunk");
    socket.off("tts:done");
    socket.off("tts:error");

    // ── Receive binary chunks ──
    socket.on("tts:chunk", (chunk) => {
      chunksRef.current.push(
        chunk instanceof ArrayBuffer ? chunk : (chunk.buffer ?? chunk)
      );
    });

    // ── All chunks received → assemble & play ──
    socket.on("tts:done", () => {
      const blob = new Blob(chunksRef.current, { type: "audio/wav" });
      chunksRef.current = [];

      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      audio.onended = () => {
        setState("idle");
        setProgress(0);
        revokeURL();
      };

      audio.onerror = () => {
        setState("error");
        setProgress(0);
        revokeURL();
        setTimeout(() => setState("idle"), 2500);
      };

      audio
        .play()
        .then(() => setState("playing"))
        .catch((err) => {
          console.error("[useTTS] Playback error:", err);
          setState("error");
          setTimeout(() => setState("idle"), 2500);
        });

      // Clean up listeners once done
      socket.off("tts:chunk");
      socket.off("tts:done");
      socket.off("tts:error");
    });

    // ── Server-side error ──
    socket.on("tts:error", ({ message }) => {
      console.error("[useTTS] TTS error:", message);
      setState("error");
      setProgress(0);
      setTimeout(() => setState("idle"), 2500);
      socket.off("tts:chunk");
      socket.off("tts:done");
      socket.off("tts:error");
    });

    // ── Fire! ──
    socket.emit("tts:stream", {
      text,
      language,
      voiceType,
      speakingRate,
    });
    // playRef must be assigned AFTER the emit so it captures the live closure
    playRef.current = play;
  }, [
    socket,
    resolveText,
    resolveLanguage,
    voiceType,
    speakingRate,
    stop,
    revokeURL,
  ]);

  // ── restart ────────────────────────────────────────────────────────────────
  // Calls stop() then play() in sequence — used when the language changes
  // so the same text is re-synthesized in the new language.
  // Uses playRef.current so we always call the LATEST play() closure,
  // which has the updated i18n.language — not a stale one captured at creation.
  const restart = useCallback(() => {
    stop();
    // Defer so stop() fully clears audioRef before we re-initialise it
    setTimeout(() => playRef.current?.(), 0);
  }, [stop]);

  // ── toggle helper (play if idle/error, stop if playing/loading) ──────────
  const toggle = useCallback(() => {
    if (state === "idle" || state === "error") play();
    else stop();
  }, [state, play, stop]);

  return { play, stop, restart, toggle, state, progress };
}
