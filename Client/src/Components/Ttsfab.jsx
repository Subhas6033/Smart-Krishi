/**
 * TTSFab.jsx  —  Floating TTS Action Button
 *
 * Sits fixed at bottom-right of every page.
 * Reads whatever lines the current page registered via useTTSContext().
 * Automatically uses i18n.language → correct Sarvam voice.
 *
 * Place once in your layout, e.g. inside App.jsx alongside <Navbar />:
 *
 *   <TTSProvider>
 *     <Navbar />
 *     <Outlet />   (or your page components)
 *     <TTSFab />
 *   </TTSProvider>
 */

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTTSContext } from "./Ttscontext";
import { useTTS } from "../Hooks/Usetts";
import { motion, AnimatePresence } from "framer-motion";

export default function TTSFab() {
  const { t, i18n } = useTranslation();
  const { lines, pageLabel } = useTTSContext();
  const { restart, toggle, state, progress } = useTTS(lines);
  const [showTooltip, setShowTooltip] = useState(false);

  // ── Auto-restart TTS when user switches language ───────────────────────────
  // Track the previous language in a ref so we can detect changes without
  // the dependency array being polluted by i18n.language itself.
  // An "active" TTS means it is playing OR loading — in both cases we need
  // to cancel the old request and start a new one in the new language.
  const prevLangRef = useRef(i18n.language);
  const wasActiveRef = useRef(false);

  useEffect(() => {
    const prev = prevLangRef.current;
    const curr = i18n.language;
    const isActive = state === "playing" || state === "loading";

    if (prev !== curr && (wasActiveRef.current || isActive)) {
      prevLangRef.current = curr;
      restart();
    }

    wasActiveRef.current = isActive;
  }, [i18n.language, state, restart]);

  const isPlaying = state === "playing";
  const isLoading = state === "loading";
  const isError = state === "error";
  const hasLines = lines.length > 0 && lines.some(Boolean);

  // Don't render if no page has registered content yet
  if (!hasLines) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      {/* ── Tooltip (language + page label) ── */}
      <AnimatePresence>
        {showTooltip && !isPlaying && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              background: "#112218",
              border: "1px solid #1e4428",
              borderRadius: 10,
              padding: "7px 12px",
              fontSize: 12,
              color: "#9ec9a3",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              maxWidth: 200,
              textAlign: "right",
            }}
          >
            <div
              style={{
                color: "#4a9e54",
                fontWeight: 600,
                fontSize: 11,
                marginBottom: 2,
              }}
            >
              🌐 {getLangName(i18n.language)}
            </div>
            {pageLabel && <div style={{ color: "#7aac82" }}>{pageLabel}</div>}
            <div style={{ color: "#5a7d5f", fontSize: 11, marginTop: 2 }}>
              {t("tts_tap_to_listen", "Tap to listen")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Progress arc (while playing) ── */}
      {isPlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: "#112218",
            border: "1px solid #1e4428",
            borderRadius: 10,
            padding: "6px 12px",
            fontSize: 11,
            color: "#6ddc7a",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              width: 80,
              height: 3,
              borderRadius: 99,
              background: "rgba(74,158,84,0.2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "linear-gradient(90deg,#3d8b47,#6ddc7a)",
                borderRadius: 99,
                transition: "width 0.1s linear",
              }}
            />
          </div>
          <span>{t("tts_playing", "Playing…")}</span>
        </motion.div>
      )}

      {/* ── Main FAB button ── */}
      <motion.button
        onClick={toggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.08 }}
        whileTap={{ scale: 0.94 }}
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          border: `2px solid ${isPlaying ? "#4a9e54" : isError ? "#7f3333" : "#2d5c34"}`,
          background: isPlaying
            ? "linear-gradient(135deg,#1a4d20,#2d7a36)"
            : isError
              ? "rgba(120,40,40,0.9)"
              : "linear-gradient(135deg,#112218,#1a3a1f)",
          color: isPlaying ? "#6ddc7a" : isError ? "#f08080" : "#4a9e54",
          cursor: isLoading ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isPlaying
            ? "0 0 0 4px rgba(74,158,84,0.2), 0 6px 20px rgba(0,0,0,0.5)"
            : "0 4px 16px rgba(0,0,0,0.5)",
          transition: "all 0.2s",
        }}
        title={
          isPlaying
            ? t("tts_stop", "Stop")
            : t("tts_listen", "Listen in your language")
        }
      >
        {isLoading ? (
          <FabSpinner />
        ) : isPlaying ? (
          <FabPause />
        ) : isError ? (
          <span style={{ fontSize: 18 }}>✕</span>
        ) : (
          <FabSpeaker />
        )}
      </motion.button>
    </div>
  );
}

// ── Language display name ─────────────────────────────────────────────────
const LANG_NAMES = {
  en: "English",
  hi: "हिन्दी",
  ta: "தமிழ்",
  te: "తెలుగు",
  kn: "ಕನ್ನಡ",
  ml: "മലയാളം",
  bn: "বাংলা",
  gu: "ગુજરાતી",
  pa: "ਪੰਜਾਬੀ",
  mr: "मराठी",
  or: "ଓଡ଼ିଆ",
  ur: "اردو",
};
function getLangName(code) {
  return LANG_NAMES[code?.split("-")[0]] || code || "English";
}

// ── FAB Icons ─────────────────────────────────────────────────────────────
function FabSpeaker() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function FabPause() {
  // Animated sound bars when playing
  const bars = [
    { delay: "0ms", h: 10 },
    { delay: "150ms", h: 18 },
    { delay: "75ms", h: 14 },
    { delay: "225ms", h: 8 },
  ];
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
      <style>{`
        @keyframes fabwave {
          0%,100% { transform: scaleY(0.35); }
          50%      { transform: scaleY(1); }
        }
      `}</style>
      {bars.map((b, i) => (
        <span
          key={i}
          style={{
            width: 4,
            height: b.h,
            borderRadius: 99,
            background: "#6ddc7a",
            display: "block",
            animation: `fabwave 0.65s ease-in-out ${b.delay} infinite`,
            transformOrigin: "center",
          }}
        />
      ))}
    </span>
  );
}

function FabSpinner() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: "fabspin 0.8s linear infinite" }}
    >
      <style>{`@keyframes fabspin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.2"
      />
      <path
        d="M4 12a8 8 0 018-8"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
