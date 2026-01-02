import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { Globe } from 'lucide-react';

const Navbar = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'es' : 'en';
    i18n.changeLanguage(newLang);
  };

  // Don't show navbar on landing page (it has its own nav)
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-netflix-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        <span 
          onClick={() => navigate('/')}
          className="text-2xl font-bold tracking-tighter cursor-pointer"
        >
          Deep<span className="text-netflix-red">Metric</span> Lite
        </span>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/roadmap')}
            className="text-white hover:text-netflix-red font-medium text-sm transition hidden md:block"
          >
            Roadmap
          </button>
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/30 hover:bg-gray-800 transition text-sm font-medium"
          >
            <Globe size={16} />
            <span>{i18n.language === 'en' ? 'ES' : 'EN'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
