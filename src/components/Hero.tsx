import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, Send } from 'lucide-react';

const Hero = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const ref = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const isSpanish = i18n.language === 'es';
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <>
      <div ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-black/60 z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-netflix-black via-transparent to-black/60 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1559166631-ef208440c75a?q=80&w=2070&auto=format&fit=crop" 
            alt="Cycling Hero" 
            className="w-full h-full object-cover opacity-60"
          />
        </motion.div>

        <motion.div 
          style={{ y: textY }}
          className="relative z-20 container mx-auto px-4 md:px-12 flex flex-col items-center text-center md:items-start md:text-left mt-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-4"
          >
            <span className="text-sm md:text-base font-bold text-netflix-red tracking-widest uppercase">
              {isSpanish ? 'Versión Lite' : 'Lite Version'}
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl max-w-4xl"
          >
            Deep<span className="text-netflix-red">Metric</span> Lite
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-2xl text-gray-200 mb-8 max-w-2xl drop-shadow-md"
          >
            {isSpanish 
              ? 'Prueba gratis las herramientas de análisis para ciclismo. La versión PRO con IA y Machine Learning llegará próximamente.' 
              : 'Try free cycling analysis tools. PRO version with AI and Machine Learning coming soon.'}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col md:flex-row gap-4 w-full md:w-auto"
          >
            <button 
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 bg-netflix-red hover:bg-red-700 text-white px-8 py-3 rounded text-xl font-bold transition duration-300 w-full md:w-auto"
            >
              <span>{t('hero.get_started')}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 bg-gray-500/40 hover:bg-gray-500/60 backdrop-blur-sm text-white px-8 py-3 rounded text-xl font-bold transition duration-300 w-full md:w-auto"
            >
               {t('hero.learn_more')}
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Learn More Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#181818] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    {isSpanish ? 'Sobre DeepMetric' : 'About DeepMetric'}
                  </h2>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-700 rounded-full transition"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6 text-gray-300">
                  <div>
                    <h3 className="text-lg font-bold text-netflix-red mb-2">
                      {isSpanish ? 'Versión Lite (Actual)' : 'Lite Version (Current)'}
                    </h3>
                    <p>
                      {isSpanish 
                        ? 'Utilidades gratuitas con funcionalidad limitada para que pruebes el potencial del software. Ideal para conocer las capacidades de análisis de datos de ciclismo.' 
                        : 'Free utilities with limited functionality to test the software potential. Ideal for exploring cycling data analysis capabilities.'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-yellow-500 mb-2">
                      {isSpanish ? 'Versión PRO (Próximamente)' : 'PRO Version (Coming Soon)'}
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>{isSpanish ? 'Panel de entrenador para gestionar deportistas' : 'Coach panel to manage athletes'}</li>
                      <li>{isSpanish ? 'Inteligencia Artificial avanzada' : 'Advanced Artificial Intelligence'}</li>
                      <li>{isSpanish ? 'Sistemas de Machine Learning' : 'Machine Learning systems'}</li>
                      <li>{isSpanish ? 'Análisis predictivo de rendimiento' : 'Predictive performance analysis'}</li>
                      <li>{isSpanish ? 'Enfocado a entrenadores y deportistas que se autoentrenen' : 'Focused on coaches and self-coached athletes'}</li>
                    </ul>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                      <Send size={20} className="text-blue-400" />
                      {isSpanish ? 'Sugerencias y Comunidad' : 'Suggestions & Community'}
                    </h3>
                    <p className="mb-3">
                      {isSpanish 
                        ? 'Únete a nuestro grupo de Telegram para sugerencias, novedades y soporte:' 
                        : 'Join our Telegram group for suggestions, news and support:'}
                    </p>
                    <a 
                      href="https://t.me/+r__YDgX6Zck3YWNk" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                      Intervals.icu España
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Hero;
