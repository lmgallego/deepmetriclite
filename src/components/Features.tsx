import { useRef, cloneElement, ReactElement } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Activity, Zap, TrendingUp, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Features = () => {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: <BarChart2 className="w-8 h-8 text-netflix-red" />,
      title: t('features.items.power.title'),
      description: t('features.items.power.desc'),
      image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?q=80&w=2048&auto=format&fit=crop"
    },
    {
      icon: <Activity className="w-8 h-8 text-netflix-red" />,
      title: t('features.items.fatigue.title'),
      description: t('features.items.fatigue.desc'),
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2070&auto=format&fit=crop"
    },
    {
      icon: <Zap className="w-8 h-8 text-netflix-red" />,
      title: t('features.items.intervals.title'),
      description: t('features.items.intervals.desc'),
      image: "https://images.unsplash.com/photo-1555675409-77a8846c8230?q=80&w=2070&auto=format&fit=crop"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-netflix-red" />,
      title: t('features.items.progress.title'),
      description: t('features.items.progress.desc'),
      image: "https://images.unsplash.com/photo-1616960893049-7c87c06cb491?q=80&w=2070&auto=format&fit=crop"
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-netflix-red" />,
      title: t('features.items.zones.title'),
      description: t('features.items.zones.desc'),
      image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="py-20 bg-netflix-black relative z-20 overflow-hidden">
      <div className="container mx-auto px-4 md:px-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
          {t('features.section_title')}
        </h2>
        
        <div className="group relative">
           <button 
             onClick={() => scroll('left')}
             className="absolute left-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/70 p-2 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
           >
             <ChevronLeft className="w-8 h-8 text-white" />
           </button>

           <div 
             ref={scrollRef}
             className="flex gap-4 overflow-x-auto scrollbar-hide pb-8 px-1 scroll-smooth"
             style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
           >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-[300px] md:w-[400px] aspect-video relative bg-[#181818] rounded-md overflow-hidden cursor-pointer transition-all duration-300 hover:z-30 hover:scale-105 hover:shadow-xl hover:ring-2 hover:ring-gray-700"
              >
                {/* Background Image */}
                <img 
                  src={feature.image} 
                  alt={feature.title} 
                  className="w-full h-full object-cover opacity-80 hover:opacity-40 transition-opacity duration-300"
                />

                {/* Content Overlay (Visible on Hover) */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-netflix-red p-1 rounded-full">
                      {cloneElement(feature.icon as ReactElement, { className: "w-4 h-4 text-white" })}
                    </div>
                    <h3 className="text-sm font-bold text-white">{feature.title}</h3>
                  </div>
                  
                  <div className="flex items-center justify-between">
                     <p className="text-[10px] text-gray-300 line-clamp-2">{feature.description}</p>
                     <div className="border border-gray-500 rounded-full p-1 hover:border-white">
                        <Info className="w-4 h-4 text-white" />
                     </div>
                  </div>

                  <div className="mt-2 flex gap-2 text-[10px] font-semibold text-green-400">
                    <span>{t('features.match')}</span>
                    <span className="border border-gray-600 px-1 text-gray-400">HD</span>
                  </div>
                </div>

                 {/* Default Title (Visible when not hovering) */}
                 <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
                    <h3 className="text-lg font-bold text-white drop-shadow-md flex items-center gap-2">
                      {feature.icon}
                      {feature.title}
                    </h3>
                 </div>
              </motion.div>
            ))}
           </div>

           <button 
             onClick={() => scroll('right')}
             className="absolute right-0 top-0 bottom-0 z-40 bg-black/50 hover:bg-black/70 p-2 hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
           >
             <ChevronRight className="w-8 h-8 text-white" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default Features;
