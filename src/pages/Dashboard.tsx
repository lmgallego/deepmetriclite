import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Activity, Zap } from 'lucide-react';

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

          {/* Placeholder Cards */}
          <div className="bg-[#181818] p-6 rounded-xl border border-gray-800 opacity-50 cursor-not-allowed">
            <div className="h-40 bg-gray-900 rounded-lg mb-4 flex items-center justify-center">
               <Zap className="text-gray-700 w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold mb-2">Power Profile</h3>
            <p className="text-gray-400 text-sm">Coming soon...</p>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
