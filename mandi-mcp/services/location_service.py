from typing import List, Dict, Optional
from pydantic import BaseModel

class Location(BaseModel):
    village: Optional[str] = None
    taluka: str
    district: str
    nearest_mandi: str
    latitude: float
    longitude: float

# Mock Database of Locations in Maharashtra
# Structure: District -> Taluka -> Village -> Mandi Data
LOCATION_DB = [
    {
        "district": "Ahmednagar",
        "taluka": "Rahata",
        "village": "Shirdi",
        "nearest_mandi": "Rahata",
        "lat": 19.7667,
        "lon": 74.4762
    },
    {
        "district": "Pune",
        "taluka": "Haveli",
        "village": "Khadakwasla",
        "nearest_mandi": "Pune",
        "lat": 18.4382,
        "lon": 73.7732
    },
    {
        "district": "Nashik",
        "taluka": "Niphad",
        "village": "Pimpalgaon",
        "nearest_mandi": "Pimpalgaon Baswant",
        "lat": 20.1738,
        "lon": 73.9877
    }
]

def get_all_locations() -> List[Dict]:
    """Returns all available locations."""
    return LOCATION_DB

def get_location_details(district: str, taluka: str) -> Optional[Dict]:
    """Finds location details for a given district and taluka."""
    for loc in LOCATION_DB:
        if loc["district"].lower() == district.lower() and loc["taluka"].lower() == taluka.lower():
            return loc
    return None
