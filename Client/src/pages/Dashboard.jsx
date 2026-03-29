import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTTSContext } from "../Components/Ttscontext";

const features = [
  {
    to: "/crop-profit",
    icon: "📊",
    color:
      "from-emerald-900/40 to-emerald-950/20 border-emerald-800/40 hover:border-emerald-600/60",
    accentColor: "text-emerald-400",
    titleKey: "feat_cpp_title",
    defaultTitle: "Crop Profit Predictor",
    descKey: "feat_cpp_desc",
    defaultDesc: "AI-driven profit analysis with seasonal market insights",
    badge: "AI",
    badgeColor: "bg-emerald-900/60 text-emerald-300 border-emerald-700/50",
  },
  {
    to: "/soil-scanner",
    icon: "🔬",
    color:
      "from-amber-900/40 to-amber-950/20 border-amber-800/40 hover:border-amber-600/60",
    accentColor: "text-amber-400",
    titleKey: "feat_ss_title",
    defaultTitle: "Soil Scanner",
    descKey: "feat_ss_desc",
    defaultDesc: "Instant nutrient & pH analysis from soil photos",
    badge: "Vision",
    badgeColor: "bg-amber-900/60 text-amber-300 border-amber-700/50",
  },
  {
    to: "/pre-pest",
    icon: "🛡️",
    color:
      "from-blue-900/40 to-blue-950/20 border-blue-800/40 hover:border-blue-600/60",
    accentColor: "text-blue-400",
    titleKey: "feat_ppd_title",
    defaultTitle: "Pre-Pest Detection",
    descKey: "feat_ppd_desc",
    defaultDesc: "Predict pest threats before they damage your crop",
    badge: "Forecast",
    badgeColor: "bg-blue-900/60 text-blue-300 border-blue-700/50",
  },
  {
    to: "/pest-detect",
    icon: "🔍",
    color:
      "from-red-900/40 to-red-950/20 border-red-800/40 hover:border-red-600/60",
    accentColor: "text-red-400",
    titleKey: "feat_pd_title",
    defaultTitle: "Pest Detection",
    descKey: "feat_pd_desc",
    defaultDesc: "Real-time pest & disease identification with treatment plans",
    badge: "Live",
    badgeColor: "bg-red-900/60 text-red-300 border-red-700/50",
  },
];

const stats = [
  { value: "12+", label: "Languages", icon: "🌐" },
  { value: "50+", label: "Crops", icon: "🌾" },
  { value: "98%", label: "Accuracy", icon: "🎯" },
  { value: "4", label: "AI Tools", icon: "🤖" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 240, damping: 24, delay: i * 0.1 },
  }),
};

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { setTTSLines } = useTTSContext();

  // ── Register page content for the floating TTS button ──────────────────
  // Re-runs whenever i18n.language changes so the next play() uses
  // fresh translated strings in the correct language.
  useEffect(() => {
    setTTSLines(
      [
        t("dash_title1", "Smart") + t("dash_title2", "Krishi"),
        t("dash_subtitle", "AI-powered farming intelligence in your language"),
        t(
          "dash_desc",
          "Soil analysis, Pest detection, Profit forecasting, 12 Indian languages"
        ),
        t("feat_cpp_title", "Crop Profit Predictor") +
          ". " +
          t(
            "feat_cpp_desc",
            "AI-driven profit analysis with seasonal market insights"
          ),
        t("feat_ss_title", "Soil Scanner") +
          ". " +
          t(
            "feat_ss_desc",
            "Instant nutrient and pH analysis from soil photos"
          ),
        t("feat_ppd_title", "Pre-Pest Detection") +
          ". " +
          t(
            "feat_ppd_desc",
            "Predict pest threats before they damage your crop"
          ),
        t("feat_pd_title", "Pest Detection") +
          ". " +
          t(
            "feat_pd_desc",
            "Real-time pest and disease identification with treatment plans"
          ),
        t("tts_feature_title", "Voice Support in Your Language") +
          ". " +
          t(
            "tts_feature_desc",
            "All AI results can be read aloud in Hindi, Tamil, Telugu, Kannada, Bengali, Gujarati, Punjabi, Marathi, Odia, and Malayalam."
          ),
      ],
      t("nav_dashboard", "Dashboard") // shown in the FAB tooltip
    );

    // Clear when unmounting so the FAB hides on other pages that haven't
    // registered yet (optional — remove if you want it to persist)
    return () => setTTSLines([], "");
  }, [i18n.language]); // ← re-register on every language switch

  return (
    <div className="min-h-screen bg-[#0d1f0f] text-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-linear-to-br from-[#1a3a1f] via-[#122a16] to-[#0d1f0f] px-6 py-20">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(#4a9e54 1px,transparent 1px),linear-gradient(90deg,#4a9e54 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center relative"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="w-20 h-20 bg-[#1e4d25] rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 border border-emerald-700/30 shadow-lg shadow-emerald-900/20"
          >
            🌱
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">
            {t("dash_title1", "Smart")}
            <span className="text-emerald-400">
              {t("dash_title2", "Krishi")}
            </span>
          </h1>
          <p className="text-xl text-[#7ec98a] mb-3 max-w-xl mx-auto">
            {t(
              "dash_subtitle",
              "AI-powered farming intelligence in your language"
            )}
          </p>
          <p className="text-[#3d6b42] text-sm">
            {t(
              "dash_desc",
              "Soil analysis · Pest detection · Profit forecasting · 12 Indian languages"
            )}
          </p>
        </motion.div>
      </div>

      {/* Stats bar */}
      <div className="bg-[#0f2411] border-y border-[#2d5c34]/40">
        <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-4 divide-x divide-[#2d5c34]/30">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="text-center px-4"
            >
              <div className="text-lg">{stat.icon}</div>
              <div className="text-xl font-bold text-emerald-400">
                {stat.value}
              </div>
              <div className="text-xs text-[#7ec98a]">
                {t(`stat_${stat.label.toLowerCase()}`, stat.label)}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm font-semibold text-[#4a7e52] uppercase tracking-widest mb-6 text-center"
        >
          {t("dash_tools", "AI Tools")}
        </motion.h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feat, i) => (
            <motion.div
              key={feat.to}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="show"
            >
              <Link to={feat.to} className="group block">
                <div
                  className={`bg-linear-to-br ${feat.color} rounded-2xl p-6 border transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg group-hover:shadow-black/20`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-black/20 flex items-center justify-center text-2xl border border-white/5">
                      {feat.icon}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${feat.badgeColor}`}
                    >
                      {feat.badge}
                    </span>
                  </div>
                  <h3
                    className={`text-lg font-bold ${feat.accentColor} mb-1 group-hover:translate-x-1 transition-transform duration-200`}
                  >
                    {t(feat.titleKey, feat.defaultTitle)}
                  </h3>
                  <p className="text-[#7ec98a] text-sm leading-relaxed">
                    {t(feat.descKey, feat.defaultDesc)}
                  </p>
                  <div
                    className={`mt-4 flex items-center gap-1 text-xs font-medium ${feat.accentColor} opacity-60 group-hover:opacity-100 transition-opacity`}
                  >
                    {t("dash_open", "Open tool")}
                    <svg
                      className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* TTS Info Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 bg-[#122a16] rounded-2xl p-5 border border-[#2d5c34]/50 flex items-center gap-4"
        >
          <div className="text-3xl shrink-0">🔊</div>
          <div>
            <h3 className="font-semibold text-white text-sm mb-0.5">
              {t("tts_feature_title", "Voice Support in Your Language")}
            </h3>
            <p className="text-[#7ec98a] text-xs leading-relaxed">
              {t(
                "tts_feature_desc",
                "All AI results can be read aloud in Hindi, Tamil, Telugu, Kannada, Bengali, Gujarati, Punjabi, Marathi, Urdu, Odia, and Malayalam."
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
