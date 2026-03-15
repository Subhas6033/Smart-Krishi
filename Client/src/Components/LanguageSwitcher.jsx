import { useTranslation } from "react-i18next";
import { useState } from "react";

const LANGUAGES = [
  { code: "en", native: "English", name: "English" },
  { code: "hi", native: "हिन्दी", name: "Hindi" },
  { code: "ta", native: "தமிழ்", name: "Tamil" },
  { code: "te", native: "తెలుగు", name: "Telugu" },
  { code: "kn", native: "ಕನ್ನಡ", name: "Kannada" },
  { code: "ml", native: "മലയാളം", name: "Malayalam" },
  { code: "bn", native: "বাংলা", name: "Bengali" },
  { code: "gu", native: "ગુજરાતી", name: "Gujarati" },
  { code: "pa", native: "ਪੰਜਾਬੀ", name: "Punjabi" },
  { code: "mr", native: "मराठी", name: "Marathi" },
  { code: "ur", native: "اردو", name: "Urdu" },
  { code: "or", native: "ଓଡ଼ିଆ", name: "Odia" },
  { code: "as", native: "অসমীয়া", name: "Assamese" },
  { code: "sa", native: "संस्कृतम्", name: "Sanskrit" },
  { code: "mai", native: "मैथिली", name: "Maithili" },
  { code: "kok", native: "कोंकणी", name: "Konkani" },
  { code: "doi", native: "डोगरी", name: "Dogri" },
  { code: "sd", native: "سنڌي", name: "Sindhi" },
  { code: "mni", native: "মৈতৈলোন্", name: "Manipuri" },
  { code: "sat", native: "ᱥᱟᱱᱛᱟᱲᱤ", name: "Santali" },
  { code: "ks", native: "کٲشُر", name: "Kashmiri" },
  { code: "ne", native: "नेपाली", name: "Nepali" },
  { code: "bo", native: "बड़ो", name: "Bodo" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current =
    LANGUAGES.find((l) => l.code === i18n.language) || LANGUAGES[0];

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem("preferred_lang", code);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          borderRadius: "12px",
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,140,0,0.4)",
          color: "white",
          cursor: "pointer",
          fontSize: "14px",
        }}
      >
        <span>{current.native}</span>
        <span style={{ color: "#aaa", fontSize: "12px" }}>
          ({current.name})
        </span>
        <span>{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            right: 0,
            width: "260px",
            maxHeight: "340px",
            overflowY: "auto",
            background: "#1a1a2e",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "16px",
            padding: "8px",
            zIndex: 1000,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {/* Search */}
          <input
            type="text"
            placeholder="Search language..."
            onChange={(e) => {
              const val = e.target.value.toLowerCase();
              document.querySelectorAll(".lang-option").forEach((el) => {
                el.style.display =
                  el.dataset.name.includes(val) ||
                  el.dataset.native.includes(val)
                    ? "flex"
                    : "none";
              });
            }}
            style={{
              width: "100%",
              padding: "8px 12px",
              marginBottom: "6px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.05)",
              color: "white",
              fontSize: "13px",
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {/* Language Options */}
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className="lang-option"
              data-name={lang.name.toLowerCase()}
              data-native={lang.native}
              onClick={() => changeLanguage(lang.code)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "none",
                background:
                  i18n.language === lang.code
                    ? "rgba(255,140,0,0.15)"
                    : "transparent",
                color: "white",
                cursor: "pointer",
                fontSize: "14px",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: "15px" }}>{lang.native}</span>
              <span style={{ color: "#666", fontSize: "12px" }}>
                {lang.name}
              </span>
              {i18n.language === lang.code && (
                <span style={{ color: "#ff8c00", marginLeft: "4px" }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
