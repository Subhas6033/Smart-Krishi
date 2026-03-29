import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

// Maps i18next codes to the keys in voice.config.js VOICE_CATALOGUE
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
  ur: "english", // Sarvam fallback
};

export default function TTSButton({
  text,
  language: languageProp,
  voiceType = "female-warm",
}) {
  const { i18n } = useTranslation();
  const [state, setState] = useState("idle"); // idle | loading | playing | error
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState("idle");
    setProgress(0);
  }, []);

  const play = useCallback(async () => {
    setState("loading");
    try {
      const langCode = LANG_MAP[i18n.language?.split("-")[0]] || "english";

      const res = await fetch("/api/tts/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: langCode, voiceType }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "TTS request failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = audioRef.current;
      if (!audio) return;

      audio.src = url;
      await audio.play();
      setState("playing");

      audio.ontimeupdate = () => {
        setProgress((audio.currentTime / (audio.duration || 1)) * 100);
      };
      audio.onended = () => {
        setState("idle");
        setProgress(0);
        URL.revokeObjectURL(url);
      };
      audio.onerror = () => {
        setState("error");
        setTimeout(() => setState("idle"), 2000);
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error("[TTS]", err.message);
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }, [text, voiceType, i18n.language]);

  const handleClick = () => {
    if (state === "playing") return stop();
    if (state === "loading") return; // debounce
    play();
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <audio ref={audioRef} className="hidden" />

      <button
        onClick={handleClick}
        title={state === "playing" ? "Stop" : "Listen in your language"}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
          state === "playing"
            ? "bg-emerald-900/40 border-emerald-600/50 text-emerald-300"
            : state === "loading"
              ? "bg-[#1a3a1f] border-[#2d5c34] text-[#7ec98a] opacity-70 cursor-wait"
              : state === "error"
                ? "bg-red-900/30 border-red-700/50 text-red-400"
                : "bg-[#1a3a1f] border-[#2d5c34] text-[#7ec98a] hover:border-emerald-600 hover:text-emerald-300"
        }`}
      >
        {state === "loading" ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"
            />
          </svg>
        ) : state === "playing" ? (
          <span className="flex items-center gap-0.5">
            <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite_0ms]" />
            <span className="w-0.5 h-5 bg-emerald-400 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite_100ms]" />
            <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-[soundwave_0.5s_ease-in-out_infinite_200ms]" />
          </span>
        ) : state === "error" ? (
          "✕"
        ) : (
          "🔊"
        )}

        <span>
          {state === "loading"
            ? "..."
            : state === "playing"
              ? "Stop"
              : state === "error"
                ? "Error"
                : "Listen"}
        </span>
      </button>

      {state === "playing" && (
        <div className="w-full h-1 bg-[#1a3a1f] rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
