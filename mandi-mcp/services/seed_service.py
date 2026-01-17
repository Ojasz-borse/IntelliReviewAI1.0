"""
Seed Suggestion Service
Provides seed variety recommendations based on crop, district, and season
"""
import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from datetime import datetime

# Load seeds database
SEEDS_DB_PATH = Path(__file__).parent.parent / "data" / "seeds_database.json"

def load_seeds_database() -> Dict:
    """Load the seeds database from JSON file"""
    try:
        if SEEDS_DB_PATH.exists():
            with open(SEEDS_DB_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading seeds database: {e}")
    return {"seeds": {}}

def get_current_season() -> str:
    """Determine the current agricultural season based on month"""
    month = datetime.now().month
    if month in [6, 7, 8, 9]:  # June to September
        return "Kharif"
    elif month in [10, 11, 12, 1, 2]:  # October to February
        return "Rabi"
    else:  # March to May
        return "Summer"

def get_seed_suggestions(
    crop: str, 
    district: Optional[str] = None, 
    language: str = "en"
) -> Dict[str, Any]:
    """
    Get seed variety suggestions for a specific crop
    
    Args:
        crop: Name of the crop (English)
        district: Optional district name for location-specific recommendations
        language: 'en' for English, 'mr' for Marathi
    
    Returns:
        Dictionary with seed suggestions including varieties, usage, and features
    """
    db = load_seeds_database()
    seeds_data = db.get("seeds", {})
    
    # Find crop in database (case-insensitive match)
    crop_lower = crop.lower()
    crop_data = None
    crop_key = None
    
    for key in seeds_data:
        if key.lower() == crop_lower or crop_lower in key.lower():
            crop_data = seeds_data[key]
            crop_key = key
            break
    
    if not crop_data:
        return {
            "found": False,
            "crop": crop,
            "message": "बीज माहिती उपलब्ध नाही" if language == "mr" else f"No seed data available for {crop}",
            "varieties": []
        }
    
    current_season = get_current_season()
    varieties = crop_data.get("varieties", [])
    
    # Filter and rank varieties
    ranked_varieties = []
    for variety in varieties:
        score = 0
        
        # Check season match
        variety_season = variety.get("season", "")
        if current_season.lower() in variety_season.lower() or "all" in variety_season.lower():
            score += 10
        
        # Check district suitability
        if district:
            suitable_districts = variety.get("suitable_districts", [])
            for sd in suitable_districts:
                if district.lower() in sd.lower() or sd.lower() in district.lower():
                    score += 5
                    break
        
        ranked_varieties.append((variety, score))
    
    # Sort by score (highest first)
    ranked_varieties.sort(key=lambda x: x[1], reverse=True)
    
    # Format output based on language
    result_varieties = []
    for variety, score in ranked_varieties:
        if language == "mr":
            result_varieties.append({
                "name": variety.get("marathi_name", variety.get("name")),
                "english_name": variety.get("name"),
                "quantity": f"{variety.get('quantity_per_acre_kg', variety.get('quantity_per_acre_sets', 'N/A'))} किलो/एकर" if 'quantity_per_acre_kg' in variety else f"{variety.get('quantity_per_acre_sets', 'N/A')} सेट/एकर",
                "season": variety.get("season_marathi", variety.get("season")),
                "features": variety.get("features_marathi", variety.get("features", [])),
                "price": variety.get("price_range", "N/A"),
                "sowing_months": variety.get("sowing_months_marathi", variety.get("sowing_months", [])),
                "harvest_days": variety.get("harvest_days", "N/A"),
                "suitable_for_district": district in variety.get("suitable_districts", []) if district else False,
                "is_current_season": score >= 10
            })
        else:
            result_varieties.append({
                "name": variety.get("name"),
                "marathi_name": variety.get("marathi_name"),
                "quantity": f"{variety.get('quantity_per_acre_kg', variety.get('quantity_per_acre_sets', 'N/A'))} kg/acre" if 'quantity_per_acre_kg' in variety else f"{variety.get('quantity_per_acre_sets', 'N/A')} sets/acre",
                "season": variety.get("season"),
                "features": variety.get("features", []),
                "price": variety.get("price_range", "N/A"),
                "sowing_months": variety.get("sowing_months", []),
                "harvest_days": variety.get("harvest_days", "N/A"),
                "suitable_for_district": district in variety.get("suitable_districts", []) if district else False,
                "is_current_season": score >= 10
            })
    
    return {
        "found": True,
        "crop": crop_key,
        "crop_marathi": crop_data.get("marathi_name", crop_key),
        "current_season": current_season,
        "varieties": result_varieties,
        "total_varieties": len(result_varieties),
        "recommendation": generate_recommendation(crop_key, result_varieties, current_season, district, language)
    }

def generate_recommendation(
    crop: str, 
    varieties: List[Dict], 
    season: str, 
    district: Optional[str],
    language: str
) -> str:
    """Generate a text recommendation for the farmer"""
    if not varieties:
        return "बीज शिफारस उपलब्ध नाही" if language == "mr" else "No seed recommendation available"
    
    top_variety = varieties[0]
    
    if language == "mr":
        rec = f"{crop} पिकासाठी '{top_variety['name']}' वाण सर्वोत्तम आहे. "
        rec += f"प्रति एकर {top_variety['quantity']} बीज लागते. "
        if top_variety.get('features'):
            rec += f"वैशिष्ट्ये: {', '.join(top_variety['features'][:2])}. "
        rec += f"अंदाजे किंमत: {top_variety.get('price', 'N/A')}."
    else:
        rec = f"For {crop}, '{top_variety['name']}' variety is recommended. "
        rec += f"Use {top_variety['quantity']} per acre. "
        if top_variety.get('features'):
            rec += f"Features: {', '.join(top_variety['features'][:2])}. "
        rec += f"Approx. price: {top_variety.get('price', 'N/A')}."
    
    return rec

def get_all_available_crops(language: str = "en") -> List[Dict]:
    """Get list of all crops with seed data available"""
    db = load_seeds_database()
    seeds_data = db.get("seeds", {})
    
    crops = []
    for crop_name, crop_data in seeds_data.items():
        crops.append({
            "name": crop_name,
            "marathi_name": crop_data.get("marathi_name", crop_name),
            "variety_count": len(crop_data.get("varieties", []))
        })
    
    return sorted(crops, key=lambda x: x["name"])

def generate_seed_advice_text(crop: str, district: str, language: str = "mr") -> str:
    """
    Generate a comprehensive Marathi advice text about seeds for TTS
    """
    suggestions = get_seed_suggestions(crop, district, language)
    
    if not suggestions.get("found"):
        return suggestions.get("message", "बीज माहिती उपलब्ध नाही")
    
    if language == "mr":
        text = f"शेतकरी मित्रांनो, {suggestions['crop_marathi']} पिकासाठी बीज माहिती. "
        
        for i, variety in enumerate(suggestions.get("varieties", [])[:2], 1):
            text += f"वाण {i}: {variety['name']}. "
            text += f"प्रति एकर {variety['quantity']} लागते. "
            if variety.get('features'):
                text += f"{variety['features'][0]}. "
            if variety.get('is_current_season'):
                text += "सध्याच्या हंगामासाठी योग्य. "
        
        text += f"बीज खरेदी करताना प्रमाणित विक्रेत्याकडून घ्या."
    else:
        text = f"For {suggestions['crop']} cultivation, here is the seed information. "
        
        for i, variety in enumerate(suggestions.get("varieties", [])[:2], 1):
            text += f"Variety {i}: {variety['name']}. "
            text += f"Use {variety['quantity']} per acre. "
            if variety.get('features'):
                text += f"{variety['features'][0]}. "
            if variety.get('is_current_season'):
                text += "Suitable for current season. "
        
        text += f"Always purchase certified seeds from authorized dealers."
    
    return text
