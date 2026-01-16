import httpx
from typing import Dict, Any

async def get_weather(lat: float, lon: float) -> Dict[str, Any]:
    """
    Fetches weather data from OpenMeteo for the given coordinates.
    Returns parsed weather info focused on rain and temperature.
    """
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": ["temperature_2m_max", "temperature_2m_min", "precipitation_sum", "precipitation_probability_max"],
        "timezone": "auto",
        "forecast_days": 3
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            daily = data.get("daily", {})
            
            # Simple aggregation logic
            rain_forecast = False
            max_precip_prob = 0
            if "precipitation_probability_max" in daily:
                max_prob = max(daily["precipitation_probability_max"])
                max_precip_prob = max_prob
                if max_prob > 40: # Threshold for rain warning
                    rain_forecast = True
            
            avg_temp = 0
            if "temperature_2m_max" in daily:
                avg_temp = sum(daily["temperature_2m_max"]) / len(daily["temperature_2m_max"])

            return {
                "rain_next_3_days": rain_forecast,
                "max_rain_probability": max_precip_prob,
                "avg_max_temp": round(avg_temp, 1),
                "forecast_text": f"Max Rain Prob: {max_precip_prob}%, Temp: {round(avg_temp, 1)}C"
            }

        except Exception as e:
            return {
                "error": str(e),
                "rain_next_3_days": False,
                "max_rain_probability": 0,
                "avg_max_temp": 0
            }
