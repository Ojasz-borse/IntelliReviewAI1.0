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
import { Sprout, ArrowLeft } from 'lucide-react';
import AgriAdvisor from './components/AgriAdvisor';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [showAgri, setShowAgri] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (showAgri) {
    return (
      <div>
        <button
          onClick={() => setShowAgri(false)}
          className="fixed top-4 left-4 z-50 bg-white shadow-md px-4 py-2 rounded-full flex items-center gap-2 font-bold text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" /> Back to IntelliReview
        </button>
        <MandiDashboard />
      </div>
    )
  }

  return (
    <>
      <div className="relative">
        <Header />
        {/* Integration Button */}
        <div className="fixed bottom-8 right-8 z-50 animate-bounce">
          <button
            onClick={() => setShowAgri(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-full shadow-2xl font-bold flex items-center gap-2 text-lg border-2 border-white"
          >
            <Sprout className="w-6 h-6" /> Open Shetkari Mitra
          </button>
        </div>
      </div>

      <main>
        <Hero />
        <Features />
        <AgriAdvisor />
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
