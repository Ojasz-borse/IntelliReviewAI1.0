
import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-white/5">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white font-semibold text-xs tracking-tight">IR</span>
                    </div>
                    <span className="text-sm text-neutral-400">IntelliReview AI</span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
