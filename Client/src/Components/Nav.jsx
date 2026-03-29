import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTTSContext } from "./Ttscontext"; // ← static import, no await/try

const LANGS = [
  { c: "en", n: "English", script: "En" },
  { c: "hi", n: "हिन्दी", script: "हि" },
  { c: "ta", n: "தமிழ்", script: "த" },
  { c: "te", n: "తెలుగు", script: "తె" },
  { c: "kn", n: "ಕನ್ನಡ", script: "ಕ" },
  { c: "ml", n: "മലയാളം", script: "മ" },
  { c: "bn", n: "বাংলা", script: "বা" },
  { c: "gu", n: "ગુજરાતી", script: "ગુ" },
  { c: "pa", n: "ਪੰਜਾਬੀ", script: "ਪੰ" },
  { c: "mr", n: "मराठी", script: "म" },
  { c: "ur", n: "اردو", script: "ار" },
  { c: "or", n: "ଓଡ଼ିଆ", script: "ଓ" },
];

const NAV_LINKS = [
  {
    to: "/",
    labelKey: "nav_dashboard",
    label: "Dashboard",
    icon: "🏠",
    end: true,
  },
  {
    to: "/crop-profit",
    labelKey: "nav_crops",
    label: "Crop Profit",
    icon: "📊",
  },
  { to: "/soil-scanner", labelKey: "nav_soil", label: "Soil Scan", icon: "🔬" },
  { to: "/pre-pest", labelKey: "nav_prepest", label: "Pre-Pest", icon: "🛡️" },
  {
    to: "/pest-detect",
    labelKey: "nav_pest",
    label: "Pest Detect",
    icon: "🔍",
  },
  { to: "/weather", labelKey: "nav_weather", label: "Weather", icon: "🌤️" },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const langRef = useRef(null);

  // ── Correct key: setTTSLines (not setLines) ──
  const { setTTSLines } = useTTSContext();

  const current = LANGS.find((l) => l.c === i18n.language) || LANGS[0];
  const filtered = LANGS.filter(
    (l) =>
      l.n.toLowerCase().includes(search.toLowerCase()) ||
      l.c.toLowerCase().includes(search.toLowerCase())
  );

  const pick = (code) => {
    const lang = code.split("-")[0]; // normalize "hi-IN" → "hi"
    setTTSLines([], "");
    i18n.changeLanguage(lang);
    localStorage.setItem("preferred_lang", lang);
    setLangOpen(false);
    setSearch("");
  };

  useEffect(() => {
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target))
        setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <nav
        style={{
          background: "#112218",
          borderBottom: "1px solid #1e4428",
          position: "sticky",
          top: 0,
          zIndex: 100,
          height: 60,
        }}
        className="flex items-center justify-between px-4"
      >
        {/* ── Logo ── */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div
            style={{
              width: 34,
              height: 34,
              background: "linear-gradient(135deg,#2d7a36,#4a9e54)",
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              boxShadow: "0 2px 8px rgba(74,158,84,0.3)",
            }}
          >
            🌱
          </div>
          <div className="hidden sm:block">
            <div
              style={{
                color: "white",
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              SmartKrishi
            </div>
            <div style={{ color: "#5a9e65", fontSize: 10, lineHeight: 1 }}>
              {t("logo_sub", "AI Farming Platform")}
            </div>
          </div>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <div className="hidden lg:flex items-center gap-0.5">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              style={({ isActive }) => ({
                color: isActive ? "#4a9e54" : "#7aac82",
                background: isActive ? "rgba(74,158,84,0.1)" : "transparent",
                borderRadius: 8,
                padding: "5px 11px",
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s",
                textDecoration: "none",
                whiteSpace: "nowrap",
              })}
            >
              <span style={{ fontSize: 13 }}>{link.icon}</span>
              {t(link.labelKey, link.label)}
            </NavLink>
          ))}
        </div>

        {/* ── Right controls ── */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Language switcher */}
          <div ref={langRef} style={{ position: "relative" }}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "white",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              <span style={{ fontSize: 14 }}>🌐</span>
              <span className="hidden sm:inline">{current.n}</span>
              <span className="sm:hidden">{current.script}</span>
              <span style={{ color: "#5a9e65", fontSize: 10 }}>▾</span>
            </button>

            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 6px)",
                    background: "#112218",
                    border: "1px solid #1e4428",
                    borderRadius: 14,
                    width: 240,
                    zIndex: 999,
                    boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                    overflow: "hidden",
                  }}
                >
                  {/* Search */}
                  <div
                    style={{
                      padding: "10px 12px",
                      borderBottom: "1px solid #1e4428",
                    }}
                  >
                    <input
                      autoFocus
                      placeholder={t("lang_search", "Search language...")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 7,
                        padding: "5px 10px",
                        color: "white",
                        fontSize: 12,
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  {/* Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      padding: 8,
                      gap: 2,
                      maxHeight: 240,
                      overflowY: "auto",
                    }}
                  >
                    {filtered.map((l) => (
                      <button
                        key={l.c}
                        onClick={() => pick(l.c)}
                        style={{
                          padding: "7px 10px",
                          borderRadius: 7,
                          border: "none",
                          background:
                            i18n.language === l.c
                              ? "rgba(74,158,84,0.15)"
                              : "transparent",
                          color: i18n.language === l.c ? "#4a9e54" : "#9ec9a3",
                          cursor: "pointer",
                          textAlign: "left",
                          fontSize: 13,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          transition: "background 0.1s",
                        }}
                        onMouseOver={(e) => {
                          if (i18n.language !== l.c)
                            e.currentTarget.style.background =
                              "rgba(255,255,255,0.04)";
                        }}
                        onMouseOut={(e) => {
                          if (i18n.language !== l.c)
                            e.currentTarget.style.background = "transparent";
                        }}
                      >
                        <span>{l.n}</span>
                        {i18n.language === l.c && (
                          <span style={{ color: "#4a9e54", fontSize: 11 }}>
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hamburger — tablet / mobile */}
          <button
            className="lg:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: 34,
              height: 34,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {[
              menuOpen ? "rotate(45deg) translateY(4px)" : "none",
              null,
              menuOpen ? "rotate(-45deg) translateY(-4px)" : "none",
            ].map((transform, i) => (
              <span
                key={i}
                style={{
                  width: 16,
                  height: 1.5,
                  display: "block",
                  background:
                    i === 1
                      ? menuOpen
                        ? "transparent"
                        : "#7aac82"
                      : menuOpen
                        ? "#4a9e54"
                        : "#7aac82",
                  transition: "all 0.2s",
                  transform: transform || "none",
                }}
              />
            ))}
          </button>
        </div>
      </nav>

      {/* ── Mobile / Tablet slide-down menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{
              background: "#0e1e12",
              borderBottom: "1px solid #1e4428",
              overflow: "hidden",
              position: "sticky",
              top: 60,
              zIndex: 99,
            }}
          >
            <div style={{ padding: "8px 12px 12px" }}>
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  onClick={() => setMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 10,
                    color: isActive ? "#4a9e54" : "#7aac82",
                    background: isActive
                      ? "rgba(74,158,84,0.1)"
                      : "transparent",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 14,
                    textDecoration: "none",
                    marginBottom: 2,
                  })}
                >
                  <span
                    style={{ fontSize: 16, width: 22, textAlign: "center" }}
                  >
                    {link.icon}
                  </span>
                  {t(link.labelKey, link.label)}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
