import React, { useState, useEffect } from 'react';
import { X, Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, ThermometerSun, Calendar, MapPin, Loader2, CloudSun, Umbrella, Sunrise, Sunset } from 'lucide-react';

interface WeatherForecastModalProps {
    isOpen: boolean;
    onClose: () => void;
    language: 'mr' | 'en';
    district: string;
}

interface DayForecast {
    date: string;
    day: string;
    tempHigh: number;
    tempLow: number;
    condition: 'sunny' | 'cloudy' | 'rainy' | 'partly_cloudy' | 'stormy';
    humidity: number;
    windSpeed: number;
    rainChance: number;
    description: string;
}

// Translations
const translations = {
    mr: {
        title: 'हवामान अंदाज',
        subtitle: '7 दिवसांचा अंदाज',
        today: 'आज',
        tomorrow: 'उद्या',
        high: 'उच्च',
        low: 'कमी',
        humidity: 'आर्द्रता',
        wind: 'वारा',
        rainChance: 'पावसाची शक्यता',
        close: 'बंद करा',
        sunny: 'सनी',
        cloudy: 'ढगाळ',
        rainy: 'पावसाळी',
        partly_cloudy: 'अंशतः ढगाळ',
        stormy: 'वादळी',
        farmingAdvice: 'शेती सल्ला',
        days: {
            'Sun': 'रवि',
            'Mon': 'सोम',
            'Tue': 'मंगळ',
            'Wed': 'बुध',
            'Thu': 'गुरु',
            'Fri': 'शुक्र',
            'Sat': 'शनि'
        }
    },
    en: {
        title: 'Weather Forecast',
        subtitle: '7-day forecast',
        today: 'Today',
        tomorrow: 'Tomorrow',
        high: 'High',
        low: 'Low',
        humidity: 'Humidity',
        wind: 'Wind',
        rainChance: 'Rain Chance',
        close: 'Close',
        sunny: 'Sunny',
        cloudy: 'Cloudy',
        rainy: 'Rainy',
        partly_cloudy: 'Partly Cloudy',
        stormy: 'Stormy',
        farmingAdvice: 'Farming Advice',
        days: {
            'Sun': 'Sun',
            'Mon': 'Mon',
            'Tue': 'Tue',
            'Wed': 'Wed',
            'Thu': 'Thu',
            'Fri': 'Fri',
            'Sat': 'Sat'
        }
    }
};

// Get farming advice based on weather
const getFarmingAdvice = (forecast: DayForecast[], language: 'mr' | 'en'): string[] => {
    const advice: string[] = [];
    const rainyDays = forecast.filter(d => d.rainChance > 50).length;
    const hotDays = forecast.filter(d => d.tempHigh > 35).length;

    if (language === 'mr') {
        if (rainyDays >= 3) {
            advice.push('🌧️ पुढील आठवड्यात पाऊस अपेक्षित - सिंचन कमी करा');
            advice.push('🌾 धान्य वाळवण्यासाठी योग्य व्यवस्था करा');
        } else if (rainyDays === 0) {
            advice.push('☀️ कोरडे हवामान - नियमित सिंचन आवश्यक');
        }
        if (hotDays >= 3) {
            advice.push('🌡️ उष्ण हवामान - सकाळी लवकर किंवा संध्याकाळी सिंचन करा');
        }
        if (forecast[0].windSpeed > 15) {
            advice.push('💨 जोरदार वारे - फवारणी टाळा');
        }
        if (advice.length === 0) {
            advice.push('✅ शेतीच्या कामांसाठी अनुकूल हवामान');
        }
    } else {
        if (rainyDays >= 3) {
            advice.push('🌧️ Rain expected this week - reduce irrigation');
            advice.push('🌾 Arrange proper grain drying facilities');
        } else if (rainyDays === 0) {
            advice.push('☀️ Dry weather ahead - ensure regular irrigation');
        }
        if (hotDays >= 3) {
            advice.push('🌡️ Hot weather - irrigate early morning or evening');
        }
        if (forecast[0].windSpeed > 15) {
            advice.push('💨 Strong winds - avoid spraying pesticides');
        }
        if (advice.length === 0) {
            advice.push('✅ Favorable weather for farming activities');
        }
    }

    return advice;
};

// Generate 7-day forecast based on location and season
const generateForecast = (district: string): DayForecast[] => {
    const forecast: DayForecast[] = [];
    const today = new Date();
    const month = today.getMonth();

    // Seasonal base temperatures for Maharashtra
    let baseTemp = 28;
    let rainBase = 10;

    // Adjust for season
    if (month >= 2 && month <= 4) { // Mar-May (Summer)
        baseTemp = 35;
        rainBase = 5;
    } else if (month >= 5 && month <= 8) { // Jun-Sep (Monsoon)
        baseTemp = 28;
        rainBase = 60;
    } else if (month >= 9 && month <= 10) { // Oct-Nov (Post-monsoon)
        baseTemp = 30;
        rainBase = 20;
    } else { // Dec-Feb (Winter)
        baseTemp = 25;
        rainBase = 5;
    }

    // Adjust for coastal vs inland districts
    const coastalDistricts = ['Mumbai', 'Thane', 'Raigad', 'Ratnagiri', 'Sindhudurg', 'Palghar'];
    if (coastalDistricts.includes(district)) {
        baseTemp -= 3;
        rainBase += 10;
    }

    const vidarbhaDistricts = ['Nagpur', 'Wardha', 'Chandrapur', 'Amravati', 'Akola', 'Yavatmal'];
    if (vidarbhaDistricts.includes(district)) {
        baseTemp += 3;
        rainBase -= 5;
    }

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const conditions: ('sunny' | 'cloudy' | 'rainy' | 'partly_cloudy' | 'stormy')[] =
        ['sunny', 'cloudy', 'rainy', 'partly_cloudy', 'stormy'];

    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);

        const tempVariation = Math.sin(i * 0.5) * 3 + (Math.random() - 0.5) * 4;
        const tempHigh = Math.round(baseTemp + tempVariation);
        const tempLow = Math.round(tempHigh - 8 - Math.random() * 4);
        const rainChance = Math.max(0, Math.min(100, rainBase + (Math.random() - 0.3) * 40));

        let condition: 'sunny' | 'cloudy' | 'rainy' | 'partly_cloudy' | 'stormy';
        if (rainChance > 70) condition = 'rainy';
        else if (rainChance > 50) condition = 'stormy';
        else if (rainChance > 30) condition = 'partly_cloudy';
        else if (rainChance > 15) condition = 'cloudy';
        else condition = 'sunny';

        forecast.push({
            date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            day: dayNames[date.getDay()],
            tempHigh,
            tempLow,
            condition,
            humidity: Math.round(40 + rainChance * 0.5 + Math.random() * 20),
            windSpeed: Math.round(5 + Math.random() * 20),
            rainChance: Math.round(rainChance),
            description: ''
        });
    }

    return forecast;
};

const WeatherIcon: React.FC<{ condition: string; size?: string }> = ({ condition, size = 'w-8 h-8' }) => {
    switch (condition) {
        case 'sunny':
            return <Sun className={`${size} text-amber-500`} />;
        case 'cloudy':
            return <Cloud className={`${size} text-gray-400`} />;
        case 'rainy':
            return <CloudRain className={`${size} text-blue-500`} />;
        case 'partly_cloudy':
            return <CloudSun className={`${size} text-amber-400`} />;
        case 'stormy':
            return <CloudRain className={`${size} text-indigo-500`} />;
        default:
            return <Sun className={`${size} text-amber-500`} />;
    }
};

const WeatherForecastModal: React.FC<WeatherForecastModalProps> = ({
    isOpen,
    onClose,
    language,
    district
}) => {
    const t = translations[language];
    const [forecast, setForecast] = useState<DayForecast[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(0);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            // Simulate API call delay
            setTimeout(() => {
                setForecast(generateForecast(district));
                setLoading(false);
            }, 500);
        }
    }, [isOpen, district]);

    if (!isOpen) return null;

    const farmingAdvice = forecast.length > 0 ? getFarmingAdvice(forecast, language) : [];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 p-5 text-white relative overflow-hidden">
                    {/* Animated clouds background */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-2 left-10 animate-pulse"><Cloud className="w-12 h-12" /></div>
                        <div className="absolute top-4 right-20 animate-pulse delay-150"><Cloud className="w-8 h-8" /></div>
                        <div className="absolute bottom-2 right-10 animate-pulse delay-300"><Sun className="w-10 h-10" /></div>
                    </div>

                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                <CloudSun className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{t.title}</h2>
                                <div className="flex items-center gap-1 text-white/80 text-sm">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span>{district}, Maharashtra</span>
                                </div>
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
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">Loading forecast...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Today's Weather - Hero Card */}
                            {forecast[0] && (
                                <div className="bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50 rounded-2xl p-6 mb-5 border border-blue-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-blue-600 font-medium mb-1">{t.today}</p>
                                            <div className="flex items-end gap-2">
                                                <span className="text-5xl font-bold text-gray-800">{forecast[0].tempHigh}°</span>
                                                <span className="text-2xl text-gray-400 mb-1">/{forecast[0].tempLow}°</span>
                                            </div>
                                            <p className="text-gray-600 mt-1 capitalize">
                                                {t[forecast[0].condition as keyof typeof t] || forecast[0].condition}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <WeatherIcon condition={forecast[0].condition} size="w-20 h-20" />
                                        </div>
                                    </div>

                                    {/* Today's Details */}
                                    <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-blue-100">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-blue-500 mb-1">
                                                <Droplets className="w-4 h-4" />
                                                <span className="text-xs font-medium">{t.humidity}</span>
                                            </div>
                                            <p className="text-lg font-semibold text-gray-700">{forecast[0].humidity}%</p>
                                        </div>
                                        <div className="text-center border-x border-blue-100">
                                            <div className="flex items-center justify-center gap-1.5 text-blue-500 mb-1">
                                                <Wind className="w-4 h-4" />
                                                <span className="text-xs font-medium">{t.wind}</span>
                                            </div>
                                            <p className="text-lg font-semibold text-gray-700">{forecast[0].windSpeed} km/h</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-blue-500 mb-1">
                                                <Umbrella className="w-4 h-4" />
                                                <span className="text-xs font-medium">{t.rainChance}</span>
                                            </div>
                                            <p className="text-lg font-semibold text-gray-700">{forecast[0].rainChance}%</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 7-Day Forecast */}
                            <div className="mb-5">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    {t.subtitle}
                                </h3>
                                <div className="grid grid-cols-7 gap-2">
                                    {forecast.map((day, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedDay(index)}
                                            className={`p-3 rounded-xl text-center transition-all ${selectedDay === index
                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-105'
                                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            <p className={`text-xs font-medium mb-1 ${selectedDay === index ? 'text-blue-100' : 'text-gray-500'}`}>
                                                {index === 0 ? (language === 'mr' ? 'आज' : 'Today') :
                                                    index === 1 ? (language === 'mr' ? 'उद्या' : 'Tom') :
                                                        t.days[day.day as keyof typeof t.days] || day.day}
                                            </p>
                                            <div className={`mx-auto mb-1 ${selectedDay === index ? 'opacity-100' : 'opacity-80'}`}>
                                                <WeatherIcon condition={day.condition} size="w-6 h-6" />
                                            </div>
                                            <p className={`text-sm font-bold ${selectedDay === index ? 'text-white' : 'text-gray-800'}`}>
                                                {day.tempHigh}°
                                            </p>
                                            <p className={`text-xs ${selectedDay === index ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {day.tempLow}°
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Selected Day Details */}
                            {forecast[selectedDay] && selectedDay > 0 && (
                                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <WeatherIcon condition={forecast[selectedDay].condition} size="w-12 h-12" />
                                            <div>
                                                <p className="font-semibold text-gray-800">{forecast[selectedDay].date}</p>
                                                <p className="text-sm text-gray-500 capitalize">
                                                    {t[forecast[selectedDay].condition as keyof typeof t] || forecast[selectedDay].condition}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-gray-800">{forecast[selectedDay].tempHigh}°</p>
                                            <p className="text-sm text-gray-400">{t.low}: {forecast[selectedDay].tempLow}°</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <Droplets className="w-4 h-4 text-blue-400" />
                                            <span className="text-sm text-gray-600">{forecast[selectedDay].humidity}%</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Wind className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-600">{forecast[selectedDay].windSpeed} km/h</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Umbrella className="w-4 h-4 text-indigo-400" />
                                            <span className="text-sm text-gray-600">{forecast[selectedDay].rainChance}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Farming Advice */}
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                                <h3 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                                    <ThermometerSun className="w-4 h-4" />
                                    {t.farmingAdvice}
                                </h3>
                                <ul className="space-y-2">
                                    {farmingAdvice.map((advice, index) => (
                                        <li key={index} className="text-sm text-green-800 flex items-start gap-2">
                                            <span>{advice}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
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

export default WeatherForecastModal;
