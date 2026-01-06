
import React from 'react';
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
import AuthForm from './components/AuthForm';

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
       <div className="flex items-center justify-center min-h-screen">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
       </div>
    );
  }

  return (
    <>
      <Header />
      {user ? (
        <main>
          <Hero />
          <Features />
          <CarModule />
          <SocialModule />
          <LoanModule />
          <NewsModule />
          <TechStack />
        </main>
      ) : (
        <AuthForm />
      )}
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
