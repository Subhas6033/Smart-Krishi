import { useState, useRef, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../Hooks/useSocketHook";
import {
  detectPest,
  clearPestResult,
  selectPestResult,
  selectPestLoading,
  selectPestError,
} from "../Features/Pestslice";

const SEVERITY = {
  Severe: {
    color: "text-red-400",
    bg: "bg-red-900/20 border-red-700/40",
    fill: "bg-red-500",
  },
  Moderate: {
    color: "text-amber-400",
    bg: "bg-amber-900/20 border-amber-700/40",
    fill: "bg-amber-500",
  },
  Mild: {
    color: "text-yellow-400",
    bg: "bg-yellow-900/20 border-yellow-700/40",
    fill: "bg-yellow-500",
  },
  None: {
    color: "text-emerald-400",
    bg: "bg-emerald-900/20 border-emerald-700/40",
    fill: "bg-emerald-500",
  },
};

// Maps i18next codes to voice.config.js keys
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
  ur: "english",
};

export default function PestDetection() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  // ── Redux state ────────────────────────────────────────────────────────────
  const result = useSelector(selectPestResult);
  const loading = useSelector(selectPestLoading);
  const error = useSelector(selectPestError);

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [ttsState, setTtsState] = useState("idle"); // idle | loading | playing | done
  const [audioProgress, setAudioProgress] = useState(0);
  const fileRef = useRef(null);
  const audioRef = useRef(null);
  const socket = useSocket();
  const chunksRef = useRef([]);

  // TTS via socket.io streaming — reads i18n.language at call time
  const playTTS = useCallback(() => {
    if (!result || !socket) return;
    setTtsState("loading");
    chunksRef.current = [];

    const lang = LANG_MAP[i18n.language?.split("-")[0]] || "english";

    socket.emit("tts:stream", {
      text: `Pest detected: ${result.pestName}. Severity: ${result.severity}. ${result.description}. Recommended action: ${result.treatment?.immediate}`,
      language: lang,
      voiceType: "female-warm",
    });

    socket.off("tts:chunk");
    socket.off("tts:done");
    socket.off("tts:error");

    socket.on("tts:chunk", (chunk) => {
      chunksRef.current.push(chunk instanceof ArrayBuffer ? chunk : (chunk.buffer ?? chunk));
    });

    socket.on("tts:done", () => {
      const blob = new Blob(chunksRef.current, { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.onended = () => {
          setTtsState("idle");
          setAudioProgress(0);
          URL.revokeObjectURL(url);
        };
        audioRef.current.onerror = () => {
          setTtsState("idle");
          setAudioProgress(0);
        };
        audioRef.current.ontimeupdate = () => {
          const pct = (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100;
          setAudioProgress(pct || 0);
          setTtsState("playing");
        };
        audioRef.current.play();
      }
    });

    socket.on("tts:error", (err) => {
      console.error("TTS error", err);
      setTtsState("idle");
    });
  }, [result, socket, i18n.language]);

  const stopTTS = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setTtsState("idle");
    setAudioProgress(0);
  };

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      setImage(file);
      dispatch(clearPestResult());
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    },
    [dispatch]
  );

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFile(e.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const analyze = () => {
    if (!image) return;
    dispatch(detectPest(image));
  };

  const severityConfig = SEVERITY[result?.severity] || SEVERITY.None;

  return (
    <div className="min-h-screen bg-[#0d1f0f] text-white">
      <audio ref={audioRef} className="hidden" />

      {/* Hero */}
      <div className="relative bg-gradient-to-b from-[#3a1a1a] to-[#0d1f0f] px-6 py-14">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#9e4a4a_1px,transparent_1px)] [background-size:24px_24px]" />
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-[#4d1e1e] text-red-300 text-xs font-medium px-4 py-1.5 rounded-full mb-5 border border-red-800/50">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            {t("pd_badge", "Real-time Detection")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            {t("pd_title1", "Pest")}{" "}
            <span className="text-red-400">{t("pd_title2", "Detection")}</span>
          </h1>
          <p className="text-[#7ec98a] text-lg max-w-xl mx-auto">
            {t(
              "pd_subtitle",
              "Upload a crop image to instantly identify pests, diseases, and get treatment recommendations."
            )}
          </p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20 -mt-4 space-y-6">
        {/* Upload */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => !preview && fileRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
              isDragging
                ? "border-red-400 bg-red-900/10 cursor-copy"
                : preview
                  ? "border-[#2d5c34]/60 bg-[#122a16]"
                  : "border-[#2d5c34] bg-[#122a16] hover:border-red-600/60 hover:bg-[#1e1212] cursor-pointer"
            }`}
            style={{ minHeight: 280 }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Crop"
                  className="w-full max-h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f0f] via-transparent to-transparent" />
                {/* Change / Remove buttons */}
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileRef.current?.click();
                    }}
                    className="text-xs text-white bg-[#0d1f0f]/80 px-3 py-1.5 rounded-lg border border-[#2d5c34] hover:bg-[#122a16] transition"
                  >
                    {t("change", "Change")}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview(null);
                      setImage(null);
                      dispatch(clearPestResult());
                    }}
                    className="text-xs text-red-400 bg-red-900/40 px-3 py-1.5 rounded-lg border border-red-800/50 hover:bg-red-900/60 transition"
                  >
                    {t("remove", "Remove")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#2a1a1a] border border-red-900/50 flex items-center justify-center mb-4 text-3xl">
                  🔍
                </div>
                <p className="text-white font-medium mb-1">
                  {t("pd_drop", "Drop crop image here")}
                </p>
                <p className="text-[#7ec98a] text-sm">
                  {t("pd_or_click", "or click to upload")}
                </p>
                <p className="text-[#3d5e40] text-xs mt-3">
                  {t("pd_hint", "Works with leaf, stem, or fruit photos")}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-5 py-3 text-sm">
            {error}
          </div>
        )}

        {image && !result && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={analyze}
            disabled={loading}
            className="w-full py-4 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
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
                {t("pd_detecting", "Scanning for pests...")}
              </>
            ) : (
              <>🔬 {t("pd_detect", "Detect Pests")}</>
            )}
          </motion.button>
        )}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Main detection card */}
              <div className={`rounded-2xl p-6 border ${severityConfig.bg}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-[#7ec98a] uppercase tracking-wider mb-1">
                      {t("pd_detected", "Detected")} · {result.confidence}%{" "}
                      {t("pd_confidence", "Confidence")}
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {result.pestName}
                    </h2>
                    <div
                      className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1 rounded-full border ${severityConfig.bg} ${severityConfig.color}`}
                    >
                      {result.severity === "None"
                        ? "✅"
                        : result.severity === "Mild"
                          ? "⚠️"
                          : result.severity === "Moderate"
                            ? "🟠"
                            : "🚨"}
                      {result.severity} {t("pd_severity", "Severity")}
                    </div>
                  </div>

                  {/* TTS Button */}
                  <div className="flex-shrink-0">
                    {ttsState === "idle" || ttsState === "done" ? (
                      <button
                        onClick={playTTS}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a1f] border border-emerald-800/50 text-emerald-300 rounded-xl text-sm hover:bg-[#1e4d25] transition"
                      >
                        <span>🔊</span> {t("pd_listen", "Listen")}
                      </button>
                    ) : ttsState === "loading" ? (
                      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#1a3a1f] border border-emerald-800/50 text-emerald-300 rounded-xl text-sm">
                        <svg
                          className="animate-spin w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
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
                        {t("pd_loading_audio", "Loading...")}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={stopTTS}
                          className="flex items-center gap-2 px-4 py-2.5 bg-red-900/40 border border-red-700/50 text-red-300 rounded-xl text-sm"
                        >
                          ⏹ {t("pd_stop", "Stop")}
                        </button>
                        <div className="h-1 bg-[#1a3a1f] rounded-full w-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-100"
                            style={{ width: `${audioProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Confidence bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-[#7ec98a] mb-1">
                    <span>
                      {t("pd_confidence_label", "Detection Confidence")}
                    </span>
                    <span>{result.confidence}%</span>
                  </div>
                  <div className="h-2 bg-[#0d1f0f] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full rounded-full ${severityConfig.fill}`}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              {result.description && (
                <div className="bg-[#122a16] rounded-2xl p-5 border border-[#2d5c34]/60">
                  <h3 className="text-sm font-semibold text-[#7ec98a] mb-2">
                    {t("pd_about", "About This Pest")}
                  </h3>
                  <p className="text-[#b8d4bb] text-sm leading-relaxed">
                    {result.description}
                  </p>
                </div>
              )}

              {/* Affected area & spread risk */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#122a16] rounded-2xl p-4 border border-[#2d5c34]/60 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {result.affectedArea}%
                  </div>
                  <div className="text-xs text-[#7ec98a] mt-1">
                    {t("pd_affected", "Crop Affected")}
                  </div>
                </div>
                <div className="bg-[#122a16] rounded-2xl p-4 border border-[#2d5c34]/60 text-center">
                  <div
                    className={`text-2xl font-bold ${result.spreadRisk === "High" ? "text-red-400" : result.spreadRisk === "Medium" ? "text-amber-400" : "text-emerald-400"}`}
                  >
                    {result.spreadRisk}
                  </div>
                  <div className="text-xs text-[#7ec98a] mt-1">
                    {t("pd_spread", "Spread Risk")}
                  </div>
                </div>
              </div>

              {/* Treatment Plan */}
              {result.treatment && (
                <div className="bg-[#122a16] rounded-2xl p-5 border border-[#2d5c34]/60 space-y-4">
                  <h3 className="text-sm font-semibold text-emerald-400">
                    💊 {t("pd_treatment", "Treatment Plan")}
                  </h3>

                  {result.treatment.immediate && (
                    <div>
                      <div className="text-xs text-red-400 font-semibold uppercase tracking-wider mb-1.5">
                        {t("pd_immediate", "Immediate Action")}
                      </div>
                      <div className="bg-red-900/20 border border-red-800/30 rounded-xl p-3 text-sm text-[#b8d4bb]">
                        {result.treatment.immediate}
                      </div>
                    </div>
                  )}

                  {result.treatment.organic && (
                    <div>
                      <div className="text-xs text-emerald-400 font-semibold uppercase tracking-wider mb-1.5">
                        🌿 {t("pd_organic", "Organic Treatment")}
                      </div>
                      <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-3 text-sm text-[#b8d4bb]">
                        {result.treatment.organic}
                      </div>
                    </div>
                  )}

                  {result.treatment.chemical && (
                    <div>
                      <div className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-1.5">
                        ⚗️ {t("pd_chemical", "Chemical Treatment")}
                      </div>
                      <div className="bg-amber-900/20 border border-amber-800/30 rounded-xl p-3 text-sm text-[#b8d4bb]">
                        {result.treatment.chemical}
                      </div>
                    </div>
                  )}

                  {result.treatment.preventive && (
                    <div>
                      <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1.5">
                        🛡️ {t("pd_preventive", "Prevention")}
                      </div>
                      <div className="bg-blue-900/20 border border-blue-800/30 rounded-xl p-3 text-sm text-[#b8d4bb]">
                        {result.treatment.preventive}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Similar Pests */}
              {result.similarPests?.length > 0 && (
                <div className="bg-[#122a16] rounded-2xl p-5 border border-[#2d5c34]/60">
                  <h3 className="text-sm font-semibold text-[#7ec98a] mb-3">
                    {t("pd_similar", "Similar Pests to Watch")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.similarPests.map((p, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-[#0d1f0f] text-[#7ec98a] border border-[#2d5c34]/40 rounded-lg text-xs"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  dispatch(clearPestResult());
                  setPreview(null);
                  setImage(null);
                  setTtsState("idle");
                }}
                className="w-full py-3 border border-[#2d5c34] text-[#7ec98a] rounded-2xl text-sm hover:bg-[#122a16] transition"
              >
                {t("pd_scan_new", "Scan New Image")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
