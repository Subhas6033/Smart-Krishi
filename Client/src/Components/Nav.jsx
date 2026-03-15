// src/components/Navbar.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";

const LANGS = [
  { c: "en", n: "English" },
  { c: "hi", n: "हिन्दी" },
  { c: "ta", n: "தமிழ்" },
  { c: "te", n: "తెలుగు" },
  { c: "kn", n: "ಕನ್ನಡ" },
  { c: "ml", n: "മലയാളം" },
  { c: "bn", n: "বাংলা" },
  { c: "gu", n: "ગુજરાતી" },
  { c: "pa", n: "ਪੰਜਾਬੀ" },
  { c: "mr", n: "मराठी" },
  { c: "ur", n: "اردو" },
  { c: "or", n: "ଓଡ଼ିଆ" },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const current = LANGS.find((l) => l.c === i18n.language) || LANGS[0];
  const filtered = LANGS.filter((l) =>
    l.n.toLowerCase().includes(search.toLowerCase())
  );

  const pick = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("preferred_lang", code);
    setOpen(false);
    setSearch("");
  };

  return (
    <nav
      style={{
        background: "#1a3a1f",
        padding: "0 24px",
        height: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
        borderBottom: "1px solid #2d5c34",
      }}
    >
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            background: "#4a9e54",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          🌱
        </div>
        <div>
          <div style={{ color: "white", fontSize: 16, fontWeight: 500 }}>
            SmartKrishi
          </div>
          <div style={{ color: "#7ec98a", fontSize: 11 }}>{t("logo_sub")}</div>
        </div>
      </div>

      {/* Nav Links */}
      <div style={{ display: "flex", gap: 2 }}>
        {[
          "nav_dashboard",
          "nav_crops",
          "nav_weather",
          "nav_market",
          "nav_advisory",
        ].map((key) => (
          <button
            key={key}
            style={{
              color: "#b8d4bb",
              fontSize: 13,
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {/* Language Switcher */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "5px 12px",
            borderRadius: 8,
            border: "0.5px solid rgba(255,255,255,0.15)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          🌐 {current.n} ▾
        </button>

        {open && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "110%",
              background: "#1a3a1f",
              border: "0.5px solid #2d5c34",
              borderRadius: 12,
              width: 260,
              zIndex: 999,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderBottom: "0.5px solid #2d5c34",
              }}
            >
              <input
                autoFocus
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.06)",
                  border: "0.5px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  color: "white",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                padding: 8,
                gap: 2,
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {filtered.map((l) => (
                <button
                  key={l.c}
                  onClick={() => pick(l.c)}
                  style={{
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: "none",
                    background:
                      i18n.language === l.c
                        ? "rgba(74,158,84,0.2)"
                        : "transparent",
                    color: "white",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 13,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>{l.n}</span>
                  {i18n.language === l.c && (
                    <span style={{ color: "#4a9e54" }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
