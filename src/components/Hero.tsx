import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const { t } = useTranslation();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
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
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold mb-4 drop-shadow-2xl max-w-4xl"
        >
          {t('hero.title_prefix')} <br/>
          <span className="text-netflix-red">{t('hero.title_highlight')}</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-2xl text-gray-200 mb-8 max-w-2xl drop-shadow-md"
        >
          {t('hero.description')}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col md:flex-row gap-4 w-full md:w-auto"
        >
          <button className="flex items-center justify-center gap-2 bg-netflix-red hover:bg-red-700 text-white px-8 py-3 rounded text-xl font-bold transition duration-300 w-full md:w-auto">
            <span>{t('hero.get_started')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
          <button className="flex items-center justify-center gap-2 bg-gray-500/40 hover:bg-gray-500/60 backdrop-blur-sm text-white px-8 py-3 rounded text-xl font-bold transition duration-300 w-full md:w-auto">
             {t('hero.learn_more')}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Hero;
