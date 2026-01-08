import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Wrench, Heart, Rocket, Calendar, BarChart3, CheckCircle2, Clock, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface RoadmapItem {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const Roadmap = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isSpanish = i18n.language === 'es';

  const completedItems: RoadmapItem[] = [
    {
      id: 1,
      title: 'Readiness Monitor',
      description: isSpanish 
        ? 'Monitor de preparación con análisis de bienestar, carga de entrenamiento y tendencias.' 
        : 'Readiness monitor with wellness analysis, training load and trends.',
      icon: BarChart3,
      color: 'green'
    },
    {
      id: 2,
      title: 'Intervals Data Doctor',
      description: isSpanish 
        ? 'Corrección de peaks de potencia, FC, cadencia y torque con subida directa a intervals.icu' 
        : 'Power peaks, HR, cadence and torque correction with direct upload to intervals.icu',
      icon: Wrench,
      color: 'green'
    }
  ];

  const inProgressItems: RoadmapItem[] = [
    {
      id: 3,
      title: isSpanish ? 'Umbrales HRV' : 'HRV Thresholds',
      description: isSpanish 
        ? 'Detección de umbrales a través de DFA Alpha 1 con un algoritmo avanzado.' 
        : 'Threshold detection through DFA Alpha 1 with an advanced algorithm.',
      icon: Heart,
      color: 'yellow'
    }
  ];

  const plannedItems: RoadmapItem[] = [
    {
      id: 4,
      title: isSpanish ? 'Historial de Actividades' : 'Activities History',
      description: isSpanish 
        ? 'Visualización avanzada del historial de actividades con filtros y estadísticas.' 
        : 'Advanced activities history visualization with filters and statistics.',
      icon: Calendar,
      color: 'purple'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
      green: { bg: 'bg-green-900/20', text: 'text-green-400', border: 'border-green-600/30', iconBg: 'bg-green-600' },
      yellow: { bg: 'bg-yellow-900/20', text: 'text-yellow-400', border: 'border-yellow-600/30', iconBg: 'bg-yellow-600' },
      purple: { bg: 'bg-purple-900/20', text: 'text-purple-400', border: 'border-purple-600/30', iconBg: 'bg-purple-600' },
    };
    return colors[color] || colors.green;
  };

  const renderColumn = (
    title: string, 
    items: RoadmapItem[], 
    headerIcon: LucideIcon, 
    headerColor: string,
    delay: number
  ) => {
    const HeaderIcon = headerIcon;
    return (
      <div className="flex-1 min-w-[280px]">
        <div className={`flex items-center gap-2 mb-4 pb-3 border-b border-gray-700`}>
          <div className={`p-2 rounded-lg ${headerColor}`}>
            <HeaderIcon className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <span className="ml-auto text-sm text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        
        <div className="space-y-4">
          {items.map((item, index) => {
            const colors = getColorClasses(item.color);
            const Icon = item.icon;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: delay + index * 0.1 }}
                className={`${colors.bg} rounded-xl p-4 border ${colors.border} hover:border-gray-600 transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${colors.iconBg}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold ${colors.text} mb-1`}>{item.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {items.length === 0 && (
            <div className="text-center py-8 text-gray-600">
              <p className="text-sm">{isSpanish ? 'Sin elementos' : 'No items'}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-netflix-black text-white pt-24 pb-12 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
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
                ? 'Estado de desarrollo de las funcionalidades' 
                : 'Development status of features'}
            </p>
          </div>
        </div>

        {/* Kanban-style Columns */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          {renderColumn(
            isSpanish ? 'Planificado' : 'Planned',
            plannedItems,
            Lightbulb,
            'bg-purple-600',
            0
          )}
          {renderColumn(
            isSpanish ? 'En Proceso' : 'In Progress',
            inProgressItems,
            Clock,
            'bg-yellow-600',
            0.2
          )}
          {renderColumn(
            isSpanish ? 'Completado' : 'Completed',
            completedItems,
            CheckCircle2,
            'bg-green-600',
            0.4
          )}
        </div>

        {/* Suggestions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center p-8 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border border-gray-700"
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
