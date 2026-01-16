import httpx
from typing import Dict, Optional
import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Mock Data for PoC since data.gov.in requires API key and can be flaky
# Market -> Crop -> Price Details
# Mock Data for PoC fallback (if CSV data missing)
MOCK_PRICES = {
    "Rahata": {
        "Tomato": {"min": 1500, "modal": 1800, "max": 2200},
        "Onion": {"min": 1200, "modal": 1500, "max": 1900},
        "Soybean": {"min": 4500, "modal": 4800, "max": 5100}
    },
    "Pune": {
        "Tomato": {"min": 1600, "modal": 1900, "max": 2300},
        "Onion": {"min": 1300, "modal": 1600, "max": 2000}
    },
    "Mumbai": {
        "Tomato": {"min": 1700, "modal": 2100, "max": 2500},
        "Onion": {"min": 1350, "modal": 1750, "max": 2200}
    }
}

import google.generativeai as genai
import json

async def get_gemini_price_estimate(market: str, crop: str) -> Optional[Dict]:
    """
    Uses Gemini to estimate market price if data is missing.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key: return None
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = (
            f"Estimate the current agricultural market price for '{crop}' in '{market}', Maharashtra, India. "
            f"Provide a realistic estimate for today's date ({datetime.date.today()}) based on seasonality and typical trends. "
            f"Return ONLY a JSON object with this format (no markdown):\n"
            f'{{"min_price_quintal": 1000, "modal_price_quintal": 1200, "max_price_quintal": 1500}}'
        )
        
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)
        
        min_q = float(data.get("min_price_quintal", 0))
        modal_q = float(data.get("modal_price_quintal", 0))
        max_q = float(data.get("max_price_quintal", 0))
        
        return {
            "market": market,
            "crop": crop,
            "min_price_quintal": min_q,
            "modal_price_quintal": modal_q,
            "max_price_quintal": max_q,
            "min_price_kg": min_q / 100,
            "modal_price_kg": modal_q / 100,
            "max_price_kg": max_q / 100,
            "date": datetime.date.today().isoformat(),
            "found": True,
            "source": "Gemini (AI Estimate)"
        }
    except Exception as e:
        print(f"Gemini Estimate Error: {e}")
        return None

async def get_mandi_prices(market: str, crop: str) -> Dict:
    """
    Fetches mandi prices. 
    Priority:
    1. Dataset.csv (Latest entry)
    2. Mock Fallback (for stability)
    """
    import csv 
    from pathlib import Path

    # path from mandi-mcp/services/mandi_service.py to data/Dataset.csv
    csv_path = Path(__file__).resolve().parent.parent.parent / "data" / "Dataset.csv"
    
    real_data = None
    
    # 1. Try CSV
    if csv_path.exists():
        try:
             entries = []
             with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                     # Filter
                     if crop.lower() in row['Commodity'].lower():
                         if market and market.lower() in row['Market'].lower():
                             try:
                                 d_str = row['Arrival_Date']
                                 dt = datetime.datetime.strptime(d_str, "%d-%m-%Y")
                                 entries.append({
                                     "dt": dt,
                                     "row": row
                                 })
                             except:
                                 pass
             
             if entries:
                 # Sort desc
                 entries.sort(key=lambda x: x['dt'], reverse=True)
                 latest = entries[0]['row']
                 
                 real_data = {
                    "market": latest.get("Market"),
                    "crop": latest.get("Commodity"),
                    "min_price_quintal": float(latest.get("Min_Price", 0)),
                    "modal_price_quintal": float(latest.get("Modal_Price", 0)),
                    "max_price_quintal": float(latest.get("Max_Price", 0)),
                    "min_price_kg": float(latest.get("Min_Price", 0)) / 100,
                    "modal_price_kg": float(latest.get("Modal_Price", 0)) / 100,
                    "max_price_kg": float(latest.get("Max_Price", 0)) / 100,
                    "date": latest.get("Arrival_Date"),
                    "found": True,
                    "source": "Dataset.csv"
                 }
        except Exception as e:
            print(f"CSV Error: {e}")

    if real_data:
        return real_data
    
    # 2. Try Gemini AI Estimate (Smart Fallback)
    print(f"CSV data missing for {market}/{crop}, trying Gemini...")
    gemini_data = await get_gemini_price_estimate(market, crop)
    if gemini_data:
        return gemini_data

    # 3. Mock Fallback (so app doesn't break for missing CSV data)
    market_data = MOCK_PRICES.get(market, {})
    price_data = market_data.get(crop)
    
    if price_data:
        return {
            "market": market,
            "crop": crop,
            "min_price_quintal": price_data["min"],
            "modal_price_quintal": price_data["modal"],
            "max_price_quintal": price_data["max"],
            "min_price_kg": price_data["min"] / 100,
            "modal_price_kg": price_data["modal"] / 100,
            "max_price_kg": price_data["max"] / 100,
            "date": datetime.date.today().isoformat(),
            "found": True,
            "source": "mock_fallback_restored"
        }
    
    # 3. Not Found
    return {
            "market": market,
            "crop": crop,
            "min_price_quintal": 0,
            "modal_price_quintal": 0,
            "max_price_quintal": 0,
            "min_price_kg": 0.0,
            "modal_price_kg": 0.0,
            "max_price_kg": 0.0,
            "date": datetime.date.today().isoformat(),
            "found": False,
            "source": "not_found"
    }
