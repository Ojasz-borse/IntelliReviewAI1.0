import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'mr' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
    mr: {
        // Header
        'app.title': 'शेतकरी मित्र',
        'app.subtitle': 'महाराष्ट्रासाठी स्मार्ट मंडी सहाय्यक',

        // Filter labels
        'filter.district': 'जिल्हा',
        'filter.market': 'मंडी',
        'filter.crop': 'पीक',

        // Price card
        'price.title': 'आजचा बाजार भाव',
        'price.loading': 'लोड होत आहे...',
        'price.select': 'भाव पाहण्यासाठी निवड करा',
        'price.na': 'माहिती उपलब्ध नाही',
        'price.perkg': '/किलो',
        'price.mandi': 'मंडी',

        // Weather
        'weather.loading': 'हवामान लोड होत आहे...',
        'weather.rain': 'पुढील ३ दिवसात पाऊस',
        'weather.norain': 'पाऊस नाही',

        // AI Advice
        'ai.title': 'AI सल्ला',
        'ai.default': 'सध्या सल्ला उपलब्ध नाही...',
        'ai.listen': 'ऐका',

        // Chart
        'chart.title': 'भावाचा आलेख',
        'chart.period': 'मागील ३० दिवस',

        // Reviews
        'reviews.title': 'शेतकरी अभिप्राय',
        'reviews.placeholder': 'तुमचा अभिप्राय लिहा...',
        'reviews.post': 'पाठवा',
        'reviews.farmer': 'शेतकरी',

        // Features
        'features.realtime': 'रिअल-टाइम भाव',
        'features.realtime.desc': 'मंडीमधील लाइव्ह बाजार भाव',
        'features.weather': 'हवामान अंदाज',
        'features.weather.desc': '३ दिवसांचा हवामान अहवाल',
        'features.ai': 'AI सल्ला',
        'features.ai.desc': 'स्मार्ट विक्री शिफारसी',
        'features.voice': 'आवाज सहाय्य',
        'features.voice.desc': 'मराठीमध्ये ऐका',

        // Language toggle
        'lang.switch': 'English',
        'lang.current': 'मराठी',

        // Common
        'back': 'मागे जा',
        'loading': 'लोड होत आहे...',
        'error': 'त्रुटी',
        'retry': 'पुन्हा प्रयत्न करा',
    },
    en: {
        // Header
        'app.title': 'Shetkari Mitra',
        'app.subtitle': 'Smart Mandi Assistant for Maharashtra',

        // Filter labels
        'filter.district': 'District',
        'filter.market': 'Market',
        'filter.crop': 'Crop',

        // Price card
        'price.title': "Today's Market Price",
        'price.loading': 'Loading...',
        'price.select': 'Select filters to see price',
        'price.na': 'Data Not Available',
        'price.perkg': '/kg',
        'price.mandi': 'Mandi',

        // Weather
        'weather.loading': 'Weather loading...',
        'weather.rain': 'Rain expected in next 3 days',
        'weather.norain': 'No rain expected',

        // AI Advice
        'ai.title': 'AI Advice',
        'ai.default': 'Advice not available currently...',
        'ai.listen': 'Listen',

        // Chart
        'chart.title': 'Price Trend',
        'chart.period': 'Last 30 Days',

        // Reviews
        'reviews.title': 'Farmer Reviews',
        'reviews.placeholder': 'Write your review...',
        'reviews.post': 'Post',
        'reviews.farmer': 'Farmer',

        // Features
        'features.realtime': 'Real-time Prices',
        'features.realtime.desc': 'Live market prices from Mandis',
        'features.weather': 'Weather Forecast',
        'features.weather.desc': '3-day weather report',
        'features.ai': 'AI Advice',
        'features.ai.desc': 'Smart selling recommendations',
        'features.voice': 'Voice Support',
        'features.voice.desc': 'Listen in Marathi',

        // Language toggle
        'lang.switch': 'मराठी',
        'lang.current': 'English',

        // Common
        'back': 'Go Back',
        'loading': 'Loading...',
        'error': 'Error',
        'retry': 'Try Again',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        // Try to get saved preference from localStorage
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('shetkari-lang');
            if (saved === 'mr' || saved === 'en') return saved;
        }
        return 'mr'; // Default to Marathi
    });

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        if (typeof window !== 'undefined') {
            localStorage.setItem('shetkari-lang', lang);
        }
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;
