/**
 * ChaBot.jsx  (your file is pages/ChaBot.jsx)
 *
 * FIXES:
 *  - Removed the internal <header> — App.jsx already renders <Navbar />.
 *    The duplicate header was pushing content down and overlapping, which
 *    also caused kisan-root to overflow and suppress the socket setup.
 *  - kisan-root now uses height:100% instead of min-height:100vh so it
 *    fits inside the flex container App.jsx provides.
 *  - dismissError replaces the undefined chat.clearError?.() call.
 *  - Sidebar toggle button no longer reads window.innerWidth on render
 *    (not SSR-safe and caused hydration mismatches).
 */

import { useState, useRef, useEffect } from "react";
import useKisanChat from "../Hooks/useChatBotHook";

const LANGUAGES = [
  { key: "hindi", label: "हिन्दी", flag: "🌾" },
  { key: "bengali", label: "বাংলা", flag: "🌿" },
  { key: "marathi", label: "मराठी", flag: "🌻" },
  { key: "tamil", label: "தமிழ்", flag: "🥥" },
  { key: "telugu", label: "తెలుగు", flag: "🌶️" },
  { key: "kannada", label: "ಕನ್ನಡ", flag: "🌴" },
  { key: "gujarati", label: "ગુજરાતી", flag: "🌱" },
  { key: "punjabi", label: "ਪੰਜਾਬੀ", flag: "🌾" },
  { key: "english", label: "English", flag: "🇮🇳" },
];

const QUICK_QUESTIONS = [
  "मेरी गेहूं की फसल में पीलापन आ रहा है, क्या करूं?",
  "खरीफ फसल के लिए सबसे अच्छा बीज कौन सा है?",
  "PM-KISAN योजना के लिए कैसे आवेदन करें?",
  "मिट्टी की जांच कहाँ करवाएं?",
];

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=Literata:ital,opsz,wght@0,7..72,300;0,7..72,400;0,7..72,600;1,7..72,300&family=JetBrains+Mono:wght@400&display=swap');

  :root {
    --soil:        #3b1f0a;
    --bark:        #6b3a1f;
    --clay:        #a0522d;
    --harvest:     #d4881a;
    --saffron:     #f5a623;
    --leaf:        #2d5a27;
    --sprout:      #4a7c40;
    --moss:        #6fa860;
    --cream:       #fdf6e3;
    --parchment:   #f0e6c8;
    --warm-white:  #faf7f0;
    --mist:        #e8dfc8;
    --shadow:      rgba(59,31,10,0.15);
    --deep-shadow: rgba(59,31,10,0.3);
  }

  /* ── Root: fills parent flex container, no own scrollbar ── */
  .kisan-root {
    font-family: 'Literata', Georgia, serif;
    background: var(--cream);
    height: 100%;           /* ← was min-height:100vh, which broke App layout */
    display: flex;
    flex-direction: column;
    color: var(--soil);
    position: relative;
    overflow: hidden;
  }

  /* Grain overlay */
  .kisan-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
    opacity: 0.5;
  }

  /* ── Toolbar (language + tts + sidebar toggle) — replaces old full header ── */
  .kisan-toolbar {
    background: linear-gradient(135deg, var(--soil) 0%, var(--leaf) 60%, var(--sprout) 100%);
    padding: 8px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 12px var(--deep-shadow);
    position: relative;
    z-index: 10;
    flex-shrink: 0;
    gap: 10px;
  }

  .kisan-brand {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .kisan-brand-icon {
    width: 34px;
    height: 34px;
    background: var(--saffron);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    box-shadow: 0 0 0 2px rgba(245,166,35,0.35);
    flex-shrink: 0;
  }

  .kisan-brand-text h2 {
    font-family: 'Tiro Devanagari Hindi', serif;
    font-size: 16px;
    color: var(--cream);
    line-height: 1.1;
  }

  .kisan-brand-text p {
    font-size: 10px;
    color: rgba(253,246,227,0.6);
    font-style: italic;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .lang-select {
    appearance: none;
    background: rgba(253,246,227,0.12);
    border: 1px solid rgba(253,246,227,0.25);
    border-radius: 8px;
    color: var(--cream);
    font-family: 'Literata', serif;
    font-size: 12px;
    padding: 5px 24px 5px 8px;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23fdf6e3'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 6px center;
  }
  .lang-select:focus { outline: none; background-color: rgba(253,246,227,0.2); }
  .lang-select option { background: var(--leaf); color: var(--cream); }

  .icon-btn {
    width: 32px; height: 32px;
    border-radius: 7px;
    border: 1px solid rgba(253,246,227,0.25);
    background: rgba(253,246,227,0.1);
    color: var(--cream);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .icon-btn:hover  { background: rgba(253,246,227,0.22); }
  .icon-btn.active { background: var(--saffron); border-color: var(--saffron); color: var(--soil); }

  /* ── Layout ── */
  .kisan-layout {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
    z-index: 1;
  }

  /* ── Sidebar ── */
  .kisan-sidebar {
    width: 260px;
    background: var(--parchment);
    border-right: 1px solid var(--mist);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    flex-shrink: 0;
    transition: width 0.2s;
  }

  .sidebar-section { padding: 14px 14px 10px; }

  .sidebar-label {
    font-size: 10px; font-weight: 600;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--clay); margin-bottom: 8px;
  }

  .quick-q-btn {
    display: block; width: 100%; text-align: left;
    background: var(--warm-white);
    border: 1px solid var(--mist);
    border-radius: 9px;
    padding: 9px 11px; margin-bottom: 7px;
    font-family: 'Tiro Devanagari Hindi', serif;
    font-size: 12px; color: var(--bark);
    cursor: pointer; line-height: 1.5;
    transition: all 0.18s;
  }
  .quick-q-btn:hover:not(:disabled) {
    background: var(--cream); border-color: var(--harvest);
    color: var(--soil); transform: translateX(2px);
    box-shadow: 0 2px 8px var(--shadow);
  }
  .quick-q-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  .sidebar-divider { height: 1px; background: var(--mist); margin: 4px 14px; }

  .rate-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .rate-row label { font-size: 12px; color: var(--bark); white-space: nowrap; }
  .rate-slider { flex: 1; accent-color: var(--harvest); }
  .rate-val { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--clay); width: 28px; text-align: right; }

  .status-badge {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 11px;
    background: var(--warm-white); border-radius: 7px;
    font-size: 11px; color: var(--bark);
    margin: 0 14px 10px;
  }
  .status-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: var(--moss); flex-shrink: 0;
  }
  .status-dot.recording { background: #e53e3e; animation: pulse-dot 1s ease-in-out infinite; }
  .status-dot.streaming { background: var(--saffron); animation: pulse-dot 1s ease-in-out infinite; }
  .status-dot.playing   { background: var(--sprout);  animation: pulse-dot 1s ease-in-out infinite; }
  @keyframes pulse-dot { 0%,100%{opacity:1}50%{opacity:0.3} }

  .clear-btn {
    display: flex; align-items: center; gap: 6px;
    margin: 0 14px 14px;
    padding: 7px 11px;
    background: none; border: 1px solid var(--mist);
    border-radius: 7px; color: var(--clay);
    font-family: 'Literata', serif; font-size: 12px;
    cursor: pointer; transition: all 0.18s;
  }
  .clear-btn:hover { border-color: var(--clay); background: var(--mist); }

  /* ── Chat panel ── */
  .kisan-chat {
    flex: 1; display: flex; flex-direction: column; overflow: hidden;
    background: var(--warm-white);
    background-image:
      radial-gradient(ellipse at 80% 10%, rgba(212,136,26,0.06) 0%, transparent 55%),
      radial-gradient(ellipse at 10% 90%, rgba(45,90,39,0.06) 0%, transparent 55%);
  }

  .messages-container {
    flex: 1; overflow-y: auto; padding: 20px 18px;
    scroll-behavior: smooth;
  }
  .messages-container::-webkit-scrollbar { width: 4px; }
  .messages-container::-webkit-scrollbar-thumb { background: var(--mist); border-radius: 10px; }

  /* Welcome */
  .welcome-card { text-align: center; padding: 32px 16px; animation: fadeUp 0.5s ease; }
  .welcome-icon { font-size: 52px; margin-bottom: 14px; display: block; filter: drop-shadow(0 4px 10px rgba(212,136,26,0.3)); }
  .welcome-card h2 { font-family: 'Tiro Devanagari Hindi', serif; font-size: 24px; color: var(--leaf); margin-bottom: 8px; }
  .welcome-card p  { color: var(--clay); font-size: 13px; line-height: 1.7; max-width: 360px; margin: 0 auto; font-style: italic; }
  .welcome-topics  { display: flex; flex-wrap: wrap; gap: 7px; justify-content: center; margin-top: 20px; }
  .topic-chip { background: var(--parchment); border: 1px solid var(--mist); border-radius: 20px; padding: 4px 11px; font-size: 12px; color: var(--bark); }

  /* Message bubbles */
  .msg-row { display: flex; gap: 9px; margin-bottom: 18px; animation: fadeUp 0.3s ease; }
  .msg-row.user { flex-direction: row-reverse; }

  .msg-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0; margin-top: 2px;
  }
  .msg-avatar.bot  { background: linear-gradient(135deg, var(--soil), var(--sprout)); box-shadow: 0 2px 8px var(--shadow); }
  .msg-avatar.user { background: var(--saffron); box-shadow: 0 2px 8px rgba(212,136,26,0.3); }

  .msg-body { max-width: 72%; display: flex; flex-direction: column; gap: 3px; }
  .msg-row.user .msg-body { align-items: flex-end; }

  .msg-role { font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--clay); font-weight: 600; }

  .msg-bubble {
    padding: 11px 14px; border-radius: 14px;
    line-height: 1.7; font-size: 14px; word-break: break-word;
  }
  .msg-bubble.bot  { background: var(--cream); border: 1px solid var(--mist); border-radius: 3px 14px 14px 14px; box-shadow: 0 2px 8px var(--shadow); color: var(--soil); }
  .msg-bubble.user { background: linear-gradient(135deg, var(--bark), var(--leaf)); color: var(--cream); border-radius: 14px 3px 14px 14px; box-shadow: 0 2px 8px rgba(45,90,39,0.3); font-family: 'Tiro Devanagari Hindi', serif; }
  .msg-bubble.user.voice-msg::before { content: '🎙️ '; font-size: 11px; }

  .streaming-cursor::after { content: '▋'; color: var(--harvest); animation: blink 0.8s step-start infinite; }
  @keyframes blink { 50%{ opacity:0; } }

  .msg-play-btn { align-self: flex-start; margin-top: 3px; background: none; border: none; color: var(--clay); cursor: pointer; font-size: 11px; display: flex; align-items: center; gap: 4px; padding: 2px 0; opacity: 0; transition: opacity 0.2s; }
  .msg-row:hover .msg-play-btn { opacity: 1; }
  .msg-play-btn:hover { color: var(--leaf); }

  /* Error */
  .error-banner { margin: 0 18px 10px; padding: 9px 13px; background: #fff5f5; border: 1px solid #fed7d7; border-radius: 9px; color: #c53030; font-size: 13px; display: flex; align-items: center; gap: 8px; animation: fadeUp 0.3s ease; }
  .error-dismiss { margin-left: auto; cursor: pointer; font-size: 15px; background: none; border: none; color: #c53030; }

  /* Input area */
  .kisan-input-area { padding: 10px 18px 14px; background: var(--parchment); border-top: 1px solid var(--mist); display: flex; flex-direction: column; gap: 9px; flex-shrink: 0; }

  .input-row { display: flex; gap: 9px; align-items: flex-end; }

  .text-input-wrap {
    flex: 1; background: var(--cream); border: 1.5px solid var(--mist);
    border-radius: 13px; display: flex; align-items: flex-end;
    padding: 7px 11px; transition: border-color 0.2s, box-shadow 0.2s;
  }
  .text-input-wrap:focus-within { border-color: var(--harvest); box-shadow: 0 0 0 3px rgba(212,136,26,0.15); }

  .text-input {
    flex: 1; border: none; outline: none; background: transparent;
    font-family: 'Tiro Devanagari Hindi', serif; font-size: 14px;
    color: var(--soil); resize: none; max-height: 110px; line-height: 1.5;
  }
  .text-input::placeholder { color: rgba(232,223,200,0.9); font-style: italic; }

  .record-btn {
    width: 44px; height: 44px; border-radius: 13px;
    border: 1.5px solid var(--mist); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 19px; flex-shrink: 0; transition: all 0.2s;
    background: var(--parchment); color: var(--bark);
  }
  .record-btn:hover:not(:disabled) { background: var(--mist); }
  .record-btn:disabled { opacity: 0.35; cursor: not-allowed; }
  .record-btn.recording { background: #e53e3e; border-color: #e53e3e; color: white; animation: pulse-scale 1s ease-in-out infinite; box-shadow: 0 0 0 4px rgba(229,62,62,0.2); }
  @keyframes pulse-scale { 0%,100%{transform:scale(1)}50%{transform:scale(1.05)} }

  .send-btn {
    width: 44px; height: 44px; border-radius: 13px; border: none;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0; transition: all 0.2s;
    background: linear-gradient(135deg, var(--bark), var(--leaf));
    color: var(--cream); box-shadow: 0 3px 10px rgba(45,90,39,0.35);
  }
  .send-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(45,90,39,0.45); }
  .send-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }

  .typing-indicator { display: flex; gap: 5px; align-items: center; padding: 10px 13px; background: var(--cream); border: 1px solid var(--mist); border-radius: 13px; width: fit-content; box-shadow: 0 2px 8px var(--shadow); }
  .typing-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--harvest); animation: bounce 1.2s ease-in-out infinite; }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px)} }

  .transcript-preview { display: flex; align-items: center; gap: 8px; padding: 5px 11px; background: rgba(212,136,26,0.1); border-radius: 7px; font-size: 12px; color: var(--bark); font-style: italic; font-family: 'Tiro Devanagari Hindi', serif; }
  .transcript-preview span { flex: 1; }

  .hint-text { text-align: center; font-size: 10px; color: var(--clay); font-style: italic; }

  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  @media (max-width: 640px) {
    .kisan-sidebar { display: none !important; }
    .msg-body { max-width: 86%; }
  }
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function KisanMitraChat() {
  const chat = useKisanChat();
  const [inputText, setInputText] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, chat.isStreaming]);

  const handleInput = (e) => {
    setInputText(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  };

  const handleSend = () => {
    if (!inputText.trim() || chat.isStreaming) return;
    chat.sendMessage(inputText.trim());
    setInputText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getStatusText = () =>
    chat.isRecording
      ? "Recording…"
      : chat.isStreaming
        ? "Thinking…"
        : chat.isTTSPlaying
          ? "Playing…"
          : "Online";
  const getStatusClass = () =>
    chat.isRecording
      ? "recording"
      : chat.isStreaming
        ? "streaming"
        : chat.isTTSPlaying
          ? "playing"
          : "";

  const currentLang =
    LANGUAGES.find((l) => l.key === chat.language) || LANGUAGES[0];

  return (
    <>
      <style>{styles}</style>
      <div className="kisan-root">
        {/* ── Compact toolbar (no duplicate Navbar) ── */}
        <div className="kisan-toolbar">
          <div className="kisan-brand">
            <div className="kisan-brand-icon">🌾</div>
            <div className="kisan-brand-text">
              <h2>किसान मित्र</h2>
              <p>आपका कृषि सहायक</p>
            </div>
          </div>

          <div className="toolbar-actions">
            <select
              className="lang-select"
              value={chat.language}
              onChange={(e) => chat.changeLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.key} value={l.key}>
                  {l.flag} {l.label}
                </option>
              ))}
            </select>

            <button
              className={`icon-btn ${chat.ttsEnabled ? "active" : ""}`}
              onClick={chat.toggleTTSMode}
              title={
                chat.ttsEnabled ? "Disable voice reply" : "Enable voice reply"
              }
            >
              {chat.ttsEnabled ? "🔊" : "🔇"}
            </button>

            <button
              className="icon-btn"
              onClick={() => setShowSidebar((s) => !s)}
              title="Toggle sidebar"
            >
              ☰
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="kisan-layout">
          {/* Sidebar */}
          {showSidebar && (
            <aside className="kisan-sidebar">
              <div style={{ height: 12 }} />

              <div className="status-badge">
                <div className={`status-dot ${getStatusClass()}`} />
                <span>{getStatusText()}</span>
              </div>

              <div className="sidebar-section">
                <div className="sidebar-label">Quick Questions</div>
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    className="quick-q-btn"
                    onClick={() => chat.sendMessage(q)}
                    disabled={chat.isStreaming}
                  >
                    {q}
                  </button>
                ))}
              </div>

              <div className="sidebar-divider" />

              <div className="sidebar-section">
                <div className="sidebar-label">Voice Settings</div>
                <div className="rate-row">
                  <label>Speed</label>
                  <input
                    type="range"
                    className="rate-slider"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={chat.speakingRate}
                    onChange={(e) =>
                      chat.changeRate(parseFloat(e.target.value))
                    }
                  />
                  <span className="rate-val">
                    {chat.speakingRate.toFixed(1)}×
                  </span>
                </div>

                <div className="sidebar-label" style={{ marginBottom: 6 }}>
                  Voice Type
                </div>
                <select
                  className="lang-select"
                  style={{
                    background: "var(--warm-white)",
                    color: "var(--soil)",
                    border: "1px solid var(--mist)",
                    width: "100%",
                  }}
                  value={chat.voiceType}
                  onChange={(e) => chat.changeVoiceType(e.target.value)}
                >
                  <option value="female-warm">👩 Female — Warm</option>
                  <option value="female-neutral">👩 Female — Neutral</option>
                  <option value="female-expressive">
                    👩 Female — Expressive
                  </option>
                  <option value="male-warm">👨 Male — Warm</option>
                  <option value="male-neutral">👨 Male — Neutral</option>
                  <option value="male-expressive">👨 Male — Expressive</option>
                </select>
              </div>

              <div className="sidebar-divider" />

              <button className="clear-btn" onClick={chat.clearChat}>
                🗑️ Clear conversation
              </button>

              {chat.sessionId && (
                <div
                  style={{
                    padding: "0 14px 14px",
                    fontSize: 9,
                    color: "var(--clay)",
                    fontFamily: "'JetBrains Mono', monospace",
                    wordBreak: "break-all",
                  }}
                >
                  Session: {chat.sessionId.slice(0, 22)}…
                </div>
              )}
            </aside>
          )}

          {/* Chat */}
          <div className="kisan-chat">
            {chat.error && (
              <div className="error-banner">
                ⚠️ {chat.error}
                <button className="error-dismiss" onClick={chat.dismissError}>
                  ✕
                </button>
              </div>
            )}

            <div className="messages-container">
              {chat.messages.length === 0 ? (
                <WelcomeCard lang={currentLang} />
              ) : (
                chat.messages.map((msg) => (
                  <MessageRow
                    key={msg.id}
                    msg={msg}
                    onPlay={chat.playMessageAudio}
                    isTTSPlaying={chat.isTTSPlaying}
                  />
                ))
              )}

              {/* Typing indicator — only when streaming and no text yet */}
              {chat.isStreaming && chat.messages.at(-1)?.text === "" && (
                <div className="msg-row" style={{ marginBottom: 18 }}>
                  <div className="msg-avatar bot">🌾</div>
                  <div className="msg-body">
                    <div className="msg-role">KisanMitra</div>
                    <div className="typing-indicator">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="kisan-input-area">
              {chat.transcript && chat.isStreaming && (
                <div className="transcript-preview">
                  🎙️ <span>{chat.transcript}</span>
                </div>
              )}

              <div className="input-row">
                <button
                  className={`record-btn ${chat.isRecording ? "recording" : ""}`}
                  onMouseDown={chat.startRecording}
                  onMouseUp={chat.stopRecording}
                  onTouchStart={chat.startRecording}
                  onTouchEnd={chat.stopRecording}
                  title="Hold to record"
                  disabled={chat.isStreaming}
                >
                  {chat.isRecording ? "⏺" : "🎙️"}
                </button>

                <div className="text-input-wrap">
                  <textarea
                    ref={textareaRef}
                    className="text-input"
                    rows={1}
                    placeholder={`अपना सवाल यहाँ लिखें… (${currentLang.label})`}
                    value={inputText}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    disabled={chat.isStreaming || chat.isRecording}
                  />
                </div>

                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={
                    !inputText.trim() || chat.isStreaming || chat.isRecording
                  }
                  title="Send"
                >
                  ➤
                </button>
              </div>

              <div className="hint-text">
                Hold 🎙️ to speak · Enter to send · Shift+Enter for new line
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function WelcomeCard({ lang }) {
  return (
    <div className="welcome-card">
      <span className="welcome-icon">🌾</span>
      <h2>नमस्कार! मैं हूँ किसान मित्र</h2>
      <p>
        Your AI companion for farming — crops, soil, pests, govt schemes & mandi
        rates. Ask in {lang.label}.
      </p>
      <div className="welcome-topics">
        {[
          "🌱 Crops",
          "🐛 Pests",
          "💧 Irrigation",
          "🏛️ Schemes",
          "📊 Mandi",
          "🐄 Livestock",
        ].map((t) => (
          <span key={t} className="topic-chip">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function MessageRow({ msg, onPlay, isTTSPlaying }) {
  const isBot = msg.role === "assistant";
  return (
    <div className={`msg-row ${msg.role}`}>
      <div className={`msg-avatar ${isBot ? "bot" : "user"}`}>
        {isBot ? "🌾" : "👨‍🌾"}
      </div>
      <div className="msg-body">
        <div className="msg-role">{isBot ? "KisanMitra" : "You"}</div>
        <div
          className={`msg-bubble ${isBot ? "bot" : "user"} ${msg.isVoice ? "voice-msg" : ""} ${msg.isStreaming && msg.text ? "streaming-cursor" : ""}`}
        >
          {msg.text || ""}
        </div>
        {isBot && msg.audio && (
          <button
            className="msg-play-btn"
            onClick={() => onPlay(msg.audio, msg.audioMime)}
            disabled={isTTSPlaying}
          >
            {isTTSPlaying ? "⏸ Playing…" : "▶ Play audio"}
          </button>
        )}
      </div>
    </div>
  );
}
