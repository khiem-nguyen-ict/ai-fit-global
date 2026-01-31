
import { WeatherInfo } from '../types';

// Weather code to condition mapping (WMO Weather interpretation codes)
const getWeatherCondition = (code: number): string => {
  if (code === 0) return "Clear sky ☀️";
  if (code === 1) return "Mainly clear 🌤️";
  if (code === 2) return "Partly cloudy ⛅";
  if (code === 3) return "Overcast ☁️";
  if (code >= 45 && code <= 48) return "Foggy 🌫️";
  if (code >= 51 && code <= 55) return "Drizzle 🌧️";
  if (code >= 56 && code <= 57) return "Freezing drizzle 🌧️❄️";
  if (code >= 61 && code <= 65) return "Rain 🌧️";
  if (code >= 66 && code <= 67) return "Freezing rain 🌧️❄️";
  if (code >= 71 && code <= 77) return "Snow ❄️";
  if (code >= 80 && code <= 82) return "Rain showers 🌦️";
  if (code >= 85 && code <= 86) return "Snow showers 🌨️";
  if (code >= 95 && code <= 99) return "Thunderstorm ⛈️";
  return "Unknown";
};

export const getLocalWeather = async (): Promise<WeatherInfo> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // Fetch weather data from Open-Meteo API (free, no API key required)
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
        );
        const weatherData = await weatherResponse.json();
        
        // Fetch location data from reverse geocoding API
        const geoResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          { headers: { 'User-Agent': 'AI-Fit-Global/1.0' } }
        );
        const geoData = await geoResponse.json();
        
        const temp = Math.round(weatherData.current.temperature_2m);
        const weatherCode = weatherData.current.weather_code;
        const humidity = weatherData.current.relative_humidity_2m;
        const windSpeed = Math.round(weatherData.current.wind_speed_10m);
        
        const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.municipality || "Unknown City";
        const country = geoData.address?.country || "Unknown Country";
        
        resolve({
          temp,
          condition: getWeatherCondition(weatherCode),
          location: `${city}, ${country}`,
          city,
          country,
          isCold: temp < 10,
          humidity,
          windSpeed
        });
      } catch (err) {
        console.error("Weather fetch error:", err);
        // Fallback with basic location-based estimate
        const isActuallyCold = Math.abs(latitude) > 45;
        resolve({
          temp: isActuallyCold ? -5 : 20,
          condition: isActuallyCold ? "Cold" : "Mild",
          location: "Location detected",
          city: "Unknown",
          country: "Unknown",
          isCold: isActuallyCold
        });
      }
    }, (err) => {
      console.error("Geolocation error:", err);
      // Fallback for demo
      resolve({
        temp: 20,
        condition: "Unknown ❓",
        location: "Location unavailable",
        city: "Unknown",
        country: "Unknown",
        isCold: false
      });
    });
  });
};
