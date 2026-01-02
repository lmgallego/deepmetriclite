import { useState, useMemo, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Area, ComposedChart, Line, Bar, ReferenceLine 
} from 'recharts';
import { Battery, RefreshCw, AlertCircle, Calendar, ArrowLeft, Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const API_BASE = 'https://intervals.icu/api/v1';
const CORS_PROXY = 'https://corsproxy.io/?';

const Fatigue = () => {
  const { apiKey, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!apiKey || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch wellness data for the last 90 days (approx 3 months season view)
      const oldest = new Date();
      oldest.setDate(oldest.getDate() - 90);
      const oldestStr = oldest.toISOString().split('T')[0];
      
      const athleteId = user.id || '0';
      const targetUrl = `${API_BASE}/athlete/${athleteId}/wellness?oldest=${oldestStr}`;
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
      
      const wellnessData = await response.json();
      
      // Sort by date
      const sorted = [...wellnessData].sort((a, b) => new Date(a.id).getTime() - new Date(b.id).getTime());
      
      // Map to chart format
      const chartData = sorted.map(d => ({
        date: d.id,
        dateShort: d.id.substring(5),
        ctl: d.ctl || 0, // Fitness
        atl: d.atl || 0, // Fatigue
        tsb: d.ctl - d.atl // Form (can also use d.form if available, typically TSB = CTL - ATL)
      }));

      setData(chartData);

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

  const latest = data.length > 0 ? data[data.length - 1] : null;

  // Calculate Ramp Rate (7 day change in CTL)
  const rampRate = useMemo(() => {
    if (data.length < 8) return 0;
    const current = data[data.length - 1].ctl;
    const lastWeek = data[data.length - 8].ctl;
    return current - lastWeek;
  }, [data]);

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
             <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">{t('fatigue.title')}</h1>
             <p className="text-sm text-gray-500">{t('fatigue.subtitle')}</p>
          </div>
          <button 
            onClick={fetchData}
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

        {latest ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard title="Fitness (CTL)" value={latest.ctl.toFixed(0)} sub={t('fatigue.fitness_desc')} color="blue" icon={<Activity size={20} />} />
              <StatCard title="Fatigue (ATL)" value={latest.atl.toFixed(0)} sub={t('fatigue.fatigue_desc')} color="pink" icon={<Battery size={20} />} />
              <StatCard 
                title="Form (TSB)" 
                value={latest.tsb.toFixed(0)} 
                sub={t('fatigue.form_desc')} 
                color={latest.tsb >= 0 ? "green" : "orange"} 
                icon={latest.tsb >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />} 
              />
              <StatCard title="Ramp Rate" value={rampRate > 0 ? `+${rampRate.toFixed(1)}` : rampRate.toFixed(1)} sub={t('fatigue.ramp_desc')} color="purple" icon={<TrendingUp size={20} />} />
            </div>

            {/* CHART */}
            <div className="bg-[#181818] border border-gray-800 rounded-3xl p-6 shadow-xl relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-netflix-red" /> {t('fatigue.chart_title')}
                </h3>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data} margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="dateShort" tick={{fontSize: 12, fill: '#666'}} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" tick={{fontSize: 12, fill: '#666'}} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: '#666'}} axisLine={false} tickLine={false} />
                    
                    <Tooltip 
                      contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px', color: '#fff'}} 
                      itemStyle={{color: '#fff'}}
                    />
                    <Legend />
                    
                    {/* Fitness (CTL) - Area */}
                    <Area yAxisId="left" type="monotone" dataKey="ctl" name="Fitness (CTL)" fill="url(#colorCtl)" stroke="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                    
                    {/* Fatigue (ATL) - Line */}
                    <Line yAxisId="left" type="monotone" dataKey="atl" name="Fatigue (ATL)" stroke="#ec4899" strokeWidth={2} dot={false} />
                    
                    {/* Form (TSB) - Bar/Line on Right Axis */}
                    <Bar yAxisId="right" dataKey="tsb" name="Form (TSB)" fill="#f59e0b" opacity={0.3} barSize={4} />
                    <ReferenceLine yAxisId="right" y={0} stroke="#666" strokeDasharray="3 3" />

                    <defs>
                      <linearGradient id="colorCtl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
            <Activity size={48} className="mb-4 opacity-20" />
            <p className="text-center px-8 text-sm font-medium">{loading ? t('readiness.loading_data') : t('readiness.no_data')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, sub, icon, color }: any) => {
  const colors: any = {
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    pink: 'text-pink-500 bg-pink-500/10 border-pink-500/20',
    green: 'text-green-500 bg-green-500/10 border-green-500/20',
    orange: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
  };

  return (
    <div className={`p-6 rounded-2xl border ${colors[color]} flex flex-col items-start justify-between transition-transform hover:scale-105`}>
      <div className="flex w-full justify-between items-start mb-4">
        <div className={`p-3 rounded-full ${colors[color].replace('border', 'ring-1 ring')}`}>
          {icon}
        </div>
        <span className="text-3xl font-black text-white">{value}</span>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{title}</p>
        <p className="text-[10px] opacity-50">{sub}</p>
      </div>
    </div>
  );
};

export default Fatigue;
