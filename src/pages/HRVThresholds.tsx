import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import {
  ArrowLeft, Calendar, Activity, Heart, X, AlertCircle, TrendingUp
} from 'lucide-react';

const API_BASE = '/api/v1';

// --- Types ---
interface DataPoint {
  time: number;
  hr: number;
  rra1: number;
  rrRatio: number;
  alpha1: number;
}

interface ThresholdResult {
  splitIndex: number;
  thresholdHeartRate: number;
  thresholdMetric: number;
  time: number;
}

interface ZoneThresholds {
  rra1: ThresholdResult | null;
  rrRatio: ThresholdResult | null;
  alpha1: ThresholdResult | null;
}

type ZoneName = 'REC' | 'VT1' | 'VT1Plus' | 'MSS' | 'VT2';

const ZONE_COLORS: Record<ZoneName, string> = {
  REC: '#92400e',
  VT1: '#2563eb',
  VT1Plus: '#7c3aed',
  MSS: '#ea580c',
  VT2: '#dc2626'
};

// --- Threshold Detection Algorithm ---
function findThresholdOptimized(data: DataPoint[], metricKey: keyof DataPoint): ThresholdResult | null {
  if (data.length < 10) return null;
  
  let bestFit: ThresholdResult | null = null;
  let bestError = Infinity;

  for (let i = 3; i < data.length - 3; i++) {
    const leftData = data.slice(0, i);
    const rightData = data.slice(i);

    const left = quickLinearFit(leftData, metricKey);
    const right = quickLinearFit(rightData, metricKey);

    const error = calculateError(data, i, left, right, metricKey);

    if (error < bestError) {
      bestError = error;
      bestFit = {
        splitIndex: i,
        thresholdHeartRate: data[i].hr,
        thresholdMetric: data[i][metricKey] as number,
        time: data[i].time,
      };
    }
  }
  return bestFit;
}

function quickLinearFit(data: DataPoint[], metricKey: keyof DataPoint) {
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  const n = data.length;

  for (let i = 0; i < n; i++) {
    const x = data[i].hr;
    const y = data[i][metricKey] as number;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { m: 0, b: sumY / n };
  
  const m = (n * sumXY - sumX * sumY) / denominator;
  const b = (sumY - m * sumX) / n;

  return { m, b };
}

function calculateError(data: DataPoint[], split: number, left: { m: number; b: number }, right: { m: number; b: number }, metricKey: keyof DataPoint) {
  let error = 0;
  for (let i = 0; i < split; i++) {
    const yPred = left.m * data[i].hr + left.b;
    error += Math.pow((data[i][metricKey] as number) - yPred, 2);
  }
  for (let i = split; i < data.length; i++) {
    const yPred = right.m * data[i].hr + right.b;
    error += Math.pow((data[i][metricKey] as number) - yPred, 2);
  }
  return error;
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// --- Calendar Day Component ---
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
        ${isSelected ? 'bg-purple-600 border-purple-500' : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'}
        ${isToday && !isSelected ? 'ring-2 ring-purple-500/50' : ''}
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

// --- Main Component ---
export default function HRVThresholds() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const { apiKey } = useAuth();
  const isSpanish = i18n.language === 'es';

  // States
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // HRV Data states
  const [maxHR, setMaxHR] = useState<number>(0);
  const [filteredData, setFilteredData] = useState<Record<ZoneName, DataPoint[]>>({
    REC: [], VT1: [], VT1Plus: [], MSS: [], VT2: []
  });
  const [thresholds, setThresholds] = useState<Record<ZoneName, ZoneThresholds>>({
    REC: { rra1: null, rrRatio: null, alpha1: null },
    VT1: { rra1: null, rrRatio: null, alpha1: null },
    VT1Plus: { rra1: null, rrRatio: null, alpha1: null },
    MSS: { rra1: null, rrRatio: null, alpha1: null },
    VT2: { rra1: null, rrRatio: null, alpha1: null },
  });

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

  const fetchHRVData = async (activity: any) => {
    if (!apiKey || !activity) return;
    setLoading(true);
    setError(null);
    
    try {
      // First get activity details to get athlete_max_hr
      const activityRes = await fetch(`${API_BASE}/activity/${activity.id}`, {
        headers: {
          'Authorization': 'Basic ' + btoa('API_KEY:' + apiKey),
          'Accept': 'application/json'
        }
      });
      
      if (!activityRes.ok) throw new Error(isSpanish ? 'Error cargando actividad' : 'Error loading activity');
      
      const activityDetail = await activityRes.json();
      const athleteMaxHR = activityDetail.athlete_max_hr || activityDetail.max_heartrate || 190;
      setMaxHR(athleteMaxHR);
      
      // Fetch streams
      const streamsRes = await fetch(`${API_BASE}/activity/${activity.id}/streams?keys=heartrate,dfa_a1,respiration`, {
        headers: {
          'Authorization': 'Basic ' + btoa('API_KEY:' + apiKey),
          'Accept': 'application/json'
        }
      });
      
      if (!streamsRes.ok) throw new Error(isSpanish ? 'Error cargando streams' : 'Error loading streams');
      
      const streams = await streamsRes.json();
      
      console.log('Raw streams response:', streams);
      console.log('Streams type:', typeof streams);
      console.log('Streams keys:', Object.keys(streams));
      
      // The API might return different formats:
      // 1. Object with keys: { heartrate: [...], dfa_a1: [...] }
      // 2. Object with data property: { heartrate: { data: [...] }, dfa_a1: { data: [...] } }
      // 3. Array of stream objects: [{ type: 'heartrate', data: [...] }, ...]
      
      let hr: number[] = [];
      let dfa_a1: number[] = [];
      let respiration: number[] = [];
      
      if (Array.isArray(streams)) {
        // Format 3: Array of stream objects
        const hrStream = streams.find((s: any) => s.type === 'heartrate');
        const dfaStream = streams.find((s: any) => s.type === 'dfa_a1');
        const respStream = streams.find((s: any) => s.type === 'respiration');
        hr = hrStream?.data || [];
        dfa_a1 = dfaStream?.data || [];
        respiration = respStream?.data || [];
      } else if (streams.heartrate?.data) {
        // Format 2: Object with data property
        hr = streams.heartrate.data || [];
        dfa_a1 = streams.dfa_a1?.data || [];
        respiration = streams.respiration?.data || [];
      } else {
        // Format 1: Direct arrays
        hr = streams.heartrate || [];
        dfa_a1 = streams.dfa_a1 || [];
        respiration = streams.respiration || [];
      }
      
      console.log('Streams loaded:', { hr: hr.length, dfa_a1: dfa_a1.length, respiration: respiration.length });
      
      if (!hr.length || !dfa_a1.length || !respiration.length) {
        throw new Error(isSpanish ? 'No hay datos HRV suficientes' : 'Not enough HRV data');
      }
      
      // Define zones based on max HR
      const zones: Record<ZoneName, { lower: number; upper: number }> = {
        REC: { lower: athleteMaxHR * 0.40, upper: athleteMaxHR * 0.71 },
        VT1: { lower: athleteMaxHR * 0.72, upper: athleteMaxHR * 0.80 },
        VT1Plus: { lower: athleteMaxHR * 0.81, upper: athleteMaxHR * 0.84 },
        MSS: { lower: athleteMaxHR * 0.84, upper: athleteMaxHR * 0.89 },
        VT2: { lower: athleteMaxHR * 0.89, upper: athleteMaxHR * 0.95 }
      };
      
      // Sample data to max 300 points
      const maxPoints = 300;
      const samplingFactor = Math.max(1, Math.floor(hr.length / maxPoints));
      
      // Filter data by zones
      const newFilteredData: Record<ZoneName, DataPoint[]> = {
        REC: [], VT1: [], VT1Plus: [], MSS: [], VT2: []
      };
      
      const zoneNames: ZoneName[] = ['REC', 'VT1', 'VT1Plus', 'MSS', 'VT2'];
      
      zoneNames.forEach(zone => {
        for (let i = 0; i < hr.length; i += samplingFactor) {
          if (dfa_a1[i] > 0 && respiration[i] > 0) {
            if (hr[i] >= zones[zone].lower && hr[i] <= zones[zone].upper) {
              newFilteredData[zone].push({
                time: i,
                hr: hr[i],
                rra1: respiration[i] / (60 * dfa_a1[i]),
                rrRatio: respiration[i] / hr[i],
                alpha1: dfa_a1[i]
              });
            }
          }
        }
      });
      
      setFilteredData(newFilteredData);
      
      // Calculate thresholds for each zone
      const newThresholds: Record<ZoneName, ZoneThresholds> = {
        REC: { rra1: null, rrRatio: null, alpha1: null },
        VT1: { rra1: null, rrRatio: null, alpha1: null },
        VT1Plus: { rra1: null, rrRatio: null, alpha1: null },
        MSS: { rra1: null, rrRatio: null, alpha1: null },
        VT2: { rra1: null, rrRatio: null, alpha1: null },
      };
      
      zoneNames.forEach(zone => {
        if (newFilteredData[zone].length >= 10) {
          newThresholds[zone] = {
            rra1: findThresholdOptimized(newFilteredData[zone], 'rra1'),
            rrRatio: findThresholdOptimized(newFilteredData[zone], 'rrRatio'),
            alpha1: findThresholdOptimized(newFilteredData[zone], 'alpha1')
          };
        }
      });
      
      setThresholds(newThresholds);
      console.log('Thresholds calculated:', newThresholds);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get activities for selected date
  const selectedDateActivities = useMemo(() => {
    if (!selectedDate) return [];
    return activities.filter(a => {
      const actDate = new Date(a.start_date_local).toDateString();
      return actDate === selectedDate.toDateString();
    });
  }, [selectedDate, activities]);

  const handleActivitySelect = (activity: any) => {
    setSelectedActivity(activity);
    fetchHRVData(activity);
  };

  const resetSelection = () => {
    setSelectedActivity(null);
    setFilteredData({ REC: [], VT1: [], VT1Plus: [], MSS: [], VT2: [] });
    setThresholds({
      REC: { rra1: null, rrRatio: null, alpha1: null },
      VT1: { rra1: null, rrRatio: null, alpha1: null },
      VT1Plus: { rra1: null, rrRatio: null, alpha1: null },
      MSS: { rra1: null, rrRatio: null, alpha1: null },
      VT2: { rra1: null, rrRatio: null, alpha1: null },
    });
  };

  // Calculate estimated HR for each zone
  const estimatedHR = useMemo(() => {
    const result: Record<ZoneName, number | null> = {
      REC: null, VT1: null, VT1Plus: null, MSS: null, VT2: null
    };
    
    const zoneNames: ZoneName[] = ['REC', 'VT1', 'VT1Plus', 'MSS', 'VT2'];
    
    zoneNames.forEach(zone => {
      const t = thresholds[zone];
      if (t.rra1 && t.rrRatio && t.alpha1) {
        result[zone] = Math.round((
          t.rra1.thresholdHeartRate +
          t.rrRatio.thresholdHeartRate +
          t.alpha1.thresholdHeartRate
        ) / 3);
      }
    });
    
    return result;
  }, [thresholds]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return filteredData.VT1.map(d => ({
      time: d.time,
      rra1: d.rra1,
      rrRatio: d.rrRatio,
      alpha1: d.alpha1,
      hr: d.hr
    }));
  }, [filteredData]);

  const hasData = Object.values(filteredData).some(arr => arr.length > 0);

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
              {isSpanish ? 'Umbrales' : 'Thresholds'} <span className="text-purple-500">HRV</span>
            </h1>
            <p className="text-gray-400 mt-1">
              {isSpanish ? 'Detección de umbrales mediante DFA Alpha 1' : 'Threshold detection via DFA Alpha 1'}
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
        {!selectedActivity && (
          <>
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="text-purple-500" size={20} />
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
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Activities for selected date */}
            <AnimatePresence>
              {selectedDate && selectedDateActivities.length > 0 && (
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
                        onClick={() => handleActivitySelect(activity)}
                        className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl cursor-pointer hover:border-purple-500 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-600/20 rounded-lg">
                            <Activity className="text-purple-500" size={20} />
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
          </>
        )}

        {/* HRV Analysis Results */}
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
                  <Activity className="text-purple-500" size={24} />
                  <div>
                    <h3 className="font-bold text-lg">{selectedActivity.name}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(selectedActivity.start_date_local).toLocaleDateString(isSpanish ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {maxHR > 0 && <span className="ml-2 text-red-400">· FC Max: {maxHR} bpm</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetSelection}
                  className="p-2 hover:bg-gray-700 rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : hasData ? (
                <>
                  {/* Threshold Results */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Heart className="text-red-500" size={20} />
                      {isSpanish ? 'Umbrales HRV Estimados' : 'Estimated HRV Thresholds'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {(['REC', 'VT1', 'VT1Plus', 'MSS', 'VT2'] as ZoneName[]).map(zone => (
                        <div 
                          key={zone}
                          className="p-4 rounded-xl text-center"
                          style={{ 
                            backgroundColor: `${ZONE_COLORS[zone]}20`,
                            borderColor: `${ZONE_COLORS[zone]}50`,
                            borderWidth: 1
                          }}
                        >
                          <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: ZONE_COLORS[zone] }}>
                            {zone === 'VT1' ? 'HRVT1' : zone === 'VT1Plus' ? 'HRVT1+' : zone === 'VT2' ? 'HRVT2' : zone === 'MSS' ? 'MSS' : zone}
                          </div>
                          {estimatedHR[zone] ? (
                            <>
                              <div className="text-2xl font-bold text-white">
                                {estimatedHR[zone]} <span className="text-sm font-normal text-gray-400">ppm</span>
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">
                              {isSpanish ? 'Sin datos' : 'No data'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
                      <TrendingUp size={16} className="text-purple-400" />
                      <span className="font-semibold text-sm">
                        {isSpanish ? 'Detección Cambios HRV' : 'HRV Change Detection'}
                      </span>
                    </div>
                    <div className="p-4 h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="time" 
                            stroke="#9ca3af" 
                            fontSize={10}
                            tickFormatter={(v) => formatTime(v)}
                          />
                          <YAxis 
                            yAxisId="left"
                            stroke="#9ca3af" 
                            fontSize={10}
                            domain={[0, 'auto']}
                          />
                          <YAxis 
                            yAxisId="right"
                            orientation="right"
                            stroke="#9ca3af" 
                            fontSize={10}
                            domain={['auto', 'auto']}
                          />
                          <RechartsTooltip 
                            contentStyle={{ 
                              backgroundColor: '#1f2937', 
                              borderRadius: '12px', 
                              border: '1px solid #374151', 
                              fontSize: '12px' 
                            }}
                            labelFormatter={(label) => formatTime(label as number)}
                          />
                          <Legend />
                          
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="rra1" 
                            name="RRa1"
                            stroke="#f97316" 
                            dot={false}
                            strokeWidth={1}
                            isAnimationActive={false}
                          />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="rrRatio" 
                            name="Resp/FC"
                            stroke="#3b82f6" 
                            dot={false}
                            strokeWidth={1}
                            isAnimationActive={false}
                          />
                          <Line 
                            yAxisId="left"
                            type="monotone" 
                            dataKey="alpha1" 
                            name="DFA Alpha-1"
                            stroke="#22c55e" 
                            dot={false}
                            strokeWidth={1}
                            isAnimationActive={false}
                          />
                          <Line 
                            yAxisId="right"
                            type="monotone" 
                            dataKey="hr" 
                            name="FC"
                            stroke="#6b7280" 
                            dot={false}
                            strokeWidth={1}
                            isAnimationActive={false}
                          />
                          
                          {/* Threshold lines */}
                          {(['REC', 'VT1', 'VT1Plus', 'MSS', 'VT2'] as ZoneName[]).map(zone => {
                            if (estimatedHR[zone]) {
                              const label = zone === 'VT1' ? 'HRVT1' : zone === 'VT1Plus' ? 'HRVT1+' : zone === 'VT2' ? 'HRVT2' : zone;
                              return (
                                <ReferenceLine 
                                  key={zone}
                                  yAxisId="right"
                                  y={estimatedHR[zone]!} 
                                  stroke={ZONE_COLORS[zone]} 
                                  strokeWidth={1}
                                  strokeDasharray="5 5"
                                  label={{ 
                                    value: label, 
                                    position: 'right',
                                    fill: ZONE_COLORS[zone],
                                    fontSize: 10
                                  }}
                                />
                              );
                            }
                            return null;
                          })}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-purple-900/20 border border-purple-600/30 rounded-xl p-4">
                    <h4 className="font-bold text-purple-400 mb-2">
                      {isSpanish ? '¿Cómo interpretar estos datos?' : 'How to interpret this data?'}
                    </h4>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• <strong>REC:</strong> {isSpanish ? 'Zona de recuperación' : 'Recovery zone'}</li>
                      <li>• <strong>HRVT1:</strong> {isSpanish ? 'Umbral HRV 1' : 'HRV Threshold 1'}</li>
                      <li>• <strong>HRVT1+:</strong> {isSpanish ? 'Zona de transición' : 'Transition zone'}</li>
                      <li>• <strong>MSS:</strong> {isSpanish ? 'Estado Estable' : 'Steady State'}</li>
                      <li>• <strong>HRVT2:</strong> {isSpanish ? 'Umbral HRV 2' : 'HRV Threshold 2'}</li>
                    </ul>
                  </div>

                  {/* Disclaimer */}
                  <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4">
                    <h4 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
                      <AlertCircle size={16} />
                      {isSpanish ? 'Aviso importante' : 'Important notice'}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {isSpanish 
                        ? 'Este método no tiene ningún tipo de validación científica y su uso es exclusivamente para hacer pruebas. Los umbrales HRV pueden cambiar diariamente aunque la variación suele ser mínima.'
                        : 'This method has no scientific validation and is for testing purposes only. HRV thresholds may change daily although the variation is usually minimal.'}
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-8 bg-gray-800/30 border border-gray-700 rounded-xl text-center">
                  <Heart className="mx-auto text-gray-600 mb-4" size={48} />
                  <p className="text-gray-400">
                    {isSpanish 
                      ? 'No se encontraron datos HRV para esta actividad. Asegúrate de que la actividad tenga datos de variabilidad cardíaca (DFA Alpha 1 y respiración).' 
                      : 'No HRV data found for this activity. Make sure the activity has heart rate variability data (DFA Alpha 1 and respiration).'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
