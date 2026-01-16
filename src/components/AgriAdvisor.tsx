"use client";

import { useState, useRef, useEffect } from "react";
import { Sprout, Send, Loader2, AlertCircle, Languages, ExternalLink } from "lucide-react";

/* Clean text formatting */
const cleanText = (text: string) => {
    return text
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/•/g, "")
        .replace(/-/g, " ")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\s*:\s*/g, ": ")
        .trim();
};

// Translations
const translations = {
    mr: {
        poweredBy: "Powered by AI",
        title: "कृषी AI सल्लागार",
        subtitle: "तुमच्या शेतीसाठी स्मार्ट सल्ला",
        placeholder: "उदा: जमिनीचा pH ६ आहे, कोणते खत वापरावे?",
        askButton: "सल्ला घ्या",
        processing: "उत्तर शोधत आहे...",
        timeout: "प्रतिसादास जास्त वेळ लागला. पुन्हा प्रयत्न करा.",
        serverError: "सर्व्हरशी कनेक्ट होत नाही.",
        noAnswer: "उत्तर उपलब्ध नाही.",
        enterQuestion: "कृपया प्रश्न लिहा.",
        langSwitch: "English",
        examplesTitle: "उदाहरण प्रश्न:",
        examples: [
            "माझ्या टोमॅटोची पाने पिवळी होत आहेत, काय...",
            "कांदा लागवडीसाठी योग्य वेळ कोणता?",
            "सोयाबीनसाठी कोणते खत चांगले?"
        ]
    },
    en: {
        poweredBy: "Powered by AI",
        title: "Agri AI Advisor",
        subtitle: "Smart advice for your farming needs",
        placeholder: "Eg: Soil pH is 6, which fertilizer should I use?",
        askButton: "Get Advice",
        processing: "Finding answer...",
        timeout: "Response timed out. Please try again.",
        serverError: "Unable to connect to server.",
        noAnswer: "No answer available.",
        enterQuestion: "Please enter a question.",
        langSwitch: "मराठी",
        examplesTitle: "Example questions:",
        examples: [
            "My tomato leaves are turning yellow...",
            "Best time for onion planting?",
            "Which fertilizer for soybean?"
        ]
    }
};

export default function AgriAdvisor() {
    const [question, setQuestion] = useState("");
    const [language, setLanguage] = useState<"mr" | "en">("mr");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);

    const t = translations[language];
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => abortControllerRef.current?.abort();
    }, []);

    const askAgent = async () => {
        const trimmed = question.trim();
        if (!trimmed) {
            setResponse(t.enterQuestion);
            return;
        }

        setLoading(true);
        setResponse("");
        setErrorDetails(null);

        const controller = new AbortController();
        abortControllerRef.current = controller;
        const timeoutId = setTimeout(() => controller.abort(), 180000);

        try {
            const res = await fetch(
                "https://ojaswini12.app.n8n.cloud/webhook/a426ca97-9dd8-4c99-9b3a-4894dc2a816f",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question: trimmed, language }),
                    signal: controller.signal,
                }
            );

            clearTimeout(timeoutId);

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status}: ${text}`);
            }

            const raw = await res.text();
            let answer = "";

            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed[0]?.text) {
                    answer = parsed[0].text;
                } else if (parsed?.text) {
                    answer = parsed.text;
                } else {
                    answer = raw;
                }
            } catch {
                answer = raw;
            }

            setResponse(cleanText(answer) || t.noAnswer);
        } catch (err: any) {
            if (err.name === "AbortError") {
                setResponse(t.timeout);
            } else {
                setErrorDetails(err.message || "Unknown error");
                setResponse(t.serverError);
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
            abortControllerRef.current = null;
        }
    };

    const handleExampleClick = (example: string) => {
        setQuestion(example);
    };

    return (
        <section id="agri-advisor" className="min-h-screen py-16 relative overflow-hidden">
            {/* Light gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-50 via-emerald-50/50 to-white"></div>

            <div className="relative z-10 max-w-2xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100/80 rounded-full text-green-600 text-xs font-medium mb-4">
                        <span className="text-base">✨</span>
                        {t.poweredBy}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-green-700 flex items-center justify-center gap-3 mb-2">
                        <Sprout className="w-8 h-8 text-green-600" />
                        {t.title}
                    </h2>
                    <p className="text-gray-500 text-sm">{t.subtitle}</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
                    {/* Language Toggle */}
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setLanguage(language === "mr" ? "en" : "mr")}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-medium transition-colors"
                        >
                            <Languages className="w-3.5 h-3.5" />
                            {t.langSwitch}
                        </button>
                    </div>

                    {/* Question Input */}
                    <div className="mb-5">
                        <div className="relative">
                            <textarea
                                rows={3}
                                className="w-full border border-gray-200 rounded-xl p-4 pr-10 text-gray-700 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all resize-none text-sm"
                                placeholder={t.placeholder}
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        askAgent();
                                    }
                                }}
                            />
                            <ExternalLink className="absolute top-4 right-4 w-4 h-4 text-gray-300" />
                        </div>
                    </div>

                    {/* Example Questions */}
                    <div className="mb-5">
                        <p className="text-xs text-gray-400 mb-2">{t.examplesTitle}</p>
                        <div className="flex flex-wrap gap-2">
                            {t.examples.map((example, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleExampleClick(example)}
                                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200 transition-colors"
                                >
                                    {example}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={askAgent}
                        disabled={loading}
                        className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t.processing}
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                {t.askButton}
                            </>
                        )}
                    </button>

                    {/* Error Display */}
                    {errorDetails && (
                        <div className="mt-4 bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-red-600 text-xs">{errorDetails}</p>
                        </div>
                    )}

                    {/* Response Display */}
                    {response && (
                        <div className="mt-4 bg-green-50 border border-green-200 p-4 rounded-xl">
                            <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                                {response}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}