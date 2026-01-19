import { GoogleGenAI, Type } from "@google/genai";
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { CarAnalysisResponse, SocialAnalysisResponse, LoanAnalysisResponse, NewsAnalysisResponse } from '../types';

const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY environment variable not set.");
        throw new Error("API Key missing. Please set GEMINI_API_KEY in your environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

// --- User Intent Summarization & Firestore Logging ---
export const saveSearchQuery = async (userId: string, query: string, analysisType: 'car' | 'loan' | 'news', analysisResult: any) => {
    try {
        const prompt = `
            Based on the user's query and the resulting analysis, provide a concise, one-sentence summary of the user's likely intent for internal business analysis.
            Focus on the core need or interest.

            User Query: "${query}"
            Analysis Type: ${analysisType}
            Analysis Result Summary: ${JSON.stringify(analysisResult).substring(0, 500)}...

            Example Intent Summaries:
            - Query "Toyota Camry vs Honda Accord": "User is comparing reliable mid-size family sedans."
            - Query with high loan amount: "User is exploring financing options for a major purchase."
            - Query about a political topic: "User is assessing the bias and sentiment of a specific news event."

            Summarize the intent for the provided query and result.
        `;

        const intentResponse = await getAI().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
        });
        const userIntent = intentResponse.text?.trim() || "Could not determine intent.";

        await addDoc(collection(db, "userSearches"), {
            userId,
            query,
            analysisType,
            userIntent,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving search query or summarizing intent:", error);
    }
};


const carAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        cars: {
            type: Type.ARRAY,
            description: "An array of car objects, containing either one or two cars for comparison.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Full name of the car, including year. e.g., 'Toyota Camry 2024'" },
                    description: { type: Type.STRING, description: "A short description of the car. e.g., 'Midsize Sedan • Hybrid Available'" },
                    overallScore: { type: Type.NUMBER, description: "An overall score out of 10. e.g., 8.7" },
                    startingMSRP: { type: Type.NUMBER, description: "The starting Manufacturer's Suggested Retail Price. e.g., 28400" },
                    metrics: {
                        type: Type.ARRAY,
                        description: "An array of performance metrics.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Name of the metric. e.g., 'Reliability'" },
                                score: { type: Type.NUMBER, description: "Score for the metric out of 10. e.g., 9.2" },
                            },
                            required: ['name', 'score'],
                        },
                    },
                    pros: { type: Type.ARRAY, description: "A list of pros for the car.", items: { type: Type.STRING } },
                    cons: { type: Type.ARRAY, description: "A list of cons for the car.", items: { type: Type.STRING } },
                },
                required: ['name', 'description', 'overallScore', 'startingMSRP', 'metrics', 'pros', 'cons'],
            },
        },
        aiRecommendation: { type: Type.STRING, description: "A detailed AI-powered recommendation summarizing the comparison." },
        sources: { type: Type.ARRAY, description: "A list of data sources used for the analysis.", items: { type: Type.STRING } },
    },
    required: ['cars', 'aiRecommendation', 'sources'],
};

export const analyzeCarDataWithGemini = async (rawData: string, userQuery: string): Promise<CarAnalysisResponse> => {
    const prompt = `
        You are a data structuring AI. Your only job is to receive raw data and format it into a specific JSON structure. You must not add, create, or infer any information that is not explicitly present in the provided raw data.

        The user's original query was: '${userQuery}'.
        The raw data from the server is: '${rawData}'.

        Your task is to populate the JSON schema using ONLY the information found in the raw data.
        - Map the data from the server into the 'cars' array.
        - For the 'aiRecommendation' field, find a summary or recommendation text within the raw data and use it directly. If no such text exists, you MUST use the following exact string for this field: "The source data did not contain a specific AI recommendation."
        - For the 'sources' field, extract any source names or URLs from the raw data. If the raw data does not mention any sources, you MUST return an empty array for this field.

        Adhere strictly to these rules. Your output must be ONLY the JSON object, with no extra text or markdown formatting.
    `;

    try {
        const response = await getAI().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: carAnalysisSchema,
            },
        });

        const jsonText = response.text;
        if (!jsonText) {
            throw new Error("Received an empty response from Gemini API.");
        }

        return JSON.parse(jsonText) as CarAnalysisResponse;
    } catch (e) {
        console.error("Error calling or parsing Gemini API response:", e);
        throw new Error("Failed to get a valid analysis from the AI. The model may be unable to process this request.");
    }
};


// --- Social Media Analysis Service ---

const socialAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        profileStats: {
            type: Type.OBJECT,
            properties: {
                username: { type: Type.STRING },
                fullName: { type: Type.STRING },
                followerCount: { type: Type.NUMBER },
                followingCount: { type: Type.NUMBER },
                postCount: { type: Type.NUMBER },
                bio: { type: Type.STRING },
                engagementRate: { type: Type.NUMBER, description: "e.g., 2.5 for 2.5%" },
            },
            required: ['username', 'fullName', 'followerCount', 'followingCount', 'postCount', 'bio', 'engagementRate'],
        },
        contentAnalysis: {
            type: Type.OBJECT,
            properties: {
                summary: { type: Type.STRING, description: "A brief summary of the content focus." },
                postFrequency: { type: Type.STRING, description: "e.g., 'Posts approximately 3-4 times a week.'" },
                commonThemes: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['summary', 'postFrequency', 'commonThemes'],
        },
        improvementTips: {
            type: Type.ARRAY,
            description: "Actionable tips for profile growth and content boost.",
            items: { type: Type.STRING },
        },
        sources: {
            type: Type.ARRAY,
            description: "List of sources used for data, if available.",
            items: { type: Type.STRING },
        },
    },
    required: ['profileStats', 'contentAnalysis', 'improvementTips', 'sources'],
};

export const analyzeSocialDataWithGemini = async (rawData: string, profileUrl: string): Promise<SocialAnalysisResponse> => {
    const prompt = `
        You are an expert social media growth analyst AI. Your task is to analyze raw data from an Instagram profile and provide structured insights and actionable tips for improvement.

        The user wants to analyze this profile: '${profileUrl}'.
        The raw data scraped from the profile is: '${rawData}'.

        Your jobs are:
        1.  Extract and structure the key profile statistics from the raw data.
        2.  Analyze the content (like post captions, themes) to summarize the user's niche and post frequency.
        3.  Based ONLY on the provided data, generate a list of 3-5 concrete, actionable improvement tips to help the user boost their content and engagement. Tips could be about bio optimization, content strategy, call-to-actions, etc.
        4.  If the raw data mentions where it's from, list it under sources. Otherwise, return an empty array for sources.

        Respond ONLY with a JSON object that strictly adheres to the provided schema. Do not include any text, markdown formatting, or anything outside the JSON object.
    `;

    try {
        const response = await getAI().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: socialAnalysisSchema,
            },
        });

        const jsonText = response.text;
        if (!jsonText) {
            throw new Error("Received an empty response from Gemini API.");
        }

        return JSON.parse(jsonText) as SocialAnalysisResponse;
    } catch (e) {
        console.error("Error calling or parsing Gemini API response:", e);
        throw new Error("Failed to get a valid analysis from the AI. The model may be unable to process this request.");
    }
};

// --- Loan Risk Analysis Service ---

const loanAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        repaymentProbability: {
            type: Type.OBJECT,
            properties: {
                successPercentage: { type: Type.NUMBER },
                defaultPercentage: { type: Type.NUMBER },
            },
            required: ['successPercentage', 'defaultPercentage'],
        },
        monthLevelRisk: {
            type: Type.ARRAY,
            description: "A list of future months with high EMI default risk.",
            items: {
                type: Type.OBJECT,
                properties: {
                    month: { type: Type.STRING, description: "e.g., 'March'" },
                    reason: { type: Type.STRING, description: "e.g., 'Low balance trend + high seasonal expenses'" },
                },
                required: ['month', 'reason'],
            },
        },
        rateRecommendation: {
            type: Type.OBJECT,
            properties: {
                minInterestRate: { type: Type.NUMBER },
                maxInterestRate: { type: Type.NUMBER },
                safeEmi: { type: Type.NUMBER },
            },
            required: ['minInterestRate', 'maxInterestRate', 'safeEmi'],
        },
        bounceRisk: {
            type: Type.OBJECT,
            properties: {
                emiBounceProbability: { type: Type.NUMBER },
            },
            required: ['emiBounceProbability'],
        },
    },
    required: ['repaymentProbability', 'monthLevelRisk', 'rateRecommendation', 'bounceRisk'],
};


export const analyzeLoanDataWithGemini = async (rawData: string): Promise<LoanAnalysisResponse> => {
    const prompt = `
        You are an expert financial risk analyst AI for loan processing. Your task is to analyze raw, pre-processed bank statement data for a loan applicant and provide a structured risk assessment.

        The raw data from the server is: '${rawData}'. This data represents a summary of the applicant's last 6 months of financial transactions.

        Your jobs are:
        1.  **Calculate Repayment Probability**: Based on income stability, expense patterns, and cash flow, predict the success and default probability percentages. The two must sum to 100.
        2.  **Predict Month-Level Risk**: Identify 1-2 future months where the applicant is most likely to miss an EMI payment. Base this on historical data showing recurring high expenses, low balance trends, or income gaps in those months. Provide a concise reason for each risky month.
        3.  **Recommend Interest Rate & EMI**: Suggest a safe interest rate range (e.g., 11.5 - 12.8) and a realistically affordable monthly EMI amount for the applicant.
        4.  **Calculate Bounce Risk**: Generate a specific probability percentage for a single EMI payment bouncing due to insufficient funds or salary delays.

        Respond ONLY with a JSON object that strictly adheres to the provided schema. Do not include any text, markdown formatting, or anything outside the JSON object.
    `;

    try {
        const response = await getAI().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: loanAnalysisSchema,
            },
        });

        const jsonText = response.text;
        if (!jsonText) {
            throw new Error("Received an empty response from Gemini API.");
        }

        return JSON.parse(jsonText) as LoanAnalysisResponse;
    } catch (e) {
        console.error("Error calling or parsing Gemini API response:", e);
        throw new Error("Failed to get a valid analysis from the AI. The model may be unable to process this request.");
    }
}

// --- News Analysis Service ---

const newsAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING },
        summary: { type: Type.STRING },
        sentiment: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER, description: "A score from -1 (very negative) to 1 (very positive)." },
                label: { type: Type.STRING, description: "Enum: 'Positive', 'Negative', 'Neutral'." },
            },
            required: ['score', 'label'],
        },
        bias: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER, description: "A score from 0 (neutral) to 1 (highly biased)." },
                label: { type: Type.STRING, description: "Enum: 'Left', 'Center', 'Right', 'Neutral', 'Biased'." },
            },
            required: ['score', 'label'],
        },
        factuality: { type: Type.STRING, description: "Enum: 'High', 'Medium', 'Low', 'Unverified'." },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        sources: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
    required: ['headline', 'summary', 'sentiment', 'bias', 'factuality', 'keyPoints', 'sources'],
};

export const analyzeNewsDataWithGemini = async (rawData: string, userQuery: string): Promise<NewsAnalysisResponse> => {
    const prompt = `
        You are an expert, impartial news analyst AI. Your task is to analyze the content of a news article and provide a structured, unbiased assessment.

        The user submitted this query/URL: '${userQuery}'.
        The raw text content from the article is: '${rawData}'.

        Your jobs are:
        1.  **Headline**: Extract or create a concise headline for the article.
        2.  **Summary**: Provide a neutral, one-paragraph summary of the article's main points.
        3.  **Sentiment Analysis**: Determine the overall tone. Is it positive, negative, or neutral? Provide a numerical score from -1.0 to 1.0.
        4.  **Bias Analysis**: Assess the political or ideological bias. Classify it (e.g., Left, Center, Right, Neutral) and provide a bias score from 0 (neutral) to 1 (biased).
        5.  **Factuality**: Based on the language used (e.g., use of sources, emotional language, factual claims), provide a high-level assessment of its likely factuality (High, Medium, Low, Unverified).
        6.  **Key Points**: Extract 3-4 main bullet points or key takeaways from the article.
        7.  **Sources**: If the raw data mentions the source of the news (e.g., from a specific publication), list it. Otherwise, return an empty array.

        Respond ONLY with a JSON object that strictly adheres to the provided schema. Do not include any text, markdown formatting, or anything outside the JSON object.
    `;

    try {
        const response = await getAI().models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: newsAnalysisSchema,
            },
        });

        const jsonText = response.text;
        if (!jsonText) {
            throw new Error("Received an empty response from Gemini API.");
        }

        return JSON.parse(jsonText) as NewsAnalysisResponse;
    } catch (e) {
        console.error("Error calling or parsing Gemini API response:", e);
        throw new Error("Failed to get a valid analysis from the AI. The model may be unable to process this request.");
    }
};