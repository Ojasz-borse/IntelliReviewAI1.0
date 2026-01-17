/**
 * Crop Prediction SDK
 * Client-side SDK for integrating with the Crop Prediction API
 */

class CropPredictionSDK {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
    }

    async getStates() {
        const response = await fetch(`${this.baseUrl}/api/v1/states`);
        return response.json();
    }

    async getDistricts(state) {
        const response = await fetch(`${this.baseUrl}/api/v1/districts/${encodeURIComponent(state)}`);
        return response.json();
    }

    async getSoilTypes() {
        const response = await fetch(`${this.baseUrl}/api/v1/soil-types`);
        return response.json();
    }

    async getCrops() {
        const response = await fetch(`${this.baseUrl}/api/v1/crops`);
        return response.json();
    }

    async getWeather(state, district) {
        const params = new URLSearchParams({ state, district });
        const response = await fetch(`${this.baseUrl}/api/v1/weather?${params}`);
        return response.json();
    }

    async predict(state, district, soilType = 'alluvial') {
        const response = await fetch(`${this.baseUrl}/api/v1/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                state,
                district,
                soil_type: soilType
            })
        });
        return response.json();
    }

    async getMarketPrices(state, commodity = null) {
        let url = `${this.baseUrl}/api/v1/market-prices?state=${encodeURIComponent(state)}`;
        if (commodity) url += `&commodity=${encodeURIComponent(commodity)}`;
        const response = await fetch(url);
        return response.json();
    }

    exportPdfUrl(state, district, soilType = 'alluvial') {
        const params = new URLSearchParams({ state, district, soil_type: soilType });
        return `${this.baseUrl}/api/v1/export/pdf?${params}`;
    }

    async getModelInfo() {
        const response = await fetch(`${this.baseUrl}/api/v1/model/info`);
        return response.json();
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CropPredictionSDK;
}
if (typeof window !== 'undefined') {
    window.CropPredictionSDK = CropPredictionSDK;
}
