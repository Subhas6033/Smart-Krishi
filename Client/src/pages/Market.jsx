import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import TTSButton from "../Components/Ttsbutton";
import {
  fetchMarketPrices,
  fetchMarketMSP,
  selectMarketPrices,
  selectMarketLoading,
  selectMarketError,
  selectMarketLastUpdated,
  selectMarketMSP,
} from "../Features/Marketslice";

const COMMODITY_GROUPS = [
  {
    id: "cereals",
    label: "Cereals",
    icon: "🌾",
    crops: ["wheat", "rice", "maize", "barley", "jowar", "bajra"],
  },
  {
    id: "pulses",
    label: "Pulses",
    icon: "🫘",
    crops: ["tur", "moong", "urad", "chana", "masoor", "peas"],
  },
  {
    id: "oilseeds",
    label: "Oilseeds",
    icon: "🌻",
    crops: ["soybean", "mustard", "groundnut", "sunflower", "sesame"],
  },
  {
    id: "vegetables",
    label: "Vegetables",
    icon: "🥦",
    crops: ["potato", "onion", "tomato", "garlic", "ginger", "capsicum"],
  },
  {
    id: "cash",
    label: "Cash Crops",
    icon: "💰",
    crops: ["cotton", "sugarcane", "tobacco", "jute"],
  },
  {
    id: "fruits",
    label: "Fruits",
    icon: "🍎",
    crops: ["mango", "banana", "apple", "pomegranate", "grapes", "orange"],
  },
];

const STATES = [
  "All India",
  "Punjab",
  "Haryana",
  "Uttar Pradesh",
  "Bihar",
  "West Bengal",
  "Maharashtra",
  "Madhya Pradesh",
  "Gujarat",
  "Rajasthan",
  "Karnataka",
  "Andhra Pradesh",
  "Tamil Nadu",
  "Telangana",
  "Odisha",
  "Assam",
];

const TREND_COLORS = {
  up: { color: "text-emerald-400", icon: "↑", bg: "bg-emerald-900/20" },
  down: { color: "text-red-400", icon: "↓", bg: "bg-red-900/20" },
  flat: { color: "text-[#7ec98a]", icon: "→", bg: "bg-[#122a16]" },
};

export default function Market() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // ── Redux state ────────────────────────────────────────────────────────────
  const prices = useSelector(selectMarketPrices);
  const loading = useSelector(selectMarketLoading);
  const error = useSelector(selectMarketError);
  const lastUpdated = useSelector(selectMarketLastUpdated);
  const msp = useSelector(selectMarketMSP);

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [activeGroup, setActiveGroup] = useState("cereals");
  const [selectedState, setSelectedState] = useState("All India");
  const [sortBy, setSortBy] = useState("name");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const group = COMMODITY_GROUPS.find((g) => g.id === activeGroup);
    const crops = group?.crops.join(",") || "";
    dispatch(fetchMarketPrices({ crops, state: selectedState }));
    dispatch(fetchMarketMSP());
  }, [dispatch, activeGroup, selectedState]);

  const sorted = [...prices]
    .filter((p) => p.crop.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price") return b.modalPrice - a.modalPrice;
      if (sortBy === "change") return b.changePercent - a.changePercent;
      return a.crop.localeCompare(b.crop);
    });

  const ttsText = sorted.length
    ? `Market prices update. ${sorted
        .slice(0, 4)
        .map((p) => `${p.crop}: ${p.modalPrice} rupees per quintal`)
        .join(". ")}.`
    : "";

  return (
    <div className="min-h-screen bg-[#0d1f0f] text-white">
      {/* Hero */}
      <div className="relative bg-linear-to-b from-[#1a2910] to-[#0d1f0f] px-6 py-14">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#7e9e4a_1px,transparent_1px)] bg-size-[28px_28px]" />
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-[#22400e] text-lime-300 text-xs font-medium px-4 py-1.5 rounded-full mb-5 border border-lime-800/50">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
            {t("mkt_badge", "Live Mandi Prices")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            {t("mkt_title", "Market")}{" "}
            <span className="text-lime-400">{t("mkt_title2", "Prices")}</span>
          </h1>
          <p className="text-[#7ec98a] text-lg max-w-xl mx-auto">
            {t(
              "mkt_subtitle",
              "Real-time mandi rates and MSP comparison across Indian states"
            )}
          </p>
        </motion.div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20 -mt-4 space-y-5">
        {/* Commodity group tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          {COMMODITY_GROUPS.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap border transition-all shrink-0 ${
                activeGroup === g.id
                  ? "bg-lime-700/40 border-lime-600/60 text-lime-300"
                  : "bg-[#122a16] border-[#2d5c34]/40 text-[#7ec98a] hover:border-lime-700/40"
              }`}
            >
              {g.icon} {t(`grp_${g.id}`, g.label)}
            </button>
          ))}
        </motion.div>

        {/* Filters row */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-[#122a16] border border-[#2d5c34]/60 text-[#7ec98a] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-lime-600 min-w-45"
          >
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("mkt_search_crop", "Search crop...")}
            className="flex-1 min-w-40 bg-[#122a16] border border-[#2d5c34]/60 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-[#3d5e40] focus:outline-none focus:border-lime-600"
          />

          <div className="flex gap-1 bg-[#122a16] border border-[#2d5c34]/40 rounded-xl p-1">
            {["name", "price", "change"].map((s) => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  sortBy === s
                    ? "bg-lime-700/40 text-lime-300"
                    : "text-[#7ec98a] hover:bg-[#1a3a1f]"
                }`}
              >
                {t(`sort_${s}`, s)}
              </button>
            ))}
          </div>

          {prices.length > 0 && <TTSButton text={ttsText} />}
        </div>

        {/* Last updated */}
        {lastUpdated && (
          <div className="text-xs text-[#3d5e40] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse" />
            {t("mkt_updated", "Updated")} {lastUpdated}
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-5 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Price cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-28 bg-[#122a16] rounded-xl border border-[#2d5c34]/30 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeGroup + selectedState}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            >
              {sorted.map((item, i) => {
                const trend =
                  item.changePercent > 0.5
                    ? "up"
                    : item.changePercent < -0.5
                      ? "down"
                      : "flat";
                const tc = TREND_COLORS[trend];
                const cropMSP = msp[item.crop?.toLowerCase()];
                const aboveMSP = cropMSP && item.modalPrice > cropMSP.price;

                return (
                  <motion.div
                    key={item.crop}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-[#122a16] rounded-xl p-4 border border-[#2d5c34]/40 hover:border-lime-700/40 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-white capitalize">
                          {item.crop}
                        </div>
                        <div className="text-xs text-[#5a9e65]">
                          {item.market || selectedState}
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-1 text-sm font-bold ${tc.color}`}
                      >
                        <span>{tc.icon}</span>
                        <span>{Math.abs(item.changePercent).toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Price display */}
                    <div className="flex items-end justify-between mt-3">
                      <div>
                        <div className="text-xs text-[#5a9e65] mb-0.5">
                          {t("mkt_modal", "Modal Price")}
                        </div>
                        <div className="text-2xl font-bold text-white">
                          ₹{item.modalPrice?.toLocaleString("en-IN")}
                          <span className="text-xs text-[#5a9e65] font-normal ml-1">
                            /qtl
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-[#3d5e40]">
                          L: ₹{item.minPrice?.toLocaleString("en-IN")}
                        </div>
                        <div className="text-xs text-[#3d5e40]">
                          H: ₹{item.maxPrice?.toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>

                    {/* MSP comparison badge */}
                    {cropMSP && (
                      <div
                        className={`mt-2 text-[10px] px-2 py-1 rounded-md inline-flex items-center gap-1 ${
                          aboveMSP
                            ? "bg-emerald-900/30 text-emerald-400"
                            : "bg-amber-900/30 text-amber-400"
                        }`}
                      >
                        {aboveMSP ? "↑ Above MSP" : "↓ Below MSP"} (₹
                        {cropMSP.price?.toLocaleString("en-IN")})
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* No results */}
        {!loading && sorted.length === 0 && !error && (
          <div className="text-center py-16 text-[#3d5e40]">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-sm">
              {t("mkt_no_data", "No price data available for this selection")}
            </div>
          </div>
        )}

        {/* MSP Reference Table */}
        {Object.keys(msp).length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0e1e12] rounded-2xl p-5 border border-[#1e4428]/50"
          >
            <h3 className="text-sm font-semibold text-lime-400 mb-4">
              📋 {t("mkt_msp_table", "MSP Reference (2024-25)")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(msp).map(([crop, data]) => (
                <div
                  key={crop}
                  className="flex justify-between items-center bg-[#122a16] rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-[#7ec98a] capitalize">
                    {crop}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    ₹{data.price?.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
            <div className="text-xs text-[#3d5e40] mt-3">
              {t("mkt_msp_source", "Source: CACP India — per quintal")}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
