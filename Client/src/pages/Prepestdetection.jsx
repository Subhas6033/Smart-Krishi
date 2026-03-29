import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import TTSButton from "../Components/Ttsbutton";
import {
  analyzePrePestRisk,
  clearPrePestResult,
  selectPrePestResult,
  selectPrePestLoading,
  selectPrePestError,
} from "../Features/Prepestslice";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const CROPS = [
  "wheat",
  "rice",
  "cotton",
  "maize",
  "sugarcane",
  "soybean",
  "potato",
  "tomato",
  "onion",
  "mustard",
  "chickpea",
  "lentil",
];
const REGIONS = [
  "north_india",
  "south_india",
  "east_india",
  "west_india",
  "central_india",
  "northeast_india",
];

const RISK_CONFIG = {
  High: {
    color: "text-red-400",
    bg: "bg-red-900/20 border-red-700/40",
    bar: "bg-red-500",
    icon: "🔴",
  },
  Medium: {
    color: "text-amber-400",
    bg: "bg-amber-900/20 border-amber-700/40",
    bar: "bg-amber-500",
    icon: "🟡",
  },
  Low: {
    color: "text-emerald-400",
    bg: "bg-emerald-900/20 border-emerald-700/40",
    bar: "bg-emerald-500",
    icon: "🟢",
  },
};

export default function PrePestDetection() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // ── Redux state ────────────────────────────────────────────────────────────
  const result = useSelector(selectPrePestResult);
  const loading = useSelector(selectPrePestLoading);
  const error = useSelector(selectPrePestError);

  // ── Local UI state (form only) ─────────────────────────────────────────────
  const [form, setForm] = useState({
    crop: "",
    region: "",
    month: new Date().getMonth(),
    temperature: "",
    humidity: "",
    rainfall: "",
    previousPestHistory: false,
    cropAge: "",
    irrigationMethod: "",
  });

  const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(analyzePrePestRisk(form));
  };

  return (
    <div className="min-h-screen bg-[#0d1f0f] text-white">
      {/* Hero */}
      <div className="relative bg-linear-to-b from-[#1a2a3f] to-[#0d1f0f] px-6 py-14">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#4a6e9e_1px,transparent_1px)] [background-size:24px_24px]" />
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-[#1e3a5c] text-blue-300 text-xs font-medium px-4 py-1.5 rounded-full mb-5 border border-blue-800/50">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            {t("ppd_badge", "Preventive Intelligence")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="text-blue-400">{t("ppd_title1", "Pre-Pest")}</span>{" "}
            {t("ppd_title2", "Detection")}
          </h1>
          <p className="text-[#7ec98a] text-lg max-w-xl mx-auto">
            {t(
              "ppd_subtitle",
              "Predict pest threats before they strike. Enter crop and environment conditions to get risk forecasts."
            )}
          </p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20 -mt-4">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Crop & Region */}
          <div className="bg-[#122a16] rounded-2xl p-6 border border-[#2d5c34]/60">
            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">
              {t("ppd_crop_info", "Crop Information")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#7ec98a] mb-1.5 font-medium">
                  {t("ppd_crop", "Crop Type")}
                </label>
                <select
                  value={form.crop}
                  onChange={(e) => handleChange("crop", e.target.value)}
                  className="w-full bg-[#0d1f0f] border border-[#2d5c34]/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">{t("select", "Select...")}</option>
                  {CROPS.map((c) => (
                    <option key={c} value={c}>
                      {t(`crop_${c}`, c)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#7ec98a] mb-1.5 font-medium">
                  {t("ppd_region", "Region")}
                </label>
                <select
                  value={form.region}
                  onChange={(e) => handleChange("region", e.target.value)}
                  className="w-full bg-[#0d1f0f] border border-[#2d5c34]/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="">{t("select", "Select...")}</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {t(`region_${r}`, r.replace(/_/g, " "))}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#7ec98a] mb-1.5 font-medium">
                  {t("ppd_crop_age", "Crop Age (days)")}
                </label>
                <input
                  type="number"
                  value={form.cropAge}
                  onChange={(e) => handleChange("cropAge", e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full bg-[#0d1f0f] border border-[#2d5c34]/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              {/* Month selector */}
              <div>
                <label className="block text-xs text-[#7ec98a] mb-1.5 font-medium">
                  {t("ppd_month", "Current Month")}
                </label>
                <div className="grid grid-cols-6 gap-1">
                  {MONTHS.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleChange("month", i)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                        form.month === i
                          ? "bg-blue-600 text-white"
                          : "bg-[#0d1f0f] text-[#7ec98a] hover:bg-blue-900/30"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weather Conditions */}
          <div className="bg-[#122a16] rounded-2xl p-6 border border-[#2d5c34]/60">
            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">
              🌤️ {t("ppd_weather", "Weather Conditions")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  key: "temperature",
                  label: t("ppd_temp", "Temperature (°C)"),
                  placeholder: "e.g. 28",
                },
                {
                  key: "humidity",
                  label: t("ppd_humidity", "Humidity (%)"),
                  placeholder: "e.g. 70",
                },
                {
                  key: "rainfall",
                  label: t("ppd_rainfall", "Recent Rainfall (mm)"),
                  placeholder: "e.g. 15",
                },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-xs text-[#7ec98a] mb-1.5 font-medium">
                    {f.label}
                  </label>
                  <input
                    type="number"
                    value={form[f.key]}
                    onChange={(e) => handleChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full bg-[#0d1f0f] border border-[#2d5c34]/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* History Toggle */}
          <div className="bg-[#122a16] rounded-2xl p-6 border border-[#2d5c34]/60">
            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-4">
              📋 {t("ppd_history", "Pest History")}
            </h2>
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={form.previousPestHistory}
                  onChange={(e) =>
                    handleChange("previousPestHistory", e.target.checked)
                  }
                  className="sr-only"
                />
                <div
                  className={`w-12 h-6 rounded-full transition-colors duration-200 ${form.previousPestHistory ? "bg-blue-600" : "bg-[#2d5c34]"}`}
                />
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.previousPestHistory ? "translate-x-7" : "translate-x-1"}`}
                />
              </div>
              <div>
                <div className="text-sm text-white">
                  {t(
                    "ppd_prev_pest",
                    "Previous pest infestation in this field"
                  )}
                </div>
                <div className="text-xs text-[#7ec98a]">
                  {t(
                    "ppd_prev_pest_sub",
                    "Increases risk score for same pest species"
                  )}
                </div>
              </div>
            </label>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-5 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.crop || !form.region}
            className="w-full py-4 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-3"
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
                {t("ppd_analyzing", "Calculating Risk...")}
              </>
            ) : (
              <>🛡️ {t("ppd_analyze", "Analyze Pest Risk")}</>
            )}
          </button>
        </motion.form>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {t("ppd_risk_report", "Pest Risk Report")}
                </h2>
                <TTSButton
                  text={`Pest risk analysis complete. Overall risk level: ${result.overallRisk}. ${result.immediateActions?.join(". ")}`}
                />
              </div>

              {/* Overall Risk */}
              <div
                className={`rounded-2xl p-5 border ${RISK_CONFIG[result.overallRisk]?.bg || "bg-[#122a16] border-[#2d5c34]/60"}`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {RISK_CONFIG[result.overallRisk]?.icon || "⚪"}
                  </div>
                  <div>
                    <div className="text-xs text-[#7ec98a] uppercase tracking-wider">
                      {t("ppd_overall", "Overall Risk Level")}
                    </div>
                    <div
                      className={`text-3xl font-bold ${RISK_CONFIG[result.overallRisk]?.color}`}
                    >
                      {result.overallRisk}
                    </div>
                    <div className="text-sm text-[#b8d4bb] mt-1">
                      {result.riskSummary}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pest Risks Table */}
              {result.pestRisks?.length > 0 && (
                <div className="bg-[#122a16] rounded-2xl p-5 border border-[#2d5c34]/60">
                  <h3 className="text-sm font-semibold text-blue-400 mb-4">
                    🦟 {t("ppd_pest_risks", "Individual Pest Risks")}
                  </h3>
                  <div className="space-y-3">
                    {result.pestRisks.map((pest, i) => {
                      const cfg =
                        RISK_CONFIG[pest.riskLevel] || RISK_CONFIG.Low;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -16 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-4 bg-[#0d1f0f] rounded-xl p-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-white">
                                {pest.name}
                              </span>
                              <span
                                className={`text-xs font-semibold ${cfg.color}`}
                              >
                                {pest.riskLevel} ({pest.probability}%)
                              </span>
                            </div>
                            <div className="h-1.5 bg-[#1a3a1f] rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pest.probability}%` }}
                                transition={{
                                  duration: 0.7,
                                  delay: i * 0.06 + 0.2,
                                }}
                                className={`h-full rounded-full ${cfg.bar}`}
                              />
                            </div>
                            <p className="text-xs text-[#7ec98a] mt-1">
                              {pest.preventionTip}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Immediate Actions */}
              {result.immediateActions?.length > 0 && (
                <div className="bg-[#122a16] rounded-2xl p-5 border border-blue-800/30">
                  <h3 className="text-sm font-semibold text-blue-400 mb-3">
                    ⚡ {t("ppd_actions", "Immediate Actions")}
                  </h3>
                  <ol className="space-y-2">
                    {result.immediateActions.map((action, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-sm text-[#b8d4bb]"
                      >
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-900/50 text-blue-300 rounded-full flex items-center justify-center text-xs font-bold border border-blue-800/40">
                          {i + 1}
                        </span>
                        {action}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Forecast Calendar */}
              {result.weeklyForecast && (
                <div className="bg-[#122a16] rounded-2xl p-5 border border-[#2d5c34]/60">
                  <h3 className="text-sm font-semibold text-blue-400 mb-4">
                    📅 {t("ppd_forecast", "2-Week Risk Forecast")}
                  </h3>
                  <div className="grid grid-cols-7 gap-1.5">
                    {result.weeklyForecast.map((day, i) => {
                      const cfg = RISK_CONFIG[day.risk] || RISK_CONFIG.Low;
                      return (
                        <div
                          key={i}
                          className="flex flex-col items-center gap-1"
                        >
                          <div className="text-[10px] text-[#7ec98a]">
                            {day.label}
                          </div>
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                              day.risk === "High"
                                ? "bg-red-900/40"
                                : day.risk === "Medium"
                                  ? "bg-amber-900/40"
                                  : "bg-emerald-900/20"
                            }`}
                          >
                            {cfg.icon}
                          </div>
                          <div
                            className={`text-[9px] font-medium ${cfg.color}`}
                          >
                            {day.risk[0]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-[#7ec98a]">
                    <span className="flex items-center gap-1">🔴 High</span>
                    <span className="flex items-center gap-1">🟡 Medium</span>
                    <span className="flex items-center gap-1">🟢 Low</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
