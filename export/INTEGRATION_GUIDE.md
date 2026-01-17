# Crop Prediction Model - Integration Guide

## Overview
This directory contains the exported crop prediction ML model and configuration files.

## Files Included

### Model Files (Pickle format)
- `crop_prediction_model.pkl` - Main trained ML model
- `label_encoders.pkl` - Label encoders for categorical features
- `feature_scaler.pkl` - Feature scaler (StandardScaler)
- `feature_columns.pkl` - List of feature column names
- `model_metadata.pkl` - Model metadata and configuration

### ONNX Format (if available)
- `crop_prediction_model.onnx` - ONNX format for cross-platform deployment

### JSON Configuration
- `model_config.json` - Model configuration
- `crops_database.json` - Crop information database
- `districts_database.json` - Indian districts with coordinates
- `soil_types.json` - Soil type definitions

## Quick Integration

### Python Integration

```python
import joblib
import numpy as np

# Load model and preprocessors
model = joblib.load('crop_prediction_model.pkl')
encoders = joblib.load('label_encoders.pkl')
scaler = joblib.load('feature_scaler.pkl')
feature_columns = joblib.load('feature_columns.pkl')

# Prepare input features (example)
features = [
    1,          # Month (January)
    1,          # WeekOfYear
    25.0,       # temperature
    60.0,       # humidity
    50.0,       # rainfall
    80,         # soil_suitability
    70,         # demand_score
    5000,       # avg_modal_price
    1000,       # price_volatility
    100,        # transaction_count
    0,          # State_encoded
    0,          # District_encoded
    0,          # Commodity_encoded
    0,          # Season_encoded
    0           # soil_type_encoded
]

# Scale and predict
features_scaled = scaler.transform([features])
prediction = model.predict(features_scaled)
probabilities = model.predict_proba(features_scaled)

# Decode prediction
class_name = encoders['target'].inverse_transform([prediction[0]])[0]
print(f"Predicted class: {class_name}")
print(f"Confidence: {max(probabilities[0]) * 100:.1f}%")
```

### JavaScript/Node.js Integration (with ONNX)

```javascript
const ort = require('onnxruntime-node');

async function predict(features) {
    const session = await ort.InferenceSession.create('crop_prediction_model.onnx');
    
    const tensor = new ort.Tensor('float32', new Float32Array(features), [1, features.length]);
    const feeds = { 'float_input': tensor };
    
    const results = await session.run(feeds);
    return results;
}
```

### REST API Integration

The backend provides a REST API at `http://localhost:8000`:

```javascript
// Fetch predictions
const response = await fetch('http://localhost:8000/api/v1/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        state: 'Maharashtra',
        district: 'Pune',
        soil_type: 'black'
    })
});

const data = await response.json();
console.log(data.predictions);
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/predict` | POST | Get crop predictions |
| `/api/v1/weather` | GET | Get current weather |
| `/api/v1/states` | GET | List all states |
| `/api/v1/districts/{state}` | GET | List districts in state |
| `/api/v1/soil-types` | GET | List soil types |
| `/api/v1/crops` | GET | List all crops |
| `/api/v1/export/pdf` | GET | Export as PDF |
| `/api/v1/model/info` | GET | Get model info |

## Feature Order

The model expects features in this exact order:
1. Month (1-12)
2. WeekOfYear (1-53)
3. temperature (°C)
4. humidity (%)
5. rainfall (mm)
6. soil_suitability (0-100)
7. demand_score (0-100)
8. avg_modal_price
9. price_volatility
10. transaction_count
11. State_encoded
12. District_encoded
13. Commodity_encoded
14. Season_encoded
15. soil_type_encoded

## Classes

The model predicts these suitability classes:
- **Very High** (Score 80-100)
- **High** (Score 60-80)
- **Medium** (Score 40-60)
- **Low** (Score 0-40)

## Need Help?

1. Run the API server: `python api.py`
2. Check API docs: http://localhost:8000/docs
3. Retrain model: `python train_model.py`
