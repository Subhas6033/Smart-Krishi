import { useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import TTSButton from "../Components/Ttsbutton";
import {
  analyzeSoil,
  clearSoilResult,
  selectSoilResult,
  selectSoilLoading,
  selectSoilError,
} from "../Features/Soilscannerslice";

const SOIL_PARAMS = [
  {
    key: "ph",
    label: "pH Level",
    unit: "",
    min: 0,
    max: 14,
    optimal: [6, 7.5],
  },
  {
    key: "nitrogen",
    label: "Nitrogen (N)",
    unit: "kg/ha",
    min: 0,
    max: 300,
    optimal: [80, 200],
  },
  {
    key: "phosphorus",
    label: "Phosphorus (P)",
    unit: "kg/ha",
    min: 0,
    max: 100,
    optimal: [20, 60],
  },
  {
    key: "potassium",
    label: "Potassium (K)",
    unit: "kg/ha",
    min: 0,
    max: 300,
    optimal: [100, 250],
  },
  {
    key: "organicMatter",
    label: "Organic Matter",
    unit: "%",
    min: 0,
    max: 10,
    optimal: [2, 5],
  },
  {
    key: "moisture",
    label: "Moisture Content",
    unit: "%",
    min: 0,
    max: 100,
    optimal: [30, 70],
  },
];

export default function SoilScanner() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // ── Redux state ────────────────────────────────────────────────────────────
  const result = useSelector(selectSoilResult);
  const loading = useSelector(selectSoilLoading);
  const error = useSelector(selectSoilError);

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef(null);

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      setImage(file);
      dispatch(clearSoilResult());
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
    dispatch(analyzeSoil(image));
  };

  return (
    <div className="min-h-screen bg-[#0d1f0f] text-white">
      {/* Hero */}
      <div className="relative bg-linear-to-b from-[#1a3a1f] to-[#0d1f0f] px-6 py-14">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#4a9e54_1px,transparent_1px)] [background-size:24px_24px]" />
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-[#1e4d25] text-amber-300 text-xs font-medium px-4 py-1.5 rounded-full mb-5 border border-amber-800/50">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {t("ss_badge", "Computer Vision Analysis")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            {t("ss_title", "Soil")}{" "}
            <span className="text-amber-400">{t("ss_title2", "Scanner")}</span>
          </h1>
          <p className="text-[#7ec98a] text-lg max-w-xl mx-auto">
            {t(
              "ss_subtitle",
              "Upload a soil image for instant AI analysis of nutrient levels, pH, and crop recommendations."
            )}
          </p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20 -mt-4 space-y-6">
        {/* Upload Zone */}
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
            onClick={() => fileRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
              isDragging
                ? "border-amber-400 bg-amber-900/10"
                : preview
                  ? "border-emerald-600/60 bg-[#122a16]"
                  : "border-[#2d5c34] bg-[#122a16] hover:border-emerald-600/60 hover:bg-[#163c1c]"
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
                  alt="Soil"
                  className="w-full max-h-72 object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#0d1f0f] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="text-sm text-emerald-300 bg-[#0d1f0f]/80 px-3 py-1.5 rounded-lg">
                    ✓ {image?.name}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreview(null);
                      setImage(null);
                      dispatch(clearSoilResult());
                    }}
                    className="text-xs text-red-400 bg-red-900/40 px-3 py-1.5 rounded-lg border border-red-800/50 hover:bg-red-900/60 transition"
                  >
                    {t("remove", "Remove")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#1a3a1f] border border-[#2d5c34] flex items-center justify-center mb-4 text-3xl">
                  🔬
                </div>
                <p className="text-white font-medium mb-1">
                  {t("ss_drop", "Drop soil image here")}
                </p>
                <p className="text-[#7ec98a] text-sm">
                  {t("ss_or_click", "or click to browse")}
                </p>
                <p className="text-[#3d5e40] text-xs mt-3">
                  {t("ss_formats", "JPG, PNG up to 10MB")}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tip Cards */}
        {!result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { icon: "☀️", tip: t("ss_tip1", "Take photo in natural light") },
              { icon: "📐", tip: t("ss_tip2", "Use white background") },
              { icon: "🔍", tip: t("ss_tip3", "Include moist & dry sections") },
            ].map((tip, i) => (
              <div
                key={i}
                className="bg-[#122a16] rounded-xl p-3 border border-[#2d5c34]/40 text-center"
              >
                <div className="text-xl mb-1">{tip.icon}</div>
                <p className="text-xs text-[#7ec98a] leading-tight">
                  {tip.tip}
                </p>
              </div>
            ))}
          </motion.div>
        )}

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
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-3"
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
                {t("ss_scanning", "Scanning soil...")}
              </>
            ) : (
              <>🔬 {t("ss_analyze", "Analyze Soil")}</>
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
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    {t("ss_results", "Soil Analysis Report")}
                  </h2>
                  <p className="text-sm text-[#7ec98a]">
                    {t("ss_type_label", "Soil Type")}:{" "}
                    <span className="text-amber-400 font-semibold">
                      {result.soilType}
                    </span>
                  </p>
                </div>
                <TTSButton
                  text={`Soil type: ${result.soilType}. Overall health: ${result.overallHealth}. ${result.recommendation}`}
                />
              </div>

              {/* Health badge */}
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  result.overallHealth === "Excellent"
                    ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700/40"
                    : result.overallHealth === "Good"
                      ? "bg-blue-900/40 text-blue-300 border border-blue-700/40"
                      : result.overallHealth === "Average"
                        ? "bg-amber-900/40 text-amber-300 border border-amber-700/40"
                        : "bg-red-900/40 text-red-300 border border-red-700/40"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {t("ss_health", "Overall Health")}: {result.overallHealth}
              </div>

              {/* Parameter bars */}
              <div className="bg-[#122a16] rounded-2xl p-5 border border-[#2d5c34]/60 space-y-4">
                <h3 className="text-sm font-semibold text-emerald-400">
                  {t("ss_nutrients", "Nutrient Profile")}
                </h3>
                {SOIL_PARAMS.map((param) => {
                  const val = result.parameters?.[param.key] ?? 0;
                  const pct = Math.min(100, (val / param.max) * 100);
                  const inOptimal =
                    val >= param.optimal[0] && val <= param.optimal[1];
                  return (
                    <div key={param.key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#b8d4bb]">{param.label}</span>
                        <span
                          className={
                            inOptimal ? "text-emerald-400" : "text-amber-400"
                          }
                        >
                          {val} {param.unit}
                          {inOptimal ? " ✓" : " ⚠"}
                        </span>
                      </div>
                      <div className="h-2 bg-[#0d1f0f] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.1 }}
                          className={`h-full rounded-full ${inOptimal ? "bg-emerald-500" : "bg-amber-500"}`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-[#3d5e40] mt-0.5">
                        <span>{param.min}</span>
                        <span>
                          Optimal: {param.optimal[0]}–{param.optimal[1]}
                        </span>
                        <span>{param.max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommended Crops */}
              {result.recommendedCrops?.length > 0 && (
                <div className="bg-[#122a16] rounded-2xl p-5 border border-[#2d5c34]/60">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-3">
                    🌱 {t("ss_crops", "Recommended Crops")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.recommendedCrops.map((crop, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-emerald-900/30 text-emerald-300 border border-emerald-800/40 rounded-lg text-sm"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Deficiencies & Treatments */}
              {result.deficiencies?.length > 0 && (
                <div className="bg-[#122a16] rounded-2xl p-5 border border-amber-800/30">
                  <h3 className="text-sm font-semibold text-amber-400 mb-3">
                    ⚠️ {t("ss_deficiencies", "Deficiencies & Treatments")}
                  </h3>
                  <div className="space-y-3">
                    {result.deficiencies.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 bg-[#0d1f0f] rounded-xl p-3"
                      >
                        <span className="text-amber-400 text-lg mt-0.5">
                          ⚡
                        </span>
                        <div>
                          <div className="text-sm font-medium text-amber-300">
                            {d.nutrient}
                          </div>
                          <div className="text-xs text-[#7ec98a] mt-0.5">
                            {d.treatment}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Recommendation */}
              <div className="bg-[#122a16] rounded-2xl p-5 border border-emerald-800/50">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <div className="text-sm font-semibold text-emerald-400 mb-1">
                      {t("ss_ai_rec", "AI Recommendation")}
                    </div>
                    <p className="text-[#b8d4bb] text-sm leading-relaxed">
                      {result.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  dispatch(clearSoilResult());
                  setPreview(null);
                  setImage(null);
                }}
                className="w-full py-3 border border-[#2d5c34] text-[#7ec98a] rounded-2xl text-sm hover:bg-[#122a16] transition"
              >
                {t("ss_scan_new", "Scan New Sample")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
