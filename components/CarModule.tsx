
import React, { useState } from 'react';
import type { Car, CarAnalysisResponse } from '../types';
import { analyzeCarDataWithGemini, saveSearchQuery } from '../services/geminiService';
import { useAuth } from '../hooks/useAuth';
import { CarIcon, SearchIcon, SparklesIcon, DownloadIcon, ThumbsUpIcon, ThumbsDownIcon, CheckIcon } from './icons';

const CarModule: React.FC = () => {
    const { user } = useAuth();
    const [query, setQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<CarAnalysisResponse | null>(null);

    const handleAnalyze = async () => {
        if (!query.trim() || !user) return;
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const webhookUrl = 'https://ojaswini12.app.n8n.cloud/webhook/car-ai';
            const webhookResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });

            if (!webhookResponse.ok) {
                throw new Error(`The backend service failed with status: ${webhookResponse.status}`);
            }

            const rawData = await webhookResponse.json();
            const result = await analyzeCarDataWithGemini(JSON.stringify(rawData), query);
            setAnalysis(result);
            
            // Save the search query and intent to Firestore
            await saveSearchQuery(user.uid, query, 'car', result.aiRecommendation);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Analysis failed: ${errorMessage}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const setAndAnalyze = (exampleQuery: string) => {
        setQuery(exampleQuery);
        // We don't auto-analyze here to let user confirm, but you could.
    }

    const RatingBar: React.FC<{ metric: { name: string, score: number } }> = ({ metric }) => {
        const scoreColor = metric.score >= 8.5 ? 'emerald' : metric.score >= 7.0 ? 'blue' : 'amber';
        return (
            <div>
                <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-400">{metric.name}</span>
                    <span className={`text-${scoreColor}-400`}>{metric.score.toFixed(1)}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r from-${scoreColor}-500 to-${scoreColor}-400 rounded-full`} style={{ width: `${metric.score * 10}%` }}></div>
                </div>
            </div>
        );
    };

    const CarCard: React.FC<{ car: Car }> = ({ car }) => (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-lg tracking-tight">{car.name}</h3>
                        <p className="text-sm text-neutral-400">{car.description}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-semibold tracking-tight text-emerald-400">{car.overallScore.toFixed(1)}</div>
                        <div className="text-xs text-neutral-500">Overall Score</div>
                    </div>
                </div>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-400">Starting MSRP</span>
                    <span className="text-sm font-medium">₹{car.startingMSRP.toLocaleString('en-IN')}</span>
                </div>
                <div className="space-y-3">
                    {car.metrics.map(metric => <RatingBar key={metric.name} metric={metric} />)}
                </div>
            </div>
        </div>
    );

    return (
        <section id="car-module" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <CarIcon className="w-5 h-5 text-blue-400" strokeWidth="1.5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Car Intelligence</h2>
                        <p className="text-sm text-neutral-400">Compare, analyze, and make informed decisions</p>
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
                                placeholder="e.g., Compare Toyota Camry vs Honda Accord 2024" 
                                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                            />
                        </div>
                        <button onClick={handleAnalyze} disabled={isLoading} className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl text-sm font-medium hover:from-blue-500 hover:to-cyan-500 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                            <SparklesIcon className="w-4 h-4" strokeWidth="1.5" />
                            {isLoading ? 'Analyzing...' : 'Analyze'}
                        </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                        <span className="text-xs text-neutral-500">Try:</span>
                        <button onClick={() => setAndAnalyze('Best electric SUV under $50k')} className="text-xs px-3 py-1 bg-white/5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors">Best electric SUV under 50 Lakhs</button>
                        <button onClick={() => setAndAnalyze('Tesla Model Y vs BMW iX3')} className="text-xs px-3 py-1 bg-white/5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors">Tesla Model Y vs BMW iX3</button>
                        <button onClick={() => setAndAnalyze('Toyota RAV4 reliability 2024')} className="text-xs px-3 py-1 bg-white/5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors">Toyota Fortuner reliability</button>
                    </div>
                </div>
                
                <div id="carResults">
                    {isLoading && (
                        <div id="carLoading">
                            <div className="flex flex-col items-center justify-center py-16">
                                <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4"></div>
                                <p className="text-neutral-400 text-sm">Contacting backend and analyzing with Gemini...</p>
                                <div className="flex flex-wrap justify-center gap-2 mt-4 max-w-md">
                                    <span className="text-xs px-2 py-1 bg-white/5 rounded text-neutral-500 animate-pulse">Fetching Real-Time Data</span>
                                    <span className="text-xs px-2 py-1 bg-white/5 rounded text-neutral-500 animate-pulse [animation-delay:200ms]">Generating Insights</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                            <h3 className="font-medium text-red-400 mb-2">Analysis Error</h3>
                            <p className="text-sm text-neutral-400">{error}</p>
                        </div>
                    )}

                    {analysis && (
                        <div id="carResultsContent" className="animate-fade-in">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 text-xs text-neutral-400">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                                    <span>Data updated just now</span>
                                </div>
                                <button className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors">
                                    <DownloadIcon className="w-[14px] h-[14px]" strokeWidth="1.5" />
                                    Export PDF
                                </button>
                            </div>
                            
                            <div className={`grid grid-cols-1 ${analysis.cars.length > 1 ? 'lg:grid-cols-2' : ''} gap-6 mb-6`}>
                                {analysis.cars.map(car => <CarCard key={car.name} car={car} />)}
                            </div>
                            
                            <div className={`grid grid-cols-1 ${analysis.cars.length > 1 ? 'lg:grid-cols-2' : ''} gap-6 mb-6`}>
                                {analysis.cars.map(car => (
                                    <div key={`${car.name}-pros-cons`}>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6">
                                            <h4 className="font-medium mb-4 flex items-center gap-2">
                                                <ThumbsUpIcon className="w-4 h-4 text-emerald-400" strokeWidth="1.5" />
                                                {car.name} Pros
                                            </h4>
                                            <ul className="space-y-2">
                                                {car.pros.map((pro, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                        <CheckIcon className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" strokeWidth="2" />
                                                        <span className="text-neutral-300">{pro}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                         <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                                            <h4 className="font-medium mb-4 flex items-center gap-2">
                                                <ThumbsDownIcon className="w-4 h-4 text-amber-400" strokeWidth="1.5" />
                                                {car.name} Cons
                                            </h4>
                                            <ul className="space-y-2">
                                                {car.cons.map((con, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm">
                                                        <span className="text-amber-400 mt-0.5 flex-shrink-0 font-bold text-sm leading-tight">&times;</span>
                                                        <span className="text-neutral-300">{con}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-2xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                                        <SparklesIcon className="w-5 h-5 text-violet-400" strokeWidth="1.5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">AI Recommendation</h4>
                                        <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">{analysis.aiRecommendation}</p>
                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {analysis.sources.map(source => (
                                                <span key={source} className="text-xs px-2 py-1 bg-white/5 rounded-lg text-neutral-400">Source: {source}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default CarModule;
