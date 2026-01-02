import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { Loader, ArrowLeft, RefreshCw, AlertCircle, BarChart3, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const API_BASE = 'https://intervals.icu/api/v1';
const CORS_PROXY = 'https://corsproxy.io/?';

const Zones = () => {
  const { apiKey, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [zoneData, setZoneData] = useState<any[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!apiKey || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch totals for the last 28 days (4 weeks)
      // This usually returns aggregated stats including time in zones
      const today = new Date();
      const newestStr = today.toISOString().split('T')[0];
      const oldest = new Date();
      oldest.setDate(oldest.getDate() - 28);
      const oldestStr = oldest.toISOString().split('T')[0];
      
      const athleteId = user.id || '0';
      // We'll use the 'totals' endpoint to get summaries.
      const targetUrl = `${API_BASE}/athlete/${athleteId}/totals?oldest=${oldestStr}&newest=${newestStr}`;
      const finalUrl = CORS_PROXY + encodeURIComponent(targetUrl);
      
      const authHeaders = { 
        'Authorization': 'Basic ' + btoa('API_KEY:' + apiKey),
        'Accept': 'application/json'
      };
      
      const response = await fetch(finalUrl, { headers: authHeaders });

      if (!response.ok) {
        if (response.status === 401) throw new Error(t('readiness.error_unauthorized'));
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Data is usually an array of weeks. We need to aggregate the 'hr_zone_times' or 'zone_times' (power).
      // Let's prefer Power zones ('zone_times') if available, else HR ('hr_zone_times').
      
      let aggregatedZones = [0, 0, 0, 0, 0, 0, 0, 0]; // Accommodate up to 7 zones + index 0 padding
      let totalSeconds = 0;

      data.forEach((week: any) => {
        // Power zones usually
        if (week.zone_times && Array.isArray(week.zone_times)) {
           week.zone_times.forEach((seconds: number, index: number) => {
             if (index < aggregatedZones.length) {
               aggregatedZones[index] += seconds || 0;
             }
           });
        } 
        // Fallback to HR if power is missing/zero (simple check)
        else if (week.hr_zone_times && Array.isArray(week.hr_zone_times)) {
           week.hr_zone_times.forEach((seconds: number, index: number) => {
             if (index < aggregatedZones.length) {
               aggregatedZones[index] += seconds || 0;
             }
           });
        }
      });

      totalSeconds = aggregatedZones.reduce((a, b) => a + b, 0);
      setTotalTime(totalSeconds);

      // Format for Recharts
      // Standard 7 zones usually: 1=Recovery, 2=Endurance, 3=Tempo, 4=Threshold, 5=VO2Max, 6=Anaerobic, 7=Neuromuscular
      // Intervals.icu arrays often start at index 0 (Z1) or index 0 is Z1? 
      // Usually API arrays are 0-indexed. Z1 is index 0.
      
      const chartData = aggregatedZones.map((seconds, index) => {
        // Filter out if index is out of standard range (e.g. 7 zones -> indices 0-6)
        // Some users have 5 zones.
        if (seconds === 0 && index > 5) return null; 
        
        return {
          name: `Z${index + 1}`,
          seconds: seconds,
          hours: Number((seconds / 3600).toFixed(1)),
          percent: totalSeconds > 0 ? Number(((seconds / totalSeconds) * 100).toFixed(1)) : 0,
          fill: getZoneColor(index + 1)
        };
      }).filter(d => d !== null); // Remove empty tail zones

      setZoneData(chartData);

    } catch (err: any) {
      console.error("Error Intervals:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiKey]);

  const getZoneColor = (zone: number) => {
    // Standard cycling zone colors
    switch(zone) {
      case 1: return '#808080'; // Grey - Active Recovery
      case 2: return '#3b82f6'; // Blue - Endurance
      case 3: return '#22c55e'; // Green - Tempo
      case 4: return '#eab308'; // Yellow - Threshold
      case 5: return '#f97316'; // Orange - VO2 Max
      case 6: return '#ef4444'; // Red - Anaerobic
      case 7: return '#a855f7'; // Purple - Neuromuscular
      default: return '#555';
    }
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
             <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">{t('zones.title')}</h1>
             <p className="text-sm text-gray-500">{t('zones.subtitle')}</p>
          </div>
          <button 
            onClick={fetchData}
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

        {loading && zoneData.length === 0 ? (
           <div className="flex justify-center py-20">
             <Loader className="animate-spin text-netflix-red" size={48} />
           </div>
        ) : zoneData.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Chart */}
              <div className="lg:col-span-2 bg-[#181818] border border-gray-800 rounded-3xl p-6 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <BarChart3 size={18} className="text-orange-500" /> {t('zones.chart_title')}
                  </h3>
                  <span className="text-sm text-gray-500">{(totalTime / 3600).toFixed(1)}h Total</span>
                </div>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={zoneData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fill: '#888'}} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff'}} 
                        cursor={{fill: '#ffffff10'}}
                        formatter={(value: any) => [`${value}%`, 'Time in Zone']}
                      />
                      <Bar dataKey="percent" radius={[4, 4, 0, 0]}>
                        {zoneData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats Panel */}
              <div className="space-y-4">
                <div className="bg-[#181818] border border-gray-800 rounded-3xl p-6">
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t('zones.breakdown')}</h3>
                   <div className="space-y-4">
                     {zoneData.map((zone) => (
                       <div key={zone.name} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-3 h-3 rounded-full" style={{backgroundColor: zone.fill}}></div>
                           <span className="font-medium text-white">{zone.name}</span>
                         </div>
                         <div className="text-right">
                           <div className="text-white font-bold">{zone.percent}%</div>
                           <div className="text-xs text-gray-500">{zone.hours}h</div>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>

                <div className="bg-gradient-to-br from-orange-900/40 to-[#181818] border border-orange-500/20 rounded-3xl p-6">
                   <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                     <Clock size={16} /> {t('zones.analysis')}
                   </h3>
                   <p className="text-sm text-gray-300 leading-relaxed">
                     {zoneData[0]?.percent + zoneData[1]?.percent > 80 
                       ? t('zones.polarized')
                       : zoneData[2]?.percent + zoneData[3]?.percent > 30 
                         ? t('zones.pyramidal')
                         : t('zones.mixed')
                     }
                   </p>
                </div>
              </div>

            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
            <BarChart3 size={48} className="mb-4 opacity-20" />
            <p className="text-center px-8 text-sm font-medium">{t('readiness.no_data')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Zones;
