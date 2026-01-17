import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Sprout, CloudRain, TrendingUp, TrendingDown, Sun, Languages, Volume2, RefreshCw, AlertCircle, Wheat, Leaf, CloudSun, MapPin, X, Send, Loader2, Mic } from 'lucide-react';
import { useLanguage, LanguageProvider } from '../contexts/LanguageContext';
import CropPredictionModal from './CropPredictionModal';

const API_URL = "http://127.0.0.1:8000";

// Fallback filter data
const FALLBACK_FILTERS: any = {
    "Ahmednagar": {
        "Rahata": ["Tomato", "Onion", "Soybean", "Wheat", "Pomegranate"],
        "Kopargaon": ["Tomato", "Onion", "Soybean", "Maize"],
    },
    "Pune": {
        "Pune": ["Tomato", "Onion", "Potato", "Ginger", "Garlic"],
    },
    "Nashik": {
        "Nashik": ["Onion", "Tomato", "Grapes", "Pomegranate"],
    }
};

// Comprehensive Marathi Translations (fallback if API fails)
const DEFAULT_CROP_TRANSLATIONS: Record<string, string> = {
    // Vegetables
    "Tomato": "टोमॅटो", "Onion": "कांदा", "Potato": "बटाटा", "Brinjal": "वांगे",
    "Cabbage": "कोबी", "Cauliflower": "फुलकोबी", "Carrot": "गाजर", "Radish": "मुळा",
    "Spinach": "पालक", "Green Chilli": "हिरवी मिरची", "Capsicum": "ढोबळी मिरची",
    "Bitter gourd": "कारले", "Bottle gourd": "दुधी भोपळा", "Cucumber": "काकडी",
    "Pumpkin": "भोपळा", "Lady Finger": "भेंडी", "Bhindi(Ladies Finger)": "भेंडी",
    "Drumstick": "शेवगा", "Ginger": "आले", "Garlic": "लसूण", "Turmeric": "हळद",
    "Methi(Leaves)": "मेथी", "Coriander(Leaves)": "कोथिंबीर",
    // Fruits
    "Banana": "केळी", "Mango": "आंबा", "Grapes": "द्राक्षे", "Pomegranate": "डाळिंब",
    "Orange": "संत्री", "Sweet Orange": "मोसंबी", "Papaya": "पपई", "Guava": "पेरू",
    "Watermelon": "कलिंगड", "Lemon": "लिंबू", "Coconut": "नारळ", "Sapota(chikkoo)": "चिकू",
    "Apple": "सफरचंद", "Custard Apple (Sharifa)": "सीताफळ", "Pineapple": "अननस",
    // Grains
    "Wheat": "गहू", "Rice": "तांदूळ", "Paddy(Dhan)": "भात", "Maize": "मका",
    "Jowar(Sorghum)": "ज्वारी", "Bajra(Pearl Millet)": "बाजरी", "Ragi (Finger Millet)": "नाचणी",
    // Pulses
    "Bengal Gram(Gram)": "हरभरा", "Bengal Gram(Gram)(Whole)": "हरभरा",
    "Arhar (Tur/Red Gram)(Whole)": "तूर डाळ", "Arhar Dal(Tur Dal)": "तूर डाळ",
    "Green Gram (Moong)": "मूग", "Green Gram (Moong)(Whole)": "मूग",
    "Black Gram (Urd Beans)": "उडीद", "Black Gram (Urd Beans)(Whole)": "उडीद",
    "Black gram (Urd Beans)(Whole)": "उडीद", "Lentil (Masur)": "मसूर",
    "Cowpea (Lobia/Karamani)": "चवळी", "Moth Beans": "मटकी",
    // Oilseeds
    "Soybean": "सोयाबीन", "Soyabean": "सोयाबीन", "Groundnut": "शेंगदाणे",
    "Mustard": "मोहरी", "Sunflower": "सूर्यफूल", "Safflower": "करडई",
    "Sesame(Sesamum,Gingelly,Til)": "तीळ", "Castor Seed": "एरंडी",
    // Cash Crops
    "Cotton": "कापूस", "Sugarcane": "ऊस", "Sugar": "साखर", "Jaggery": "गूळ",
    "Gur (Jaggery)": "गूळ",
    // Spices
    "Chillies(Red)": "लाल मिरची", "Dry Chillies": "सुकी मिरची",
    "Coriander seed": "धणे", "Cumin Seed(Jeera)": "जिरे", "Ajwan": "ओवा",
    // Dry Fruits
    "Almond(Badam)": "बदाम", "Cashewnuts": "काजू", "Arecanut(Betelnut/Supari)": "सुपारी",
    // Others
    "Soanf": "बडीशेप", "Tender Coconut": "शहाळा"
};

const DEFAULT_DISTRICT_TRANSLATIONS: Record<string, string> = {
    // Major Districts
    "Mumbai": "मुंबई", "Pune": "पुणे", "Nashik": "नाशिक", "Nagpur": "नागपूर",
    "Thane": "ठाणे", "Aurangabad": "औरंगाबाद", "Solapur": "सोलापूर",
    "Kolhapur": "कोल्हापूर", "Ahmednagar": "अहमदनगर", "Satara": "सातारा",
    "Sangli": "सांगली", "Raigad": "रायगड", "Jalgaon": "जळगाव", "Dhule": "धुळे",
    "Nanded": "नांदेड", "Latur": "लातूर", "Amravati": "अमरावती", "Amarawati": "अमरावती",
    "Akola": "अकोला", "Buldhana": "बुलढाणा", "Yavatmal": "यवतमाळ", "Washim": "वाशीम",
    "Wardha": "वर्धा", "Chandrapur": "चंद्रपूर", "Gadchiroli": "गडचिरोली",
    "Gondia": "गोंदिया", "Bhandara": "भंडारा", "Parbhani": "परभणी",
    "Hingoli": "हिंगोली", "Jalna": "जालना", "Jalana": "जालना", "Beed": "बीड",
    "Osmanabad": "उस्मानाबाद", "Ratnagiri": "रत्नागिरी", "Sindhudurg": "सिंधुदुर्ग",
    "Palghar": "पालघर", "Nandurbar": "नंदुरबार",
    "Ahmadnagar": "अहमदनगर", "Chhatrapati Sambhajinagar": "छत्रपती संभाजीनगर",
    "Dharashiv": "धाराशिव"
};

interface PriceData {
    market: string;
    crop: string;
    min_price_quintal: number;
    modal_price_kg: number;
    max_price_kg: number;
}

interface WeatherData {
    forecast_text: string;
    rain_next_3_days: boolean;
}

interface DashboardData {
    price_data: PriceData;
    weather_data: WeatherData;
    advice_marathi: string;
    audio_base64: string;
}

// AI Sallagar Modal Component
const AISallagarModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    language: 'mr' | 'en';
}> = ({ isOpen, onClose, language }) => {
    const [question, setQuestion] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);

    const t = {
        mr: { title: "AI सल्लागार", placeholder: "तुमचा प्रश्न लिहा...", ask: "विचारा", close: "बंद करा" },
        en: { title: "AI Advisor", placeholder: "Type your question...", ask: "Ask", close: "Close" }
    }[language];

    const askQuestion = async () => {
        if (!question.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(
                "https://ojaswini12.app.n8n.cloud/webhook/a426ca97-9dd8-4c99-9b3a-4894dc2a816f",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question: question.trim(), language }),
                }
            );
            const raw = await res.text();
            try {
                const parsed = JSON.parse(raw);
                setResponse(parsed[0]?.text || parsed?.text || raw);
            } catch {
                setResponse(raw);
            }
        } catch (e) {
            setResponse(language === 'mr' ? 'त्रुटी आली' : 'Error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-green-700 flex items-center gap-2">
                        <Sprout className="w-5 h-5" /> {t.title}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <textarea
                    rows={3}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder={t.placeholder}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm mb-3 focus:outline-none focus:border-green-400"
                />
                <button
                    onClick={askQuestion}
                    disabled={loading}
                    className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {t.ask}
                </button>
                {response && (
                    <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded-xl text-sm text-gray-700">
                        {response}
                    </div>
                )}
            </div>
        </div>
    );
};

// Feature Card Component
const FeatureCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    desc: string;
    onClick: () => void;
    color: string;
}> = ({ icon, title, desc, onClick, color }) => (
    <button
        onClick={onClick}
        className={`${color} p-4 rounded-xl text-left hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md w-full`}
    >
        <div className="flex items-center gap-3">
            <div className="p-2 bg-white/80 rounded-lg">{icon}</div>
            <div>
                <h4 className="font-semibold text-sm">{title}</h4>
                <p className="text-xs opacity-80">{desc}</p>
            </div>
        </div>
    </button>
);

const MandiDashboardContent: React.FC = () => {
    const { language, setLanguage, t } = useLanguage();

    // Filter state
    const [filterData, setFilterData] = useState<any>(null);
    const [districts, setDistricts] = useState<string[]>([]);
    const [markets, setMarkets] = useState<string[]>([]);
    const [crops, setCrops] = useState<string[]>([]);
    const [selectedDistrict, setSelectedDistrict] = useState<string>("");
    const [selectedMarket, setSelectedMarket] = useState<string>("");
    const [selectedCrop, setSelectedCrop] = useState<string>("");

    // Data state
    const [currentData, setCurrentData] = useState<DashboardData | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [priceChange, setPriceChange] = useState<number | null>(null);

    // UI state
    const [loading, setLoading] = useState(false);
    const [filterLoading, setFilterLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showAISallagar, setShowAISallagar] = useState(false);
    const [showCropPrediction, setShowCropPrediction] = useState(false);

    // Load filters from API
    useEffect(() => {
        const loadFilters = async () => {
            setFilterLoading(true);
            try {
                const res = await axios.get(`${API_URL}/filters`, { timeout: 10000 });
                if (res.data && Object.keys(res.data).length > 0) {
                    setFilterData(res.data);
                    const districtList = Object.keys(res.data).sort();
                    setDistricts(districtList);
                    if (districtList.length > 0) setSelectedDistrict(districtList[0]);
                } else {
                    throw new Error('Empty');
                }
            } catch {
                setFilterData(FALLBACK_FILTERS);
                const districtList = Object.keys(FALLBACK_FILTERS).sort();
                setDistricts(districtList);
                if (districtList.length > 0) setSelectedDistrict(districtList[0]);
            } finally {
                setFilterLoading(false);
            }
        };
        loadFilters();
    }, []);

    // Update markets when district changes
    useEffect(() => {
        if (selectedDistrict && filterData) {
            const districtData = filterData[selectedDistrict] || {};
            const marketList = Object.keys(districtData).sort();
            setMarkets(marketList);
            if (marketList.length > 0 && !marketList.includes(selectedMarket)) {
                setSelectedMarket(marketList[0]);
            }
        }
    }, [selectedDistrict, filterData]);

    // Update crops when market changes
    useEffect(() => {
        if (selectedDistrict && selectedMarket && filterData) {
            const districtData = filterData[selectedDistrict] || {};
            const cropList = districtData[selectedMarket] || [];
            setCrops(cropList);
            if (cropList.length > 0 && !cropList.includes(selectedCrop)) {
                setSelectedCrop(cropList[0]);
            }
        }
    }, [selectedDistrict, selectedMarket, filterData]);

    // Calculate price change
    const calculatePriceChange = useCallback((data: any[]) => {
        if (!data || data.length < 2) {
            setPriceChange(null);
            return;
        }
        const oldPrice = data[0]?.close || 0;
        const newPrice = data[data.length - 1]?.close || 0;
        if (oldPrice > 0) {
            setPriceChange(parseFloat(((newPrice - oldPrice) / oldPrice * 100).toFixed(1)));
        }
    }, []);

    // Load dashboard data
    const loadDashboardData = useCallback(async () => {
        if (!selectedDistrict || !selectedMarket || !selectedCrop) return;

        setLoading(true);
        setError(null);

        try {
            const res = await axios.get(`${API_URL}/data`, {
                params: { district: selectedDistrict, market: selectedMarket, crop: selectedCrop },
                timeout: 30000
            });
            setCurrentData(res.data);

            const histRes = await axios.get(`${API_URL}/history`, {
                params: { crop: selectedCrop, mandi: selectedMarket },
                timeout: 15000
            });

            setChartData(histRes.data || []);
            calculatePriceChange(histRes.data || []);
        } catch (e) {
            setError(language === 'mr' ? 'डेटा लोड करताना त्रुटी' : 'Error loading data');
            setChartData([]);
        } finally {
            setLoading(false);
        }
    }, [selectedDistrict, selectedMarket, selectedCrop, calculatePriceChange, language]);

    useEffect(() => {
        if (selectedDistrict && selectedMarket && selectedCrop) {
            loadDashboardData();
        }
    }, [selectedDistrict, selectedMarket, selectedCrop, loadDashboardData]);

    // Play voice with dashboard data context
    const playVoiceAdvice = () => {
        if (currentData?.audio_base64) {
            setIsPlaying(true);
            const audio = new Audio(`data:audio/mp3;base64,${currentData.audio_base64}`);
            audio.onended = () => setIsPlaying(false);
            audio.play();
        }
    };

    const getCropName = (crop: string) => language === 'mr' ? (DEFAULT_CROP_TRANSLATIONS[crop] || crop) : crop;
    const getDistrictName = (district: string) => language === 'mr' ? (DEFAULT_DISTRICT_TRANSLATIONS[district] || district) : district;

    // Feature handlers
    const handleSeedSuggestion = () => alert(language === 'mr' ? 'बीज सूचना लवकरच येत आहे!' : 'Seed suggestions coming soon!');
    const handleCropPrediction = () => setShowCropPrediction(true);
    const handleWeatherForecast = () => alert(language === 'mr' ? 'हवामान अंदाज लवकरच येत आहे!' : 'Weather forecast coming soon!');

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-50 via-emerald-50/30 to-white">
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                {/* Header */}
                <header className="mb-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-green-500 rounded-xl">
                                <Sprout className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-green-700">
                                    {t('app.title')}
                                </h1>
                                <p className="text-gray-500 text-sm">{t('app.subtitle')}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* AI Sallagar Button */}
                            <button
                                onClick={() => setShowAISallagar(true)}
                                className="flex items-center gap-1.5 px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full text-xs font-medium transition-colors"
                            >
                                <Sprout className="w-3.5 h-3.5" />
                                {language === 'mr' ? 'AI सल्लागार' : 'AI Advisor'}
                            </button>

                            {/* Voice Agent Button - Uses Dashboard Data */}
                            <button
                                onClick={playVoiceAdvice}
                                disabled={!currentData?.audio_base64 || isPlaying}
                                className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-xs font-medium transition-colors disabled:opacity-50"
                            >
                                {isPlaying ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Volume2 className="w-3.5 h-3.5" />
                                )}
                                {language === 'mr' ? 'ऐका' : 'Listen'}
                            </button>

                            {/* Language Toggle */}
                            <button
                                onClick={() => setLanguage(language === 'mr' ? 'en' : 'mr')}
                                className="flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-medium transition-colors"
                            >
                                <Languages className="w-3.5 h-3.5" />
                                {t('lang.switch')}
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        {filterLoading ? (
                            <div className="flex items-center justify-center py-4">
                                <RefreshCw className="w-5 h-5 text-green-500 animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 font-medium mb-1.5">
                                        {t('filter.district')}
                                    </label>
                                    <select
                                        value={selectedDistrict}
                                        onChange={(e) => setSelectedDistrict(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-green-400"
                                    >
                                        {districts.map(d => <option key={d} value={d}>{getDistrictName(d)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 font-medium mb-1.5">
                                        {t('filter.market')}
                                    </label>
                                    <select
                                        value={selectedMarket}
                                        onChange={(e) => setSelectedMarket(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-green-400"
                                    >
                                        {markets.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 font-medium mb-1.5">
                                        {t('filter.crop')}
                                    </label>
                                    <select
                                        value={selectedCrop}
                                        onChange={(e) => setSelectedCrop(e.target.value)}
                                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-green-400"
                                    >
                                        {crops.map(c => <option key={c} value={c}>{getCropName(c)}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Main Content - Two Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                    {/* Left Column - Price & Features */}
                    <div className="space-y-5">
                        {/* Price Card - Compact */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-semibold text-gray-700">{t('price.title')}</h2>
                                {priceChange !== null && (
                                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${priceChange >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                        }`}>
                                        {priceChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {priceChange >= 0 ? '+' : ''}{priceChange}%
                                    </div>
                                )}
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-6">
                                    <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : currentData?.price_data?.modal_price_kg ? (
                                <div className="text-center py-3">
                                    <div className="text-4xl font-bold text-green-600 mb-1">
                                        ₹{currentData.price_data.modal_price_kg}
                                        <span className="text-base text-gray-400 font-normal">{t('price.perkg')}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {getCropName(selectedCrop)} • {currentData.price_data.market}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-center py-4 text-sm">{t('price.na')}</p>
                            )}

                            {/* Weather Strip */}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                                {currentData?.weather_data ? (
                                    <>
                                        {currentData.weather_data.rain_next_3_days ? (
                                            <CloudRain className="w-4 h-4 text-blue-500" />
                                        ) : (
                                            <Sun className="w-4 h-4 text-amber-500" />
                                        )}
                                        <span className="text-gray-600 text-xs truncate">
                                            {currentData.weather_data.forecast_text}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-gray-400 text-xs">{t('weather.loading')}</span>
                                )}
                            </div>
                        </div>

                        {/* Feature Navigation Cards */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-700 px-1">
                                {language === 'mr' ? 'वैशिष्ट्ये' : 'Features'}
                            </h3>
                            <FeatureCard
                                icon={<Leaf className="w-5 h-5 text-green-600" />}
                                title={language === 'mr' ? 'बीज सूचना' : 'Seed Suggestions'}
                                desc={language === 'mr' ? 'सर्वोत्तम बीज शोधा' : 'Find best seeds'}
                                onClick={handleSeedSuggestion}
                                color="bg-green-50 hover:bg-green-100 text-green-800"
                            />
                            <FeatureCard
                                icon={<Wheat className="w-5 h-5 text-amber-600" />}
                                title={language === 'mr' ? 'पीक अंदाज' : 'Crop Prediction'}
                                desc={language === 'mr' ? 'AI वर आधारित शिफारस' : 'AI-based recommendation'}
                                onClick={handleCropPrediction}
                                color="bg-amber-50 hover:bg-amber-100 text-amber-800"
                            />
                            <FeatureCard
                                icon={<CloudSun className="w-5 h-5 text-blue-600" />}
                                title={language === 'mr' ? 'हवामान अंदाज' : 'Weather Forecast'}
                                desc={language === 'mr' ? '7 दिवसांचा अंदाज' : '7-day forecast'}
                                onClick={handleWeatherForecast}
                                color="bg-blue-50 hover:bg-blue-100 text-blue-800"
                            />
                        </div>
                    </div>

                    {/* Right Column - Large Chart */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-semibold text-gray-700">{t('chart.title')}</h2>
                                <span className="text-xs text-gray-400">{t('chart.period')}</span>
                            </div>
                            <div className="h-80 w-full">
                                {loading ? (
                                    <div className="flex items-center justify-center h-full">
                                        <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
                                    </div>
                                ) : chartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(value) => value?.substring(5) || value}
                                            />
                                            <YAxis
                                                domain={['auto', 'auto']}
                                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                                axisLine={false}
                                                tickLine={false}
                                                tickFormatter={(value) => `₹${value}`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    borderRadius: '12px',
                                                    border: '1px solid #e5e7eb',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                    fontSize: '12px'
                                                }}
                                                formatter={(value: any) => [`₹${value}`, language === 'mr' ? 'भाव' : 'Price']}
                                                labelFormatter={(label) => `${language === 'mr' ? 'तारीख' : 'Date'}: ${label}`}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="close"
                                                stroke="#22c55e"
                                                strokeWidth={2.5}
                                                fill="url(#colorClose)"
                                                dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
                                                activeDot={{ r: 6, fill: '#22c55e', stroke: '#fff', strokeWidth: 2 }}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                        {language === 'mr' ? 'चार्ट डेटा उपलब्ध नाही' : 'No chart data available'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Sallagar Modal */}
            <AISallagarModal
                isOpen={showAISallagar}
                onClose={() => setShowAISallagar(false)}
                language={language}
            />

            {/* Crop Prediction Modal */}
            <CropPredictionModal
                isOpen={showCropPrediction}
                onClose={() => setShowCropPrediction(false)}
                language={language}
            />
        </div>
    );
};

const MandiDashboard: React.FC = () => {
    return (
        <LanguageProvider>
            <MandiDashboardContent />
        </LanguageProvider>
    );
};

export default MandiDashboard;
