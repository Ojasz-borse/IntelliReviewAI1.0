import httpx
from typing import Dict, Optional
import datetime
import os
import json
from dotenv import load_dotenv

load_dotenv()

# =============================================================================
# BASE PRICES FOR COMMON CROPS (Rs/Quintal) - Used for Synthetic Fallback
# =============================================================================
BASE_CROP_PRICES = {
    "tomato": {"min": 1500, "modal": 1800, "max": 2200},
    "onion": {"min": 1200, "modal": 1500, "max": 1900},
    "potato": {"min": 1600, "modal": 2000, "max": 2400},
    "soybean": {"min": 4500, "modal": 4800, "max": 5100},
    "wheat": {"min": 2000, "modal": 2200, "max": 2500},
    "rice": {"min": 2500, "modal": 2800, "max": 3200},
    "maize": {"min": 1800, "modal": 2100, "max": 2400},
    "cotton": {"min": 5500, "modal": 6000, "max": 6500},
    "sugarcane": {"min": 2800, "modal": 3000, "max": 3300},
    "grapes": {"min": 4500, "modal": 5000, "max": 5500},
    "pomegranate": {"min": 3500, "modal": 4000, "max": 4500},
    "banana": {"min": 1500, "modal": 1800, "max": 2100},
    "mango": {"min": 3000, "modal": 3500, "max": 4000},
    "orange": {"min": 2500, "modal": 3000, "max": 3500},
    "cabbage": {"min": 800, "modal": 1000, "max": 1300},
    "cauliflower": {"min": 1000, "modal": 1200, "max": 1500},
    "carrot": {"min": 1200, "modal": 1500, "max": 1800},
    "spinach": {"min": 600, "modal": 800, "max": 1000},
    "beans": {"min": 2000, "modal": 2500, "max": 3000},
    "chilli": {"min": 2500, "modal": 3000, "max": 3500},
    "ginger": {"min": 3000, "modal": 3500, "max": 4000},
    "garlic": {"min": 4000, "modal": 5000, "max": 6000},
    "turmeric": {"min": 8000, "modal": 9000, "max": 10000},
    "groundnut": {"min": 5000, "modal": 5500, "max": 6000},
    "sunflower": {"min": 4500, "modal": 5000, "max": 5500},
}

import google.generativeai as genai

# Cache for AI-generated prices to avoid repeated Gemini calls
AI_PRICE_CACHE: Dict = {}

async def get_gemini_price_estimate(market: str, crop: str) -> Optional[Dict]:
    """
    Uses Gemini to estimate market price if data is missing.
    """
    cache_key = f"{market.lower()}_{crop.lower()}"
    if cache_key in AI_PRICE_CACHE:
        print(f"Using cached AI price for {market}/{crop}")
        return AI_PRICE_CACHE[cache_key]
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("No GEMINI_API_KEY found, using synthetic prices")
        return None
    
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        prompt = (
            f"Estimate the current agricultural market price for '{crop}' in '{market}', Maharashtra, India. "
            f"Provide a realistic estimate for today's date ({datetime.date.today()}) based on seasonality and typical trends. "
            f"Return ONLY a JSON object with this format (no markdown, no explanation):\n"
            f'{{"min_price_quintal": 1000, "modal_price_quintal": 1200, "max_price_quintal": 1500}}'
        )
        
        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(text)
        
        min_q = float(data.get("min_price_quintal", 0))
        modal_q = float(data.get("modal_price_quintal", 0))
        max_q = float(data.get("max_price_quintal", 0))
        
        result = {
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
            "source": "Gemini AI Estimate"
        }
        
        # Cache the result
        AI_PRICE_CACHE[cache_key] = result
        print(f"Generated AI price for {market}/{crop}: {modal_q}/quintal")
        return result
        
    except Exception as e:
        print(f"Gemini Estimate Error: {e}")
        return None


def get_synthetic_price(market: str, crop: str) -> Dict:
    """
    Returns synthetic price based on known crop base prices.
    ALWAYS returns valid data - never N/A.
    """
    crop_lower = crop.lower()
    
    # Find matching crop (partial match)
    base_price = None
    for key, prices in BASE_CROP_PRICES.items():
        if key in crop_lower or crop_lower in key:
            base_price = prices
            break
    
    # If no match, use a sensible default
    if not base_price:
        base_price = {"min": 2000, "modal": 2500, "max": 3000}
    
    return {
        "market": market,
        "crop": crop,
        "min_price_quintal": base_price["min"],
        "modal_price_quintal": base_price["modal"],
        "max_price_quintal": base_price["max"],
        "min_price_kg": base_price["min"] / 100,
        "modal_price_kg": base_price["modal"] / 100,
        "max_price_kg": base_price["max"] / 100,
        "date": datetime.date.today().isoformat(),
        "found": True,
        "source": "Estimated (Typical Price)"
    }


async def get_mandi_prices(market: str, crop: str) -> Dict:
    """
    Fetches mandi prices with multi-tier fallback.
    NEVER returns 0 prices - always provides meaningful data.
    
    Priority:
    1. Dataset.csv (Latest entry)
    2. Gemini AI Estimate
    3. Synthetic prices based on typical crop values
    """
    import csv 
    from pathlib import Path

    csv_path = Path(__file__).resolve().parent.parent.parent / "data" / "Dataset.csv"
    
    real_data = None
    
    # 1. Try CSV
    if csv_path.exists():
        try:
            entries = []
            with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Flexible matching
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
    
    # 2. Try Gemini AI Estimate
    print(f"CSV data missing for {market}/{crop}, trying Gemini...")
    gemini_data = await get_gemini_price_estimate(market, crop)
    if gemini_data:
        return gemini_data

    # 3. ALWAYS return synthetic price - NEVER return 0
    print(f"Using synthetic price for {market}/{crop}")
    return get_synthetic_price(market, crop)
