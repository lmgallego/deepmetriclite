import { useState, useEffect, useMemo } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line
} from 'recharts';
import { Zap, RefreshCw, AlertCircle, Calendar, ArrowLeft, Trophy, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const API_BASE = 'https://intervals.icu/api/v1';
const CORS_PROXY = 'https://corsproxy.io/?';

const PowerProfile = () => {
  const { apiKey, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [powerData, setPowerData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPowerData = async () => {
    if (!apiKey || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetching power curves for the last 42 days (6 weeks) and all time (optional, usually default is good)
      // The endpoint returns data for different time periods. We'll use the '42d' or similar if available, or just standard.
      // API: /athlete/{id}/power-curves
      const athleteId = user.id || '0';
      const targetUrl = `${API_BASE}/athlete/${athleteId}/power-curves`;
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
      
      // Process data: Intervals returns objects like { duration_secs: 1, watts: 1000 }, etc.
      // We need to transform this into a format suitable for the chart.
      // Typical response has multiple curves (e.g., currency, 42d, 84d, ytd, etc.)
      // Let's assume we want to show '42d' (Recent) vs 'currency' (All time/Season).
      
      // If the API returns a different structure, we might need to adjust. 
      // Common structure: { "42d": [{secs: 1, watts: 500}, ...], "currency": [...] }
      
      // For now, let's handle the likely scenario where we get a list or an object.
      // We will try to map common durations: 1s, 5s, 15s, 30s, 1m, 2m, 5m, 10m, 20m, 60m
      
      const durationsOfInterest = [1, 5, 15, 30, 60, 120, 300, 600, 1200, 3600];
      const durationLabels: {[key: number]: string} = {
        1: '1s', 5: '5s', 15: '15s', 30: '30s', 
        60: '1m', 120: '2m', 300: '5m', 600: '10m', 1200: '20m', 3600: '60m'
      };

      // Helper to find closest point in a curve
      const getWattsAtDuration = (curve: any[], targetSecs: number) => {
        if (!Array.isArray(curve)) return 0;
        const exact = curve.find(p => p.secs === targetSecs);
        if (exact) return exact.watts;
        // Interpolation or nearest neighbor could be added here, but usually intervals provides these standard points
        // If not found, find nearest
        const sorted = [...curve].sort((a,b) => Math.abs(a.secs - targetSecs) - Math.abs(b.secs - targetSecs));
        return sorted.length > 0 ? sorted[0].watts : 0;
      };

      let chartData: any[] = [];
      
      // Check if data has categories or is a flat list
      // If it's a flat list (unlikely for multiple curves), wrap it.
      // Assuming structure { "42d": [...], "season": [...] }
      
      const recentCurve = data["42d"] || [];
      const seasonCurve = data["season"] || data["currency"] || []; // 'currency' is often used for 'current season'

      if (recentCurve.length === 0 && seasonCurve.length === 0) {
         // Maybe it's just a list?
         if (Array.isArray(data)) {
             // Treat as single curve
             chartData = durationsOfInterest.map(secs => ({
                 name: durationLabels[secs],
                 secs: secs,
                 recent: getWattsAtDuration(data, secs),
                 season: 0
             }));
         }
      } else {
          chartData = durationsOfInterest.map(secs => ({
              name: durationLabels[secs],
              secs: secs,
              recent: getWattsAtDuration(recentCurve, secs),
              season: getWattsAtDuration(seasonCurve, secs)
          }));
      }

      setPowerData(chartData);

    } catch (err: any) {
      console.error("Error Intervals:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPowerData();
  }, [apiKey]);

  // Max values for cards
  const max1s = useMemo(() => powerData.find(d => d.secs === 1)?.recent || 0, [powerData]);
  const max5m = useMemo(() => powerData.find(d => d.secs === 300)?.recent || 0, [powerData]);
  const max20m = useMemo(() => powerData.find(d => d.secs === 1200)?.recent || 0, [powerData]);

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
             <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">{t('power.title')}</h1>
             <p className="text-sm text-gray-500">{t('power.subtitle')}</p>
          </div>
          <button 
            onClick={fetchPowerData}
            disabled={loading}
            className="ml-auto bg-netflix-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
            {loading ? t('readiness.syncing') : t('readiness.refresh')}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-500/50 rounded-xl text-red-400 flex items-center gap-2">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        {powerData.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <PowerCard title="Sprint (1s)" value={`${max1s}w`} icon={<Zap size={20} />} color="yellow" />
              <PowerCard title="VO2 Max (5m)" value={`${max5m}w`} icon={<TrendingUp size={20} />} color="orange" />
              <PowerCard title="FTP Proxy (20m)" value={`${max20m}w`} icon={<Trophy size={20} />} color="red" />
            </div>

            {/* CHART */}
            <div className="bg-[#181818] border border-gray-800 rounded-3xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-netflix-red" /> {t('power.chart_title')}
                </h3>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={powerData} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#666'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#666'}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff'}} 
                      itemStyle={{color: '#fff'}}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="recent" name={t('power.legend_recent')} stroke="#E50914" strokeWidth={3} dot={{r: 4, fill: '#E50914', strokeWidth: 0}} activeDot={{r: 6}} />
                    <Line type="monotone" dataKey="season" name={t('power.legend_season')} stroke="#555" strokeWidth={2} dot={{r: 3, fill: '#555'}} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
            <Zap size={48} className="mb-4 opacity-20" />
            <p className="text-center px-8 text-sm font-medium">{loading ? t('readiness.loading_data') : t('readiness.no_data')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const PowerCard = ({ title, value, icon, color }: any) => {
  const colors: any = {
    yellow: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    red: 'text-red-500 bg-red-500/10 border-red-500/20'
  };

  return (
    <div className={`p-6 rounded-2xl border ${colors[color]} flex items-center justify-between transition-transform hover:scale-105`}>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{title}</p>
        <p className="text-3xl font-black">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${colors[color].replace('border', 'ring-1 ring')}`}>
        {icon}
      </div>
    </div>
  );
};

export default PowerProfile;
