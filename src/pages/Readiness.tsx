import { useState, useMemo, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ReferenceLine, Area, Bar, ComposedChart, Line, ReferenceArea
} from 'recharts';
import { Activity, AlertCircle, ShieldAlert, Heart, RefreshCw, Info, ArrowLeft, Scale } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

// --- API CONFIG ---
// Use Vite proxy in development to avoid CORS issues
const API_BASE = '/api/v1';

// Helper function to fetch data with proper auth
const fetchIntervalsAPI = async (endpoint: string, apiKey: string) => {
  const url = `${API_BASE}${endpoint}`;
  console.log('Fetching:', url);
  
  return fetch(url, {
    headers: {
      'Authorization': 'Basic ' + btoa('API_KEY:' + apiKey),
      'Accept': 'application/json'
    }
  });
};

// Helper to parse CSV response
const parseCSV = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj: any = {};
    headers.forEach((h, i) => {
      obj[h] = values[i];
    });
    return obj;
  });
  return rows;
};

const Readiness = () => {
  const { apiKey, user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isSpanish = i18n.language === 'es';
  
  const [rawWellness, setRawWellness] = useState<any[]>([]);
  const [dailyLoads, setDailyLoads] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'ci' | 'readiness' | 'raw' | 'zscore'>('ci');

  // --- DATA FETCHING ---
  const fetchIntervalsData = async () => {
    if (!apiKey || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const oldest = new Date();
      oldest.setDate(oldest.getDate() - 30);
      const oldestStr = oldest.toISOString().split('T')[0];
      const newestStr = new Date().toISOString().split('T')[0];
      
      const athleteId = user.id || '0';
      
      console.log('API Key (first 5 chars):', apiKey?.substring(0, 5));
      
      // Fetch wellness data
      const wellnessEndpoint = `/athlete/${athleteId}/wellness?oldest=${oldestStr}`;
      const wellnessResponse = await fetchIntervalsAPI(wellnessEndpoint, apiKey!);

      if (!wellnessResponse.ok) {
        if (wellnessResponse.status === 401) throw new Error(t('readiness.error_unauthorized'));
        throw new Error(`API Error: ${wellnessResponse.status}`);
      }
      
      const wellnessData = await wellnessResponse.json();
      if (!Array.isArray(wellnessData)) throw new Error(t('readiness.error_invalid_response'));

      const sorted = [...wellnessData].sort((a, b) => new Date(a.id).getTime() - new Date(b.id).getTime());
      setRawWellness(sorted);
      
      // Fetch activities data for training load
      const activitiesEndpoint = `/athlete/${athleteId}/activities.csv?oldest=${oldestStr}&newest=${newestStr}`;
      const activitiesResponse = await fetch(`${API_BASE}${activitiesEndpoint}`, {
        headers: {
          'Authorization': 'Basic ' + btoa('API_KEY:' + apiKey),
          'Accept': 'text/csv'
        }
      });
      
      if (activitiesResponse.ok) {
        const csvText = await activitiesResponse.text();
        const activities = parseCSV(csvText);
        
        // Aggregate daily training load (sum of icu_training_load per day)
        const loadByDate: Record<string, number> = {};
        activities.forEach((act: any) => {
          // Extract date from start_date_local (format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)
          const dateStr = act.start_date_local?.split('T')[0];
          if (dateStr && act.icu_training_load) {
            const load = parseFloat(act.icu_training_load) || 0;
            loadByDate[dateStr] = (loadByDate[dateStr] || 0) + load;
          }
        });
        
        console.log('Daily loads:', loadByDate);
        setDailyLoads(loadByDate);
      }

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

  // --- ALGORITHM V3 (SNA Analysis with Confidence Intervals) ---
  const processedData = useMemo(() => {
    if (rawWellness.length === 0) return [];

    const baseData = rawWellness.map(w => ({
      date: w.id,
      rmssd: w.hrv || null,
      lnHRV: w.hrv ? Math.log(w.hrv) : null,
      rhr: w.restingHR || null,
      sleep: w.sleepSecs ? (w.sleepSecs / 3600) : null,
      sleepScore: w.sleepScore || null,
      carga: dailyLoads[w.id] || 0
    })).filter(d => d.rmssd !== null && d.rhr !== null);

    if (baseData.length < 2) return [];

    // Estadísticas 30d para rangos históricos
    const allRMSSD = baseData.map(d => d.rmssd!);
    const gMinRMSSD = Math.min(...allRMSSD);
    const gMaxRMSSD = Math.max(...allRMSSD);
    const allLN = baseData.map(d => d.lnHRV!);
    const gMinLN = Math.min(...allLN);
    const gMaxLN = Math.max(...allLN);
    const allRHR = baseData.map(d => d.rhr!);
    const gMinRHR = Math.min(...allRHR);
    const gMaxRHR = Math.max(...allRHR);

    const gMeanRMSSD = allRMSSD.reduce((a, b) => a + b, 0) / allRMSSD.length;
    const gStdRMSSD = Math.sqrt(allRMSSD.reduce((s, v) => s + Math.pow(v - gMeanRMSSD, 2), 0) / allRMSSD.length);
    const gMeanRHR = allRHR.reduce((a, b) => a + b, 0) / allRHR.length;
    const gStdRHR = Math.sqrt(allRHR.reduce((s, v) => s + Math.pow(v - gMeanRHR, 2), 0) / allRHR.length);

    return baseData.map((d, i, arr) => {
      const prevWindow = arr.slice(Math.max(0, i - 7), i);
      const yesterday = arr[i - 1];
      
      // IC lnHRV (7 días)
      const lnValues = prevWindow.map(p => p.lnHRV!);
      const lnMean = lnValues.length > 0 ? lnValues.reduce((a,b)=>a+b,0)/lnValues.length : d.lnHRV!;
      const lnStd = lnValues.length > 0 ? Math.sqrt(lnValues.reduce((s,v)=>s+Math.pow(v-lnMean,2),0)/lnValues.length) : 0.1;
      const ciUpper = lnMean + (0.75 * lnStd);
      const ciLower = lnMean - (0.75 * lnStd);

      // IC RHR (7 días)
      const rhrValues = prevWindow.map(p => p.rhr!);
      const rhrMean = rhrValues.length > 0 ? rhrValues.reduce((a,b)=>a+b,0)/rhrValues.length : d.rhr!;
      const rhrStd = rhrValues.length > 0 ? Math.sqrt(rhrValues.reduce((s,v)=>s+Math.pow(v-rhrMean,2),0)/rhrValues.length) : 2;
      const rhrCiUpper = rhrMean + (0.75 * rhrStd);
      const rhrCiLower = rhrMean - (0.75 * rhrStd);

      // Detección de cambios bruscos (±15% HRV o ±3 bpm RHR)
      let sharpHrv = false;
      let sharpRhr = false;
      if (yesterday) {
        const hrvChange = Math.abs(d.rmssd! - yesterday.rmssd!) / yesterday.rmssd!;
        if (hrvChange > 0.15) sharpHrv = true;
        const rhrChange = Math.abs(d.rhr! - yesterday.rhr!);
        if (rhrChange >= 3) sharpRhr = true;
      }

      // --- ALGORITMO V3 ---
      const penalties = { hrvBase: 0, hrvSwing: 0, sharpChange: 0, sleep: 0, rhr: 0 };
      
      // 1. Base Score (Capped at 100 before penalties)
      const hrvRatio = d.rmssd! / Math.exp(lnMean);
      const baseScoreRaw = Math.pow(hrvRatio, 1.4) * 100;
      const baseScore = Math.min(100, baseScoreRaw);

      // 2. Penalización por inestabilidad (Fuera de rango)
      const isOutsideCI = d.lnHRV! < ciLower || d.lnHRV! > ciUpper;
      if (isOutsideCI) penalties.hrvSwing = 12.5;
      
      // 3. Penalización por cambio brusco
      if (sharpHrv || sharpRhr) penalties.sharpChange = 5;
      
      // 4. Estrés Cardiovascular (RHR)
      const rhrDiff = d.rhr! - rhrMean;
      if (rhrDiff > 1.5) penalties.rhr = Math.min(15, rhrDiff * 2.5);

      // 5. Sueño
      const isSleepMissing = (d.sleep === null && d.sleepScore === null);
      if (!isSleepMissing && d.sleep !== null && d.sleep < 7) {
        penalties.sleep = Math.min(25, (7 - d.sleep) * 12);
      }

      const totalPenalty = Object.values(penalties).reduce((a,b)=>a+b,0);
      const finalReadiness = Math.max(0, baseScore - totalPenalty);
      
      const mainPenaltyKey = Object.entries(penalties).sort((a,b)=>b[1]-a[1])[0][0];

      return {
        ...d,
        dateShort: d.date.substring(5),
        readiness: Number(finalReadiness.toFixed(0)),
        lnHRV_fmt: Number(d.lnHRV!.toFixed(2)),
        ciUpper: Number(ciUpper.toFixed(3)),
        ciLower: Number(ciLower.toFixed(3)),
        rhrCiUpper: Number(rhrCiUpper.toFixed(2)),
        rhrCiLower: Number(rhrCiLower.toFixed(2)),
        zHRV: Number(((d.rmssd! - gMeanRMSSD) / (gStdRMSSD || 1)).toFixed(2)),
        zRHR: Number(((d.rhr! - gMeanRHR) / (gStdRHR || 1)).toFixed(2)),
        isOutsideCI,
        isRhrOutsideCI: d.rhr! < rhrCiLower || d.rhr! > rhrCiUpper,
        isSharp: sharpHrv || sharpRhr,
        mainPenalty: mainPenaltyKey,
        totalPenalty: totalPenalty.toFixed(1),
        baselineRMSSD: Number(Math.exp(lnMean).toFixed(1)),
        isSleepMissing,
        // Rangos para las tarjetas
        range7d_LN: `${ciLower.toFixed(2)} - ${ciUpper.toFixed(2)}`,
        range30d_LN: `${gMinLN.toFixed(2)} - ${gMaxLN.toFixed(2)}`,
        range7d_RHR: `${rhrCiLower.toFixed(0)} - ${rhrCiUpper.toFixed(0)}`,
        range30d_RHR: `${gMinRHR} - ${gMaxRHR}`,
        severity: finalReadiness < 45 ? 'critical' : finalReadiness < 65 ? 'warning' : 'normal'
      };
    });
  }, [rawWellness, dailyLoads]);

  const latest = processedData.length > 0 ? processedData[processedData.length - 1] : null;

  const penaltyLabels: Record<string, string> = {
    hrvBase: isSpanish ? 'Baja Variabilidad' : 'Low Variability',
    hrvSwing: isSpanish ? 'Inestabilidad SNA' : 'ANS Instability',
    sharpChange: isSpanish ? 'Cambio Brusco' : 'Sharp Change',
    sleep: isSpanish ? 'Falta Descanso' : 'Lack of Rest',
    rhr: isSpanish ? 'Estrés Cardíaco' : 'Cardiac Stress',
    none: 'Normal'
  };

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
             <h1 className="text-3xl font-bold text-white uppercase tracking-tighter">Readiness Monitor <span className="text-netflix-red">V3</span></h1>
             <p className="text-sm text-gray-500">{isSpanish ? 'Motor SNA con Intervalos de Confianza' : 'ANS Engine with Confidence Intervals'}</p>
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
            {/* STATUS SUMMARY - V3 with 4 cards */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
              {/* Readiness Score Card */}
              <div className={`p-6 rounded-3xl border-2 flex flex-col items-center justify-center transition-all ${latest.severity === 'critical' ? 'bg-rose-500/10 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : latest.severity === 'warning' ? 'bg-amber-500/10 border-amber-500' : 'bg-emerald-500/10 border-emerald-500'}`}>
                <span className="text-[10px] font-bold opacity-60 uppercase mb-1 tracking-widest text-center">Readiness SNA</span>
                <span className="text-5xl font-black tracking-tighter">{latest.readiness}%</span>
                <div className="mt-3 flex flex-col items-center gap-1">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${latest.isOutsideCI || latest.isSharp ? 'bg-rose-500 text-white' : 'bg-white/10 text-white'}`}>
                    {latest.isOutsideCI ? (isSpanish ? 'SNA Inestable' : 'ANS Unstable') : latest.isSharp ? (isSpanish ? 'Cambio Brusco' : 'Sharp Change') : (isSpanish ? 'SNA Estable' : 'ANS Stable')}
                  </span>
                </div>
              </div>
              
              {/* SNA (lnRMSSD) Card */}
              <DetailedMetricCard 
                title="SNA (lnRMSSD)" 
                value={latest.lnHRV_fmt} 
                range7={latest.range7d_LN}
                range30={latest.range30d_LN}
                isInRange={!latest.isOutsideCI}
                color={latest.isOutsideCI ? "rose" : "blue"} 
                icon={<Scale size={16}/>} 
                isSpanish={isSpanish}
              />
              
              {/* RHR Card */}
              <DetailedMetricCard 
                title={isSpanish ? "Pulso (RHR)" : "Pulse (RHR)"} 
                value={`${latest.rhr} bpm`} 
                range7={latest.range7d_RHR}
                range30={latest.range30d_RHR}
                isInRange={!latest.isRhrOutsideCI}
                color={latest.isRhrOutsideCI ? "rose" : "emerald"} 
                icon={<Heart size={16}/>} 
                isSpanish={isSpanish}
              />

              {/* Limiting Factor Card */}
              <MetricCard 
                title={isSpanish ? "Limitante" : "Limiting Factor"} 
                value={penaltyLabels[latest.mainPenalty] || 'Normal'} 
                sub={`${isSpanish ? 'Impacto' : 'Impact'}: -${latest.totalPenalty} pts`} 
                color={latest.severity === 'critical' ? "rose" : "amber"} 
                icon={<ShieldAlert size={16}/>} 
              />
            </div>

            {/* CHART SECTION */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 mb-8 shadow-xl relative ring-1 ring-white/5">
              {/* View Selector */}
              <div className="flex flex-wrap bg-slate-800 p-1 rounded-xl w-fit mb-6 gap-1">
                <button onClick={() => setSelectedView('ci')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${selectedView === 'ci' ? 'bg-netflix-red text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'}`}>
                  {isSpanish ? 'Zonas de Confianza' : 'Confidence Zones'}
                </button>
                <button onClick={() => setSelectedView('readiness')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${selectedView === 'readiness' ? 'bg-netflix-red text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'}`}>
                  Readiness
                </button>
                <button onClick={() => setSelectedView('raw')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${selectedView === 'raw' ? 'bg-netflix-red text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'}`}>
                  {isSpanish ? 'Valores MS' : 'MS Values'}
                </button>
                <button onClick={() => setSelectedView('zscore')} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${selectedView === 'zscore' ? 'bg-netflix-red text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'}`}>
                  Z-Scores
                </button>
              </div>

              {/* Confidence Intervals View */}
              {selectedView === 'ci' && (
                <div className="space-y-6">
                  {/* lnRMSSD Chart */}
                  <div className="h-[260px] w-full relative">
                    <div className="absolute top-0 left-0 text-[10px] font-black text-indigo-400/40 uppercase tracking-[0.2em]">
                      {isSpanish ? 'Dinámica SNA (lnRMSSD)' : 'ANS Dynamics (lnRMSSD)'}
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={processedData} syncId="wellnessSync" margin={{ bottom: 0, top: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="dateShort" hide />
                        <YAxis tick={{fontSize: 10, fill: '#475569'}} domain={['auto', 'auto']} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff'}}
                          itemStyle={{fontSize: '11px'}}
                          formatter={(val: any) => [typeof val === 'number' ? val.toFixed(2) : val]}
                        />
                        <Area type="monotone" dataKey="ciUpper" stroke="none" fill="#6366f1" fillOpacity={0.08} name={isSpanish ? "Techo SNA" : "ANS Ceiling"} />
                        <Area type="monotone" dataKey="ciLower" stroke="none" fill="#141414" fillOpacity={1} />
                        <Line type="monotone" dataKey="lnHRV_fmt" name="lnRMSSD" stroke="#818cf8" strokeWidth={3} dot={(p: any) => {
                           if (!p.cx || !p.cy) return null;
                           const isCrit = p.payload.isOutsideCI || p.payload.isSharp;
                           return <circle key={`dot-hrv-${p.payload.date}`} cx={p.cx} cy={p.cy} r={isCrit ? 5 : 2} fill={isCrit ? "#f43f5e" : "#818cf8"} stroke="white" strokeWidth={isCrit ? 1 : 0} />;
                        }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* RHR Chart */}
                  <div className="h-[200px] w-full relative">
                    <div className="absolute top-0 left-0 text-[10px] font-black text-emerald-400/40 uppercase tracking-[0.2em]">
                      {isSpanish ? 'Carga Cardiovascular (Pulso)' : 'Cardiovascular Load (Pulse)'}
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={processedData} syncId="wellnessSync" margin={{ top: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="dateShort" tick={{fontSize: 9, fill: '#475569'}} axisLine={false} />
                        <YAxis tick={{fontSize: 10, fill: '#475569'}} domain={['auto', 'auto']} axisLine={false} tickLine={false} orientation="right" />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff'}}
                          itemStyle={{fontSize: '11px'}}
                        />
                        <Area type="monotone" dataKey="rhrCiUpper" stroke="none" fill="#10b981" fillOpacity={0.06} name={isSpanish ? "Techo RHR" : "RHR Ceiling"} />
                        <Area type="monotone" dataKey="rhrCiLower" stroke="none" fill="#141414" fillOpacity={1} />
                        <Line type="monotone" dataKey="rhr" name="RHR (bpm)" stroke="#10b981" strokeWidth={2} dot={(p: any) => (
                           <circle key={`dot-rhr-${p.payload.date}`} cx={p.cx} cy={p.cy} r={p.payload.isRhrOutsideCI || p.payload.isSharp ? 4 : 2} fill={p.payload.isRhrOutsideCI || p.payload.isSharp ? "#f43f5e" : "#10b981"} />
                        )} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Readiness View */}
              {selectedView === 'readiness' && (
                <div className="h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={processedData} margin={{ left: -10, right: 10, top: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="dateShort" tick={{fontSize: 9, fill: '#475569'}} axisLine={false} />
                      <YAxis tick={{fontSize: 10, fill: '#475569'}} domain={[0, 100]} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff'}} />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                      
                      <ReferenceArea y1={0} y2={45} fill="#f43f5e" fillOpacity={0.08} />
                      <ReferenceArea y1={45} y2={65} fill="#fbbf24" fillOpacity={0.08} />
                      <ReferenceArea y1={65} y2={100} fill="#10b981" fillOpacity={0.08} />
                      
                      <ReferenceLine y={45} stroke="#f43f5e" strokeDasharray="3 3" />
                      <ReferenceLine y={65} stroke="#fbbf24" strokeDasharray="3 3" />

                      <Line type="monotone" dataKey="readiness" name="Readiness Score" stroke="#ffffff" strokeWidth={4} dot={(p: any) => {
                         return <circle key={`dot-read-${p.payload.date}`} cx={p.cx} cy={p.cy} r={5} fill={p.payload.readiness < 45 ? "#f43f5e" : p.payload.readiness < 65 ? "#fbbf24" : "#10b981"} stroke="white" strokeWidth={1} />;
                      }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Raw Values & Z-Score Views */}
              {(selectedView === 'raw' || selectedView === 'zscore') && (
                <div className="h-[450px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={processedData} margin={{ left: -10, right: 10, top: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="dateShort" tick={{fontSize: 9, fill: '#475569'}} axisLine={false} />
                      <YAxis yAxisId="left" tick={{fontSize: 10, fill: '#475569'}} domain={selectedView === 'zscore' ? [-3, 3] : ['auto', 'auto']} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10, fill: '#94a3b8'}} domain={[0, 100]} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', color: '#fff'}} formatter={(v: any) => typeof v === 'number' ? v.toFixed(2) : v} />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} iconType="circle" />
                      
                      {selectedView === 'raw' && (
                        <>
                          <Area yAxisId="left" type="monotone" dataKey="rmssd" name="HRV (ms)" fill="#6366f1" fillOpacity={0.05} stroke="#6366f1" strokeWidth={3} />
                          <Line yAxisId="left" type="monotone" dataKey="rhr" name={isSpanish ? "Pulso (bpm)" : "Pulse (bpm)"} stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                          <Bar yAxisId="right" dataKey="carga" name={isSpanish ? "Carga (TSS)" : "Load (TSS)"} fill="#4f46e5" fillOpacity={0.15} barSize={12} radius={[2, 2, 0, 0]} />
                        </>
                      )}

                      {selectedView === 'zscore' && (
                        <>
                          <ReferenceLine yAxisId="left" y={0} stroke="#475569" strokeDasharray="5 5" />
                          <ReferenceLine yAxisId="left" y={1.5} stroke="#f43f5e" strokeDasharray="3 3" />
                          <ReferenceLine yAxisId="left" y={-1.5} stroke="#f43f5e" strokeDasharray="3 3" />
                          <Line yAxisId="left" type="monotone" dataKey="zHRV" name="Z-HRV" stroke="#6366f1" strokeWidth={3} dot={false} />
                          <Line yAxisId="left" type="monotone" dataKey="zRHR" name="Z-RHR" stroke="#10b981" strokeWidth={2} dot={false} />
                        </>
                      )}
                      <Line yAxisId="right" type="monotone" dataKey="readiness" name="Readiness %" stroke="#ffffff" strokeWidth={2} dot={false} strokeDasharray="10 5" opacity={0.2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* INFO PANELS - V3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SNA Alerts Panel */}
              <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-6 ring-1 ring-white/5">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ShieldAlert size={14} /> {isSpanish ? 'Análisis de Alertas SNA' : 'ANS Alert Analysis'}
                </h4>
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                  <ul className="text-[11px] space-y-4">
                    <li className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-bold uppercase tracking-tighter">{isSpanish ? 'Variabilidad (SNA)' : 'Variability (ANS)'}</span>
                        <span className="text-slate-500 italic">lnRMSSD vs {isSpanish ? 'Banda' : 'Band'} 7d: <span className="text-indigo-400 font-mono font-bold ml-1">{latest.range7d_LN}</span></span>
                      </div>
                      <span className={latest.isOutsideCI ? "text-rose-400 font-bold bg-rose-500/10 px-2 py-1 rounded" : "text-emerald-400"}>
                        {latest.isOutsideCI ? (isSpanish ? "Inestable (-12.5)" : "Unstable (-12.5)") : (isSpanish ? "Estable" : "Stable")}
                      </span>
                    </li>
                    <li className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-bold uppercase tracking-tighter">{isSpanish ? 'Respuesta Cardíaca' : 'Cardiac Response'}</span>
                        <span className="text-slate-500 italic">RHR vs {isSpanish ? 'Banda' : 'Band'} 7d: <span className="text-emerald-400 font-mono font-bold ml-1">{latest.range7d_RHR}</span></span>
                      </div>
                      <span className={latest.isRhrOutsideCI ? "text-rose-400 font-bold bg-rose-500/10 px-2 py-1 rounded" : "text-emerald-400"}>
                        {latest.isRhrOutsideCI ? (isSpanish ? "Desviado" : "Deviated") : "Normal"}
                      </span>
                    </li>
                    <li className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-bold uppercase tracking-tighter">{isSpanish ? 'Cambio Brusco' : 'Sharp Change'}</span>
                        <span className="text-slate-500 italic">{isSpanish ? 'Variación ±15% HRV / ±3 bpm' : 'Variation ±15% HRV / ±3 bpm'}</span>
                      </div>
                      <span className={latest.isSharp ? "text-amber-400 font-bold animate-pulse bg-amber-400/10 px-2 py-1 rounded" : "text-slate-600"}>
                        {latest.isSharp ? (isSpanish ? "SISTEMA REACTIVO (-5)" : "REACTIVE SYSTEM (-5)") : "Normal"}
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Interpretation Panel */}
              <div className="bg-slate-800/40 border border-slate-700 rounded-3xl p-6 ring-1 ring-white/5 flex flex-col">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Info size={14} /> {isSpanish ? 'Interpretación de Niveles' : 'Level Interpretation'}
                </h4>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-center">
                      <p className="text-[8px] uppercase font-bold text-rose-400">{isSpanish ? 'Descanso' : 'Rest'}</p>
                      <p className="text-xs font-black text-white">&lt; 45%</p>
                    </div>
                    <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20 text-center">
                      <p className="text-[8px] uppercase font-bold text-amber-400">{isSpanish ? 'Precaución' : 'Caution'}</p>
                      <p className="text-xs font-black text-white">45-65%</p>
                    </div>
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-center">
                      <p className="text-[8px] uppercase font-bold text-emerald-400">{isSpanish ? 'Óptimo' : 'Optimal'}</p>
                      <p className="text-xs font-black text-white">&gt; 65%</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed italic">
                    {isSpanish 
                      ? '*Para garantizar la precisión, el algoritmo limita el potencial máximo a 100 ANTES de restar penalizaciones. Esto asegura que la inestabilidad detectada siempre reduzca la nota final.'
                      : '*To ensure accuracy, the algorithm caps the maximum potential at 100 BEFORE subtracting penalties. This ensures that detected instability always reduces the final score.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/10">
            <Activity size={48} className="mb-4 opacity-20 text-indigo-400" />
            <p className="text-center px-8 text-sm font-medium italic">
              {loading ? t('readiness.loading_data') : (isSpanish ? 'Sincroniza tus datos para activar el análisis avanzado del SNA.' : 'Sync your data to activate advanced ANS analysis.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Detailed Metric Card Component for V3
const DetailedMetricCard = ({ title, value, range7, range30, isInRange, color, icon, isSpanish }: any) => {
  const themes: any = {
    blue: 'border-blue-500/20 text-blue-400 bg-blue-500/5 ring-1 ring-blue-500/10',
    rose: 'border-rose-500/20 text-rose-400 bg-rose-500/5 ring-1 ring-rose-500/10',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5 ring-1 ring-emerald-500/10',
  };

  return (
    <div className={`p-5 rounded-3xl border ${themes[color]} transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-2 opacity-60">
        <span className="text-[10px] uppercase font-bold tracking-widest">{title}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <div className="text-2xl font-black text-white tracking-tighter">{value}</div>
        <div className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${isInRange ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
          {isInRange ? (isSpanish ? 'Estable' : 'Stable') : (isSpanish ? 'Inestable' : 'Unstable')}
        </div>
      </div>
      <div className="space-y-1.5 mt-2 border-t border-white/5 pt-3">
        <div className="flex justify-between items-center text-[9px]">
          <span className="opacity-40 uppercase font-bold tracking-tighter">{isSpanish ? 'Banda 7d' : 'Band 7d'}</span>
          <span className="text-slate-300 font-mono font-bold tracking-tighter">{range7}</span>
        </div>
        <div className="flex justify-between items-center text-[9px]">
          <span className="opacity-40 uppercase font-bold tracking-tighter">{isSpanish ? 'Hist 30d' : 'Hist 30d'}</span>
          <span className="text-slate-400 font-mono tracking-tighter">{range30}</span>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, sub, color, icon }: any) => {
  const themes: any = {
    rose: 'border-rose-500/20 text-rose-400 bg-rose-500/5 ring-1 ring-rose-500/10',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-500/5 ring-1 ring-amber-500/10',
  };
  return (
    <div className={`p-5 rounded-3xl border ${themes[color]}`}>
      <div className="flex items-center justify-between mb-2 opacity-60">
        <span className="text-[10px] uppercase font-bold tracking-widest">{title}</span>
        {icon}
      </div>
      <div className="text-lg font-black text-white leading-tight mb-1 truncate">{value}</div>
      <div className="text-[9px] opacity-50 font-medium truncate uppercase tracking-tighter">{sub}</div>
    </div>
  );
};

export default Readiness;
