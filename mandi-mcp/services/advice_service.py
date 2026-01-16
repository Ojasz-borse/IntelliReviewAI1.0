import google.generativeai as genai
from typing import Dict, Any

async def generate_advice(price_data: Dict[str, Any], weather_data: Dict[str, Any], api_key: str) -> str:
    """
    Generates advice in Marathi using Gemini based on price and weather data.
    """
    if not api_key:
        return "सल्ला उपलब्ध नाही (API Key missing)."

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('models/gemini-2.0-flash') 
        
        prompt = (
            f"You are an expert agricultural advisor for farmers in Maharashtra. "
            f"Based on the following data, provide simple, actionable advice in Marathi. "
            f"Do not just list numbers. Give a recommendation on whether to sell or hold. "
            f"\n\nData:\n"
            f"Crop: {price_data.get('crop')}\n"
            f"Current Price: ₹{price_data.get('modal_price_kg')}/kg\n"
            f"Price Trend: Stable (Assumed)\n"
            f"Weather Forecast: {weather_data.get('forecast_text')}\n"
            f"Rain Warning: {'Yes' if weather_data.get('rain_next_3_days') else 'No'}\n"
            f"\nOutput in Marathi only."
        )

        response = model.generate_content(prompt)
        
        return response.text if response.text else "सल्ला उपलब्ध नाही."

    except Exception as e:
        print(f"Advice Generation Error: {e}")
        return "सध्या सल्ला उपलब्ध नाही. (Self-Analysis: Check market trends manually)."
