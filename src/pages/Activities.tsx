import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Activity, Zap, TrendingUp, ArrowLeft, MapPin, Loader, RefreshCw, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

// Use Vite proxy in development
const API_BASE = '/api/v1';

const Activities = () => {
  const { apiKey, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    if (!apiKey || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch last 20 activities
      const oldest = new Date();
      oldest.setDate(oldest.getDate() - 30); // Last 30 days
      const oldestStr = oldest.toISOString().split('T')[0];
      const newestStr = new Date().toISOString().split('T')[0];
      
      const athleteId = user.id || '0';
      const endpoint = `${API_BASE}/athlete/${athleteId}/activities?oldest=${oldestStr}&newest=${newestStr}`;
      
      const response = await fetch(endpoint, {
        headers: { 
          'Authorization': 'Basic ' + btoa('API_KEY:' + apiKey),
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error(t('readiness.error_unauthorized'));
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Sort by date descending
      const sorted = [...data].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      setActivities(sorted);

    } catch (err: any) {
      console.error("Error Intervals:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [apiKey]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-netflix-black text-slate-200 font-sans pb-12 pt-24 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-gray-800 transition text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
             <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">{t('activities.title')}</h1>
             <p className="text-sm text-gray-500">{t('activities.subtitle')}</p>
          </div>
          <button 
            onClick={fetchActivities}
            disabled={loading}
            className="ml-auto bg-netflix-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            {loading ? <Loader className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            {loading ? t('readiness.syncing') : t('readiness.refresh')}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-2">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {loading && activities.length === 0 ? (
           <div className="flex justify-center py-20">
             <Loader className="animate-spin text-netflix-red" size={48} />
           </div>
        ) : activities.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 gap-4"
          >
            {activities.map((activity) => (
              <div key={activity.id} className="bg-[#181818] border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-800 rounded-lg">
                      <Activity className="text-netflix-red w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-netflix-red transition-colors">{activity.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Calendar size={14} />
                        <span>{new Date(activity.start_date).toLocaleDateString()}</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <Clock size={14} />
                        <span>{formatTime(activity.moving_time)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-8">
                    <MetricItem label="Load" value={activity.icu_training_load || 0} icon={<TrendingUp size={14} />} color="text-purple-400" />
                    <MetricItem label="Avg Power" value={`${activity.average_watts || 0}w`} icon={<Zap size={14} />} color="text-yellow-400" />
                    <MetricItem label="Norm Power" value={`${activity.normalized_power || 0}w`} icon={<Zap size={14} />} color="text-orange-400" />
                    <MetricItem label="Distance" value={`${(activity.distance / 1000).toFixed(1)}km`} icon={<MapPin size={14} />} color="text-blue-400" />
                  </div>

                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
            <Activity size={48} className="mb-4 opacity-20" />
            <p className="text-center px-8 text-sm font-medium">{t('readiness.no_data')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricItem = ({ label, value, icon, color }: any) => (
  <div className="flex flex-col">
    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
      {icon} {label}
    </span>
    <span className={`text-lg font-bold ${color}`}>{value}</span>
  </div>
);

export default Activities;
