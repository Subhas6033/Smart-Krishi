// Server/Routes/weather.js

import express from "express";
import {
  getCurrentWeather,
  getWeatherAdvisory,
  getWeatherByCoords,
} from "../Controllers/Weather.controller.js";

const router = express.Router();

// GET /api/weather/current?city=Mumbai
router.get("/current", getCurrentWeather);

// GET /api/weather/advisory?city=Mumbai
router.get("/advisory", getWeatherAdvisory);

// GET /api/weather/by-coords?lat=22.5726&lon=88.3639
router.get("/by-coords", getWeatherByCoords);

export default router;
