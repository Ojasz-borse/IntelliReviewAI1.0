from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from typing import Optional, List, Dict
import os
import csv
import json
import random
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

from services.location_service import get_all_locations, get_location_details
from services.mandi_service import get_mandi_prices
from services.weather_service import get_weather
from services.advice_service import generate_advice
from services.tts_service import generate_marathi_speech

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Use faster JSON serialization
app = FastAPI(title="Mandi Price API", default_response_class=ORJSONResponse)

# Enable CORS for Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# CACHED DATA - Loaded ONCE at startup for millisecond responses
# =============================================================================
FILTER_DATA: Dict = {}  # { District: { Market: [Crops] } }
HISTORY_CACHE: Dict = {}  # { (crop_lower, market_lower): [sorted_records] }
AI_GENERATED_CACHE: Dict = {}  # Cache for AI-generated data to avoid repeated calls

def get_csv_path() -> Path:
    """Returns the path to the CSV file."""
    csv_path = Path(__file__).resolve().parent.parent / "data" / "Dataset.csv"
    if not csv_path.exists():
        csv_path = Path("data") / "Dataset.csv"
    if not csv_path.exists():
        csv_path = Path("..") / "data" / "Dataset.csv"
    return csv_path

def load_all_data_at_startup():
    """
    Pre-loads ALL CSV data into memory for instant responses.
    Called once at module import.
    """
    global FILTER_DATA, HISTORY_CACHE
    
    csv_path = get_csv_path()
    
    if not csv_path.exists():
        print(f"Warning: CSV not found at {csv_path.resolve()}, using fallback data")
        FILTER_DATA = {
            "Ahmednagar": {
                "Rahata": ["Tomato", "Onion", "Soybean"],
                "Ahmednagar": ["Tomato", "Onion"]
            },
            "Pune": {
                "Pune": ["Tomato", "Onion", "Potato"],
                "Haveli": ["Soybean", "Rice"]
            },
            "Nashik": {
                "Pimpalgaon Baswant": ["Onion", "Tomato", "Grapes"],
                "Lasalgaon": ["Onion"]
            }
        }
        return
    
    print(f"Loading all data from CSV: {csv_path}")
    start_time = datetime.now()
    
    temp_filters: Dict = {}
    temp_history: Dict = {}  # (crop_lower, market_lower) -> list of records
    
    row_count = 0
    
    try:
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                row_count += 1
                
                district = row.get('District', '').strip()
                market = row.get('Market', '').strip()
                commodity = row.get('Commodity', '').strip()
                date_str = row.get('Arrival_Date', '').strip()
                
                if not district or not market or not commodity:
                    continue
                
                # ===== Build Filter Data =====
                if district not in temp_filters:
                    temp_filters[district] = {}
                if market not in temp_filters[district]:
                    temp_filters[district][market] = set()
                temp_filters[district][market].add(commodity)
                
                # ===== Build History Cache =====
                try:
                    min_price = float(row.get('Min_Price', 0))
                    max_price = float(row.get('Max_Price', 0))
                    modal_price = float(row.get('Modal_Price', 0))
                    dt = datetime.strptime(date_str, "%d-%m-%Y")
                    
                    cache_key = (commodity.lower(), market.lower())
                    if cache_key not in temp_history:
                        temp_history[cache_key] = []
                    
                    temp_history[cache_key].append({
                        "dt": dt,
                        "date": dt.strftime("%Y-%m-%d"),
                        "open": min_price,
                        "high": max_price,
                        "low": min_price,
                        "close": modal_price,
                        "market": market,
                        "commodity": commodity
                    })
                except (ValueError, KeyError):
                    continue
        
        # Convert filter sets to sorted lists
        for d in temp_filters:
            FILTER_DATA[d] = {}
            for m in temp_filters[d]:
                FILTER_DATA[d][m] = sorted(list(temp_filters[d][m]))
        
        # Sort and deduplicate history records
        for key, records in temp_history.items():
            # Sort by date
            records.sort(key=lambda x: x['dt'])
            
            # Deduplicate by date, keeping the one with highest price
            unique = {}
            for rec in records:
                d = rec['date']
                if d not in unique or rec['high'] > unique[d]['high']:
                    unique[d] = rec
            
            # Store sorted list without dt field (not JSON serializable)
            HISTORY_CACHE[key] = [
                {k: v for k, v in r.items() if k != 'dt'}
                for r in sorted(unique.values(), key=lambda x: x['date'])
            ]
        
        elapsed = (datetime.now() - start_time).total_seconds()
        print(f"Loaded {row_count} rows in {elapsed:.2f}s")
        print(f"  - {len(FILTER_DATA)} districts")
        print(f"  - {len(HISTORY_CACHE)} crop/market combinations cached")
        
    except Exception as e:
        print(f"Error loading CSV: {e}")
        # Use fallback
        FILTER_DATA = {
            "Ahmednagar": {"Rahata": ["Tomato", "Onion", "Soybean"]},
            "Pune": {"Pune": ["Tomato", "Onion", "Potato"]}
        }

# Load all data at startup
load_all_data_at_startup()

# =============================================================================
# GEMINI AI DATA GENERATION FOR MISSING DATA
# =============================================================================

async def generate_ai_history_data(crop: str, market: str, days: int = 30) -> List[Dict]:
    """
    Uses Gemini AI to generate realistic historical price data when CSV data is missing.
    This ensures the dashboard always shows meaningful charts.
    """
    import google.generativeai as genai
    
    cache_key = f"history_{crop.lower()}_{market.lower()}_{days}"
    if cache_key in AI_GENERATED_CACHE:
        print(f"Using cached AI history for {crop}/{market}")
        return AI_GENERATED_CACHE[cache_key]
    
    if not GEMINI_API_KEY:
        print("No Gemini API key, generating synthetic data")
        return generate_synthetic_history(crop, market, days)
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        today = datetime.now()
        start_date = today - timedelta(days=days)
        
        prompt = f"""Generate realistic historical market prices for '{crop}' in '{market}' market, Maharashtra, India.

Generate data for the last {days} days (from {start_date.strftime('%Y-%m-%d')} to {today.strftime('%Y-%m-%d')}).

Consider:
- Seasonal variations for this crop in Maharashtra
- Typical price ranges for this commodity in Indian agricultural markets
- Natural price fluctuations (not constant)
- Prices are in Rs/Quintal (100 kg)

Return ONLY a valid JSON array with this format (no markdown, no explanation):
[
  {{"date": "2025-01-01", "open": 1500, "high": 1800, "low": 1400, "close": 1700}},
  {{"date": "2025-01-02", "open": 1700, "high": 1900, "low": 1600, "close": 1800}}
]

Generate exactly {min(days, 30)} data points with realistic price variations."""

        response = model.generate_content(prompt)
        text = response.text.replace("```json", "").replace("```", "").strip()
        
        data = json.loads(text)
        
        # Validate and clean data
        valid_data = []
        for item in data:
            if all(k in item for k in ['date', 'open', 'high', 'low', 'close']):
                valid_data.append({
                    "date": item['date'],
                    "open": float(item['open']),
                    "high": float(item['high']),
                    "low": float(item['low']),
                    "close": float(item['close']),
                    "source": "AI Generated"
                })
        
        if valid_data:
            AI_GENERATED_CACHE[cache_key] = valid_data
            print(f"Generated {len(valid_data)} AI history points for {crop}/{market}")
            return valid_data
            
    except Exception as e:
        print(f"AI History Generation Error: {e}")
    
    # Fallback to synthetic data
    return generate_synthetic_history(crop, market, days)


def generate_synthetic_history(crop: str, market: str, days: int = 30) -> List[Dict]:
    """
    Generates realistic synthetic historical data based on typical crop prices.
    Used as fallback when both CSV and AI fail.
    """
    # Base prices for common crops (Rs/Quintal)
    base_prices = {
        "tomato": 1500,
        "onion": 1200,
        "potato": 1800,
        "soybean": 4500,
        "wheat": 2200,
        "rice": 2500,
        "maize": 1900,
        "cotton": 6000,
        "sugarcane": 3000,
        "grapes": 5000,
        "pomegranate": 4000,
    }
    
    crop_lower = crop.lower()
    base_price = base_prices.get(crop_lower, 2000)  # Default 2000 Rs/Quintal
    
    data = []
    today = datetime.now()
    
    # Generate realistic price movements
    current_price = base_price
    for i in range(days):
        date = today - timedelta(days=days - i - 1)
        
        # Add some realistic variation (±10%)
        variation = random.uniform(-0.10, 0.10)
        current_price = current_price * (1 + variation * 0.3)  # Smoothed variation
        
        # Keep within reasonable bounds (±30% of base)
        current_price = max(base_price * 0.7, min(base_price * 1.3, current_price))
        
        # Generate OHLC with realistic spreads
        spread = current_price * random.uniform(0.05, 0.15)
        
        open_price = current_price + random.uniform(-spread/2, spread/2)
        close_price = current_price + random.uniform(-spread/2, spread/2)
        high_price = max(open_price, close_price) + random.uniform(0, spread/2)
        low_price = min(open_price, close_price) - random.uniform(0, spread/2)
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(low_price, 0),
            "high": round(high_price, 0),
            "low": round(low_price, 0),
            "close": round(close_price, 0),
            "source": "Synthetic"
        })
    
    return data

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.get("/")
async def root():
    return {"message": "Mandi API is running", "cached_districts": len(FILTER_DATA)}

@app.get("/locations")
async def get_locations_endpoint():
    return get_all_locations()

@app.get("/filters")
async def get_filters():
    """Returns cached filter hierarchy - instant response."""
    return FILTER_DATA

@app.get("/history")
async def get_historical_chart_data(
    crop: str, 
    mandi: Optional[str] = None, 
    days: int = 30
):
    """
    Returns OHLC data from pre-cached data.
    If no data found, generates AI-powered realistic historical data.
    NEVER returns empty - always provides meaningful chart data.
    """
    crop_lower = crop.lower()
    
    # Try exact cache match first
    if mandi:
        cache_key = (crop_lower, mandi.lower())
        if cache_key in HISTORY_CACHE:
            records = HISTORY_CACHE[cache_key]
            if records:
                return records[-days:] if len(records) > days else records
    
    # If no exact match, find best available market for this crop
    best_key = None
    best_count = 0
    
    # Preferred markets for fallback
    preferred = ["rahata", "ahmednagar", "pune", "mumbai", "nagpur"]
    
    for key, records in HISTORY_CACHE.items():
        if key[0] == crop_lower:
            market_name = key[1]
            if market_name in preferred:
                if len(records) > best_count:
                    best_key = key
                    best_count = len(records)
            elif best_key is None or len(records) > best_count:
                best_key = key
                best_count = len(records)
    
    if best_key and best_key in HISTORY_CACHE:
        records = HISTORY_CACHE[best_key]
        if records:
            return records[-days:] if len(records) > days else records
    
    # ===== NO CSV DATA FOUND - USE AI GENERATION =====
    print(f"No CSV data for {crop}/{mandi}, generating AI data...")
    market_name = mandi or "Maharashtra"
    ai_data = await generate_ai_history_data(crop, market_name, days)
    return ai_data

@app.get("/data")
async def get_unified_data(
    district: str, 
    taluka: str = "", 
    crop: str = "Tomato", 
    market: Optional[str] = None
):
    """
    Main endpoint for price, weather, and advice.
    Always returns complete data - uses AI for missing values.
    """
    # 1. Resolve Location / Market
    nearest_mandi = market
    lat, lon = 19.7515, 75.7139  # Default Maharashtra Center
    
    # Try to get coordinates from DB if district matches
    if district:
        locs = get_all_locations()
        for loc in locs:
            if loc['district'].lower() == district.lower():
                lat, lon = loc['lat'], loc['lon']
                if not nearest_mandi:
                    nearest_mandi = loc['nearest_mandi']
                break
    
    if not nearest_mandi:
        # Pick first market from filters for that district
        if district in FILTER_DATA and FILTER_DATA[district]:
            nearest_mandi = list(FILTER_DATA[district].keys())[0]
        else:
            nearest_mandi = "Pune"  # Fallback
    
    # 2. Fetch Prices (already has Gemini fallback in mandi_service.py)
    price_data = await get_mandi_prices(nearest_mandi, crop)
    
    # 3. Fetch Weather
    weather_data = await get_weather(lat, lon)
    
    # 4. Generate Advice
    advice_text = await generate_advice(price_data, weather_data, GEMINI_API_KEY)
    
    # 5. Generate Audio
    audio_base64 = await generate_marathi_speech(advice_text, GEMINI_API_KEY)
    
    return {
        "location": {
            "district": district,
            "taluka": taluka,
            "nearest_mandi": nearest_mandi,
            "lat": lat,
            "lon": lon
        },
        "crop": crop,
        "price_data": price_data,
        "weather_data": weather_data,
        "advice_marathi": advice_text,
        "audio_base64": audio_base64
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
