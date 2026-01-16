import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Mic, Play, MessageSquare, Star, Sprout, CloudRain } from 'lucide-react';

const API_URL = "http://127.0.0.1:8000";

// --- HARCODED FALLBACK DATA ---
// Prevents "dropdowns gone" issue if API fails or is slow
const FALLBACK_FILTERS: any = {
    "Ahmednagar": {
        "Rahata": ["Tomato", "Onion", "Soybean", "Wheat", "Pomegranate"],
        "Kopargaon": ["Tomato", "Onion", "Soybean", "Maize"],
        "Sangamner": ["Tomato", "Onion", "Pomegranate"]
    },
    "Pune": {
        "Pune": ["Tomato", "Onion", "Potato", "Ginger", "Garlic"],
        "Manchar": ["Tomato", "Onion", "Potato"],
        "Junnar": ["Tomato", "Onion", "Banana"]
    },
    "Nashik": {
        "Nashik": ["Onion", "Tomato", "Grapes", "Pomegranate"],
        "Lasalgaon": ["Onion", "Tomato", "Maize"],
        "Yeola": ["Onion", "Tomato", "Maize"]
    },
    "Solapur": {
        "Solapur": ["Onion", "Maize", "Pomegranate", "Tur"],
        "Pandharpur": ["Maize", "Jowar", "Pomegranate"]
    }
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

const MandiDashboard: React.FC = () => {
    // --- State ---
    const [filterData, setFilterData] = useState<any>(FALLBACK_FILTERS); // Init with fallback immediately

    // Dropdown Lists
    const [districts, setDistricts] = useState<string[]>(Object.keys(FALLBACK_FILTERS));
    const [markets, setMarkets] = useState<string[]>([]);
    const [crops, setCrops] = useState<string[]>([]);

    // Selected Values
    const [selectedDistrict, setSelectedDistrict] = useState<string>("Ahmednagar");
    const [selectedMarket, setSelectedMarket] = useState<string>("Rahata");
    const [selectedCrop, setSelectedCrop] = useState<string>("Tomato");

    // Data State
    const [currentData, setCurrentData] = useState<DashboardData | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [reviews, setReviews] = useState<{ user: string, text: string, rating: number }[]>([
        { user: "Ramesh P.", text: "Salla khup chan aahe!", rating: 5 }
    ]);
    const [newReview, setNewReview] = useState("");
    const [loading, setLoading] = useState(false);

    // --- Effects ---

    // 1. Load Real Filters from API (Optional Enhancement)
    useEffect(() => {
        axios.get(`${API_URL}/filters`)
            .then(res => {
                if (res.data && Object.keys(res.data).length > 0) {
                    // Update with real data if valid
                    console.log("Loaded live filters");
                    setFilterData(res.data);
                    setDistricts(Object.keys(res.data));
                }
            })
            .catch(err => {
                console.warn("Using fallback filters due to API error:", err);
                // No action needed, fallback already loaded
            });
    }, []);

    // 2. Cascade: District -> Markets
    useEffect(() => {
        if (selectedDistrict && filterData) {
            const districtData = filterData[selectedDistrict] || {};
            const mkts = Object.keys(districtData).sort();
            setMarkets(mkts);

            // Auto-select first market if current selection is invalid
            if (!mkts.includes(selectedMarket)) {
                if (mkts.length > 0) setSelectedMarket(mkts[0]);
                else setSelectedMarket("");
            }
        }
    }, [selectedDistrict, filterData]); // dependency on filterData ensures update if API loads

    // 3. Cascade: Market -> Crops
    useEffect(() => {
        if (selectedDistrict && selectedMarket && filterData) {
            const districtData = filterData[selectedDistrict] || {};
            const availCrops = districtData[selectedMarket] || [];
            setCrops(availCrops);

            // Auto-select first crop if current selection is invalid
            if (!availCrops.includes(selectedCrop)) {
                if (availCrops.length > 0) setSelectedCrop(availCrops[0]);
                else setSelectedCrop("");
            }
        }
    }, [selectedDistrict, selectedMarket, filterData]);

    // 4. Fetch Main Data & Chart
    useEffect(() => {
        if (selectedDistrict && selectedMarket && selectedCrop) {
            loadDashboardData();
        }
    }, [selectedDistrict, selectedMarket, selectedCrop]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // A. Current Price & Advice
            const res = await axios.get(`${API_URL}/data`, {
                params: {
                    district: selectedDistrict,
                    market: selectedMarket,
                    crop: selectedCrop
                }
            });
            setCurrentData(res.data);

            // B. History Chart
            // If explicit market is selected, use it. Else fall back to nearest.
            const mandiForChart = selectedMarket || res.data?.location?.nearest_mandi || "Rahata";
            const histRes = await axios.get(`${API_URL}/history?crop=${selectedCrop}&mandi=${mandiForChart}`);
            setChartData(histRes.data || []);

        } catch (e) {
            console.error("Error fetching dashboard data", e);
            // Don't crash, just show empty state
            setChartData([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Actions ---
    const playAudio = () => {
        if (currentData?.audio_base64) {
            const audio = new Audio(`data:audio/mp3;base64,${currentData.audio_base64}`);
            audio.play();
        }
    };

    const addReview = () => {
        if (newReview) {
            setReviews([...reviews, { user: "Farmer", text: newReview, rating: 4 }]);
            setNewReview("");
        }
    }

    return (
        <div className="p-6 bg-green-50 min-h-screen font-sans text-gray-800">
            <header className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-green-800 flex items-center gap-2">
                        <Sprout className="w-8 h-8" /> Shetkari Mitra
                    </h1>
                    <p className="text-sm text-green-600">Smart Mandi Assistant for Maharashtra</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 bg-white p-3 rounded-xl shadow-sm border border-green-100">
                    <div className="flex flex-col">
                        <label className="text-xs text-green-600 font-bold ml-1">Zilla (District)</label>
                        <select
                            value={selectedDistrict}
                            onChange={(e) => setSelectedDistrict(e.target.value)}
                            className="p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 outline-none min-w-[140px]"
                        >
                            {districts.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs text-green-600 font-bold ml-1">Mandi (Market)</label>
                        <select
                            value={selectedMarket}
                            onChange={(e) => setSelectedMarket(e.target.value)}
                            className="p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 outline-none min-w-[140px]"
                        >
                            {markets.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs text-green-600 font-bold ml-1">Pik (Crop)</label>
                        <select
                            value={selectedCrop}
                            onChange={(e) => setSelectedCrop(e.target.value)}
                            className="p-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 outline-none min-w-[140px]"
                        >
                            {crops.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Col: Current Status & Voice Agent */}
                <div className="md:col-span-1 space-y-6">
                    {/* Price Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
                        <h2 className="text-xl font-semibold mb-4 text-gray-700">Aajcha Bajar Bhav</h2>
                        {loading ? <p>Loading...</p> : currentData ? (
                            <div className="text-center py-4">
                                {currentData.price_data.modal_price_kg > 0 ? (
                                    <div className="text-5xl font-bold text-green-700 mb-2">₹{currentData.price_data.modal_price_kg}<span className="text-lg text-gray-400">/kg</span></div>
                                ) : (
                                    <div className="text-3xl font-bold text-gray-400 mb-2">Data N/A</div>
                                )}
                                <div className="text-sm text-gray-500">{currentData.price_data.market} Mandi</div>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-4">Select filters to see price</p>
                        )}

                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-blue-600">
                            <CloudRain className="w-5 h-5" />
                            <span>{currentData?.weather_data.forecast_text || "Weather loading..."}</span>
                        </div>
                    </div>

                    {/* AI Voice Agent */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl shadow-sm border border-blue-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Mic className="w-24 h-24 text-blue-800" /></div>
                        <h2 className="text-xl font-semibold mb-2 text-blue-900">AI Salla (Review)</h2>
                        <p className="text-sm text-blue-800 mb-4 h-24 overflow-auto italic">
                            "{currentData?.advice_marathi || 'Sadhya salla uplabdh nahi...'}"
                        </p>
                        <button
                            onClick={playAudio}
                            disabled={!currentData?.audio_base64}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
                        >
                            <Play className="w-5 h-5" /> Aika (Listen)
                        </button>
                    </div>
                </div>

                {/* Right Col: Charts & Reviews */}
                <div className="md:col-span-2 space-y-6">
                    {/* Chart Section - LINE CHART (Stable) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold mb-6 flex justify-between">
                            <span>Bhav Cha Alekh (Trend)</span>
                            <span className="text-sm font-normal text-gray-400">Last 30 Days</span>
                        </h2>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="date" hide />
                                    <YAxis domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="close"
                                        stroke="#16a34a"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Review Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-yellow-500" /> Farmer Reviews
                        </h2>

                        <div className="space-y-4 mb-6 max-h-40 overflow-auto pr-2">
                            {reviews.map((rev, idx) => (
                                <div key={idx} className="bg-gray-50 p-3 rounded-lg text-sm">
                                    <div className="flex justify-between font-semibold text-gray-700">
                                        <span>{rev.user}</span>
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'fill-current' : 'text-gray-300'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 mt-1">{rev.text}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newReview}
                                onChange={(e) => setNewReview(e.target.value)}
                                placeholder="Tumcha abhipray lih.."
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <button
                                onClick={addReview}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
                            >
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MandiDashboard;
