
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../services/firebase';
import { signOut } from 'firebase/auth';

const Header: React.FC = () => {
    const { user } = useAuth();

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };
    
    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-neutral-950/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm tracking-tight">IR</span>
                        </div>
                        <span className="font-semibold text-base tracking-tight">IntelliReview AI</span>
                    </div>
                    {user && (
                        <div className="hidden md:flex items-center gap-8">
                            <button onClick={() => scrollToSection('features')} className="text-sm text-neutral-400 hover:text-white transition-colors">Features</button>
                            <button onClick={() => scrollToSection('car-module')} className="text-sm text-neutral-400 hover:text-white transition-colors">Car Intel</button>
                            <button onClick={() => scrollToSection('social-module')} className="text-sm text-neutral-400 hover:text-white transition-colors">Social Analyzer</button>
                            <button onClick={() => scrollToSection('loan-module')} className="text-sm text-neutral-400 hover:text-white transition-colors">Loan Intel</button>
                            <button onClick={() => scrollToSection('news-module')} className="text-sm text-neutral-400 hover:text-white transition-colors">News Intel</button>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                         {user ? (
                            <button onClick={handleSignOut} className="px-4 py-2 bg-white/5 text-neutral-300 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">Sign Out</button>
                         ) : (
                            <button className="px-4 py-2 bg-white text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors">Get Started</button>
                         )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;
