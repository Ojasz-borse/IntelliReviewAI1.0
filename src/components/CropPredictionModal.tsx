import React, { useState, useEffect } from 'react';
import { X, Wheat, Loader2, AlertTriangle, Sprout, ThermometerSun, Droplets, Cloud, CheckCircle2, Info, MapPin, Layers } from 'lucide-react';
import { cropPredictionService, CropPrediction, PredictionResult, FALLBACK_SOIL_TYPES, FALLBACK_DISTRICTS } from '../services/cropPredictionService';

interface CropPredictionModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: 'mr' | 'en';
}

// Translations for the modal
const translations = {
    mr: {
        title: 'पीक अंदाज',
        subtitle: 'AI-आधारित पीक शिफारस',
        selectState: 'राज्य निवडा',
        selectDistrict: 'जिल्हा निवडा',
        selectSoil: 'मातीचा प्रकार निवडा',
        predict: 'पीक अंदाज घ्या',
        predicting: 'अंदाज घेत आहे...',
        results: 'शिफारस केलेली पिके',
        weather: 'हवामान',
        temperature: 'तापमान',
        humidity: 'आर्द्रता',
        rainfall: 'पाऊस',
        fallbackNotice: '⚠️ API उपलब्ध नाही - स्थानिक डेटासेटवरून अंदाज',
        veryHigh: 'अत्यंत उच्च',
        high: 'उच्च',
        medium: 'मध्यम',
        low: 'कमी',
        confidence: 'आत्मविश्वास',
        season: 'हंगाम',
        reasons: 'कारणे',
        close: 'बंद करा',
        noResults: 'कोणतेही परिणाम आढळले नाहीत',
        error: 'त्रुटी आली, पुन्हा प्रयत्न करा',
        kharif: 'खरीप',
        rabi: 'रब्बी',
        zaid: 'झाईद',
        perennial: 'बारमाही',
        all: 'सर्व हंगाम'
    },
    en: {
        title: 'Crop Prediction',
        subtitle: 'AI-powered crop recommendation',
        selectState: 'Select State',
        selectDistrict: 'Select District',
        selectSoil: 'Select Soil Type',
        predict: 'Get Crop Prediction',
        predicting: 'Predicting...',
        results: 'Recommended Crops',
        weather: 'Weather',
        temperature: 'Temperature',
        humidity: 'Humidity',
        rainfall: 'Rainfall',
        fallbackNotice: '⚠️ API unavailable - predictions from local dataset',
        veryHigh: 'Very High',
        high: 'High',
        medium: 'Medium',
        low: 'Low',
        confidence: 'Confidence',
        season: 'Season',
        reasons: 'Reasons',
        close: 'Close',
        noResults: 'No results found',
        error: 'Error occurred, please try again',
        kharif: 'Kharif',
        rabi: 'Rabi',
        zaid: 'Zaid',
        perennial: 'Perennial',
        all: 'All Seasons'
    }
};

// Soil type translations
const soilTranslations: Record<string, Record<'mr' | 'en', string>> = {
    alluvial: { mr: 'जलोढ माती', en: 'Alluvial Soil' },
    black: { mr: 'काळी माती', en: 'Black Soil' },
    red: { mr: 'लाल माती', en: 'Red Soil' },
    laterite: { mr: 'जांभी माती', en: 'Laterite Soil' },
    desert: { mr: 'वाळवंटी माती', en: 'Desert Soil' },
    mountain: { mr: 'पर्वतीय माती', en: 'Mountain Soil' },
    saline: { mr: 'क्षारयुक्त माती', en: 'Saline Soil' }
};

const CropPredictionModal: React.FC<CropPredictionModalProps> = ({
    isOpen,
    onClose,
    language
}) => {
    const t = translations[language];

    // State
    const [states, setStates] = useState<string[]>([]);
    const [districts, setDistricts] = useState<string[]>([]);
    const [soilTypes, setSoilTypes] = useState<string[]>([]);

    const [selectedState, setSelectedState] = useState<string>('Maharashtra');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');
    const [selectedSoil, setSelectedSoil] = useState<string>('black');

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load initial data
    useEffect(() => {
        if (isOpen) {
            loadInitialData();
        }
    }, [isOpen]);

    // Update districts when state changes
    useEffect(() => {
        if (selectedState) {
            loadDistricts(selectedState);
        }
    }, [selectedState]);

    const loadInitialData = async () => {
        setInitialLoading(true);
        try {
            const [statesList, soilTypesList] = await Promise.all([
                cropPredictionService.getStates(),
                cropPredictionService.getSoilTypes()
            ]);
            setStates(statesList);
            setSoilTypes(Object.keys(soilTypesList));

            if (statesList.length > 0 && !statesList.includes(selectedState)) {
                setSelectedState(statesList[0]);
            }
        } catch (err) {
            // Use fallback data
            setStates(Object.keys(FALLBACK_DISTRICTS));
            setSoilTypes(Object.keys(FALLBACK_SOIL_TYPES));
        } finally {
            setInitialLoading(false);
        }
    };

    const loadDistricts = async (state: string) => {
        try {
            const districtsList = await cropPredictionService.getDistricts(state);
            setDistricts(districtsList);
            if (districtsList.length > 0) {
                setSelectedDistrict(districtsList[0]);
            }
        } catch {
            const fallbackDistricts = Object.keys(FALLBACK_DISTRICTS[state] || {});
            setDistricts(fallbackDistricts);
            if (fallbackDistricts.length > 0) {
                setSelectedDistrict(fallbackDistricts[0]);
            }
        }
    };

    const handlePredict = async () => {
        if (!selectedState || !selectedDistrict || !selectedSoil) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const prediction = await cropPredictionService.predict(
                selectedState,
                selectedDistrict,
                selectedSoil
            );
            setResult(prediction);
        } catch (err) {
            setError(t.error);
        } finally {
            setLoading(false);
        }
    };

    const getSuitabilityColor = (suitability: string) => {
        switch (suitability) {
            case 'Very High':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'High':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Medium':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Low':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getSuitabilityText = (suitability: string) => {
        switch (suitability) {
            case 'Very High': return t.veryHigh;
            case 'High': return t.high;
            case 'Medium': return t.medium;
            case 'Low': return t.low;
            default: return suitability;
        }
    };

    const getSeasonText = (season: string) => {
        const seasonMap: Record<string, keyof typeof t> = {
            kharif: 'kharif',
            rabi: 'rabi',
            zaid: 'zaid',
            perennial: 'perennial',
            all: 'all'
        };
        return t[seasonMap[season] || 'all'] || season;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 rounded-xl">
                                <Wheat className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{t.title}</h2>
                                <p className="text-white/80 text-sm">{t.subtitle}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {initialLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Selection Form */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                                {/* State Selection */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {t.selectState}
                                    </label>
                                    <select
                                        value={selectedState}
                                        onChange={(e) => setSelectedState(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                    >
                                        {states.map(state => (
                                            <option key={state} value={state}>{state}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* District Selection */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {t.selectDistrict}
                                    </label>
                                    <select
                                        value={selectedDistrict}
                                        onChange={(e) => setSelectedDistrict(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                    >
                                        {districts.map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Soil Type Selection */}
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mb-1.5">
                                        <Layers className="w-3.5 h-3.5" />
                                        {t.selectSoil}
                                    </label>
                                    <select
                                        value={selectedSoil}
                                        onChange={(e) => setSelectedSoil(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                                    >
                                        {soilTypes.map(soil => (
                                            <option key={soil} value={soil}>
                                                {soilTranslations[soil]?.[language] || FALLBACK_SOIL_TYPES[soil]?.name || soil}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Predict Button */}
                            <button
                                onClick={handlePredict}
                                disabled={loading || !selectedState || !selectedDistrict}
                                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-200"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t.predicting}
                                    </>
                                ) : (
                                    <>
                                        <Sprout className="w-4 h-4" />
                                        {t.predict}
                                    </>
                                )}
                            </button>

                            {/* Error Message */}
                            {error && (
                                <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded-xl flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-red-500" />
                                    <span className="text-red-700 text-sm">{error}</span>
                                </div>
                            )}

                            {/* Results */}
                            {result && (
                                <div className="mt-5 space-y-4">
                                    {/* Fallback Notice */}
                                    {result.isFromFallback && (
                                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center gap-2">
                                            <Info className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                            <span className="text-amber-700 text-xs">{t.fallbackNotice}</span>
                                        </div>
                                    )}

                                    {/* Weather Info */}
                                    {result.weather && (
                                        <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 rounded-xl p-4">
                                            <h3 className="text-sm font-semibold text-sky-700 mb-3 flex items-center gap-2">
                                                <Cloud className="w-4 h-4" />
                                                {t.weather}
                                            </h3>
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-white/70 rounded-lg p-2.5 text-center">
                                                    <ThermometerSun className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                                                    <div className="text-xs text-gray-500">{t.temperature}</div>
                                                    <div className="text-sm font-semibold text-gray-700">
                                                        {result.weather.temperature.toFixed(1)}°C
                                                    </div>
                                                </div>
                                                <div className="bg-white/70 rounded-lg p-2.5 text-center">
                                                    <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                                                    <div className="text-xs text-gray-500">{t.humidity}</div>
                                                    <div className="text-sm font-semibold text-gray-700">
                                                        {result.weather.humidity.toFixed(0)}%
                                                    </div>
                                                </div>
                                                <div className="bg-white/70 rounded-lg p-2.5 text-center">
                                                    <Cloud className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                                                    <div className="text-xs text-gray-500">{t.rainfall}</div>
                                                    <div className="text-sm font-semibold text-gray-700">
                                                        {result.weather.rainfall.toFixed(0)} mm
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-sky-600 mt-2 text-center">
                                                {result.weather.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Crop Predictions */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <Sprout className="w-4 h-4 text-green-600" />
                                            {t.results}
                                        </h3>

                                        {result.predictions.length === 0 ? (
                                            <p className="text-gray-500 text-center py-4 text-sm">{t.noResults}</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {result.predictions.map((prediction, index) => (
                                                    <CropCard
                                                        key={`${prediction.crop}-${index}`}
                                                        prediction={prediction}
                                                        language={language}
                                                        getSuitabilityColor={getSuitabilityColor}
                                                        getSuitabilityText={getSuitabilityText}
                                                        getSeasonText={getSeasonText}
                                                        t={t}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium text-sm transition-colors"
                    >
                        {t.close}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Crop Card Component
const CropCard: React.FC<{
    prediction: CropPrediction;
    language: 'mr' | 'en';
    getSuitabilityColor: (s: string) => string;
    getSuitabilityText: (s: string) => string;
    getSeasonText: (s: string) => string;
    t: typeof translations['en'];
}> = ({ prediction, language, getSuitabilityColor, getSuitabilityText, getSeasonText, t }) => {
    const [showReasons, setShowReasons] = useState(false);

    return (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Wheat className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 text-sm">
                            {language === 'mr' && prediction.hindi_name ? prediction.hindi_name : prediction.crop}
                        </h4>
                        {language === 'mr' && prediction.hindi_name && (
                            <span className="text-xs text-gray-400">{prediction.crop}</span>
                        )}
                    </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getSuitabilityColor(prediction.suitability_class)}`}>
                    {getSuitabilityText(prediction.suitability_class)}
                </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                    {t.confidence}: {(prediction.confidence * 100).toFixed(0)}%
                </span>
                <span>•</span>
                <span>{t.season}: {getSeasonText(prediction.season)}</span>
            </div>

            {/* Confidence bar */}
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full rounded-full transition-all ${prediction.suitability_class === 'Very High' ? 'bg-green-500' :
                            prediction.suitability_class === 'High' ? 'bg-emerald-500' :
                                prediction.suitability_class === 'Medium' ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                    style={{ width: `${prediction.confidence * 100}%` }}
                />
            </div>

            {/* Reasons toggle */}
            {prediction.reasons && prediction.reasons.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowReasons(!showReasons)}
                        className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1"
                    >
                        <Info className="w-3 h-3" />
                        {showReasons ? '−' : '+'} {t.reasons}
                    </button>
                    {showReasons && (
                        <ul className="mt-2 text-xs text-gray-500 space-y-0.5 pl-4">
                            {prediction.reasons.map((reason, idx) => (
                                <li key={idx} className="list-disc">{reason}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default CropPredictionModal;
