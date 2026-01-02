import React from 'react';
import Hero from './components/Hero';
import Features from './components/Features';
import Donation from './components/Donation';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-netflix-black text-white overflow-x-hidden">
       <nav className="fixed w-full z-50 bg-gradient-to-b from-black/80 to-transparent px-4 py-4 md:px-12 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-2">
           <span className="text-netflix-red text-2xl md:text-3xl font-bold tracking-tighter uppercase shadow-lg">DeepMetric Lite</span>
        </div>
        <div className="flex gap-4">
            <button className="px-4 py-1 text-white bg-netflix-red rounded text-sm font-medium hover:bg-red-700 transition">
              Launch App
            </button>
        </div>
      </nav>

      <main>
        <Hero />
        <Features />
        <Donation />
      </main>

      <Footer />
    </div>
  );
}

export default App;
