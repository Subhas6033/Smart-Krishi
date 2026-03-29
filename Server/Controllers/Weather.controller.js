// Server/Controllers/weatherController.js

const OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5";

// ==========================================
// Helper Functions
// ==========================================

function processForecast(forecastData) {
  if (!forecastData || !forecastData.list) return [];

  const dailyData = {};
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  forecastData.list.forEach((item) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toDateString();

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        dayLabel: days[date.getDay()],
        main: item.weather[0].main,
        tempMax: item.main.temp_max,
        tempMin: item.main.temp_min,
        rain: 0,
        temps: [item.main.temp],
      };
    } else {
      dailyData[dateKey].tempMax = Math.max(
        dailyData[dateKey].tempMax,
        item.main.temp_max
      );
      dailyData[dateKey].tempMin = Math.min(
        dailyData[dateKey].tempMin,
        item.main.temp_min
      );
      dailyData[dateKey].temps.push(item.main.temp);
    }

    if (item.rain && item.rain["3h"]) {
      dailyData[dateKey].rain += item.rain["3h"];
    }
  });

  return Object.values(dailyData).slice(0, 7);
}

function formatTime(timestamp, timezone) {
  const date = new Date((timestamp + timezone) * 1000);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

function buildWeatherResponse(weatherData, forecastData) {
  const dailyForecast = processForecast(forecastData);
  return {
    city: weatherData.name,
    temp: Math.round(weatherData.main.temp),
    feelsLike: Math.round(weatherData.main.feels_like),
    main: weatherData.weather[0].main,
    description: weatherData.weather[0].description,
    humidity: weatherData.main.humidity,
    pressure: weatherData.main.pressure,
    windSpeed: Math.round(weatherData.wind.speed * 3.6),
    windDeg: weatherData.wind.deg,
    visibility: Math.round(weatherData.visibility / 1000),
    uvi: null,
    sunrise: formatTime(weatherData.sys.sunrise, weatherData.timezone),
    sunset: formatTime(weatherData.sys.sunset, weatherData.timezone),
    forecast: dailyForecast,
  };
}

function generateAdvisory(weatherData, upcomingRain) {
  const temp = weatherData.main.temp;
  const humidity = weatherData.main.humidity;
  const windSpeed = weatherData.wind.speed;
  const weatherMain = weatherData.weather[0].main;
  const description = weatherData.weather[0].description;

  let summary = "";
  const tips = [];
  const warnings = [];

  // Temperature-based advice
  if (temp > 35) {
    summary = `Very hot weather (${Math.round(temp)}°C) detected. High risk of heat stress on crops and livestock.`;
    tips.push(
      "Increase irrigation frequency, especially for shallow-rooted crops"
    );
    tips.push("Apply mulch to conserve soil moisture and reduce evaporation");
    tips.push(
      "Avoid transplanting or major farm operations during peak afternoon heat"
    );
    tips.push("Ensure adequate water supply for livestock and provide shade");
    warnings.push(
      "🌡️ Extreme heat can damage sensitive crops like tomatoes and leafy vegetables"
    );
  } else if (temp > 30) {
    summary = `Warm weather conditions (${Math.round(temp)}°C). Moderate heat stress possible.`;
    tips.push("Monitor soil moisture levels regularly");
    tips.push("Consider evening watering to reduce evaporation");
    tips.push("Watch for signs of wilting in heat-sensitive crops");
  } else if (temp < 10) {
    summary = `Cold weather (${Math.round(temp)}°C) detected. Risk of frost damage.`;
    tips.push("Protect sensitive plants with frost covers or sheets");
    tips.push("Avoid irrigation in early morning to prevent ice formation");
    tips.push("Harvest mature crops before frost if possible");
    warnings.push(
      "❄️ Frost risk - cover vulnerable seedlings and young plants"
    );
  } else if (temp >= 20 && temp <= 30) {
    summary = `Ideal temperature conditions (${Math.round(temp)}°C) for most farming activities.`;
    tips.push("Good weather for spraying pesticides and fertilizers");
    tips.push("Suitable for transplanting and outdoor farm work");
    tips.push("Ideal conditions for harvesting operations");
  }

  // Weather condition-based advice
  if (weatherMain === "Rain") {
    if (!summary) summary = `Rainy conditions (${description}). `;
    else summary += " Rainy conditions detected. ";
    tips.push("Postpone harvesting operations until fields dry");
    tips.push("Delay fertilizer application to prevent nutrient runoff");
    tips.push("Check drainage systems to prevent waterlogging");
    tips.push("Good opportunity for sowing rain-fed crops");
    warnings.push(
      "🌧️ Avoid machinery use in wet fields to prevent soil compaction"
    );
  } else if (weatherMain === "Clear") {
    if (!summary) summary = "Clear sunny conditions. ";
    tips.push("Ideal for drying harvested crops");
    tips.push("Good time for hay making and grain drying");
    tips.push("Suitable for pesticide spraying (check wind conditions)");
  } else if (weatherMain === "Thunderstorm") {
    if (!summary) summary = "Thunderstorm conditions. ";
    warnings.push("⛈️ Avoid outdoor farm activities during storm");
    warnings.push("⚠️ Secure farm equipment and protect livestock");
    tips.push("Stay indoors and monitor weather alerts");
    tips.push("Check crop damage after storm passes");
  }

  // Humidity-based advice
  if (humidity > 80) {
    if (!tips.some((t) => t.includes("fungal"))) {
      tips.push("High humidity - monitor crops closely for fungal diseases");
      tips.push("Improve air circulation in greenhouse and storage areas");
      tips.push("Avoid overhead irrigation to reduce disease risk");
    }
    if (!warnings.some((w) => w.includes("fungal"))) {
      warnings.push(
        `💧 High humidity (${humidity}%) increases risk of fungal infections`
      );
    }
  }

  // Wind-based advice
  if (windSpeed > 10) {
    const windKmh = Math.round(windSpeed * 3.6);
    tips.push(
      `Strong winds (${windKmh} km/h) - secure greenhouse structures and stake tall plants`
    );
    tips.push("Delay pesticide spraying to avoid drift");
    warnings.push(`💨 High winds may damage crops and farm structures`);
  }

  // Upcoming rain advice
  if (upcomingRain && weatherMain !== "Rain") {
    tips.push("Rain expected in next 24 hours - plan irrigation accordingly");
    tips.push("Complete harvest operations before rain arrives");
  }

  // Default summary if none set
  if (!summary) {
    summary = `Current weather: ${description}. Conditions are generally favorable for routine farm operations.`;
  }

  // Default tips if none provided
  if (tips.length === 0) {
    tips.push("Continue with planned farming activities");
    tips.push("Monitor weather forecasts for any changes");
    tips.push("Maintain regular irrigation schedule based on crop needs");
  }

  return { summary, tips, warnings };
}

// ==========================================
// Controller 1: Get weather by city name
// GET /api/weather/current?city=Mumbai
// ==========================================
export const getCurrentWeather = async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: "City parameter is required" });
  }

  try {
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    const weatherRes = await fetch(
      `${OPENWEATHER_BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );

    if (!weatherRes.ok) {
      const errorData = await weatherRes.json();
      return res.status(weatherRes.status).json({
        error: errorData.message || "City not found",
      });
    }

    const weatherData = await weatherRes.json();

    const forecastRes = await fetch(
      `${OPENWEATHER_BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );

    let forecastData = null;
    if (forecastRes.ok) {
      forecastData = await forecastRes.json();
    }

    return res
      .status(200)
      .json(buildWeatherResponse(weatherData, forecastData));
  } catch (error) {
    console.error("getCurrentWeather Error:", error);
    return res.status(500).json({ error: "Failed to fetch weather data" });
  }
};

// ==========================================
// Controller 2: Get farming advisory
// GET /api/weather/advisory?city=Mumbai
// ==========================================
export const getWeatherAdvisory = async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: "City parameter is required" });
  }

  try {
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    const weatherRes = await fetch(
      `${OPENWEATHER_BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );

    if (!weatherRes.ok) {
      return res.status(404).json({ error: "City not found" });
    }

    const weatherData = await weatherRes.json();

    const forecastRes = await fetch(
      `${OPENWEATHER_BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );

    let upcomingRain = false;
    if (forecastRes.ok) {
      const forecastData = await forecastRes.json();
      upcomingRain = forecastData.list
        .slice(0, 8)
        .some((item) => item.weather[0].main === "Rain");
    }

    return res.status(200).json(generateAdvisory(weatherData, upcomingRain));
  } catch (error) {
    console.error("getWeatherAdvisory Error:", error);
    return res.status(500).json({ error: "Failed to generate advisory" });
  }
};

// ==========================================
// Controller 3: Get weather by GPS coordinates
// GET /api/weather/by-coords?lat=22.5726&lon=88.3639
// ==========================================
export const getWeatherByCoords = async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res
      .status(400)
      .json({ error: "Latitude and longitude parameters are required" });
  }

  try {
    const API_KEY = process.env.OPENWEATHER_API_KEY;

    const weatherRes = await fetch(
      `${OPENWEATHER_BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    if (!weatherRes.ok) {
      return res
        .status(weatherRes.status)
        .json({ error: "Location not found" });
    }

    const weatherData = await weatherRes.json();

    const forecastRes = await fetch(
      `${OPENWEATHER_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    let forecastData = null;
    if (forecastRes.ok) {
      forecastData = await forecastRes.json();
    }

    return res
      .status(200)
      .json(buildWeatherResponse(weatherData, forecastData));
  } catch (error) {
    console.error("getWeatherByCoords Error:", error);
    return res.status(500).json({ error: "Failed to fetch weather data" });
  }
};
