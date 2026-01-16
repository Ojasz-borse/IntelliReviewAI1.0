import React, { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import CarModule from './components/CarModule';
import SocialModule from './components/SocialModule';
import LoanModule from './components/LoanModule';
import NewsModule from './components/NewsModule';
import TechStack from './components/TechStack';
import Footer from './components/Footer';
import { AuthProvider, useAuth } from './hooks/useAuth';
import MandiDashboard from './components/MandiDashboard';
import { Sprout, ArrowLeft, Leaf, Home } from 'lucide-react';
// AgriAdvisor moved to Shetkari Mitra dashboard

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showAgri, setShowAgri] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (showAgri) {
    return (
      <div className="relative">
        {/* Enhanced Back Button */}
        <button
          onClick={() => setShowAgri(false)}
          className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-md shadow-xl px-5 py-3 rounded-full flex items-center gap-3 font-bold text-gray-700 hover:bg-white hover:shadow-2xl transition-all duration-300 border border-gray-200 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <Home className="w-4 h-4" />
          <span>IntelliReview</span>
        </button>
        <MandiDashboard />
      </div>
    )
  }

  return (
    <>
      <div className="relative">
        <Header />
        {/* Shetkari Mitra Floating Button - Clean minimalistic style */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowAgri(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full shadow-lg font-medium flex items-center gap-2.5 text-sm transition-all hover:shadow-xl group"
          >
            <Sprout className="w-5 h-5" />
            <div className="flex flex-col items-start leading-tight">
              <span className="font-semibold">शेतकरी मित्र</span>
              <span className="text-[10px] text-white/70">Shetkari Mitra</span>
            </div>
            <Leaf className="w-4 h-4 text-green-200 group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>

      <main>
        <Hero />
        <Features />
        <CarModule />
        <SocialModule />
        <LoanModule />
        <NewsModule />
        <TechStack />
      </main>
      <Footer />
    </>
  );
}


const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
