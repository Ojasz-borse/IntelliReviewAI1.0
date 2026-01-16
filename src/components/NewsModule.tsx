
import React, { useState } from 'react';
import type { NewsAnalysisResponse } from '../types';
import { analyzeNewsDataWithGemini, saveSearchQuery } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import { NewspaperIcon, SearchIcon, SparklesIcon, ScaleIcon, ShieldCheckIcon, CheckIcon } from './icons';

const NewsModule: React.FC = () => {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<NewsAnalysisResponse | null>(null);

    const handleAnalyze = async () => {
        if (!query.trim() || !user) {
            setError('Please enter a news URL or paste some text to analyze.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const webhookUrl = 'https://ojaswini12.app.n8n.cloud/webhook/news-validation';
            const webhookResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });

            if (!webhookResponse.ok) {
                throw new Error(`The backend service failed with status: ${webhookResponse.status}`);
            }

            const rawData = await webhookResponse.json();
            const result = await analyzeNewsDataWithGemini(JSON.stringify(rawData), query);
            setAnalysis(result);

            await saveSearchQuery(user.uid, query, 'news', result.summary);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Analysis failed: ${errorMessage}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const AnalysisCard: React.FC<{ icon: React.ReactNode; label: string; value: string; colorClass: string; }> = ({ icon, label, value, colorClass }) => (
        <div className="bg-white/5 p-4 rounded-lg text-center">
            <div className={`w-8 h-8 rounded-lg ${colorClass}/10 flex items-center justify-center mx-auto mb-2`}>
                {icon}
            </div>
            <p className={`text-lg font-semibold tracking-tight ${colorClass}`}>{value}</p>
            <p className="text-xs text-neutral-400">{label}</p>
        </div>
    );
    
    const getSentimentColor = (label: string) => {
        switch (label) {
            case 'Positive': return 'text-emerald-400';
            case 'Negative': return 'text-red-400';
            default: return 'text-neutral-400';
        }
    };

    return (
        <section id="news-module" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                        <NewspaperIcon className="w-5 h-5 text-amber-400" strokeWidth="1.5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">News Sentiment & Validator</h2>
                        <p className="text-sm text-neutral-400">AI-powered analysis for news articles and text content</p>
                    </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-[18px] h-[18px]" strokeWidth="1.5" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                                placeholder="Paste news URL or text content here..."
                                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
                            />
                        </div>
                        <button onClick={handleAnalyze} disabled={isLoading} className="px-6 py-3 bg-gradient-to-r from-amber-600 to-yellow-600 rounded-xl text-sm font-medium hover:from-amber-500 hover:to-yellow-500 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                            <SparklesIcon className="w-4 h-4" strokeWidth="1.5" />
                            {isLoading ? 'Analyzing...' : 'Validate News'}
                        </button>
                    </div>
                </div>
                
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-12 h-12 rounded-full border-2 border-amber-500 border-t-transparent animate-spin mb-4"></div>
                        <p className="text-neutral-400 text-sm">Analyzing content for bias, sentiment, and factuality...</p>
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                        <h3 className="font-medium text-red-400 mb-2">Analysis Error</h3>
                        <p className="text-sm text-neutral-400">{error}</p>
                    </div>
                )}

                {analysis && (
                    <div className="animate-fade-in space-y-6">
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                            <h3 className="font-semibold text-lg tracking-tight mb-2">{analysis.headline}</h3>
                            <p className="text-sm text-neutral-400 mb-6">{analysis.summary}</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <AnalysisCard 
                                    icon={<SparklesIcon className="w-4 h-4 text-neutral-400" />} 
                                    label="Sentiment" 
                                    value={analysis.sentiment.label} 
                                    colorClass={getSentimentColor(analysis.sentiment.label)} 
                                />
                                <AnalysisCard 
                                    icon={<ScaleIcon className="w-4 h-4 text-blue-400" />} 
                                    label="Political Bias" 
                                    value={analysis.bias.label} 
                                    colorClass="text-blue-400" 
                                />
                                <AnalysisCard 
                                    icon={<ShieldCheckIcon className="w-4 h-4 text-emerald-400" />} 
                                    label="Factuality" 
                                    value={analysis.factuality} 
                                    colorClass="text-emerald-400" 
                                />
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                            <h4 className="font-medium mb-4">Key Points</h4>
                            <ul className="space-y-2">
                                {analysis.keyPoints.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2.5 text-sm">
                                        <CheckIcon className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" strokeWidth="2" />
                                        <span className="text-neutral-300">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                         {analysis.sources.length > 0 && (
                            <div className="text-center">
                                {analysis.sources.map(source => (
                                    <span key={source} className="text-xs px-2 py-1 bg-white/5 rounded-lg text-neutral-400">Source: {source}</span>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default NewsModule;
