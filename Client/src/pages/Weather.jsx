import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import TTSButton from "../components/TTSButton";

const WEATHER_ICONS = {
  Clear: { icon: "☀️", label: "Sunny" },
  Clouds: { icon: "⛅", label: "Cloudy" },
  Rain: { icon: "🌧️", label: "Rainy" },
  Drizzle: { icon: "🌦️", label: "Drizzle" },
  Thunderstorm: { icon: "⛈️", label: "Storm" },
  Snow: { icon: "❄️", label: "Snow" },
  Mist: { icon: "🌫️", label: "Misty" },
  Haze: { icon: "🌫️", label: "Hazy" },
  Fog: { icon: "🌁", label: "Foggy" },
};

const QUICK_CITIES = [
  "Delhi",
  "Mumbai",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Ahmedabad",
  "Pune",
  "Lucknow",
  "Jaipur",
  "Bhopal",
  "Chandigarh",
  "Patna",
  "Bhubaneswar",
  "Guwahati",
];

const UV_LEVELS = [
  { max: 2, label: "Low", color: "text-emerald-400", bg: "bg-emerald-900/30" },
  {
    max: 5,
    label: "Moderate",
    color: "text-yellow-400",
    bg: "bg-yellow-900/30",
  },
  { max: 7, label: "High", color: "text-amber-400", bg: "bg-amber-900/30" },
  { max: 10, label: "V.High", color: "text-red-400", bg: "bg-red-900/30" },
  {
    max: 99,
    label: "Extreme",
    color: "text-purple-400",
    bg: "bg-purple-900/30",
  },
];

function getUV(val) {
  return UV_LEVELS.find((l) => val <= l.max) || UV_LEVELS[UV_LEVELS.length - 1];
}

function WindDir({ deg }) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return <span>{dirs[Math.round(deg / 45) % 8]}</span>;
}

export default function Weather() {
  const { t } = useTranslation();
  const [city, setCity] = useState("");
  const [query, setQuery] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState("");
  const [advisory, setAdvisory] = useState(null);

  // Auto-load last city
  useEffect(() => {
    const last = localStorage.getItem("sk_weather_city");
    if (last) {
      setCity(last);
      fetchWeather(last);
    }
  }, []);

  const fetchWeather = async (cityName) => {
    if (!cityName?.trim()) return;
    setLoading(true);
    setError("");
    try {
      const [wRes, aRes] = await Promise.all([
        fetch(`/api/weather/current?city=${encodeURIComponent(cityName)}`),
        fetch(`/api/weather/advisory?city=${encodeURIComponent(cityName)}`),
      ]);
      if (!wRes.ok) {
        const d = await wRes.json();
        throw new Error(d.error || "City not found");
      }
      const [wData, aData] = await Promise.all([wRes.json(), aRes.json()]);
      setWeather(wData);
      setForecast(wData.forecast || []);
      setAdvisory(aData);
      localStorage.setItem("sk_weather_city", cityName);
    } catch (err) {
      setError(err.message);
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  const geoLocate = () => {
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `/api/weather/by-coords?lat=${coords.latitude}&lon=${coords.longitude}`
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.error);
          setCity(data.city);
          setWeather(data);
          setForecast(data.forecast || []);
          const aRes = await fetch(
            `/api/weather/advisory?city=${encodeURIComponent(data.city)}`
          );
          setAdvisory(await aRes.json());
          localStorage.setItem("sk_weather_city", data.city);
        } catch (err) {
          setError(err.message);
        } finally {
          setLocLoading(false);
        }
      },
      () => {
        setError("Location access denied.");
        setLocLoading(false);
      }
    );
  };

  const wicon = weather
    ? WEATHER_ICONS[weather.main] || { icon: "🌡️", label: weather.main }
    : null;

  const ttsText = weather
    ? `Current weather in ${weather.city}: ${weather.temp}°C, ${weather.description}. Humidity ${weather.humidity}%. Wind ${weather.windSpeed} km/h. ${advisory?.summary || ""}`
    : "";

  return (
    <div className="min-h-screen bg-[#0d1f0f] text-white">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-[#0d1e2e] to-[#0d1f0f] px-6 py-14">
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#4a7e9e_1px,transparent_1px)] [background-size:28px_28px]" />
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 bg-[#0e2236] text-sky-300 text-xs font-medium px-4 py-1.5 rounded-full mb-5 border border-sky-800/50">
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            {t("wx_badge", "Agro-Weather Intelligence")}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            {t("wx_title", "Farm")}{" "}
            <span className="text-sky-400">{t("wx_title2", "Weather")}</span>
          </h1>
          <p className="text-[#7ec98a] text-lg max-w-xl mx-auto">
            {t(
              "wx_subtitle",
              "Hyperlocal forecasts with crop-specific advisories"
            )}
          </p>
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20 -mt-4 space-y-5">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0e1e12] rounded-2xl p-4 border border-[#1e4428]/60"
        >
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setCity(query);
                  fetchWeather(query);
                }
              }}
              placeholder={t(
                "wx_search_ph",
                "Enter city, district or block..."
              )}
              className="flex-1 bg-[#0d1f0f] border border-[#1e4428] text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-[#3d5e40] focus:outline-none focus:border-sky-600"
            />
            <button
              onClick={() => {
                setCity(query);
                fetchWeather(query);
              }}
              disabled={loading}
              className="px-5 py-2.5 bg-sky-700 hover:bg-sky-600 disabled:opacity-40 text-white rounded-xl text-sm font-medium transition"
            >
              {loading ? "..." : t("wx_search", "Search")}
            </button>
            <button
              onClick={geoLocate}
              disabled={locLoading}
              title={t("wx_locate", "Use my location")}
              className="px-3 py-2.5 bg-[#122a16] border border-[#1e4428] text-[#7ec98a] rounded-xl text-sm hover:bg-[#1a3a1f] transition"
            >
              {locLoading ? "⏳" : "📍"}
            </button>
          </div>

          {/* Quick cities */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {QUICK_CITIES.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setQuery(c);
                  setCity(c);
                  fetchWeather(c);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-[#0d1f0f] border border-[#1e4428]/60 text-[#7ec98a] hover:border-sky-700/50 hover:text-sky-300 transition"
              >
                {c}
              </button>
            ))}
          </div>
        </motion.div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 rounded-xl px-5 py-3 text-sm">
            {error}
          </div>
        )}

        <AnimatePresence>
          {weather && (
            <motion.div
              key="weather-data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Current conditions hero card */}
              <div className="bg-gradient-to-br from-[#0e2236] to-[#0d1f0f] rounded-2xl p-6 border border-sky-900/40 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <TTSButton text={ttsText} />
                </div>
                <div className="flex items-start gap-5">
                  <div className="text-7xl leading-none">{wicon?.icon}</div>
                  <div>
                    <div className="text-sky-300 text-sm font-medium mb-1">
                      📍 {weather.city}
                      {weather.state ? `, ${weather.state}` : ""}
                    </div>
                    <div className="text-6xl font-bold text-white leading-none">
                      {Math.round(weather.temp)}°
                      <span className="text-3xl text-sky-400">C</span>
                    </div>
                    <div className="text-[#7ec98a] mt-1 capitalize">
                      {weather.description}
                    </div>
                    <div className="text-xs text-[#3d6b42] mt-1">
                      {t("wx_feels", "Feels like")}{" "}
                      {Math.round(weather.feelsLike)}°C
                    </div>
                  </div>
                </div>

                {/* Stat row */}
                <div className="grid grid-cols-4 gap-3 mt-6">
                  {[
                    {
                      icon: "💧",
                      label: t("wx_humidity", "Humidity"),
                      value: `${weather.humidity}%`,
                    },
                    {
                      icon: "💨",
                      label: t("wx_wind", "Wind"),
                      value: `${weather.windSpeed} km/h`,
                    },
                    {
                      icon: "👁️",
                      label: t("wx_visibility", "Visibility"),
                      value: `${weather.visibility} km`,
                    },
                    {
                      icon: "🌡️",
                      label: t("wx_pressure", "Pressure"),
                      value: `${weather.pressure} hPa`,
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-[#0d1f0f]/60 rounded-xl p-3 text-center"
                    >
                      <div className="text-lg">{s.icon}</div>
                      <div className="text-sm font-semibold text-white mt-1">
                        {s.value}
                      </div>
                      <div className="text-[10px] text-[#5a9e65]">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Wind dir + UV */}
                <div className="flex gap-3 mt-3">
                  <div className="flex-1 bg-[#0d1f0f]/60 rounded-xl p-3 flex items-center gap-3">
                    <div className="text-xl">🧭</div>
                    <div>
                      <div className="text-xs text-[#5a9e65]">
                        {t("wx_winddir", "Wind Direction")}
                      </div>
                      <div className="text-sm font-semibold text-white">
                        <WindDir deg={weather.windDeg} /> ({weather.windDeg}°)
                      </div>
                    </div>
                  </div>
                  {weather.uvi != null && (
                    <div
                      className={`flex-1 rounded-xl p-3 flex items-center gap-3 ${getUV(weather.uvi).bg}`}
                    >
                      <div className="text-xl">☀️</div>
                      <div>
                        <div className={`text-xs ${getUV(weather.uvi).color}`}>
                          {t("wx_uv", "UV Index")}
                        </div>
                        <div
                          className={`text-sm font-semibold ${getUV(weather.uvi).color}`}
                        >
                          {weather.uvi} — {getUV(weather.uvi).label}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 7-day forecast */}
              {forecast.length > 0 && (
                <div className="bg-[#0e1e12] rounded-2xl p-5 border border-[#1e4428]/60">
                  <h3 className="text-sm font-semibold text-sky-400 mb-4">
                    📅 {t("wx_forecast", "7-Day Forecast")}
                  </h3>
                  <div className="grid grid-cols-7 gap-2">
                    {forecast.map((day, i) => {
                      const di = WEATHER_ICONS[day.main] || { icon: "🌡️" };
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex flex-col items-center gap-1.5 bg-[#0d1f0f] rounded-xl p-2"
                        >
                          <div className="text-[10px] text-[#5a9e65] font-medium">
                            {day.dayLabel}
                          </div>
                          <div className="text-xl">{di.icon}</div>
                          <div className="text-xs font-semibold text-white">
                            {Math.round(day.tempMax)}°
                          </div>
                          <div className="text-[10px] text-[#3d5e40]">
                            {Math.round(day.tempMin)}°
                          </div>
                          {day.rain > 0 && (
                            <div className="text-[9px] text-sky-400">
                              💧{day.rain}mm
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sunrise / Sunset */}
              {(weather.sunrise || weather.sunset) && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      icon: "🌅",
                      label: t("wx_sunrise", "Sunrise"),
                      time: weather.sunrise,
                    },
                    {
                      icon: "🌇",
                      label: t("wx_sunset", "Sunset"),
                      time: weather.sunset,
                    },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="bg-[#0e1e12] rounded-xl p-4 border border-[#1e4428]/40 flex items-center gap-3"
                    >
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <div className="text-xs text-[#5a9e65]">{s.label}</div>
                        <div className="text-sm font-semibold text-white">
                          {s.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Crop Advisory */}
              {advisory && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#0e1e12] rounded-2xl p-5 border border-emerald-900/40 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-emerald-400">
                      🌾 {t("wx_crop_advisory", "Crop Advisory")}
                    </h3>
                    <TTSButton
                      text={advisory.summary + " " + advisory.tips?.join(". ")}
                    />
                  </div>

                  <p className="text-[#b8d4bb] text-sm leading-relaxed">
                    {advisory.summary}
                  </p>

                  {advisory.tips?.length > 0 && (
                    <div className="space-y-2">
                      {advisory.tips.map((tip, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 text-sm text-[#b8d4bb]"
                        >
                          <span className="text-emerald-500 flex-shrink-0 mt-0.5">
                            •
                          </span>
                          {tip}
                        </div>
                      ))}
                    </div>
                  )}

                  {advisory.warnings?.length > 0 && (
                    <div className="bg-amber-900/20 border border-amber-800/30 rounded-xl p-3 space-y-1">
                      <div className="text-xs font-semibold text-amber-400 mb-2">
                        ⚠️ {t("wx_warnings", "Alerts")}
                      </div>
                      {advisory.warnings.map((w, i) => (
                        <div key={i} className="text-xs text-amber-200/80">
                          {w}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skeleton loader */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-52 bg-[#0e1e12] rounded-2xl border border-[#1e4428]/40" />
            <div className="h-28 bg-[#0e1e12] rounded-2xl border border-[#1e4428]/40" />
            <div className="h-40 bg-[#0e1e12] rounded-2xl border border-[#1e4428]/40" />
          </div>
        )}
      </div>
    </div>
  );
}
