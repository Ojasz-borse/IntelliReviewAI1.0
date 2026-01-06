
import React, { useState } from 'react';
import { InstagramIcon, AtSignIcon, ScanIcon, LockIcon, SparklesIcon, CheckIcon } from './icons';
import { analyzeSocialDataWithGemini } from '../services/geminiService';
import type { SocialAnalysisResponse } from '../types';

const SocialModule: React.FC = () => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<SocialAnalysisResponse | null>(null);
    
    const isValidInstagramUrl = (url: string) => {
        const pattern = new RegExp('^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$');
        return pattern.test(url);
    };

    const handleAnalyze = async () => {
        if (!url.trim() || !isValidInstagramUrl(url)) {
            setError('Please enter a valid Instagram profile URL.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis(null);

        try {
            const webhookUrl = 'https://ojaswini12.app.n8n.cloud/webhook/instagram-profile';
            const webhookResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });

            if (!webhookResponse.ok) {
                throw new Error(`The backend service failed with status: ${webhookResponse.status}`);
            }

            const rawData = await webhookResponse.json();
            const result = await analyzeSocialDataWithGemini(JSON.stringify(rawData), url);
            setAnalysis(result);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(`Analysis failed: ${errorMessage}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const StatCard: React.FC<{ label: string; value: string | number; }> = ({ label, value }) => (
        <div className="bg-white/5 p-4 rounded-lg text-center">
            <p className="text-xl font-semibold tracking-tight">{value}</p>
            <p className="text-xs text-neutral-400">{label}</p>
        </div>
    );

    return (
        <section id="social-module" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center">
                        <InstagramIcon className="w-5 h-5 text-pink-400" strokeWidth="1.5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Social Media Analyzer</h2>
                        <p className="text-sm text-neutral-400">Instagram profile insights and growth recommendations</p>
                    </div>
                </div>
                
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <AtSignIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-[18px] h-[18px]" strokeWidth="1.5" />
                            <input 
                                type="text" 
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                                placeholder="Paste Instagram profile URL, e.g., https://instagram.com/xyz" 
                                className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder:text-neutral-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/50 transition-all"
                            />
                        </div>
                        <button onClick={handleAnalyze} disabled={isLoading} className="px-6 py-3 bg-gradient-to-r from-pink-600 to-orange-600 rounded-xl text-sm font-medium hover:from-pink-500 hover:to-orange-500 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed">
                            <ScanIcon className="w-4 h-4" strokeWidth="1.5" />
                            {isLoading ? 'Analyzing...' : 'Analyze Profile'}
                        </button>
                    </div>
                    
                    <p className="text-xs text-neutral-500 mt-3 flex items-center gap-1.5">
                        <LockIcon className="w-3 h-3" strokeWidth="1.5" />
                        Only public profile data is analyzed. We never store credentials.
                    </p>
                </div>
                
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-12 h-12 rounded-full border-2 border-pink-500 border-t-transparent animate-spin mb-4"></div>
                        <p className="text-neutral-400 text-sm">Fetching profile data and generating AI insights...</p>
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
                            <h3 className="font-medium mb-1 text-lg">@{analysis.profileStats.username}</h3>
                            <p className="text-neutral-400 text-sm mb-4">{analysis.profileStats.bio}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <StatCard label="Followers" value={analysis.profileStats.followerCount.toLocaleString()} />
                                <StatCard label="Following" value={analysis.profileStats.followingCount.toLocaleString()} />
                                <StatCard label="Posts" value={analysis.profileStats.postCount} />
                                <StatCard label="Engagement" value={`${analysis.profileStats.engagementRate.toFixed(2)}%`} />
                            </div>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                             <h3 className="font-medium mb-4">Content Analysis</h3>
                             <p className="text-sm text-neutral-300 mb-1"><span className="font-medium text-white">Summary:</span> {analysis.contentAnalysis.summary}</p>
                             <p className="text-sm text-neutral-300 mb-4"><span className="font-medium text-white">Frequency:</span> {analysis.contentAnalysis.postFrequency}</p>
                             <div className="flex flex-wrap gap-2">
                                 <span className="text-sm font-medium">Themes:</span>
                                 {analysis.contentAnalysis.commonThemes.map(theme => (
                                     <span key={theme} className="text-xs px-2.5 py-1 bg-white/5 rounded-full text-neutral-300">{theme}</span>
                                 ))}
                             </div>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                        <SparklesIcon className="w-5 h-5 text-emerald-400" strokeWidth="1.5" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium mb-2">AI Growth Recommendations</h4>
                                        <ul className="space-y-2">
                                            {analysis.improvementTips.map((tip, i) => (
                                                <li key={i} className="flex items-start gap-2.5 text-sm">
                                                    <CheckIcon className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" strokeWidth="2" />
                                                    <span className="text-neutral-300">{tip}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default SocialModule;