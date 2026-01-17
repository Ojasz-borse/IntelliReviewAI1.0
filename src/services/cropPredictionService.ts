/**
 * Crop Prediction Service
 * Integrates with the ML API for crop predictions with fallback to local dataset
 */

// API Configuration
const API_URL = "http://localhost:8000";
const API_TIMEOUT = 15000;

// Types
export interface CropPrediction {
    crop: string;
    suitability_class: 'Very High' | 'High' | 'Medium' | 'Low';
    confidence: number;
    season: string;
    category: string;
    hindi_name?: string;
    reasons?: string[];
}

export interface PredictionResult {
    predictions: CropPrediction[];
    weather?: {
        temperature: number;
        humidity: number;
        rainfall: number;
        description: string;
    };
    location: {
        state: string;
        district: string;
        soil_type: string;
    };
    isFromFallback: boolean;
    timestamp: string;
}

export interface SoilType {
    name: string;
    description: string;
    fertility: string;
    suitable_crops: string[];
    regions: string[];
    water_retention: string;
}

export interface DistrictInfo {
    lat: number;
    lon: number;
    climate: string;
}

// Fallback Data - Embedded from exported datasets
const FALLBACK_SOIL_TYPES: Record<string, SoilType> = {
    alluvial: {
        name: "Alluvial Soil",
        description: "Found in river valleys and deltas, highly fertile",
        fertility: "high",
        suitable_crops: ["wheat", "rice", "sugarcane", "cotton", "maize", "pulses", "vegetables"],
        regions: ["Punjab", "Haryana", "Uttar Pradesh", "Bihar", "West Bengal"],
        water_retention: "medium"
    },
    black: {
        name: "Black Soil (Regur)",
        description: "Also called black cotton soil, rich in clay and retains moisture",
        fertility: "high",
        suitable_crops: ["cotton", "soybean", "sorghum", "wheat", "groundnut", "sunflower", "citrus"],
        regions: ["Maharashtra", "Gujarat", "Madhya Pradesh", "Karnataka"],
        water_retention: "high"
    },
    red: {
        name: "Red Soil",
        description: "Rich in iron content, found in tropical regions",
        fertility: "medium",
        suitable_crops: ["groundnut", "millets", "tobacco", "vegetables", "fruits", "pulses"],
        regions: ["Tamil Nadu", "Karnataka", "Andhra Pradesh", "Odisha"],
        water_retention: "low"
    },
    laterite: {
        name: "Laterite Soil",
        description: "Formed in hot and wet tropical areas, acidic in nature",
        fertility: "low",
        suitable_crops: ["tea", "coffee", "rubber", "cashew", "coconut", "tapioca"],
        regions: ["Kerala", "Karnataka", "Maharashtra", "Goa"],
        water_retention: "low"
    },
    desert: {
        name: "Desert Soil (Arid)",
        description: "Sandy with low organic matter, found in arid regions",
        fertility: "low",
        suitable_crops: ["barley", "dates", "cotton", "millets"],
        regions: ["Rajasthan", "Gujarat"],
        water_retention: "low"
    },
    mountain: {
        name: "Mountain Soil",
        description: "Found in hilly regions, rich in humus",
        fertility: "medium",
        suitable_crops: ["tea", "coffee", "spices", "fruits", "vegetables"],
        regions: ["Himachal Pradesh", "Uttarakhand", "Jammu Kashmir"],
        water_retention: "medium"
    },
    saline: {
        name: "Saline/Alkaline Soil",
        description: "High salt content, found in coastal and arid areas",
        fertility: "low",
        suitable_crops: ["rice", "sugarbeet", "cotton"],
        regions: ["Gujarat", "Rajasthan", "Punjab", "Coastal areas"],
        water_retention: "low"
    }
};

const FALLBACK_DISTRICTS: Record<string, Record<string, DistrictInfo>> = {
    Maharashtra: {
        Mumbai: { lat: 19.076, lon: 72.8777, climate: "tropical_wet" },
        Pune: { lat: 18.5204, lon: 73.8567, climate: "semi_arid" },
        Nashik: { lat: 19.9975, lon: 73.7898, climate: "semi_arid" },
        Nagpur: { lat: 21.1458, lon: 79.0882, climate: "tropical_wet_dry" },
        Aurangabad: { lat: 19.8762, lon: 75.3433, climate: "semi_arid" },
        Solapur: { lat: 17.6599, lon: 75.9064, climate: "semi_arid" },
        Kolhapur: { lat: 16.705, lon: 74.2433, climate: "tropical_wet" },
        Ahmednagar: { lat: 19.0948, lon: 74.7480, climate: "semi_arid" },
        Satara: { lat: 17.6805, lon: 74.0183, climate: "semi_arid" },
        Sangli: { lat: 16.8524, lon: 74.5815, climate: "semi_arid" },
        Jalgaon: { lat: 21.0077, lon: 75.5626, climate: "semi_arid" },
        Latur: { lat: 18.4088, lon: 76.5604, climate: "semi_arid" },
        Amravati: { lat: 20.9374, lon: 77.7796, climate: "tropical_wet_dry" },
        Akola: { lat: 20.7002, lon: 77.0082, climate: "semi_arid" },
        Buldhana: { lat: 20.5292, lon: 76.1842, climate: "semi_arid" },
        Yavatmal: { lat: 20.3888, lon: 78.1204, climate: "tropical_wet_dry" },
        Wardha: { lat: 20.7453, lon: 78.5985, climate: "tropical_wet_dry" },
        Chandrapur: { lat: 19.9615, lon: 79.2961, climate: "tropical_wet_dry" },
        Nanded: { lat: 19.1383, lon: 77.3210, climate: "semi_arid" },
        Parbhani: { lat: 19.2704, lon: 76.7604, climate: "semi_arid" },
        Beed: { lat: 18.9891, lon: 75.7601, climate: "semi_arid" },
        Jalna: { lat: 19.8347, lon: 75.8802, climate: "semi_arid" }
    }
};

const FALLBACK_CROPS: Record<string, {
    category: string;
    season: string;
    temp_min: number;
    temp_max: number;
    temp_optimal: number;
    rainfall_min: number;
    rainfall_max: number;
    hindi_name: string;
    soil_types: string[];
}> = {
    Wheat: {
        category: "cereal",
        season: "rabi",
        temp_min: 10,
        temp_max: 25,
        temp_optimal: 18,
        rainfall_min: 50,
        rainfall_max: 100,
        hindi_name: "गहू",
        soil_types: ["alluvial", "black", "red"]
    },
    Rice: {
        category: "cereal",
        season: "kharif",
        temp_min: 20,
        temp_max: 35,
        temp_optimal: 25,
        rainfall_min: 150,
        rainfall_max: 300,
        hindi_name: "तांदूळ",
        soil_types: ["alluvial", "black", "laterite"]
    },
    Cotton: {
        category: "cash_crop",
        season: "kharif",
        temp_min: 21,
        temp_max: 35,
        temp_optimal: 28,
        rainfall_min: 50,
        rainfall_max: 100,
        hindi_name: "कापूस",
        soil_types: ["black", "alluvial", "red"]
    },
    Soybean: {
        category: "oilseed",
        season: "kharif",
        temp_min: 20,
        temp_max: 32,
        temp_optimal: 26,
        rainfall_min: 60,
        rainfall_max: 100,
        hindi_name: "सोयाबीन",
        soil_types: ["black", "alluvial"]
    },
    Sugarcane: {
        category: "cash_crop",
        season: "perennial",
        temp_min: 20,
        temp_max: 35,
        temp_optimal: 28,
        rainfall_min: 75,
        rainfall_max: 150,
        hindi_name: "ऊस",
        soil_types: ["alluvial", "black"]
    },
    Onion: {
        category: "vegetable",
        season: "rabi",
        temp_min: 13,
        temp_max: 30,
        temp_optimal: 20,
        rainfall_min: 50,
        rainfall_max: 75,
        hindi_name: "कांदा",
        soil_types: ["alluvial", "red", "black"]
    },
    Tomato: {
        category: "vegetable",
        season: "all",
        temp_min: 15,
        temp_max: 32,
        temp_optimal: 24,
        rainfall_min: 40,
        rainfall_max: 60,
        hindi_name: "टोमॅटो",
        soil_types: ["alluvial", "red", "black"]
    },
    Pomegranate: {
        category: "fruit",
        season: "perennial",
        temp_min: 18,
        temp_max: 35,
        temp_optimal: 28,
        rainfall_min: 50,
        rainfall_max: 80,
        hindi_name: "डाळिंब",
        soil_types: ["black", "red", "alluvial"]
    },
    Groundnut: {
        category: "oilseed",
        season: "kharif",
        temp_min: 22,
        temp_max: 32,
        temp_optimal: 27,
        rainfall_min: 50,
        rainfall_max: 100,
        hindi_name: "शेंगदाणे",
        soil_types: ["red", "alluvial", "black"]
    },
    Jowar: {
        category: "cereal",
        season: "kharif",
        temp_min: 25,
        temp_max: 35,
        temp_optimal: 30,
        rainfall_min: 40,
        rainfall_max: 60,
        hindi_name: "ज्वारी",
        soil_types: ["black", "red", "alluvial"]
    },
    Bajra: {
        category: "cereal",
        season: "kharif",
        temp_min: 25,
        temp_max: 38,
        temp_optimal: 32,
        rainfall_min: 30,
        rainfall_max: 50,
        hindi_name: "बाजरी",
        soil_types: ["red", "desert", "alluvial"]
    },
    Maize: {
        category: "cereal",
        season: "kharif",
        temp_min: 18,
        temp_max: 32,
        temp_optimal: 25,
        rainfall_min: 60,
        rainfall_max: 110,
        hindi_name: "मका",
        soil_types: ["alluvial", "red", "black"]
    },
    Grapes: {
        category: "fruit",
        season: "perennial",
        temp_min: 15,
        temp_max: 35,
        temp_optimal: 25,
        rainfall_min: 50,
        rainfall_max: 90,
        hindi_name: "द्राक्षे",
        soil_types: ["black", "alluvial", "red"]
    },
    Banana: {
        category: "fruit",
        season: "perennial",
        temp_min: 20,
        temp_max: 35,
        temp_optimal: 27,
        rainfall_min: 100,
        rainfall_max: 200,
        hindi_name: "केळी",
        soil_types: ["alluvial", "laterite", "black"]
    },
    TurDal: {
        category: "pulse",
        season: "kharif",
        temp_min: 20,
        temp_max: 35,
        temp_optimal: 28,
        rainfall_min: 60,
        rainfall_max: 100,
        hindi_name: "तूर डाळ",
        soil_types: ["black", "red", "alluvial"]
    }
};

// Crop Prediction Service Class
class CropPredictionService {
    private apiUrl: string;
    private timeout: number;

    constructor(apiUrl: string = API_URL, timeout: number = API_TIMEOUT) {
        this.apiUrl = apiUrl;
        this.timeout = timeout;
    }

    /**
     * Get list of available states
     */
    async getStates(): Promise<string[]> {
        try {
            const response = await this.fetchWithTimeout(`${this.apiUrl}/api/v1/states`);
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            return data.states || Object.keys(FALLBACK_DISTRICTS);
        } catch {
            return Object.keys(FALLBACK_DISTRICTS);
        }
    }

    /**
     * Get list of districts for a state
     */
    async getDistricts(state: string): Promise<string[]> {
        try {
            const response = await this.fetchWithTimeout(
                `${this.apiUrl}/api/v1/districts/${encodeURIComponent(state)}`
            );
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            return data.districts || Object.keys(FALLBACK_DISTRICTS[state] || {});
        } catch {
            return Object.keys(FALLBACK_DISTRICTS[state] || {});
        }
    }

    /**
     * Get available soil types
     */
    async getSoilTypes(): Promise<Record<string, SoilType>> {
        try {
            const response = await this.fetchWithTimeout(`${this.apiUrl}/api/v1/soil-types`);
            if (!response.ok) throw new Error('API Error');
            return await response.json();
        } catch {
            return FALLBACK_SOIL_TYPES;
        }
    }

    /**
     * Get crop prediction with fallback
     */
    async predict(
        state: string,
        district: string,
        soilType: string = 'black'
    ): Promise<PredictionResult> {
        try {
            const response = await this.fetchWithTimeout(`${this.apiUrl}/api/v1/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    state,
                    district,
                    soil_type: soilType
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.status}`);

            const data = await response.json();
            return {
                ...data,
                isFromFallback: false,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.warn('API failed, using fallback prediction:', error);
            return this.getFallbackPrediction(state, district, soilType);
        }
    }

    /**
     * Generate fallback prediction from local dataset
     */
    private getFallbackPrediction(
        state: string,
        district: string,
        soilType: string
    ): PredictionResult {
        const soilData = FALLBACK_SOIL_TYPES[soilType] || FALLBACK_SOIL_TYPES.black;
        const suitableCrops = soilData.suitable_crops;

        // Calculate current season
        const month = new Date().getMonth();
        const currentSeason = this.getCurrentSeason(month);

        // Generate predictions based on soil type and season
        const predictions: CropPrediction[] = [];

        Object.entries(FALLBACK_CROPS).forEach(([cropName, cropData]) => {
            // Check if crop is suitable for this soil type
            const soilMatch = cropData.soil_types.includes(soilType);
            // Check if any of the crop's general categories match soil's suitable crops
            const categoryMatch = suitableCrops.some(sc =>
                cropData.category.includes(sc) || cropName.toLowerCase().includes(sc)
            );

            if (soilMatch || categoryMatch) {
                // Calculate suitability based on season match
                let confidence = 0.5;
                let suitability_class: 'Very High' | 'High' | 'Medium' | 'Low' = 'Medium';

                const seasonMatch =
                    cropData.season === currentSeason ||
                    cropData.season === 'all' ||
                    cropData.season === 'perennial';

                if (soilMatch && seasonMatch) {
                    confidence = 0.75 + Math.random() * 0.2;
                    suitability_class = 'Very High';
                } else if (soilMatch) {
                    confidence = 0.55 + Math.random() * 0.15;
                    suitability_class = 'High';
                } else if (seasonMatch) {
                    confidence = 0.45 + Math.random() * 0.15;
                    suitability_class = 'Medium';
                } else {
                    confidence = 0.25 + Math.random() * 0.15;
                    suitability_class = 'Low';
                }

                const reasons = this.generateReasons(cropData, soilType, currentSeason, soilMatch, seasonMatch);

                predictions.push({
                    crop: cropName,
                    suitability_class,
                    confidence: parseFloat(confidence.toFixed(2)),
                    season: cropData.season,
                    category: cropData.category,
                    hindi_name: cropData.hindi_name,
                    reasons
                });
            }
        });

        // Sort by confidence (highest first)
        predictions.sort((a, b) => b.confidence - a.confidence);

        // Take top 6 predictions
        const topPredictions = predictions.slice(0, 6);

        // Generate mock weather based on season
        const weather = this.getMockWeatherForSeason(currentSeason);

        return {
            predictions: topPredictions,
            weather,
            location: {
                state,
                district,
                soil_type: soilType
            },
            isFromFallback: true,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate reasons for crop recommendation
     */
    private generateReasons(
        cropData: typeof FALLBACK_CROPS[string],
        soilType: string,
        currentSeason: string,
        soilMatch: boolean,
        seasonMatch: boolean
    ): string[] {
        const reasons: string[] = [];

        if (soilMatch) {
            reasons.push(`Suitable for ${FALLBACK_SOIL_TYPES[soilType]?.name || soilType} soil`);
        }
        if (seasonMatch) {
            reasons.push(`Ideal for ${currentSeason} season planting`);
        }
        reasons.push(`Optimal temperature: ${cropData.temp_min}-${cropData.temp_max}°C`);
        reasons.push(`Category: ${cropData.category.replace('_', ' ')}`);

        return reasons;
    }

    /**
     * Get current agricultural season
     */
    private getCurrentSeason(month: number): string {
        // Kharif: June - October (months 5-9)
        // Rabi: November - March (months 10-2)
        // Zaid: April - June (months 3-5)
        if (month >= 5 && month <= 9) return 'kharif';
        if (month >= 10 || month <= 2) return 'rabi';
        return 'zaid';
    }

    /**
     * Generate mock weather data based on season
     */
    private getMockWeatherForSeason(season: string): PredictionResult['weather'] {
        switch (season) {
            case 'kharif':
                return {
                    temperature: 28 + Math.random() * 5,
                    humidity: 70 + Math.random() * 15,
                    rainfall: 80 + Math.random() * 50,
                    description: 'Monsoon season - good for Kharif crops'
                };
            case 'rabi':
                return {
                    temperature: 18 + Math.random() * 8,
                    humidity: 50 + Math.random() * 15,
                    rainfall: 10 + Math.random() * 20,
                    description: 'Winter season - ideal for Rabi crops'
                };
            case 'zaid':
                return {
                    temperature: 32 + Math.random() * 8,
                    humidity: 40 + Math.random() * 20,
                    rainfall: 5 + Math.random() * 15,
                    description: 'Summer season - suitable for short-duration crops'
                };
            default:
                return {
                    temperature: 25,
                    humidity: 60,
                    rainfall: 30,
                    description: 'Moderate weather conditions'
                };
        }
    }

    /**
     * Fetch with timeout
     */
    private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
}

// Export singleton instance
export const cropPredictionService = new CropPredictionService();

// Export fallback data for direct access if needed
export { FALLBACK_SOIL_TYPES, FALLBACK_DISTRICTS, FALLBACK_CROPS };

export default cropPredictionService;
