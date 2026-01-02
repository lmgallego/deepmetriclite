import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Wrench, Heart, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Roadmap = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isSpanish = i18n.language === 'es';

  const roadmapItems = [
    {
      id: 1,
      title: 'Intervals Data Doctor',
      description: isSpanish 
        ? 'Corrección de peaks de potencia de actividades de una forma sencilla y muy intuitiva con subida directa a intervals.icu' 
        : 'Easy and intuitive power peaks correction for activities with direct upload to intervals.icu',
      progress: 75,
      icon: Wrench,
      color: 'yellow',
      status: isSpanish ? 'En desarrollo' : 'In development'
    },
    {
      id: 2,
      title: isSpanish ? 'Umbrales HRV' : 'HRV Thresholds',
      description: isSpanish 
        ? 'Detección de umbrales a través de DFA Alpha 1 con un algoritmo nuevo.' 
        : 'Threshold detection through DFA Alpha 1 with a new algorithm.',
      progress: 25,
      icon: Heart,
      color: 'purple',
      status: isSpanish ? 'Planificado' : 'Planned'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; bar: string; border: string }> = {
      yellow: { bg: 'bg-yellow-900/30', text: 'text-yellow-500', bar: 'bg-yellow-500', border: 'border-yellow-600/50' },
      purple: { bg: 'bg-purple-900/30', text: 'text-purple-500', bar: 'bg-purple-500', border: 'border-purple-600/50' },
    };
    return colors[color] || colors.yellow;
  };

  return (
    <div className="min-h-screen bg-netflix-black text-white pt-24 pb-12 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-12">
          <button 
            onClick={() => navigate('/')}
            className="p-2 rounded-full hover:bg-gray-800 transition text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="text-netflix-red">Roadmap</span>
            </h1>
            <p className="text-gray-400 mt-2">
              {isSpanish 
                ? 'Próximas funcionalidades en desarrollo' 
                : 'Upcoming features in development'}
            </p>
          </div>
        </div>

        {/* Roadmap Items */}
        <div className="space-y-8">
          {roadmapItems.map((item, index) => {
            const colors = getColorClasses(item.color);
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`${colors.bg} rounded-xl p-6 border ${colors.border}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
                    <Icon className={`w-8 h-8 ${colors.text}`} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`text-xl font-bold ${colors.text}`}>{item.title}</h3>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {item.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 mb-4">{item.description}</p>
                    
                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">
                          {isSpanish ? 'Progreso' : 'Progress'}
                        </span>
                        <span className={`text-sm font-bold ${colors.text}`}>{item.progress}%</span>
                      </div>
                      <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progress}%` }}
                          transition={{ duration: 1, delay: index * 0.2 + 0.3 }}
                          className={`h-full ${colors.bar} rounded-full`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center p-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border border-gray-700"
        >
          <Rocket className="w-12 h-12 text-netflix-red mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">
            {isSpanish ? '¿Tienes sugerencias?' : 'Have suggestions?'}
          </h3>
          <p className="text-gray-400 mb-4">
            {isSpanish 
              ? 'Únete a nuestro grupo de Telegram y comparte tus ideas' 
              : 'Join our Telegram group and share your ideas'}
          </p>
          <a 
            href="https://t.me/+r__YDgX6Zck3YWNk" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Intervals.icu España
          </a>
        </motion.div>
      </div>
    </div>
  );
};

export default Roadmap;
