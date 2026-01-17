import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Sprout,
    X,
    Loader2,
    ChevronRight,
    Info,
    Calendar,
    Scale,
    Tag,
    Volume2,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    MapPin
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { API_URL } from '../config';

interface SeedVariety {
    name: string;
    marathi_name?: string;
    english_name?: string;
    quantity: string;
    season: string;
    features: string[];
    price: string;
    sowing_months: string[];
    harvest_days: string | number;
    suitable_for_district: boolean;
    is_current_season: boolean;
}

interface SeedSuggestionResponse {
    found: boolean;
    crop: string;
    crop_marathi: string;
    current_season: string;
    varieties: SeedVariety[];
    recommendation: string;
    advice_text?: string;
    audio_base64?: string;
}

interface SeedCrop {
    name: string;
    marathi_name: string;
    variety_count: number;
}

interface SeedSuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCrop?: string;
    initialDistrict?: string;
}

const SeedSuggestionModal: React.FC<SeedSuggestionModalProps> = ({
    isOpen,
    onClose,
    initialCrop = "",
    initialDistrict = ""
}) => {
    const { language } = useLanguage();
    const [availableCrops, setAvailableCrops] = useState<SeedCrop[]>([]);
    const [selectedCrop, setSelectedCrop] = useState(initialCrop);
    const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
    const [loading, setLoading] = useState(false);
    const [suggestionData, setSuggestionData] = useState<SeedSuggestionResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Update selection when props change (only when modal opens)
    useEffect(() => {
        if (isOpen) {
            if (initialCrop) setSelectedCrop(initialCrop);
            if (initialDistrict) setSelectedDistrict(initialDistrict);
        }
    }, [isOpen, initialCrop, initialDistrict]);

    // Fetch available crops on mount
    useEffect(() => {
        if (isOpen) {
            const fetchCrops = async () => {
                try {
                    const res = await axios.get(`${API_URL}/seeds/crops`, { params: { language } });
                    setAvailableCrops(res.data);

                    // If no crop selected yet, or to find a best match for initialCrop
                    if (res.data.length > 0) {
                        const current = selectedCrop || initialCrop;
                        const match = res.data.find((c: any) => c.name.toLowerCase() === current.toLowerCase());
                        if (match) setSelectedCrop(match.name);
                        else if (!selectedCrop) setSelectedCrop(res.data[0].name);
                    }
                } catch (err) {
                    console.error("Failed to fetch seed crops", err);
                }
            };
            fetchCrops();
        }
    }, [isOpen, language]);

    // Fetch suggestions when crop/district changes
    useEffect(() => {
        if (isOpen && selectedCrop) {
            fetchSuggestions();
        }
    }, [isOpen, selectedCrop, selectedDistrict]);

    const fetchSuggestions = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_URL}/seeds`, {
                params: {
                    crop: selectedCrop,
                    district: selectedDistrict,
                    language: language
                }
            });
            setSuggestionData(res.data);
        } catch (err) {
            setError(language === 'mr' ? 'माहिती मिळवण्यात अडचण आली' : 'Failed to fetch seed suggestions');
        } finally {
            setLoading(false);
        }
    };

    const playAudio = () => {
        if (suggestionData?.audio_base64) {
            const audio = new Audio(`data:audio/mp3;base64,${suggestionData.audio_base64}`);
            setIsPlaying(true);
            audio.onended = () => setIsPlaying(false);
            audio.play();
        }
    };

    if (!isOpen) return null;

    const t = {
        mr: {
            title: "बीज शिफारस डॅशबोर्ड",
            subtitle: "तुमच्या पिकासाठी सर्वोत्तम वाण निवडा",
            selectCrop: "पीक निवडा",
            selectDistrict: "जिल्हा निवडा (पर्यायी)",
            recommendation: "तज्ञांचा सल्ला",
            varieties: "उपलब्ध सुधारित वाण",
            perAcre: "प्रति एकर",
            harvest: "काढणी दिवस",
            price: "अंदाजे किंमत",
            features: "वैशिष्ट्ये",
            sowing: "पेरणीचा काळ",
            listen: "सल्ला ऐका",
            noData: "माहिती उपलब्ध नाही",
            bestChoice: "सर्वोत्तम निवड",
            currentSeason: "चालू हंगामासाठी"
        },
        en: {
            title: "Seed Suggestion Dashboard",
            subtitle: "Choose the best variety for your crop",
            selectCrop: "Select Crop",
            selectDistrict: "Select District (Optional)",
            recommendation: "Expert Recommendation",
            varieties: "Available Improved Varieties",
            perAcre: "Per Acre",
            harvest: "Harvest Days",
            price: "Approx Price",
            features: "Key Features",
            sowing: "Sowing Months",
            listen: "Listen to Advice",
            noData: "No data available",
            bestChoice: "Recommended Choice",
            currentSeason: "Current Season"
        }
    }[language === 'mr' ? 'mr' : 'en'];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-emerald-100">

                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-500 p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute right-6 top-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <Sprout className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{t.title}</h2>
                            <p className="text-emerald-50/80 text-sm">{t.subtitle}</p>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="bg-emerald-50/50 p-4 border-b border-emerald-100 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-emerald-700 mb-1 ml-1 uppercase">{t.selectCrop}</label>
                        <div className="relative">
                            <select
                                value={selectedCrop}
                                onChange={(e) => setSelectedCrop(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                            >
                                {availableCrops.map(crop => (
                                    <option key={crop.name} value={crop.name}>
                                        {language === 'mr' ? crop.marathi_name : crop.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 rotate-90" />
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-emerald-700 mb-1 ml-1 uppercase">{t.selectDistrict}</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                            <input
                                type="text"
                                value={selectedDistrict}
                                onChange={(e) => setSelectedDistrict(e.target.value)}
                                placeholder="e.g. Pune"
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="md:pt-5">
                        <button
                            onClick={playAudio}
                            disabled={!suggestionData?.audio_base64 || isPlaying}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-200 disabled:opacity-50"
                        >
                            {isPlaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                            {t.listen}
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-3">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                                <Sprout className="w-6 h-6 text-emerald-600 absolute inset-0 m-auto" />
                            </div>
                            <p className="text-emerald-700 font-medium animate-pulse">
                                {language === 'mr' ? 'सर्वोत्तम वाण शोधत आहे...' : 'Scanning best varieties...'}
                            </p>
                        </div>
                    ) : suggestionData && suggestionData.found ? (
                        <div className="space-y-6">

                            {/* Expert Recommendation Banner */}
                            <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-sm overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <TrendingUp className="w-24 h-24 text-emerald-600" />
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-emerald-100 rounded-lg shrink-0">
                                        <Info className="w-6 h-6 text-emerald-700" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-emerald-900 mb-1">{t.recommendation}</h3>
                                        <p className="text-gray-700 leading-relaxed">{suggestionData.recommendation}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Varieties Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {suggestionData.varieties.map((variety, idx) => (
                                    <div
                                        key={idx}
                                        className={`bg-white border rounded-2xl p-5 transition-all hover:shadow-lg hover:border-emerald-300 group ${idx === 0 ? 'border-emerald-200 ring-1 ring-emerald-50 shadow-md ring-opacity-50' : 'border-gray-100'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="text-lg font-bold text-gray-900">{variety.name}</h4>
                                                    {idx === 0 && (
                                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                                            {t.bestChoice}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 font-medium uppercase tracking-tighter">
                                                    {variety.marathi_name || variety.name}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${variety.is_current_season ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {variety.season}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-5">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <Scale className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-semibold uppercase">{t.perAcre}</span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-700">{variety.quantity}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-semibold uppercase">{t.harvest}</span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-700">{variety.harvest_days} Days</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <Tag className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-semibold uppercase">{t.price}</span>
                                                </div>
                                                <p className="text-sm font-bold text-emerald-600">{variety.price}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <div className="w-3.5 h-3.5 flex items-center justify-center">
                                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                    </div>
                                                    <span className="text-[10px] font-semibold uppercase">{t.sowing}</span>
                                                </div>
                                                <p className="text-xs font-semibold text-gray-600 truncate">{variety.sowing_months.join(', ')}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.features}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {variety.features.map((feature, fIdx) => (
                                                    <div key={fIdx} className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 group-hover:border-emerald-100 transition-colors">
                                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                        <span className="text-xs text-gray-600">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <div className="p-4 bg-gray-100 rounded-full mb-4">
                                <AlertCircle className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-gray-600 font-bold mb-1">{t.noData}</h3>
                            <p className="text-gray-400 text-sm">{language === 'mr' ? 'दुसरे पीक निवडून प्रयत्न करा.' : 'Please try selecting a different crop.'}</p>
                        </div>
                    )}
                </div>

                {/* Footer Disclaimer */}
                <div className="p-4 bg-white border-t border-gray-100 text-[10px] text-gray-400 text-center uppercase tracking-wide">
                    Disclaimer: These suggestions are for informational purposes. Always consult local agricultural experts before sowing.
                </div>
            </div>
        </div>
    );
};

export default SeedSuggestionModal;
