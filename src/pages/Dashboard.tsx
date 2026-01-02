import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Activity, Zap, Battery, Calendar } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-netflix-black text-white p-8 pt-24">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold">
            {t('dashboard.welcome')}, <span className="text-netflix-red">{user?.firstname || 'Athlete'}</span>
          </h1>
          <button 
            onClick={logout}
            className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-800 transition text-sm"
          >
            {t('dashboard.logout')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Readiness Monitor Card */}
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

          {/* Power Profile Card */}
          <div 
            onClick={() => navigate('/power-profile')}
            className="group bg-[#181818] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-yellow-900/20 border border-gray-800 hover:border-yellow-600/50"
          >
            <div className="h-40 bg-gradient-to-br from-yellow-900 to-black relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity" />
               <div className="absolute top-4 right-4 bg-yellow-600 p-2 rounded-lg shadow-lg">
                  <Zap className="text-white w-6 h-6" />
               </div>
               <div className="absolute bottom-4 left-4">
                 <span className="text-xs font-bold text-yellow-200 tracking-wider uppercase">Utility #2</span>
               </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 group-hover:text-yellow-500 transition-colors">{t('power.title')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('power.subtitle')}
              </p>
            </div>
          </div>

          {/* Fatigue Monitor Card */}
          <div 
            onClick={() => navigate('/fatigue')}
            className="group bg-[#181818] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-900/20 border border-gray-800 hover:border-blue-600/50"
          >
            <div className="h-40 bg-gradient-to-br from-blue-900 to-black relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1552674605-46d526758ad9?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity" />
               <div className="absolute top-4 right-4 bg-blue-600 p-2 rounded-lg shadow-lg">
                  <Battery className="text-white w-6 h-6" />
               </div>
               <div className="absolute bottom-4 left-4">
                 <span className="text-xs font-bold text-blue-200 tracking-wider uppercase">Utility #3</span>
               </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 group-hover:text-blue-500 transition-colors">{t('fatigue.title')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('fatigue.subtitle')}
              </p>
            </div>
          </div>
          
          {/* Activities Card */}
          <div 
            onClick={() => navigate('/activities')}
            className="group bg-[#181818] rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-900/20 border border-gray-800 hover:border-green-600/50"
          >
            <div className="h-40 bg-gradient-to-br from-green-900 to-black relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541625602330-2277a4c46182?q=80&w=1470&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity" />
               <div className="absolute top-4 right-4 bg-green-600 p-2 rounded-lg shadow-lg">
                  <Calendar className="text-white w-6 h-6" />
               </div>
               <div className="absolute bottom-4 left-4">
                 <span className="text-xs font-bold text-green-200 tracking-wider uppercase">Utility #4</span>
               </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2 group-hover:text-green-500 transition-colors">{t('activities.title')}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {t('activities.subtitle')}
              </p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
