import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Key, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const [inputKey, setInputKey] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(inputKey);
    if (success) {
      navigate('/dashboard');
    } else {
      setError(t('login.error'));
    }
  };

  return (
    <div className="min-h-screen bg-netflix-black flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070')] opacity-10 bg-cover bg-center" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-black/80 backdrop-blur-md p-8 md:p-12 rounded-lg border border-gray-800 w-full max-w-md relative z-10 shadow-2xl"
      >
        <h2 className="text-3xl font-bold text-white mb-8">{t('login.title')}</h2>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-sm mb-2">{t('login.label')}</label>
            <div className="relative">
              <Key className="absolute left-3 top-3 text-gray-500 w-5 h-5" />
              <input 
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full bg-[#333] text-white rounded px-10 py-3 focus:outline-none focus:ring-2 focus:ring-netflix-red border border-transparent focus:border-transparent transition"
                placeholder={t('login.placeholder')}
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-netflix-red text-sm bg-red-900/20 p-3 rounded">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-netflix-red hover:bg-red-700 text-white font-bold py-3 rounded transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? t('login.verifying') : t('login.submit')}
            {!isLoading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-6 text-gray-500 text-sm">
          <p>{t('login.help')}</p>
          <a 
            href="https://intervals.icu/settings" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white hover:underline mt-1 block"
          >
            {t('login.settings_link')} &rarr;
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
