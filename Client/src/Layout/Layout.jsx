import React, { useState } from "react";
import { Navbar, Footer } from "../Components/index";
import { useNavigate, useLocation } from "react-router-dom";

const ChatFAB = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);

  if (location.pathname === "/chat") return null;

  return (
    <div className="fixed bottom-7 right-7 z999 flex items-center">
      {/* Tooltip — slides in from the right */}
      <div
        className={`
          relative mr-3 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
          bg-[#1a3a1a] text-[#fdf6e3] shadow-lg
          transition-all duration-200
          ${hovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"}
        `}
      >
        किसान मित्र — Ask anything
        {/* Arrow pointing right */}
        <span className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-l-[6px] border-l-[#1a3a1a]" />
      </div>

      {/* FAB Button */}
      <button
        onClick={() => navigate("/chat")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Open Kisan Mitra chatbot"
        className={`
          relative w-14 h-14 rounded-full
          flex items-center justify-center
          bg-linear-to-br from-[#1a3a1a] to-[#2d5a27]
          shadow-[0_4px_20px_rgba(45,90,39,0.5)]
          transition-all duration-200
          ${
            hovered
              ? "shadow-[0_8px_28px_rgba(45,90,39,0.65)] -translate-y-1 scale-105"
              : ""
          }
          active:scale-95
        `}
      >
        {/* Animated pulse ring */}
        <span className="absolute -inset-1 rounded-full border-2 border-green-500/40 animate-ping" />

        {/* Icon */}
        <span
          className={`text-2xl leading-none select-none transition-transform duration-200 ${hovered ? "-rotate-12" : "rotate-0"}`}
        >
          🌾
        </span>
      </button>
    </div>
  );
};

const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <ChatFAB />
    </>
  );
};

export default Layout;
