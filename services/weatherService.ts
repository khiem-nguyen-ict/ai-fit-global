
import { WeatherInfo } from '../types';

export const getLocalWeather = async (): Promise<WeatherInfo> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // In a real app, call a weather API here.
        // Mocking logic for the demo based on latitude (simplistic: higher lat = colder)
        const isActuallyCold = Math.abs(latitude) > 45;
        const mockTemp = isActuallyCold ? -5 : 30;
        
        resolve({
          temp: mockTemp,
          condition: isActuallyCold ? "Cold" : "Sunny",
          location: "Detected Location",
          isCold: isActuallyCold
        });
      } catch (err) {
        reject(err);
      }
    }, (err) => {
      // Fallback for demo
      resolve({
        temp: 20,
        condition: "Cloudy",
        location: "Unknown",
        isCold: false
      });
    });
  });
};
