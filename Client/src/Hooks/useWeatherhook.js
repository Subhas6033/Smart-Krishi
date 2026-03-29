// src/Hooks/useWeather.js

import { useDispatch, useSelector } from "react-redux";
import {
  fetchCurrentWeather,
  fetchWeatherByCoords,
  clearError,
} from "../Features/WeatherSlice";

export function useWeather() {
  const dispatch = useDispatch();
  const { weather, forecast, advisory, loading, locLoading, error } =
    useSelector((state) => state.weather);

  const fetchWeather = (cityName) => {
    if (!cityName?.trim()) return;
    localStorage.setItem("sk_weather_city", cityName);
    dispatch(fetchCurrentWeather(cityName));
  };

  const geoLocate = () => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        dispatch(
          fetchWeatherByCoords({ lat: coords.latitude, lon: coords.longitude })
        ).then((action) => {
          if (action.meta.requestStatus === "fulfilled") {
            const city = action.payload.weather.city;
            localStorage.setItem("sk_weather_city", city);
          }
        });
      },
      () => {
        dispatch({
          type: "weather/setError",
          payload: "Location access denied. Please search manually.",
        });
      }
    );
  };

  return {
    weather,
    forecast,
    advisory,
    loading,
    locLoading,
    error,
    fetchWeather,
    geoLocate,
  };
}
