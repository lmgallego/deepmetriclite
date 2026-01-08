import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceArea, Legend
} from 'recharts';
import {
  ArrowLeft, Calendar, Activity, Zap, Heart, Gauge, Repeat,
  Filter, Save, Wrench, X, CloudUpload, AlertCircle, LucideIcon
} from 'lucide-react';

const API_BASE = '/api/v1';

// --- Utils ---
const copyToClipboard = (text: string) => {
  if (!text) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
};

const fallbackCopy = (text: string) => {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  } catch (err) {
    console.error(err);
  }
};

interface Stats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
  outliers: number[];
  mean: number;
}

const calculateStats = (data: any[], key: string): Stats | null => {
  if (!data || data.length === 0) return null;
  const values = data.map(d => d[key]).filter((v): v is number => v !== null && v !== undefined).sort((a, b) => a - b);
  if (values.length === 0) return null;
  const q1 = values[Math.floor((values.length / 4))];
  const median = values[Math.floor((values.length / 2))];
  const q3 = values[Math.floor((values.length * (3 / 4)))];
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  const outliers = values.filter(v => v < lowerFence || v > upperFence);
  return { min: values[0], q1, median, q3, max: values[values.length - 1], iqr, lowerFence, upperFence, outliers, mean: values.reduce((a, b) => a + b, 0) / values.length };
};

// --- Components ---
interface VerticalBoxPlotProps {
  stats: Stats | null;
  label: string;
  color: string;
  icon: LucideIcon;
  unit: string;
}

const VerticalBoxPlot = ({ stats, label, color, icon: Icon, unit }: VerticalBoxPlotProps) => {
  if (!stats) return (
    <div className="flex-1 h-full flex items-center justify-center text-gray-500 text-xs bg-gray-800/30 rounded-lg">
      Sin datos
    </div>
  );
  
  const dataMin = Math.min(stats.min, stats.lowerFence);
  const dataMax = Math.max(stats.max, stats.upperFence);
  let range = dataMax - dataMin;
  if (range === 0) range = 1;
  const scale = (val: number) => ((val - dataMin) / range) * 80 + 10;

  return (
    <div className="flex-1 flex flex-col items-center h-full relative group hover:bg-gray-800/50 transition-all duration-300 rounded-xl py-3 border border-transparent hover:border-gray-700">
      <div className="mb-2 text-center z-10 pointer-events-none">
        <div className="flex items-center justify-center gap-1 text-gray-300 font-bold text-xs uppercase tracking-wide">
          <Icon size={12} className={color} /> {label}
        </div>
        <div className="text-[10px] text-gray-500 font-mono">{unit}</div>
      </div>
      <div className="relative w-full flex-1 mx-auto" style={{ maxWidth: '80px' }}>
        <div className="absolute left-1/2 top-[10%] bottom-[10%] w-px bg-gray-700 transform -translate-x-1/2"></div>
        <div className="absolute left-1/2 w-0.5 bg-gray-500 transform -translate-x-1/2" style={{ bottom: `${scale(stats.lowerFence)}%`, height: `${scale(stats.upperFence) - scale(stats.lowerFence)}%` }} />
        <div 
          className="absolute left-1/2 w-10 transform -translate-x-1/2 border border-gray-600 group-hover:w-12 transition-all duration-300 rounded-sm cursor-help"
          title={`Q3: ${stats.q3}\nMediana: ${stats.median}\nQ1: ${stats.q1}`}
          style={{ bottom: `${scale(stats.q1)}%`, height: `${Math.max(2, scale(stats.q3) - scale(stats.q1))}%`, backgroundColor: color, opacity: 0.5 }} 
        />
        <div className="absolute left-1/2 w-12 h-0.5 bg-white transform -translate-x-1/2 z-10" style={{ bottom: `${scale(stats.median)}%` }} />
        <div className="absolute left-1/2 w-6 h-0.5 bg-gray-500 transform -translate-x-1/2" style={{ bottom: `${scale(stats.lowerFence)}%` }} />
        <div className="absolute left-1/2 w-6 h-0.5 bg-gray-500 transform -translate-x-1/2" style={{ bottom: `${scale(stats.upperFence)}%` }} />
        {stats.outliers.slice(0, 50).map((val, idx) => {
          const pct = scale(val);
          if (pct < 0 || pct > 100) return null;
          return (
            <div 
              key={idx} 
              className="absolute left-1/2 w-2 h-2 rounded-full border border-gray-900 transform -translate-x-1/2 -translate-y-1/2 hover:scale-150 z-20 transition-all bg-red-500" 
              style={{ bottom: `${pct}%`, opacity: 0.8 }} 
              title={`Outlier: ${val}`} 
            />
          );
        })}
      </div>
      <div className="mt-2 text-center z-10">
        {stats.outliers.length > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-900/50 text-red-400 border border-red-800">
            {stats.outliers.length} outliers
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-900/50 text-green-400 border border-green-800">
            Clean
          </span>
        )}
      </div>
    </div>
  );
};

// Calendar Day Component
interface CalendarDayProps {
  date: Date;
  activities: any[];
  isSelected: boolean;
  onClick: () => void;
}

const CalendarDay = ({ date, activities, isSelected, onClick }: CalendarDayProps) => {
  const dayActivities = activities.filter(a => {
    const actDate = new Date(a.start_date_local).toDateString();
    return actDate === date.toDateString();
  });
  
  const isToday = new Date().toDateString() === date.toDateString();
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`
        relative p-3 rounded-xl cursor-pointer transition-all border
        ${isSelected ? 'bg-netflix-red border-netflix-red' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'}
        ${isToday && !isSelected ? 'ring-2 ring-netflix-red/50' : ''}
      `}
    >
      <div className="text-center">
        <div className="text-[10px] text-gray-400 uppercase">{dayNames[date.getDay()]}</div>
        <div className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-300'}`}>
          {date.getDate()}
        </div>
        <div className="text-[10px] text-gray-500">
          {date.toLocaleDateString('es-ES', { month: 'short' })}
        </div>
      </div>
      {dayActivities.length > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
          {dayActivities.length}
        </div>
      )}
    </motion.div>
  );
};

export default function IntervalsDataDoctor() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { apiKey } = useAuth();
  const isSpanish = i18n.language === 'es';

  // States
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Selection for chart
  const [selection, setSelection] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });
  const [isSelecting, setIsSelecting] = useState(false);
  
  // Filters & Tools
  const [filterMin, setFilterMin] = useState('');
  const [filterMax, setFilterMax] = useState('');
  const [filterMetric, setFilterMetric] = useState('watts');
  const [fixMetric, setFixMetric] = useState('watts');
  const [fixThreshold, setFixThreshold] = useState('');
  const [fixMode, setFixMode] = useState('zero');
  
  // CSV & Upload
  const [csvOutput, setCsvOutput] = useState('');
  const [uploadStatus, setUploadStatus] = useState<{ status: string; message: string }>({ status: 'idle', message: '' });
  const [confirmingUpload, setConfirmingUpload] = useState(false);

  // Generate last 15 days
  const last15Days = useMemo(() => {
    const days: Date[] = [];
    for (let i = 14; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d);
    }
    return days;
  }, []);

  // Fetch activities on mount
  useEffect(() => {
    if (apiKey) {
      fetchActivities();
    }
  }, [apiKey]);

  const fetchActivities = async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);
    
    const today = new Date();
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(today.getDate() - 15);
    const newestStr = today.toISOString().split('T')[0];
    const oldestStr = fifteenDaysAgo.toISOString().split('T')[0];
    
    try {
      const res = await fetch(`${API_BASE}/athlete/0/activities?oldest=${oldestStr}&newest=${newestStr}`, {
        headers: {
          'Authorization': 'Basic ' + btoa('API_KEY:' + apiKey),
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) throw new Error(isSpanish ? 'API Key inválida' : 'Invalid API Key');
        throw new Error(`Error: ${res.status}`);
      }
      
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreams = async (activityId: string) => {
    if (!apiKey || !activityId) return;
    setLoading(true);
    setRawData([]);
    setSelection({ start: null, end: null });
    setError(null);
    
    try {
      const res = await fetch(`${API_BASE}/activity/${activityId}/streams?types=watts,cadence,heartrate,torque`, {
        headers: {
          'Authorization': 'Basic ' + btoa('API_KEY:' + apiKey),
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) throw new Error(isSpanish ? 'Error cargando streams' : 'Error loading streams');
      
      const streams = await res.json();
      const maxLength = Math.max(...streams.map((s: any) => s.data?.length || 0));
      const formatted: any[] = [];
      
      const wattsS = streams.find((s: any) => s.type === 'watts')?.data || [];
      const hrS = streams.find((s: any) => s.type === 'heartrate')?.data || [];
      const cadS = streams.find((s: any) => s.type === 'cadence')?.data || [];
      const torqS = streams.find((s: any) => s.type === 'torque')?.data || [];
      
      for (let i = 0; i < maxLength; i++) {
        formatted.push({
          time: i,
          watts: wattsS[i] ?? null,
          heartrate: hrS[i] ?? null,
          cadence: cadS[i] ?? null,
          torque: torqS[i] ?? null
        });
      }
      
      setRawData(formatted);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Derived Data
  const activeData = useMemo(() => {
    if (selection.start !== null && selection.end !== null && rawData.length > 0) {
      const start = Math.min(selection.start, selection.end);
      const end = Math.max(selection.start, selection.end);
      return rawData.filter(d => d.time >= start && d.time <= end);
    }
    return rawData;
  }, [rawData, selection]);

  const stats = useMemo(() => ({
    watts: calculateStats(activeData, 'watts'),
    cadence: calculateStats(activeData, 'cadence'),
    heartrate: calculateStats(activeData, 'heartrate'),
    torque: calculateStats(activeData, 'torque'),
  }), [activeData]);

  const filteredForTable = useMemo(() => {
    return activeData.filter(row => {
      const val = row[filterMetric];
      if (val === null) return true;
      const min = filterMin === '' ? -Infinity : Number(filterMin);
      const max = filterMax === '' ? Infinity : Number(filterMax);
      return val >= min && val <= max;
    });
  }, [activeData, filterMin, filterMax, filterMetric]);

  // Get activities for selected date
  const selectedDateActivities = useMemo(() => {
    if (!selectedDate) return [];
    return activities.filter(a => {
      const actDate = new Date(a.start_date_local).toDateString();
      return actDate === selectedDate.toDateString();
    });
  }, [selectedDate, activities]);

  // Handlers
  const handleDataChange = (time: number, key: string, val: string) => {
    const realIdx = rawData.findIndex(r => r.time === time);
    if (realIdx !== -1) {
      const newData = [...rawData];
      newData[realIdx] = { ...newData[realIdx], [key]: val === '' ? null : Number(val) };
      setRawData(newData);
    }
  };

  const applyPeakCorrection = () => {
    if (!fixThreshold || isNaN(Number(fixThreshold))) {
      alert(isSpanish ? 'Valor numérico requerido.' : 'Numeric value required.');
      return;
    }
    const thr = Number(fixThreshold);
    const metricStats = stats[fixMetric as keyof typeof stats];
    const mean = metricStats ? Math.round(metricStats.mean) : 0;
    let count = 0;
    
    const newData = rawData.map(row => {
      const val = row[fixMetric];
      if (val !== null && val > thr) {
        count++;
        let cVal = fixMode === 'zero' ? 0 : fixMode === 'mean' ? mean : thr;
        return { ...row, [fixMetric]: cVal };
      }
      return row;
    });
    
    if (count > 0) {
      setRawData(newData);
      alert(isSpanish ? `Corregidos ${count} puntos.` : `Corrected ${count} points.`);
    } else {
      alert(isSpanish ? 'No se encontraron picos.' : 'No peaks found.');
    }
  };

  const generateFullCSV = () => {
    if (rawData.length === 0) return;
    const headers = ['time', 'watts', 'heartrate', 'cadence', 'torque'];
    let csv = headers.join(',') + '\n';
    rawData.forEach(row => {
      csv += headers.map(h => row[h] ?? '').join(',') + '\n';
    });
    setCsvOutput(csv);
    setUploadStatus({ status: 'idle', message: '' });
    setConfirmingUpload(false);
  };

  const handleUpload = async () => {
    if (!selectedActivity) return;
    setLoading(true);
    setUploadStatus({ status: 'uploading', message: isSpanish ? 'Subiendo...' : 'Uploading...' });
    
    try {
      const blob = new Blob([csvOutput], { type: 'text/csv' });
      const formData = new FormData();
      formData.append('file', blob, 'streams.csv');
      
      const res = await fetch(`${API_BASE}/activity/${selectedActivity.id}/streams.csv`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Basic ' + btoa('API_KEY:' + apiKey)
        },
        body: formData
      });
      
      if (!res.ok) throw new Error(res.statusText);
      setUploadStatus({ status: 'success', message: isSpanish ? 'Subida Exitosa' : 'Upload Successful' });
      setConfirmingUpload(false);
    } catch (e: any) {
      setUploadStatus({ status: 'error', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  // Chart handlers
  const handleMouseDown = (e: any) => {
    if (e?.activeLabel !== undefined) {
      setIsSelecting(true);
      setSelection({ start: e.activeLabel, end: e.activeLabel });
    }
  };
  
  const handleMouseMove = (e: any) => {
    if (isSelecting && e?.activeLabel !== undefined) {
      setSelection(prev => ({ ...prev, end: e.activeLabel }));
    }
  };
  
  const handleMouseUp = () => setIsSelecting(false);
  const clearSelection = () => setSelection({ start: null, end: null });

  return (
    <div className="min-h-screen bg-netflix-black text-white pt-20 pb-12 px-4 sm:px-8">
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
            <h1 className="text-3xl md:text-4xl font-bold">
              Intervals <span className="text-netflix-red">Data Doctor</span>
            </h1>
            <p className="text-gray-400 mt-1">
              {isSpanish ? 'Corrección de picos de potencia' : 'Power peaks correction'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-xl flex items-center gap-3 text-red-400">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Calendar Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="text-netflix-red" size={20} />
            <h2 className="text-xl font-bold">
              {isSpanish ? 'Últimos 15 días' : 'Last 15 days'}
            </h2>
          </div>
          
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-15 gap-2">
            {last15Days.map((date, idx) => (
              <CalendarDay
                key={idx}
                date={date}
                activities={activities}
                isSelected={selectedDate?.toDateString() === date.toDateString()}
                onClick={() => {
                  setSelectedDate(date);
                  setSelectedActivity(null);
                  setRawData([]);
                }}
              />
            ))}
          </div>
        </div>

        {/* Activities for selected date */}
        <AnimatePresence>
          {selectedDate && selectedDateActivities.length > 0 && !selectedActivity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <h3 className="text-lg font-bold mb-4 text-gray-300">
                {isSpanish ? 'Actividades del' : 'Activities on'} {selectedDate.toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedDateActivities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedActivity(activity);
                      fetchStreams(activity.id);
                    }}
                    className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer hover:border-netflix-red transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-netflix-red/20 rounded-lg">
                        <Activity className="text-netflix-red" size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{activity.name}</h4>
                        <p className="text-sm text-gray-400">
                          {activity.moving_time ? `${Math.round(activity.moving_time / 60)} min` : ''} 
                          {activity.icu_training_load ? ` · ${activity.icu_training_load} TSS` : ''}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No activities message */}
        {selectedDate && selectedDateActivities.length === 0 && (
          <div className="mb-8 p-8 bg-gray-800/30 border border-gray-700 rounded-xl text-center">
            <Activity className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400">
              {isSpanish ? 'No hay actividades en esta fecha' : 'No activities on this date'}
            </p>
          </div>
        )}

        {/* Data Doctor Interface */}
        <AnimatePresence>
          {selectedActivity && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Activity Header */}
              <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex items-center gap-3">
                  <Activity className="text-netflix-red" size={24} />
                  <div>
                    <h3 className="font-bold text-lg">{selectedActivity.name}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(selectedActivity.start_date_local).toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedActivity(null);
                    setRawData([]);
                  }}
                  className="p-2 hover:bg-gray-700 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-netflix-red"></div>
                </div>
              ) : rawData.length > 0 ? (
                <>
                  {/* Stats Distribution */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
                      <Activity size={16} className="text-gray-400" />
                      <span className="font-semibold text-sm">
                        {isSpanish ? 'Distribución de Datos' : 'Data Distribution'}
                      </span>
                    </div>
                    <div className="p-6 h-[280px] flex gap-4 md:gap-8 justify-around">
                      <VerticalBoxPlot stats={stats.watts} label={isSpanish ? 'Potencia' : 'Power'} unit="Watts" color="#818cf8" icon={Zap} />
                      <VerticalBoxPlot stats={stats.heartrate} label="FC" unit="BPM" color="#fb923c" icon={Heart} />
                      <VerticalBoxPlot stats={stats.cadence} label={isSpanish ? 'Cadencia' : 'Cadence'} unit="RPM" color="#34d399" icon={Repeat} />
                      <VerticalBoxPlot stats={stats.torque} label="Torque" unit="N-m" color="#60a5fa" icon={Gauge} />
                    </div>
                  </div>

                  {/* Peak Correction Tool */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
                      <Wrench size={16} className="text-orange-400" />
                      <span className="font-semibold text-sm">
                        {isSpanish ? 'Corrección Automática de Picos' : 'Automatic Peak Correction'}
                      </span>
                    </div>
                    <div className="p-4 flex flex-col md:flex-row gap-4 items-end md:items-center">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                          {isSpanish ? 'Métrica' : 'Metric'}
                        </label>
                        <select 
                          value={fixMetric} 
                          onChange={(e) => setFixMetric(e.target.value)} 
                          className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg outline-none focus:border-netflix-red"
                        >
                          <option value="watts">{isSpanish ? 'Potencia' : 'Power'}</option>
                          <option value="cadence">{isSpanish ? 'Cadencia' : 'Cadence'}</option>
                          <option value="heartrate">HR</option>
                          <option value="torque">Torque</option>
                        </select>
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                          {isSpanish ? 'Si es mayor a...' : 'If greater than...'}
                        </label>
                        <input 
                          type="number" 
                          value={fixThreshold} 
                          onChange={(e) => setFixThreshold(e.target.value)} 
                          placeholder="Ej: 1500" 
                          className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg outline-none focus:border-netflix-red"
                        />
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">
                          {isSpanish ? 'Corregir con...' : 'Correct with...'}
                        </label>
                        <select 
                          value={fixMode} 
                          onChange={(e) => setFixMode(e.target.value)} 
                          className="w-full px-3 py-2 text-sm bg-gray-900 border border-gray-700 rounded-lg outline-none focus:border-netflix-red"
                        >
                          <option value="zero">{isSpanish ? 'Cero (0)' : 'Zero (0)'}</option>
                          <option value="mean">{isSpanish ? 'Media de la Actividad' : 'Activity Mean'}</option>
                          <option value="cap">{isSpanish ? 'Limitar al valor máximo' : 'Cap to max value'}</option>
                        </select>
                      </div>
                      <button 
                        onClick={applyPeakCorrection} 
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Wrench size={16} /> {isSpanish ? 'Aplicar' : 'Apply'}
                      </button>
                    </div>
                  </div>

                  {/* Interactive Timeline - Power & HR */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden select-none">
                    <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity size={16} className="text-gray-400" />
                        <span className="font-semibold text-sm">
                          {isSpanish ? 'Cronología Interactiva' : 'Interactive Timeline'}
                        </span>
                        {selection.start !== null && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({Math.abs((selection.end || 0) - selection.start)}s {isSpanish ? 'seleccionados' : 'selected'})
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={clearSelection} 
                        disabled={selection.start === null}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                          selection.start !== null 
                            ? 'bg-red-900/50 text-red-400 border border-red-800 hover:bg-red-800/50' 
                            : 'bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed'
                        }`}
                      >
                        <X size={12} /> {isSpanish ? 'Limpiar Selección' : 'Clear Selection'}
                      </button>
                    </div>
                    
                    {/* Power & Heart Rate Chart */}
                    <div className="p-4 h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={rawData} 
                          onMouseDown={handleMouseDown} 
                          onMouseMove={handleMouseMove} 
                          onMouseUp={handleMouseUp}
                          syncId="dataDoctor"
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                          <XAxis dataKey="time" hide />
                          <YAxis yAxisId="left" orientation="left" stroke="#818cf8" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `${v}W`} />
                          <YAxis yAxisId="right" orientation="right" stroke="#fb923c" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `${v}`} />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: '#1f2937', 
                              borderRadius: '12px', 
                              border: '1px solid #374151', 
                              fontSize: '12px' 
                            }}
                            formatter={(value, name) => {
                              if (name === 'watts') return [`${value} W`, isSpanish ? 'Potencia' : 'Power'];
                              if (name === 'heartrate') return [`${value} bpm`, 'FC'];
                              return [value, name];
                            }}
                            labelFormatter={(label) => `${label}s`}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={30}
                            formatter={(value) => {
                              if (value === 'watts') return isSpanish ? 'Potencia (W)' : 'Power (W)';
                              if (value === 'heartrate') return 'FC (bpm)';
                              return value;
                            }}
                          />
                          <Line yAxisId="left" type="monotone" dataKey="watts" name="watts" stroke="#818cf8" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                          <Line yAxisId="right" type="monotone" dataKey="heartrate" name="heartrate" stroke="#fb923c" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                          {selection.start !== null && selection.end !== null && (
                            <ReferenceArea 
                              yAxisId="left" 
                              x1={Math.min(selection.start, selection.end)} 
                              x2={Math.max(selection.start, selection.end)} 
                              strokeOpacity={0.3} 
                              fill="#e50914" 
                              fillOpacity={0.2} 
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Cadence & Torque Chart */}
                    <div className="px-4 pb-4 h-[180px] border-t border-gray-700/50">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={rawData} 
                          onMouseDown={handleMouseDown} 
                          onMouseMove={handleMouseMove} 
                          onMouseUp={handleMouseUp}
                          syncId="dataDoctor"
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                          <XAxis dataKey="time" fontSize={10} stroke="#6b7280" tickFormatter={(v) => `${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`} />
                          <YAxis yAxisId="left" orientation="left" stroke="#34d399" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `${v}`} />
                          <YAxis yAxisId="right" orientation="right" stroke="#60a5fa" fontSize={10} domain={['auto', 'auto']} tickFormatter={(v) => `${v}`} />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: '#1f2937', 
                              borderRadius: '12px', 
                              border: '1px solid #374151', 
                              fontSize: '12px' 
                            }}
                            formatter={(value, name) => {
                              if (name === 'cadence') return [`${value} rpm`, isSpanish ? 'Cadencia' : 'Cadence'];
                              if (name === 'torque') return [`${value} Nm`, 'Torque'];
                              return [value, name];
                            }}
                            labelFormatter={(label) => `${label}s`}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={30}
                            formatter={(value) => {
                              if (value === 'cadence') return isSpanish ? 'Cadencia (rpm)' : 'Cadence (rpm)';
                              if (value === 'torque') return 'Torque (Nm)';
                              return value;
                            }}
                          />
                          <Line yAxisId="left" type="monotone" dataKey="cadence" name="cadence" stroke="#34d399" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                          <Line yAxisId="right" type="monotone" dataKey="torque" name="torque" stroke="#60a5fa" dot={false} strokeWidth={1.5} isAnimationActive={false} />
                          {selection.start !== null && selection.end !== null && (
                            <ReferenceArea 
                              yAxisId="left" 
                              x1={Math.min(selection.start, selection.end)} 
                              x2={Math.max(selection.start, selection.end)} 
                              strokeOpacity={0.3} 
                              fill="#e50914" 
                              fillOpacity={0.2} 
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Data Table Editor */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden flex flex-col h-[400px]">
                    <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
                      <Filter size={16} className="text-gray-400" />
                      <span className="font-semibold text-sm">
                        {isSpanish ? 'Editor Manual' : 'Manual Editor'} ({activeData.length} {isSpanish ? 'filas' : 'rows'})
                      </span>
                    </div>
                    
                    <div className="px-4 py-3 bg-gray-900/50 border-b border-gray-700 flex gap-4 items-center">
                      <div className="flex-1">
                        <select 
                          value={filterMetric} 
                          onChange={(e) => setFilterMetric(e.target.value)} 
                          className="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg outline-none"
                        >
                          <option value="watts">{isSpanish ? 'Filtrar por Potencia' : 'Filter by Power'}</option>
                          <option value="cadence">{isSpanish ? 'Filtrar por Cadencia' : 'Filter by Cadence'}</option>
                          <option value="heartrate">{isSpanish ? 'Filtrar por FC' : 'Filter by HR'}</option>
                          <option value="torque">{isSpanish ? 'Filtrar por Torque' : 'Filter by Torque'}</option>
                        </select>
                      </div>
                      <div className="flex gap-2 w-1/3">
                        <input 
                          type="number" 
                          value={filterMin} 
                          onChange={e => setFilterMin(e.target.value)} 
                          className="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg outline-none" 
                          placeholder="Min" 
                        />
                        <input 
                          type="number" 
                          value={filterMax} 
                          onChange={e => setFilterMax(e.target.value)} 
                          className="w-full px-2 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg outline-none" 
                          placeholder="Max" 
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto">
                      <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-gray-900 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-2.5">Time</th>
                            <th className="px-4 py-2.5 text-indigo-400">Watts</th>
                            <th className="px-4 py-2.5 text-orange-400">HR</th>
                            <th className="px-4 py-2.5 text-emerald-400">Cad</th>
                            <th className="px-4 py-2.5 text-blue-400">Torq</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {filteredForTable.slice(0, 100).map((row) => (
                            <tr key={`${row.time}-${row.watts}-${row.heartrate}-${row.cadence}-${row.torque}`} className="hover:bg-gray-800/50 transition-colors">
                              <td className="px-4 py-1.5 font-mono text-xs text-gray-500">{row.time}</td>
                              <td className="px-4 py-1.5">
                                <input 
                                  type="number" 
                                  className="w-20 px-2 py-1 text-xs text-white bg-gray-900 border border-gray-700 rounded-md focus:border-netflix-red outline-none" 
                                  defaultValue={row.watts ?? ''} 
                                  onBlur={(e) => handleDataChange(row.time, 'watts', e.target.value)} 
                                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                />
                              </td>
                              <td className="px-4 py-1.5">
                                <input 
                                  type="number" 
                                  className="w-16 px-2 py-1 text-xs text-white bg-gray-900 border border-gray-700 rounded-md focus:border-netflix-red outline-none" 
                                  defaultValue={row.heartrate ?? ''} 
                                  onBlur={(e) => handleDataChange(row.time, 'heartrate', e.target.value)} 
                                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                />
                              </td>
                              <td className="px-4 py-1.5">
                                <input 
                                  type="number" 
                                  className="w-16 px-2 py-1 text-xs text-white bg-gray-900 border border-gray-700 rounded-md focus:border-netflix-red outline-none" 
                                  defaultValue={row.cadence ?? ''} 
                                  onBlur={(e) => handleDataChange(row.time, 'cadence', e.target.value)} 
                                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                />
                              </td>
                              <td className="px-4 py-1.5">
                                <input 
                                  type="number" 
                                  className="w-16 px-2 py-1 text-xs text-white bg-gray-900 border border-gray-700 rounded-md focus:border-netflix-red outline-none" 
                                  defaultValue={row.torque ?? ''} 
                                  onBlur={(e) => handleDataChange(row.time, 'torque', e.target.value)} 
                                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredForTable.length > 100 && (
                        <div className="p-3 text-center text-[10px] text-gray-500 bg-gray-900/50 border-t border-gray-800">
                          ... {filteredForTable.length - 100} {isSpanish ? 'filas más ocultas' : 'more rows hidden'} ...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Generate CSV & Upload Button */}
                  <div className="flex justify-end">
                    <button 
                      onClick={generateFullCSV} 
                      className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all"
                    >
                      <Save size={18} /> {isSpanish ? 'Generar CSV & Subir' : 'Generate CSV & Upload'}
                    </button>
                  </div>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CSV Upload Modal */}
        <AnimatePresence>
          {csvOutput && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-700"
              >
                <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
                  <Save size={16} className="text-gray-400" />
                  <span className="font-semibold text-sm">
                    {isSpanish ? 'Revisión y Subida' : 'Review & Upload'}
                  </span>
                </div>
                <div className="p-6">
                  <div className="text-xs text-gray-400 mb-2">
                    {isSpanish 
                      ? 'Este CSV contiene todos los datos de la actividad, incluidas tus correcciones.'
                      : 'This CSV contains all activity data, including your corrections.'}
                  </div>
                  <textarea 
                    readOnly 
                    value={csvOutput} 
                    className="w-full h-48 text-[11px] font-mono p-4 border border-gray-700 rounded-xl bg-gray-800 text-gray-300 focus:outline-none resize-none mb-4" 
                  />
                  
                  {uploadStatus.status !== 'idle' && (
                    <div className={`mb-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
                      uploadStatus.status === 'success' ? 'bg-green-900/50 text-green-400 border border-green-800' : 
                      uploadStatus.status === 'error' ? 'bg-red-900/50 text-red-400 border border-red-800' : 
                      'bg-blue-900/50 text-blue-400 border border-blue-800'
                    }`}>
                      <span className="font-medium">{uploadStatus.message}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-3 justify-end items-center">
                    <button 
                      onClick={() => setCsvOutput('')} 
                      className="px-4 py-2 text-sm font-medium text-gray-400 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      {isSpanish ? 'Cerrar' : 'Close'}
                    </button>
                    <button 
                      onClick={() => copyToClipboard(csvOutput)} 
                      className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {isSpanish ? 'Copiar CSV' : 'Copy CSV'}
                    </button>
                    {!confirmingUpload ? (
                      <button 
                        onClick={() => setConfirmingUpload(true)} 
                        disabled={loading || uploadStatus.status === 'success'} 
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-netflix-red hover:bg-red-700 rounded-lg transition-all disabled:opacity-50"
                      >
                        {uploadStatus.status === 'success' ? (isSpanish ? 'Subido' : 'Uploaded') : (
                          <>
                            <CloudUpload size={16} /> {isSpanish ? 'Subir a Intervals' : 'Upload to Intervals'}
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-400 font-bold mr-2">
                          {isSpanish ? '¿Sobrescribir datos?' : 'Overwrite data?'}
                        </span>
                        <button 
                          onClick={() => setConfirmingUpload(false)} 
                          className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-white"
                        >
                          {isSpanish ? 'Cancelar' : 'Cancel'}
                        </button>
                        <button 
                          onClick={handleUpload} 
                          className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                        >
                          {isSpanish ? 'Sí, Subir' : 'Yes, Upload'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
