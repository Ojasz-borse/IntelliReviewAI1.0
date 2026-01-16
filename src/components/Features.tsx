
import React from 'react';
import { ZapIcon, BrainIcon, LayersIcon } from './icons';

const Features: React.FC = () => {
    return (
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">Real Data. Real Insights.</h2>
                    <p className="text-neutral-400 max-w-xl mx-auto">We aggregate and analyze real-time data from trusted sources across the internet.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
                            <ZapIcon className="w-5 h-5 text-violet-400" strokeWidth="1.5" />
                        </div>
                        <h3 className="font-medium mb-2">Real-Time Data</h3>
                        <p className="text-sm text-neutral-400 leading-relaxed">Fresh data from the latest reviews, ratings, and user feedback.</p>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                            <BrainIcon className="w-5 h-5 text-emerald-400" strokeWidth="1.5" />
                        </div>
                        <h3 className="font-medium mb-2">Gemini AI Analysis</h3>
                        <p className="text-sm text-neutral-400 leading-relaxed">Advanced AI summarization and insight generation powered by Google.</p>
                    </div>
                    
                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
                            <LayersIcon className="w-5 h-5 text-amber-400" strokeWidth="1.5" />
                        </div>
                        <h3 className="font-medium mb-2">Multi-Source</h3>
                        <p className="text-sm text-neutral-400 leading-relaxed">Data from trusted expert sources and real user reviews.</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Features;
