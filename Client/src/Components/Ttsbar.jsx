import { useTTS } from "../Hooks/Usetts";
import { useTranslation } from "react-i18next";

export default function TTSBar({
  lines,
  label,
  voiceType = "female-warm",
  speakingRate = 1.0,
  className = "",
}) {
  const { t } = useTranslation();
  const { toggle, state, progress } = useTTS(lines, {
    voiceType,
    speakingRate,
  });

  const isPlaying = state === "playing";
  const isLoading = state === "loading";
  const isError = state === "error";

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <button
        onClick={toggle}
        disabled={isLoading}
        title={
          isPlaying
            ? t("tts_stop", "Stop")
            : t("tts_listen", "Listen in your language")
        }
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 14px",
          borderRadius: 10,
          border: `1px solid ${isPlaying ? "#3d8b47" : isError ? "#7f3333" : "#2d5c34"}`,
          background: isPlaying
            ? "rgba(74,158,84,0.15)"
            : isError
              ? "rgba(180,60,60,0.15)"
              : "rgba(26,58,31,0.8)",
          color: isPlaying ? "#6ddc7a" : isError ? "#f08080" : "#7ec98a",
          cursor: isLoading ? "wait" : "pointer",
          fontSize: 13,
          fontWeight: 500,
          transition: "all 0.18s",
          opacity: isLoading ? 0.7 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {/* Icon */}
        {isLoading ? (
          <LoadingSpinner />
        ) : isPlaying ? (
          <SoundWave />
        ) : isError ? (
          <span style={{ fontSize: 14 }}>✕</span>
        ) : (
          <span style={{ fontSize: 15 }}>🔊</span>
        )}

        {/* Label */}
        <span>
          {isLoading
            ? t("tts_loading", "Loading…")
            : isPlaying
              ? t("tts_stop", "Stop")
              : isError
                ? t("tts_error", "Error — retry?")
                : label || t("tts_listen", "Listen")}
        </span>
      </button>

      {/* Progress bar — only while playing */}
      {isPlaying && (
        <div
          style={{
            height: 3,
            borderRadius: 99,
            background: "rgba(74,158,84,0.15)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, #3d8b47, #6ddc7a)",
              borderRadius: 99,
              transition: "width 0.1s linear",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Internal micro-components ─────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeOpacity="0.25"
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

function SoundWave() {
  const bars = [
    { delay: "0ms", height: 10 },
    { delay: "120ms", height: 16 },
    { delay: "60ms", height: 12 },
    { delay: "180ms", height: 8 },
  ];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        height: 18,
      }}
    >
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50%       { transform: scaleY(1);   }
        }
      `}</style>
      {bars.map((b, i) => (
        <span
          key={i}
          style={{
            width: 3,
            height: b.height,
            borderRadius: 99,
            background: "#6ddc7a",
            display: "block",
            animation: `wave 0.7s ease-in-out ${b.delay} infinite`,
            transformOrigin: "center",
          }}
        />
      ))}
    </span>
  );
}
