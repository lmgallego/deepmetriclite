import { useTranslation } from 'react-i18next';
import { Facebook, Instagram, Mail, Send } from 'lucide-react';

const Footer = () => {
  const { i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';

  return (
    <footer className="bg-black py-12 text-gray-400 text-sm relative z-20 border-t border-[#222]">
      <div className="container mx-auto px-4 md:px-12 max-w-5xl">
        
        {/* Powered By */}
        <div className="text-center mb-8">
          <p className="text-lg font-light text-gray-300 mb-2">
            Powered by{' '}
            <a href="https://intervals.icu" target="_blank" rel="noopener noreferrer" className="text-netflix-red hover:underline font-semibold">
              Intervals.icu
            </a>
            {' '}&{' '}
            <span className="text-white font-semibold">ControlMetrics</span>
          </p>
        </div>

        {/* Social Links */}
        <div className="flex justify-center items-center gap-6 mb-8">
          <a 
            href="https://www.facebook.com/luisma.gallego.96" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 bg-gray-800 hover:bg-blue-600 rounded-full transition-all hover:scale-110"
            title="Facebook"
          >
            <Facebook size={20} />
          </a>
          <a 
            href="https://x.com/lmagallego" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 bg-gray-800 hover:bg-gray-600 rounded-full transition-all hover:scale-110"
            title="X (Twitter)"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a 
            href="https://www.instagram.com/luisma_gallego/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 bg-gray-800 hover:bg-pink-600 rounded-full transition-all hover:scale-110"
            title="Instagram"
          >
            <Instagram size={20} />
          </a>
          <a 
            href="mailto:luisma.gallego@controlmetrics.es" 
            className="p-3 bg-gray-800 hover:bg-red-600 rounded-full transition-all hover:scale-110"
            title="Email"
          >
            <Mail size={20} />
          </a>
          <a 
            href="https://t.me/+r__YDgX6Zck3YWNk" 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 bg-gray-800 hover:bg-blue-500 rounded-full transition-all hover:scale-110"
            title="Telegram - Intervals.icu España"
          >
            <Send size={20} />
          </a>
        </div>

        {/* Privacy Notice */}
        <div className="text-center text-xs text-gray-500 max-w-2xl mx-auto">
          <p className="mb-2">
            {isSpanish 
              ? '🔒 No almacenamos ningún dato personal ni de entrenamiento. Tu clave API solo se guarda localmente en tu navegador.' 
              : '🔒 We do not store any personal or training data. Your API key is only saved locally in your browser.'}
          </p>
          <p>
            {isSpanish 
              ? '🤖 No se entrenan modelos de inteligencia artificial con tus datos.' 
              : '🤖 No AI models are trained with your data.'}
          </p>
        </div>

        <div className="text-center text-xs text-gray-600 mt-8">
          <p>© {new Date().getFullYear()} DeepMetric Lite. {isSpanish ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
