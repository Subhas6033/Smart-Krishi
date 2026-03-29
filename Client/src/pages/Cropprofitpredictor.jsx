import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import TTSButton from "../Components/Ttsbutton";
import {
  predictCropProfit,
  clearCropProfitResult,
  selectCropProfitResult,
  selectCropProfitLoading,
  selectCropProfitError,
} from "../Features/Cropprofitslice";

const CROPS = [
  { id: "wheat", emoji: "🌾" },
  { id: "rice", emoji: "🌾" },
  { id: "cotton", emoji: "🌿" },
  { id: "sugarcane", emoji: "🎋" },
  { id: "maize", emoji: "🌽" },
  { id: "soybean", emoji: "🫘" },
  { id: "potato", emoji: "🥔" },
  { id: "tomato", emoji: "🍅" },
  { id: "onion", emoji: "🧅" },
  { id: "mustard", emoji: "🌻" },
];

const SEASONS = ["kharif", "rabi", "zaid"];
const SOIL_TYPES = ["alluvial", "black", "red", "laterite", "sandy", "loamy"];
const IRRIGATION = ["rainfed", "canal", "drip", "sprinkler", "borewell"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

export default function CropProfitPredictor() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // ── Redux state ────────────────────────────────────────────────────────────
  const result = useSelector(selectCropProfitResult);
  const loading = useSelector(selectCropProfitLoading);
  const error = useSelector(selectCropProfitError);

  // ── Local UI state (form only) ─────────────────────────────────────────────
  const [form, setForm] = useState({
    crop: "",
    area: "",
    season: "",
    soilType: "",
    irrigation: "",
    seedCost: "",
    fertilizerCost: "",
    laborCost: "",
    expectedYield: "",
    marketPrice: "",
  });

  const resultRef = useRef(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  // Clean up Redux result on unmount
  useEffect(() => {
    return () => {
      dispatch(clearCropProfitResult());
    };
  }, [dispatch]);

  const handleChange = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(predictCropProfit(form));
  };

  const profitColor =
    result?.netProfit > 0
      ? "text-emerald-400"
      : result?.netProfit < 0
        ? "text-red-400"
        : "text-amber-400";

  return (
    <div className="min-h-screen bg-[#0d1f0f] text-white font-[system-ui]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-linear-to-b from-[#1a3a1f] to-[#0d1f0f] px-6 py-14">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#4a9e54_1px,transparent_1px)] bg-size-[24px_24px]" />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-[#1e4d25] text-emerald-300 text-xs font-medium px-4 py-1.5 rounded-full mb-5 border border-emerald-800/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t("cpp_badge", "AI-Powered Analysis")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-3">
            {t("cpp_title", "Crop Profit")}
            <span className="text-emerald-400">
              {" "}
              {t("cpp_title2", "Predictor")}
            </span>
          </h1>
          <p className="text-[#7ec98a] text-lg max-w-xl mx-auto">
            {t(
              "cpp_subtitle",
              "Enter your farm details to get AI-driven profit predictions and seasonal recommendations."
            )}
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-20 -mt-4">
        <motion.form
          variants={containerVariants}
          initial="hidden"
          animate="show"
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Crop Selection */}
          <motion.div
            variants={itemVariants}
            className="bg-[#122a16] rounded-2xl p-6 border border-[#2d5c34]/60"
          >
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
              {t("cpp_select_crop", "Select Crop")}
            </h2>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {CROPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleChange("crop", c.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all duration-200 ${
                    form.crop === c.id
                      ? "bg-emerald-600/30 border-emerald-500 scale-105"
                      : "bg-[#0d1f0f] border-[#2d5c34]/40 hover:border-emerald-600/60"
                  }`}
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-[10px] text-[#7ec98a] capitalize">
                    {t(`crop_${c.id}`, c.id)}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Farm Details */}
          <motion.div
            variants={itemVariants}
            className="bg-[#122a16] rounded-2xl p-6 border border-[#2d5c34]/60"
          >
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
              {t("cpp_farm_details", "Farm Details")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label={t("cpp_area", "Land Area (acres)")}
                type="number"
                value={form.area}
                onChange={(v) => handleChange("area", v)}
                placeholder="e.g. 2.5"
              />
              <SelectField
                label={t("cpp_season", "Season")}
                value={form.season}
                onChange={(v) => handleChange("season", v)}
                options={SEASONS.map((s) => ({
                  value: s,
                  label: t(`season_${s}`, s),
                }))}
              />
              <SelectField
                label={t("cpp_soil", "Soil Type")}
                value={form.soilType}
                onChange={(v) => handleChange("soilType", v)}
                options={SOIL_TYPES.map((s) => ({
                  value: s,
                  label: t(`soil_${s}`, s),
                }))}
              />
              <SelectField
                label={t("cpp_irrigation", "Irrigation Method")}
                value={form.irrigation}
                onChange={(v) => handleChange("irrigation", v)}
                options={IRRIGATION.map((i) => ({
                  value: i,
                  label: t(`irrigation_${i}`, i),
                }))}
              />
            </div>
          </motion.div>

          {/* Cost Inputs */}
          <motion.div
            variants={itemVariants}
            className="bg-[#122a16] rounded-2xl p-6 border border-[#2d5c34]/60"
          >
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
              {t("cpp_costs", "Input Costs (₹)")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label={t("cpp_seed_cost", "Seed Cost")}
                type="number"
                value={form.seedCost}
                onChange={(v) => handleChange("seedCost", v)}
                placeholder="₹"
              />
              <InputField
                label={t("cpp_fert_cost", "Fertilizer Cost")}
                type="number"
                value={form.fertilizerCost}
                onChange={(v) => handleChange("fertilizerCost", v)}
                placeholder="₹"
              />
              <InputField
                label={t("cpp_labor_cost", "Labor Cost")}
                type="number"
                value={form.laborCost}
                onChange={(v) => handleChange("laborCost", v)}
                placeholder="₹"
              />
            </div>
          </motion.div>

          {/* Yield & Price */}
          <motion.div
            variants={itemVariants}
            className="bg-[#122a16] rounded-2xl p-6 border border-[#2d5c34]/60"
          >
            <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-4">
              {t("cpp_yield_price", "Yield & Market Price")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label={t("cpp_yield", "Expected Yield (kg/acre)")}
                type="number"
                value={form.expectedYield}
                onChange={(v) => handleChange("expectedYield", v)}
                placeholder="kg"
              />
              <InputField
                label={t("cpp_msp", "Market Price (₹/quintal)")}
                type="number"
                value={form.marketPrice}
                onChange={(v) => handleChange("marketPrice", v)}
                placeholder="₹"
              />
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-5 py-3 text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            <button
              type="submit"
              disabled={loading || !form.crop}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/40 disabled:text-emerald-700 text-white font-semibold rounded-2xl transition-all duration-200 text-base flex items-center justify-center gap-3"
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
                  {t("cpp_analyzing", "Analyzing...")}
                </>
              ) : (
                <>📊 {t("cpp_predict", "Predict Profit")}</>
              )}
            </button>
          </motion.div>
        </motion.form>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              ref={resultRef}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="mt-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {t("cpp_results", "Prediction Results")}
                </h2>
                <TTSButton
                  text={`Net profit prediction: ${result.netProfit} rupees. ${result.recommendation}`}
                />
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: t("cpp_gross_revenue", "Gross Revenue"),
                    value: `₹${result.grossRevenue?.toLocaleString("en-IN")}`,
                    color: "text-emerald-300",
                  },
                  {
                    label: t("cpp_total_cost", "Total Cost"),
                    value: `₹${result.totalCost?.toLocaleString("en-IN")}`,
                    color: "text-amber-300",
                  },
                  {
                    label: t("cpp_net_profit", "Net Profit"),
                    value: `₹${result.netProfit?.toLocaleString("en-IN")}`,
                    color: profitColor,
                  },
                  {
                    label: t("cpp_roi", "ROI"),
                    value: `${result.roi?.toFixed(1)}%`,
                    color: result.roi > 0 ? "text-emerald-300" : "text-red-400",
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="bg-[#122a16] rounded-xl p-4 border border-[#2d5c34]/60 text-center"
                  >
                    <div className={`text-xl font-bold ${card.color}`}>
                      {card.value}
                    </div>
                    <div className="text-xs text-[#7ec98a] mt-1">
                      {card.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendation */}
              <div className="bg-[#122a16] rounded-2xl p-5 border border-emerald-800/50">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <div className="text-sm font-semibold text-emerald-400 mb-1">
                      {t("cpp_ai_rec", "AI Recommendation")}
                    </div>
                    <p className="text-[#b8d4bb] text-sm leading-relaxed">
                      {result.recommendation}
                    </p>
                  </div>
                </div>
              </div>

              {/* Market Insights */}
              {result.marketInsights && (
                <div className="bg-[#122a16] rounded-2xl p-5 border border-[#2d5c34]/60">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-3">
                    📈 {t("cpp_market", "Market Insights")}
                  </h3>
                  <ul className="space-y-2">
                    {result.marketInsights.map((insight, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-[#b8d4bb]"
                      >
                        <span className="text-emerald-500 mt-0.5">•</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-xs text-[#7ec98a] mb-1.5 font-medium">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0d1f0f] border border-[#2d5c34]/60 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-[#3d5e40] focus:outline-none focus:border-emerald-500 transition-colors"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-xs text-[#7ec98a] mb-1.5 font-medium">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0d1f0f] border border-[#2d5c34]/60 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 transition-colors capitalize"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
