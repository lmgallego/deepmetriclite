import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Donation from '../components/Donation';
import Footer from '../components/Footer';

const Landing = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-netflix-black text-white overflow-x-hidden">
       <nav className={`fixed w-full z-50 px-4 py-4 md:px-12 flex justify-between items-center transition-all duration-300 ${isScrolled ? 'bg-netflix-black shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
        <div className="flex items-center gap-2">
           <span className="text-2xl md:text-3xl font-bold tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
             Deep<span className="text-netflix-red">Metric</span> Lite
           </span>
        </div>
        <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/roadmap')}
              className="text-white hover:text-netflix-red font-medium text-sm transition hidden md:block"
            >
              Roadmap
            </button>
            <button 
              onClick={toggleLanguage}
              className="text-white hover:text-gray-300 font-medium text-sm border border-white/30 px-2 py-1 rounded"
            >
              {i18n.language === 'en' ? 'ES' : 'EN'}
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-4 py-1 text-white bg-netflix-red rounded text-sm font-medium hover:bg-red-700 transition"
            >
              {t('navbar.launch')}
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
};

export default Landing;
