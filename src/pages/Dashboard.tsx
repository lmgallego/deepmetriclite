import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Activity, Wrench, Heart, Calendar, BarChart3 as IconBarChart, Lock, ExternalLink } from 'lucide-react';

const API_BASE = '/api/v1';

const Dashboard = () => {
  const { apiKey, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [athleteName, setAthleteName] = useState<string>('Athlete');
  const isSpanish = i18n.language === 'es';

  useEffect(() => {
    const fetchAthleteName = async () => {
      if (!apiKey) return;
      
      try {
        const response = await fetch(`${API_BASE}/athlete/0`, {
          headers: {
            'Authorization': 'Basic ' + btoa('API_KEY:' + apiKey),
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.name) {
            setAthleteName(data.name);
          }
        }
      } catch (error) {
        console.error('Error fetching athlete name:', error);
      }
    };
    
    fetchAthleteName();
  }, [apiKey]);

  return (
    <div className="min-h-screen bg-netflix-black text-white p-8 pt-24">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold">
            {t('dashboard.welcome')}, <span className="text-netflix-red">{athleteName}</span>
          </h1>
          <button 
            onClick={logout}
            className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-800 transition text-sm"
          >
            {t('dashboard.logout')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Readiness Monitor Card - ACTIVE */}
          <div 
            onClick={() => navigate('/readiness')}
            className="group bg-[#181818] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-900/20 border border-gray-800 hover:border-red-900/50"
          >
            <div className="h-40 bg-gradient-to-br from-red-900 to-black relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity" />
               <div className="absolute top-4 right-4 bg-netflix-red p-2 rounded-lg shadow-lg">
                  <Activity className="text-white w-6 h-6" />
               </div>
               <div className="absolute bottom-4 left-4">
                 <span className="text-xs font-bold text-red-200 tracking-wider uppercase">Utility #1</span>
               </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 group-hover:text-netflix-red transition-colors">{t('dashboard.apps.readiness.title')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('dashboard.apps.readiness.desc')}
              </p>
            </div>
          </div>

          {/* Intervals Data Doctor Card - COMING SOON */}
          <div className="group bg-[#181818] rounded-xl overflow-hidden cursor-not-allowed transition-all duration-300 border border-gray-800 opacity-75 relative">
            <div className="absolute top-2 left-2 z-10 bg-yellow-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Lock size={12} />
              {isSpanish ? 'Próximamente' : 'Coming Soon'}
            </div>
            <div className="h-40 bg-gradient-to-br from-yellow-900 to-black relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
               <div className="absolute top-4 right-4 bg-yellow-600 p-2 rounded-lg shadow-lg">
                  <Wrench className="text-white w-6 h-6" />
               </div>
               <div className="absolute bottom-4 left-4">
                 <span className="text-xs font-bold text-yellow-200 tracking-wider uppercase">Utility #2</span>
               </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 text-yellow-500">Intervals Data Doctor</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {isSpanish 
                  ? 'Corrección de picos de potencia, frecuencia cardíaca, torque y cadencia.' 
                  : 'Power peaks, heart rate, torque and cadence correction.'}
              </p>
            </div>
          </div>

          {/* Umbrales HRV Card - COMING SOON */}
          <div className="group bg-[#181818] rounded-xl overflow-hidden cursor-not-allowed transition-all duration-300 border border-gray-800 opacity-75 relative">
            <div className="absolute top-2 left-2 z-10 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Lock size={12} />
              {isSpanish ? 'Próximamente' : 'Coming Soon'}
            </div>
            <div className="h-40 bg-gradient-to-br from-purple-900 to-black relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
               <div className="absolute top-4 right-4 bg-purple-600 p-2 rounded-lg shadow-lg">
                  <Heart className="text-white w-6 h-6" />
               </div>
               <div className="absolute bottom-4 left-4">
                 <span className="text-xs font-bold text-purple-200 tracking-wider uppercase">Utility #3</span>
               </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 text-purple-500">{isSpanish ? 'Umbrales HRV' : 'HRV Thresholds'}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {isSpanish 
                  ? 'Detección de umbrales a través de DFA Alpha 1 con algoritmo avanzado.' 
                  : 'Threshold detection through DFA Alpha 1 with advanced algorithm.'}
              </p>
            </div>
          </div>
          
          {/* Activities Card - COMING SOON */}
          <div className="group bg-[#181818] rounded-xl overflow-hidden cursor-not-allowed transition-all duration-300 border border-gray-800 opacity-75 relative">
            <div className="absolute top-2 left-2 z-10 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Lock size={12} />
              {isSpanish ? 'Próximamente' : 'Coming Soon'}
            </div>
            <div className="h-40 bg-gradient-to-br from-green-900 to-black relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541625602330-2277a4c46182?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
               <div className="absolute top-4 right-4 bg-green-600 p-2 rounded-lg shadow-lg">
                  <Calendar className="text-white w-6 h-6" />
               </div>
               <div className="absolute bottom-4 left-4">
                 <span className="text-xs font-bold text-green-200 tracking-wider uppercase">Utility #4</span>
               </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 text-green-500">{t('activities.title')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('activities.subtitle')}
              </p>
            </div>
          </div>

          {/* Zones Card - COMING SOON */}
          <div className="group bg-[#181818] rounded-xl overflow-hidden cursor-not-allowed transition-all duration-300 border border-gray-800 opacity-75 relative">
            <div className="absolute top-2 left-2 z-10 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Lock size={12} />
              {isSpanish ? 'Próximamente' : 'Coming Soon'}
            </div>
            <div className="h-40 bg-gradient-to-br from-orange-900 to-black relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
               <div className="absolute top-4 right-4 bg-orange-600 p-2 rounded-lg shadow-lg">
                  <IconBarChart className="text-white w-6 h-6" />
               </div>
               <div className="absolute bottom-4 left-4">
                 <span className="text-xs font-bold text-orange-200 tracking-wider uppercase">Utility #5</span>
               </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 text-orange-500">{t('zones.title')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('zones.subtitle')}
              </p>
            </div>
          </div>
          
        </div>

        {/* Donation Section */}
        <div className="mt-12 p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                {isSpanish ? '¿Te gusta DeepMetric Lite?' : 'Do you like DeepMetric Lite?'}
              </h3>
              <p className="text-gray-400 text-sm">
                {isSpanish 
                  ? 'Ayúdanos con el mantenimiento del servidor. El 15% de cada donación va a Intervals.icu.' 
                  : 'Help us with server maintenance. 15% of each donation goes to Intervals.icu.'}
              </p>
            </div>
            <a 
              href="https://www.paypal.com/donate/?hosted_button_id=XXXXXXX" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-netflix-red hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
            >
              <ExternalLink size={18} />
              {isSpanish ? 'Donar con PayPal' : 'Donate with PayPal'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
