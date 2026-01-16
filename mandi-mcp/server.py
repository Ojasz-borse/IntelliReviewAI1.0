from mcp.server.fastmcp import FastMCP
import os
from dotenv import load_dotenv
from typing import Optional, Dict, Any

from services.location_service import get_all_locations, get_location_details
from services.mandi_service import get_mandi_prices
from services.weather_service import get_weather
from services.advice_service import generate_advice
from services.tts_service import generate_marathi_speech

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

mcp = FastMCP("Mandi Price & Weather Service")

@mcp.tool()
async def get_locations() -> str:
    """
    Returns a list of supported locations in Maharashtra (PoC database).
    """
    locations = get_all_locations()
    return str(locations)

@mcp.tool()
async def get_agricultural_advice(district: str, taluka: str, crop: str, village: Optional[str] = None) -> Dict[str, Any]:
    """
    Get consolidated agricultural advice including:
    1. Nearest Mandi Price (Standardized to Rs/Kg)
    2. Weather Forecast (Rain & Temp)
    3. AI-Generated Marathi Advice
    4. Audio (TTS) of the advice
    """
    
    # 1. Resolve Location
    location_details = get_location_details(district, taluka)
    if not location_details:
        return {"error": f"Location not found for District: {district}, Taluka: {taluka}"}
    
    nearest_mandi = location_details["nearest_mandi"]
    lat, lon = location_details["lat"], location_details["lon"]

    # 2. Fetch Prices
    price_data = await get_mandi_prices(nearest_mandi, crop)
    
    # 3. Fetch Weather
    weather_data = await get_weather(lat, lon)
    
    # 4. Generate Advice
    advice_text = await generate_advice(price_data, weather_data, GEMINI_API_KEY)
    
    # 5. Generate Audio
    audio_base64 = await generate_marathi_speech(advice_text, GEMINI_API_KEY)
    
    return {
        "location": location_details,
        "crop": crop,
        "price_data": price_data,
        "weather_data": weather_data,
        "advice_marathi": advice_text,
        "audio_base64": audio_base64
    }

if __name__ == "__main__":
    mcp.run()
