
import React from 'react';
import { CarIcon, InstagramIcon, FileTextIcon, NewspaperIcon } from './icons';

const Hero: React.FC = () => {
    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-600/10 via-transparent to-transparent"></div>
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl"></div>
            
            <div className="max-w-4xl mx-auto text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-xs text-neutral-300">Powered by Google Gemini AI</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight mb-6 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
                    Research Smarter.<br/>Decide Faster.
                </h1>
                
                <p className="text-lg sm:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Real-time AI analysis across cars, social media, and financial documents. Get comprehensive insights in seconds.
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <button onClick={() => scrollToSection('car-module')} className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl text-sm font-medium hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/25">
                        <CarIcon className="w-[18px] h-[18px]" strokeWidth="1.5" />
                        Analyze Cars
                    </button>
                    <button onClick={() => scrollToSection('social-module')} className="w-full sm:w-auto px-6 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        <InstagramIcon className="w-[18px] h-[18px]" strokeWidth="1.5" />
                        Analyze Profiles
                    </button>
                     <button onClick={() => scrollToSection('loan-module')} className="w-full sm:w-auto px-6 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        <FileTextIcon className="w-[18px] h-[18px]" strokeWidth="1.5" />
                        Analyze Loans
                    </button>
                    <button onClick={() => scrollToSection('news-module')} className="w-full sm:w-auto px-6 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        <NewspaperIcon className="w-[18px] h-[18px]" strokeWidth="1.5" />
                        Analyze News
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Hero;
