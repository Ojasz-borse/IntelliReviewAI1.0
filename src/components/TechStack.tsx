
import React from 'react';
import { SparklesIcon, CloudIcon, FlameIcon, ZapIcon } from './icons';

const TechStack: React.FC = () => {
    return (
        <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/5 bg-white/[0.01]">
            <div className="max-w-4xl mx-auto text-center">
                <p className="text-xs text-neutral-500 uppercase tracking-wider mb-6">Powered By</p>
                <div className="flex flex-wrap items-center justify-center gap-8">
                    <div className="flex items-center gap-2 text-neutral-400">
                        <SparklesIcon className="w-5 h-5" strokeWidth="1.5" />
                        <span className="text-sm font-medium">Gemini AI</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-400">
                        <CloudIcon className="w-5 h-5" strokeWidth="1.5" />
                        <span className="text-sm font-medium">Cloud Run</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-400">
                        <FlameIcon className="w-5 h-5" strokeWidth="1.5" />
                        <span className="text-sm font-medium">Firebase</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-400">
                        <ZapIcon className="w-5 h-5" strokeWidth="1.5" />
                        <span className="text-sm font-medium">Cloud Functions</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TechStack;
