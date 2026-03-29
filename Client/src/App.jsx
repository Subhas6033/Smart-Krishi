import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { Suspense, lazy } from "react";
import Navbar from "./Components/Nav";
import { TTSProvider } from "./Components/Ttscontext";
import TTSFab from "./Components/Ttsfab";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CropProfitPredictor = lazy(() => import("./pages/Cropprofitpredictor"));
const SoilScanner = lazy(() => import("./pages/Soilscanner"));
const PrePestDetection = lazy(() => import("./pages/Prepestdetection"));
const PestDetection = lazy(() => import("./pages/Pestdetection"));

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

const BottomNav = () => {
  const navItems = [
    { to: "/", icon: "🏠", label: "Home", exact: true },
    { to: "/crop-profit", icon: "📊", label: "Profit" },
    { to: "/soil-scanner", icon: "🔬", label: "Soil" },
    { to: "/pre-pest", icon: "🛡️", label: "Pre-Pest" },
    { to: "/pest-detect", icon: "🔍", label: "Detect" },
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
              `flex-1 flex flex-col items-center py-2.5 gap-0.5 text-[10px] transition-colors ${
                isActive ? "text-emerald-400" : "text-[#7ec98a]"
              }`
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      {/* TTSProvider wraps everything so any page can register TTS lines */}
      <TTSProvider>
        <div className="pb-16 sm:pb-0">
          <Navbar />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/crop-profit" element={<CropProfitPredictor />} />
              <Route path="/soil-scanner" element={<SoilScanner />} />
              <Route path="/pre-pest" element={<PrePestDetection />} />
              <Route path="/pest-detect" element={<PestDetection />} />
            </Routes>
          </Suspense>
          <BottomNav />
        </div>

        {/* Floating TTS button — sits above BottomNav (z-index 200 > 50).
            Reads whatever the current page registered via setTTSLines().  */}
        <TTSFab />
      </TTSProvider>
    </BrowserRouter>
  );
}
