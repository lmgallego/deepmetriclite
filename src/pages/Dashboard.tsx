import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-netflix-black text-white p-8 pt-24">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold">
            {t('dashboard.welcome')}, <span className="text-netflix-red">{user?.firstname || 'Athlete'}</span>
          </h1>
          <button 
            onClick={logout}
            className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-800 transition"
          >
            {t('dashboard.logout')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Placeholder Cards */}
          <div className="bg-[#181818] p-6 rounded-lg border border-gray-800 hover:border-gray-600 transition">
            <h3 className="text-xl font-bold mb-4">Power Profile</h3>
            <p className="text-gray-400">Your Critical Power Analysis will appear here.</p>
          </div>
          
          <div className="bg-[#181818] p-6 rounded-lg border border-gray-800 hover:border-gray-600 transition">
            <h3 className="text-xl font-bold mb-4">Fatigue Monitor</h3>
            <p className="text-gray-400">Tracking your chronic training load.</p>
          </div>

          <div className="bg-[#181818] p-6 rounded-lg border border-gray-800 hover:border-gray-600 transition">
            <h3 className="text-xl font-bold mb-4">Recent Activities</h3>
            <p className="text-gray-400">Analysis of your latest rides.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
