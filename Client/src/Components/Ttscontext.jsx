/**
 * TTSContext.jsx
 *
 * Global context that lets any page register the text it wants spoken.
 * The floating TTSFab reads from this context.
 *
 * Usage in any page:
 *   const { setTTSLines } = useTTSContext();
 *   useEffect(() => {
 *     setTTSLines([t("page_title"), t("page_body")], t("nav_label"));
 *     return () => setTTSLines([], "");
 *   }, [i18n.language]);
 */

import { createContext, useContext, useState, useCallback } from "react";

const TTSContext = createContext(null);

export function TTSProvider({ children }) {
  const [lines, setLines] = useState([]);
  const [pageLabel, setPageLabel] = useState("");

  // ── Defined here as a stable useCallback — NOT inside JSX ──
  // This is what was broken before: the function was declared inside
  // the return() which caused it to be undefined on first render.
  const setTTSLines = useCallback((newLines, label = "") => {
    setLines(Array.isArray(newLines) ? newLines : newLines ? [newLines] : []);
    setPageLabel(label || "");
  }, []);

  return (
    <TTSContext.Provider value={{ lines, setTTSLines, pageLabel }}>
      {children}
    </TTSContext.Provider>
  );
}

export function useTTSContext() {
  const ctx = useContext(TTSContext);
  if (!ctx) throw new Error("useTTSContext must be used inside <TTSProvider>");
  return ctx;
}
