from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse
from typing import Optional, List, Dict
import os
import csv
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
CSV_ROW_DATA: List = []  # All parsed CSV rows for price lookups

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
    global FILTER_DATA, HISTORY_CACHE, CSV_ROW_DATA
    
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
    Returns OHLC data from pre-cached data - instant response.
    No file reads, pure in-memory lookup.
    """
    crop_lower = crop.lower()
    
    # Try exact cache match first
    if mandi:
        cache_key = (crop_lower, mandi.lower())
        if cache_key in HISTORY_CACHE:
            records = HISTORY_CACHE[cache_key]
            return records[-days:] if len(records) > days else records
    
    # If no exact match, find best available market for this crop
    best_key = None
    best_count = 0
    
    # Preferred markets for fallback
    preferred = ["rahata", "ahmednagar", "pune", "mumbai", "nagpur"]
    
    for key, records in HISTORY_CACHE.items():
        if key[0] == crop_lower:
            # Prioritize preferred markets
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
        return records[-days:] if len(records) > days else records
    
    return []

@app.get("/data")
async def get_unified_data(
    district: str, 
    taluka: str = "", 
    crop: str = "Tomato", 
    market: Optional[str] = None
):
    """Main endpoint for price, weather, and advice."""
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
    
    # 2. Fetch Prices
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
