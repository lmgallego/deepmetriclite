import { useState, useMemo, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ReferenceLine, Area, Bar, ComposedChart, Line 
} from 'recharts';
import { Activity, AlertCircle, ShieldAlert, Heart, Moon, RefreshCw, Info, Calendar, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

// --- API CONFIG ---
const API_BASE = 'https://intervals.icu/api/v1';
// Note: In production/local dev we might need a proxy if CORS issues arise with direct browser calls to Intervals.icu
// The user provided code used corsproxy.io. We will keep it for now to ensure it works as requested.
const CORS_PROXY = 'https://corsproxy.io/?';

const Readiness = () => {
  const { apiKey, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [rawWellness, setRawWellness] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'zscore' | 'raw'>('zscore');

  // --- DATA FETCHING ---
  const fetchIntervalsData = async () => {
    if (!apiKey || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const oldest = new Date();
      oldest.setDate(oldest.getDate() - 30);
      const oldestStr = oldest.toISOString().split('T')[0];
      
      // Use the athlete ID from the authenticated user context or default to '0' (self)
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
      
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error(t('readiness.error_invalid_response'));

      const sorted = [...data].sort((a, b) => new Date(a.id).getTime() - new Date(b.id).getTime());
      setRawWellness(sorted);

    } catch (err: any) {
      console.error("Error Intervals:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntervalsData();
  }, [apiKey]);

  // --- ALGORITHM V2 (Dynamic Null Handling) ---
  const processedData = useMemo(() => {
    if (rawWellness.length === 0) return [];

    const baseData = rawWellness.map(w => ({
      date: w.id,
      rmssd: w.hrv || null,
      rhr: w.restingHR || null,
      sleep: w.sleepSecs ? (w.sleepSecs / 3600) : null,
      sleepScore: w.sleepScore || null,
      carga: w.trainingLoad || 0
    })).filter(d => d.rmssd !== null && d.rhr !== null);

    if (baseData.length < 2) return [];

    const allRMSSD = baseData.map(d => d.rmssd);
    const meanRMSSD = allRMSSD.reduce((a, b) => a + b, 0) / allRMSSD.length;
    const stdRMSSD = Math.sqrt(allRMSSD.reduce((s, v) => s + Math.pow(v - meanRMSSD, 2), 0) / allRMSSD.length);

    return baseData.map((d, i, arr) => {
      const prevWindow = arr.slice(Math.max(0, i - 7), i);
      const baselineRMSSD = prevWindow.length > 0 
        ? prevWindow.reduce((a, b) => a + b.rmssd, 0) / prevWindow.length 
        : d.rmssd;
      const baselineRHR = prevWindow.length > 0 
        ? prevWindow.reduce((a, b) => a + b.rhr, 0) / prevWindow.length 
        : d.rhr;

      const hrvRatio = d.rmssd / baselineRMSSD;
      
      // Cardiovascular Base Logic
      let readinessScore = Math.pow(hrvRatio, 1.4) * 100;
      const rhrDiff = d.rhr - baselineRHR;
      if (rhrDiff > 1) readinessScore -= (rhrDiff * 2.5);

      // Sleep Data Handling
      let isSleepMissing = (d.sleep === null && d.sleepScore === null);
      
      if (!isSleepMissing) {
        // Only penalize if data exists
        if (d.sleep !== null && d.sleep < 7) {
          readinessScore -= (7 - d.sleep) * 12;
        }
        if (d.sleepScore !== null && d.sleepScore < 60) {
          readinessScore -= 10;
        }
      }

      // Trend
      const hrvYesterday = arr[i-1]?.rmssd || d.rmssd;
      if (d.rmssd < hrvYesterday && d.rmssd < baselineRMSSD) readinessScore -= 8;

      const finalReadiness = Math.max(0, Math.min(100, readinessScore));

      return {
        ...d,
        dateShort: d.date.substring(5),
        zHRV: Number(((d.rmssd - meanRMSSD) / (stdRMSSD || 1)).toFixed(2)),
        readiness: Number(finalReadiness.toFixed(0)),
        baselineRMSSD: Number(baselineRMSSD.toFixed(1)),
        isSleepMissing,
        severity: finalReadiness < 45 ? 'critical' : finalReadiness < 65 ? 'warning' : 'normal'
      };
    });
  }, [rawWellness]);

  const latest = processedData.length > 0 ? processedData[processedData.length - 1] : null;

  return (
    <div className="min-h-screen bg-netflix-black text-slate-200 font-sans pb-12 pt-24 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full hover:bg-gray-800 transition text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
             <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">Readiness Monitor <span className="text-netflix-red">V2</span></h1>
             <p className="text-sm text-gray-500">{t('readiness.subtitle')}</p>
          </div>
          <button 
            onClick={fetchIntervalsData}
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
            {/* STATUS SUMMARY */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
              <div className={`p-6 rounded-3xl border-2 flex flex-col items-center justify-center transition-all ${latest.severity === 'critical' ? 'bg-rose-500/10 border-rose-500' : latest.severity === 'warning' ? 'bg-amber-500/10 border-amber-500' : 'bg-emerald-500/10 border-emerald-500'}`}>
                <span className="text-[10px] font-bold opacity-60 uppercase mb-1 tracking-widest">Readiness Score</span>
                <span className="text-4xl font-black text-white">{latest.readiness}%</span>
                {latest.isSleepMissing && (
                  <span className="text-[8px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full mt-2 font-bold uppercase tracking-tighter">
                    {t('readiness.restricted_mode')}
                  </span>
                )}
              </div>
              <MetricCard title="HRV (RMSSD)" value={`${latest.rmssd}ms`} sub={`Baseline 7d: ${latest.baselineRMSSD}`} color="blue" icon={<Activity size={16}/>} />
              <MetricCard title={t('readiness.rhr')} value={`${latest.rhr}bpm`} sub="Resting HR" color="emerald" icon={<Heart size={16}/>} />
              <MetricCard 
                title={t('readiness.sleep')} 
                value={latest.isSleepMissing ? "N/A" : (latest.sleepScore || `${latest.sleep?.toFixed(1)}h`)} 
                sub={latest.isSleepMissing ? t('readiness.missing_data') : `${t('readiness.quality')}: ${latest.sleepScore || 'N/A'}`} 
                color={latest.isSleepMissing ? "amber" : "indigo"} 
                icon={latest.isSleepMissing ? <AlertTriangle size={16}/> : <Moon size={16}/>} 
                warning={latest.isSleepMissing}
              />
            </div>

            {/* CHART */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 mb-8 shadow-xl relative ring-1 ring-white/5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} /> {t('readiness.cycle_30d')}
                </h3>
                <div className="flex bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => setSelectedView('zscore')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedView === 'zscore' ? 'bg-netflix-red text-white shadow-lg' : 'text-slate-400'}`}>Z-SCORE</button>
                  <button onClick={() => setSelectedView('raw')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${selectedView === 'raw' ? 'bg-netflix-red text-white shadow-lg' : 'text-slate-400'}`}>{t('readiness.values')}</button>
                </div>
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={processedData} margin={{ left: -10, right: 10, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="dateShort" tick={{fontSize: 9, fill: '#475569'}} axisLine={false} />
                    <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#475569'}} domain={selectedView === 'zscore' ? [-3, 3] : ['auto', 'auto']} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#94a3b8'}} domain={[0, 100]} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff'}} />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} iconType="circle" />
                    
                    <Bar yAxisId="right" dataKey="carga" name={t('readiness.load_tss')} fill="#4f46e5" fillOpacity={0.1} barSize={20} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="readiness" name="Readiness %" stroke="#ffffff" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                    
                    {selectedView === 'zscore' ? (
                      <>
                        <ReferenceLine yAxisId="left" y={-1.2} stroke="#f43f5e" strokeDasharray="3 3" />
                        <Line yAxisId="left" type="monotone" dataKey="zHRV" name="HRV (Z-Score)" stroke="#6366f1" strokeWidth={3} dot={(props: any) => {
                           if (!props.cx || !props.cy) return <></>;
                           if (props.payload.severity === 'critical') return <circle key={`dot-${props.payload.date}`} cx={props.cx} cy={props.cy} r={5} fill="#f43f5e" stroke="white" strokeWidth={1} />;
                           return <circle key={`dot-${props.payload.date}`} cx={props.cx} cy={props.cy} r={2} fill="#6366f1" />;
                        }} />
                      </>
                    ) : (
                      <>
                        <Area yAxisId="left" type="monotone" dataKey="rmssd" fill="#6366f1" fillOpacity={0.05} stroke="#6366f1" strokeWidth={3} name="HRV (RMSSD)" />
                        <Line yAxisId="left" type="monotone" dataKey="baselineRMSSD" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} name={t('readiness.avg_7d')} />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* INFO PANELS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-6">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <ShieldAlert size={14} className="text-indigo-400" /> {t('readiness.algorithm_notes')}
                </h4>
                <div className="space-y-3 text-sm text-slate-400">
                  <p>• <strong>{t('readiness.null_detection')}:</strong> {t('readiness.null_detection_desc')}</p>
                  <p>• <strong>{t('readiness.sensitivity')}:</strong> {t('readiness.sensitivity_desc')}</p>
                </div>
              </div>
              <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-6">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Info size={14} className="text-indigo-400" /> {t('readiness.diagnosis')}
                </h4>
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800 h-full flex flex-col justify-center">
                  <p className="text-sm text-slate-300 italic">
                    {latest.isSleepMissing ? 
                      t('readiness.diag_partial') :
                      (latest.readiness < 45 ? t('readiness.diag_critical') : 
                       latest.readiness < 65 ? t('readiness.diag_warning') : 
                       t('readiness.diag_optimal'))
                    }
                  </p>
                </div>
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

const MetricCard = ({ title, value, sub, color, icon, warning }: any) => {
  const themes: any = {
    blue: 'border-blue-500/20 text-blue-400 bg-blue-500/5 ring-1 ring-blue-500/10',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 ring-1 ring-emerald-500/10',
    indigo: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/5 ring-1 ring-indigo-500/10',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-500/5 ring-1 ring-amber-500/10',
  };
  return (
    <div className={`p-5 rounded-3xl border ${themes[color]} transition-all hover:scale-[1.02] relative overflow-hidden`}>
      {warning && <div className="absolute top-0 right-0 p-2"><AlertTriangle size={12} className="text-amber-500 opacity-50" /></div>}
      <div className="flex items-center justify-between mb-1 opacity-60">
        <span className="text-[10px] uppercase font-bold tracking-widest">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-[10px] mt-1 opacity-50 font-medium truncate">{sub}</div>
    </div>
  );
};

export default Readiness;
