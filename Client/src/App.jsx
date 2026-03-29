import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Suspense, lazy, useState } from "react";
import Navbar from "./Components/Nav";
import { TTSProvider } from "./Components/Ttscontext";
import TTSFab from "./Components/Ttsfab";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CropProfitPredictor = lazy(() => import("./pages/Cropprofitpredictor"));
const SoilScanner = lazy(() => import("./pages/Soilscanner"));
const PrePestDetection = lazy(() => import("./pages/Prepestdetection"));
const PestDetection = lazy(() => import("./pages/Pestdetection"));
const Weather = lazy(() => import("./pages/Weather"));
const KisanMitraChat = lazy(() => import("./pages/ChaBot"));

// ─── Page loader ──────────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen bg-[#0d1f0f] flex items-center justify-center">
    <div className="flex items-center gap-3 text-[#7ec98a]">
      <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
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
      Loading...
    </div>
  </div>
);

// ─── Bottom nav ───────────────────────────────────────────────────────────────
const BottomNav = () => {
  const navItems = [
    { to: "/", icon: "🏠", label: "Home", exact: true },
    { to: "/crop-profit", icon: "📊", label: "Profit" },
    { to: "/soil-scanner", icon: "🔬", label: "Soil" },
    { to: "/pre-pest", icon: "🛡️", label: "Pre-Pest" },
    { to: "/pest-detect", icon: "🔍", label: "Detect" },
    { to: "/chat", icon: "🌾", label: "Chat" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1a3a1f] border-t border-[#2d5c34] z-50 sm:hidden">
      <div className="flex">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 text-[9px] transition-colors ${
                isActive ? "text-emerald-400 bg-[#223d28]" : "text-[#7ec98a]"
              }`
            }
          >
            <span className="text-lg leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

// ─── Kisan Mitra Chat FAB ─────────────────────────────────────────────────────
// Floats above the TTS button (bottom-28 so it sits above TTSFab at bottom-7)
const ChatFAB = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  // Hide when already on the chat page
  if (location.pathname === "/chat") return null;

  return (
    <div className="fixed bottom-28 right-7 z-9998 flex items-center sm:bottom-24">
      {/* Tooltip */}
      <div
        className={`
          relative mr-3 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
          bg-[#1a3a1a] text-[#fdf6e3] shadow-lg
          transition-all duration-200
          ${hovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"}
        `}
      >
        किसान मित्र — Ask anything
        <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-[#1a3a1a]" />
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate("/chat")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Open Kisan Mitra chatbot"
        className={`
          relative w-14 h-14 rounded-2xl
          flex items-center justify-center
          bg-linear-to-br from-emerald-700 to-emerald-900
          shadow-[0_4px_20px_rgba(45,90,39,0.55)]
          transition-all duration-200 cursor-pointer border-0
          ${hovered ? "shadow-[0_8px_28px_rgba(45,90,39,0.7)] -translate-y-1 scale-105" : ""}
          active:scale-95
        `}
      >
        {/* Pulse ring */}
        <span className="absolute -inset-1 rounded-2xl border-2 border-emerald-400/40 animate-ping" />

        {/* Chat bubble SVG icon */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`w-7 h-7 transition-transform duration-200 ${hovered ? "scale-110" : ""}`}
        >
          {/* Main chat bubble */}
          <rect
            x="2"
            y="2"
            width="22"
            height="16"
            rx="5"
            fill="white"
            fillOpacity="0.95"
          />
          {/* Bubble tail */}
          <path d="M6 18 L4 24 L13 19.5" fill="white" fillOpacity="0.95" />
          {/* Dot 1 */}
          <circle cx="8" cy="10" r="2" fill="#16a34a" />
          {/* Dot 2 */}
          <circle cx="13" cy="10" r="2" fill="#16a34a" />
          {/* Dot 3 */}
          <circle cx="18" cy="10" r="2" fill="#16a34a" />
          {/* Small leaf badge — top right */}
          <circle cx="26" cy="6" r="5" fill="#4ade80" />
          <text x="26" y="9.5" textAnchor="middle" fontSize="7" fill="#14532d">
            🌿
          </text>
        </svg>

        {/* Unread dot */}
        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-emerald-900" />
      </button>
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <TTSProvider>
        <Routes>
          {/* ── Chat route — full-screen, no extra padding ── */}
          <Route
            path="/chat"
            element={
              <div className="h-screen flex flex-col overflow-hidden">
                <Navbar />
                <div className="flex-1 overflow-hidden">
                  <Suspense fallback={<PageLoader />}>
                    <KisanMitraChat />
                  </Suspense>
                </div>
                <BottomNav />
              </div>
            }
          />

          {/* ── All other routes — standard layout ── */}
          <Route
            path="*"
            element={
              <div className="pb-16 sm:pb-0">
                <Navbar />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route
                      path="/crop-profit"
                      element={<CropProfitPredictor />}
                    />
                    <Route path="/soil-scanner" element={<SoilScanner />} />
                    <Route path="/pre-pest" element={<PrePestDetection />} />
                    <Route path="/pest-detect" element={<PestDetection />} />
                    <Route path="/weather" element={<Weather />} />
                  </Routes>
                </Suspense>
                <BottomNav />
              </div>
            }
          />
        </Routes>
        {/* Global floating buttons — render outside Routes so they persist across navigation */}
        <TTSFab /> {/* bottom-7  right-7  — teal TTS button */}
        <ChatFAB /> {/* bottom-28 right-7  — green wheat chat button */}
      </TTSProvider>
    </BrowserRouter>
  );
}
