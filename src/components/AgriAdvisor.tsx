"use client";

import { useState, useRef, useEffect } from "react";

/* 🔹 CLEAN UNWANTED SYMBOLS */
const cleanText = (text: string) => {
    return text
        .replace(/\*\*/g, "")       // remove bold **
        .replace(/\*/g, "")         // remove *
        .replace(/•/g, "")          // remove bullets
        .replace(/-/g, "")          // remove hyphens
        .replace(/_/g, "")          // remove underscores
        .replace(/\s+/g, " ")       // normalize spaces
        .replace(/\s*:\s*/g, ": ")  // clean colons
        .trim();
};

export default function AgriAdvisor() {
    const [question, setQuestion] = useState("");
    const [language, setLanguage] = useState<"mr" | "en">("mr");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        return () => abortControllerRef.current?.abort();
    }, []);

    const askAgent = async () => {
        const trimmed = question.trim();
        if (!trimmed) {
            setResponse(language === "mr" ? "कृपया प्रश्न लिहा." : "Please enter a question.");
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

            /* 🔹 HANDLE JSON OR TEXT */
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

            setResponse(
                cleanText(answer) ||
                (language === "mr" ? "उत्तर उपलब्ध नाही." : "No answer available.")
            );
        } catch (err: any) {
            if (err.name === "AbortError") {
                setResponse(
                    language === "mr"
                        ? "प्रतिसादास जास्त वेळ लागला. पुन्हा प्रयत्न करा."
                        : "Response timed out. Please try again."
                );
            } else {
                setErrorDetails(err.message || "Unknown error");
                setResponse(
                    language === "mr"
                        ? "सर्व्हरशी कनेक्ट होत नाही."
                        : "Unable to connect to server."
                );
            }
        } finally {
            clearTimeout(timeoutId);
            setLoading(false);
            abortControllerRef.current = null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-6 space-y-4">

                <h2 className="text-2xl font-bold text-green-700 text-center">
                    🌱 Agri AI Advice
                </h2>

                <select
                    className="w-full border rounded-lg p-2"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as "mr" | "en")}
                >
                    <option value="mr">मराठी</option>
                    <option value="en">English</option>
                </select>

                <textarea
                    rows={4}
                    className="w-full border rounded-lg p-3"
                    placeholder={
                        language === "mr"
                            ? "उदा: जमिनीचा pH 6 आहे, कोणते खत वापरावे?"
                            : "Eg: Soil pH is 6, which fertilizer should I use?"
                    }
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />

                <button
                    onClick={askAgent}
                    disabled={loading}
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold disabled:opacity-60"
                >
                    {loading
                        ? language === "mr"
                            ? "उत्तर शोधत आहे..."
                            : "Processing..."
                        : language === "mr"
                            ? "सल्ला घ्या"
                            : "Get Advice"}
                </button>

                {errorDetails && (
                    <div className="bg-red-50 border border-red-300 p-3 text-red-700 text-sm font-mono rounded-lg">
                        {errorDetails}
                    </div>
                )}

                {response && (
                    <div className="bg-green-50 border border-green-300 p-4 whitespace-pre-line text-gray-900 rounded-lg">
                        {response}
                    </div>
                )}
            </div>
        </div>
    );
}