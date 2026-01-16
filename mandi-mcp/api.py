"""
Mandi Price API - Using Real data.gov.in API
Fetches live agricultural market prices from Government of India's Open Data Portal
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional, List, Dict
import os
import json
import csv
import httpx
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from dotenv import load_dotenv

from services.weather_service import get_weather
from services.advice_service import generate_advice
from services.tts_service import generate_marathi_speech
from translations import (
    DISTRICT_TRANSLATIONS, 
    COMMODITY_TRANSLATIONS, 
    translate_district, 
    translate_commodity,
    get_all_translations
)

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# data.gov.in API Configuration
DATA_GOV_API_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"
DATA_GOV_RESOURCE_ID = "9ef84268-d588-465a-a308-a864a43d0070"
DATA_GOV_BASE_URL = "https://api.data.gov.in/resource"

app = FastAPI(title="Mandi Price API - Live Data", default_response_class=JSONResponse)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cache for filters (refreshed periodically)
CACHE = {
    "filters": None,
    "filters_timestamp": None,
    "cache_duration": 3600  # 1 hour
}

# District coordinates for weather
DISTRICT_COORDS = {
    "Pune": (18.5204, 73.8567),
    "Mumbai": (19.0760, 72.8777),
    "Nashik": (20.0063, 73.7909),
    "Ahmednagar": (19.0948, 74.7500),
    "Nagpur": (21.1458, 79.0882),
    "Aurangabad": (19.8762, 75.3433),
    "Solapur": (17.6599, 75.9064),
    "Kolhapur": (16.7050, 74.2433),
    "Dhule": (20.9042, 74.7749),
    "Jalgaon": (21.0077, 75.5626),
    "Thane": (19.2183, 72.9781),
    "Raigad": (18.5158, 73.1822),
    "Satara": (17.6805, 74.0183),
    "Sangli": (16.8524, 74.5815),
    "Ratnagiri": (16.9902, 73.3120),
}

async def fetch_from_data_gov(
    filters: Dict = None,
    limit: int = 100,
    offset: int = 0
) -> Dict:
    """Fetch data from data.gov.in API"""
    url = f"{DATA_GOV_BASE_URL}/{DATA_GOV_RESOURCE_ID}"
    
    params = {
        "api-key": DATA_GOV_API_KEY,
        "format": "json",
        "limit": limit,
        "offset": offset
    }
    
    # Add filters
    if filters:
        for key, value in filters.items():
            params[f"filters[{key}]"] = value
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        print(f"data.gov.in API Error: {e}")
        return None

async def get_maharashtra_filters() -> Dict:
    """Get available districts, markets, and commodities - merges live API with CSV"""
    
    # Check cache
    if CACHE["filters"] and CACHE["filters_timestamp"]:
        if (datetime.now() - CACHE["filters_timestamp"]).seconds < CACHE["cache_duration"]:
            return CACHE["filters"]
    
    # First, load comprehensive data from CSV
    print("Loading base filters from CSV dataset...")
    csv_filters = get_fallback_filters()
    
    print("Fetching fresh live data from data.gov.in...")
    
    # Fetch live data - get ALL states for comprehensive coverage
    data = await fetch_from_data_gov(
        filters={},  # No filter - get all states
        limit=5000
    )
    
    # Start with CSV data as base (deep copy to avoid modifying sets)
    filters = {}
    for district, markets in csv_filters.items():
        filters[district] = {}
        for market, crops in markets.items():
            filters[district][market] = set(crops) if isinstance(crops, list) else crops.copy()
    
    # Add live API data on top (if available)
    if data and "records" in data:
        print(f"Merging {len(data.get('records', []))} live records...")
        for record in data["records"]:
            district = record.get("district", "").strip()
            market = record.get("market", "").strip()
            commodity = record.get("commodity", "").strip()
            
            if not district or not market or not commodity:
                continue
            
            if district not in filters:
                filters[district] = {}
            if market not in filters[district]:
                filters[district][market] = set()
            filters[district][market].add(commodity)
    else:
        print("Live API failed, using CSV data only")
    
    # Convert sets to sorted lists
    for district in filters:
        for market in filters[district]:
            if isinstance(filters[district][market], set):
                filters[district][market] = sorted(list(filters[district][market]))
    
    # Update cache
    CACHE["filters"] = filters
    CACHE["filters_timestamp"] = datetime.now()
    
    print(f"Total: {len(filters)} districts with {sum(len(m) for m in filters.values())} markets")
    return filters

def get_fallback_filters() -> Dict:
    """Fallback filters from CSV dataset - comprehensive data"""
    csv_path = Path(__file__).parent.parent / "data" / "Dataset.csv"
    
    if not csv_path.exists():
        print(f"CSV not found at {csv_path}, using minimal fallback")
        return {
            "Pune": {"Pune": ["Tomato", "Onion", "Potato"]},
            "Nashik": {"Nashik": ["Onion", "Tomato", "Grapes"]},
            "Mumbai": {"Mumbai": ["Tomato", "Onion", "Potato"]},
        }
    
    print(f"Loading comprehensive filters from CSV: {csv_path}")
    filters = {}
    
    try:
        import csv
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Normalize keys by stripping whitespace
                normalized = {k.strip(): v.strip() if isinstance(v, str) else v for k, v in row.items()}
                
                district = normalized.get('District', '')
                market = normalized.get('Market', '')
                commodity = normalized.get('Commodity', '')
                
                if not district or not market or not commodity:
                    continue
                
                if district not in filters:
                    filters[district] = {}
                if market not in filters[district]:
                    filters[district][market] = set()
                filters[district][market].add(commodity)
        
        # Convert sets to sorted lists
        for district in filters:
            for market in filters[district]:
                filters[district][market] = sorted(list(filters[district][market]))
        
        print(f"Loaded {len(filters)} districts from CSV with {sum(len(m) for m in filters.values())} markets")
        return filters
    except Exception as e:
        print(f"CSV Error: {e}")
        return {
            "Pune": {"Pune": ["Tomato", "Onion", "Potato"]},
            "Nashik": {"Nashik": ["Onion", "Tomato", "Grapes"]},
        }

@app.on_event("startup")
async def startup_event():
    """Pre-fetch filters on startup"""
    print("Starting Mandi API with LIVE data.gov.in connection...")
    await get_maharashtra_filters()

@app.get("/")
async def root():
    return {
        "message": "Mandi API is running with LIVE data from data.gov.in",
        "data_source": "Government of India Open Data Portal",
        "api_version": "2.0"
    }

@app.get("/filters")
async def get_filters():
    """Returns available filter options from live API"""
    filters = await get_maharashtra_filters()
    return filters

@app.get("/translations")
async def get_translations_endpoint():
    """Returns all Marathi translations for frontend use"""
    return get_all_translations()

@app.get("/history")
async def get_historical_data(
    crop: str,
    mandi: Optional[str] = None,
    days: int = 30
):
    """
    Fetch historical price data - first tries live API, then CSV, then synthetic
    """
    # Try live API first
    filters = {"commodity": crop}  # Don't filter by state for more data
    if mandi:
        filters["market"] = mandi
    
    data = await fetch_from_data_gov(filters=filters, limit=500)
    
    # Collect data from both sources
    chart_data = []
    seen_dates = set()
    
    # First add live API data if available
    if data and "records" in data and len(data["records"]) > 0:
        for record in data["records"]:
            try:
                date_str = record.get("arrival_date", "")
                date_str = date_str.replace("\\/", "/")
                dt = datetime.strptime(date_str, "%d/%m/%Y")
                date_key = dt.strftime("%Y-%m-%d")
                
                if date_key in seen_dates:
                    continue
                seen_dates.add(date_key)
                
                chart_data.append({
                    "date": date_key,
                    "open": float(record.get("min_price", 0)),
                    "high": float(record.get("max_price", 0)),
                    "low": float(record.get("min_price", 0)),
                    "close": float(record.get("modal_price", 0)),
                    "market": record.get("market", ""),
                    "source": "data.gov.in"
                })
            except (ValueError, KeyError):
                continue
    
    # Always add CSV data to supplement (for more historical data points)
    csv_data = get_history_from_csv(crop, mandi, days * 2)  # Get more data
    for point in csv_data:
        if point["date"] not in seen_dates:
            seen_dates.add(point["date"])
            chart_data.append(point)
    
    # Sort and limit
    if len(chart_data) > 0:
        chart_data.sort(key=lambda x: x["date"])
        return chart_data[-days:] if len(chart_data) > days else chart_data
    
    # Last resort: synthetic data
    print(f"No history found for {crop}/{mandi}, generating synthetic")
    return generate_synthetic_history(crop, days)

def get_history_from_csv(crop: str, mandi: str = None, days: int = 30) -> List[Dict]:
    """Get historical data from CSV dataset"""
    csv_path = Path(__file__).parent.parent / "data" / "Dataset.csv"
    
    if not csv_path.exists():
        return []
    
    chart_data = []
    crop_lower = crop.lower()
    mandi_lower = mandi.lower() if mandi else None
    
    try:
        with open(csv_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                normalized = {k.strip(): v.strip() if isinstance(v, str) else v for k, v in row.items()}
                
                commodity = normalized.get('Commodity', '').lower()
                market = normalized.get('Market', '').lower()
                
                # Match crop using contains (for cases like "Onion Green" matching "Onion")
                if crop_lower not in commodity and commodity not in crop_lower:
                    continue
                # Match market using contains
                if mandi_lower and mandi_lower not in market and market not in mandi_lower:
                    continue
                
                try:
                    date_str = normalized.get('Arrival_Date', '')
                    dt = datetime.strptime(date_str, "%d-%m-%Y")
                    
                    chart_data.append({
                        "date": dt.strftime("%Y-%m-%d"),
                        "open": float(normalized.get('Min_Price', 0) or 0),
                        "high": float(normalized.get('Max_Price', 0) or 0),
                        "low": float(normalized.get('Min_Price', 0) or 0),
                        "close": float(normalized.get('Modal_Price', 0) or 0),
                        "market": normalized.get('Market', ''),
                        "source": "CSV"
                    })
                except (ValueError, KeyError):
                    continue
        
        # Sort and limit
        chart_data.sort(key=lambda x: x["date"])
        return chart_data[-days:] if len(chart_data) > days else chart_data
    except Exception as e:
        print(f"CSV history error: {e}")
        return []

def generate_synthetic_history(crop: str, days: int = 30) -> List[Dict]:
    """Generate synthetic history when API data is missing"""
    import random
    
    base_prices = {
        "tomato": 2500, "onion": 1500, "potato": 1200, "wheat": 2800,
        "rice": 3500, "soybean": 5000, "cotton": 7000, "sugar": 4000,
        "maize": 2200, "jowar": 2500
    }
    
    base = base_prices.get(crop.lower(), 2000)
    current = base
    data = []
    
    for i in range(days):
        date = datetime.now() - timedelta(days=days - i - 1)
        current = current * (1 + random.uniform(-0.05, 0.05))
        current = max(base * 0.7, min(base * 1.3, current))
        
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(current * 0.98),
            "high": round(current * 1.05),
            "low": round(current * 0.95),
            "close": round(current),
            "source": "synthetic"
        })
    
    return data

@app.get("/data")
async def get_unified_data(
    district: str,
    market: Optional[str] = None,
    crop: str = "Tomato"
):
    """
    Main endpoint - fetches current price, weather, and generates advice
    All data from LIVE APIs
    """
    # 1. Get current price from data.gov.in
    filters = {"state": "Maharashtra", "district": district, "commodity": crop}
    if market:
        filters["market"] = market
    
    price_data = await fetch_from_data_gov(filters=filters, limit=10)
    
    current_price = None
    price_market = market or district
    
    if price_data and "records" in price_data and len(price_data["records"]) > 0:
        # Get the most recent record
        record = price_data["records"][0]
        modal_price = float(record.get("modal_price", 0))
        current_price = {
            "market": record.get("market", price_market),
            "crop": crop,
            "min_price_quintal": float(record.get("min_price", 0)),
            "modal_price_kg": round(modal_price / 100, 2),  # Convert quintal to kg
            "max_price_kg": round(float(record.get("max_price", 0)) / 100, 2),
            "arrival_date": record.get("arrival_date", ""),
            "source": "data.gov.in (LIVE)"
        }
    else:
        # Fallback to CSV data
        print(f"No live data for {crop}/{market}, checking CSV...")
        csv_history = get_history_from_csv(crop, market, days=1)
        
        if csv_history and len(csv_history) > 0:
            latest = csv_history[-1]
            current_price = {
                "market": market or district,
                "crop": crop,
                "min_price_quintal": latest["low"],
                "modal_price_kg": round(latest["close"] / 100, 2),
                "max_price_kg": round(latest["high"] / 100, 2),
                "arrival_date": latest["date"],
                "source": "Historical Data (CSV)"
            }
        else:
            # Last resort: empty/synthetic
            current_price = {
                "market": price_market,
                "crop": crop,
                "min_price_quintal": 0,
                "modal_price_kg": 0,
                "max_price_kg": 0,
                "source": "No data available"
            }
    
    # 2. Get weather from Open-Meteo API
    lat, lon = DISTRICT_COORDS.get(district, (19.0760, 72.8777))
    weather_data = await get_weather(lat, lon)
    
    # 3. Generate AI advice based on price and weather
    advice_text = await generate_advice(current_price, weather_data, GEMINI_API_KEY)
    
    # 4. Generate voice audio
    audio_base64 = await generate_marathi_speech(advice_text, GEMINI_API_KEY)
    
    return {
        "location": {
            "district": district,
            "market": market or price_market,
            "lat": lat,
            "lon": lon
        },
        "crop": crop,
        "price_data": current_price,
        "weather_data": weather_data,
        "advice_marathi": advice_text,
        "audio_base64": audio_base64,
        "data_source": "data.gov.in (Government of India)"
    }

@app.get("/live-test")
async def test_live_api():
    """Test endpoint to verify live API connection"""
    data = await fetch_from_data_gov(
        filters={"state": "Maharashtra"},
        limit=5
    )
    
    if data and "records" in data:
        return {
            "status": "connected",
            "source": "data.gov.in",
            "total_records": data.get("total", 0),
            "sample_records": data["records"][:3],
            "last_updated": data.get("updated_date", "")
        }
    else:
        return {"status": "failed", "error": "Could not connect to data.gov.in"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
