import { Heart, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Donation = () => {
  const { t } = useTranslation();

  return (
    <div className="py-24 relative overflow-hidden bg-black border-t-8 border-[#222]">
      
      <div className="container mx-auto px-4 md:px-12 relative z-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t('donation.title_prefix')} <span className="text-netflix-red">{t('donation.title_highlight')}</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              {t('donation.description')}
            </p>
            
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-3 text-lg text-gray-200">
                <Check className="text-netflix-red w-6 h-6" />
                <span>{t('donation.check_free')}</span>
              </div>
              <div className="flex items-center gap-3 text-lg text-gray-200">
                <Check className="text-netflix-red w-6 h-6" />
                <span>{t('donation.check_account')}</span>
              </div>
              <div className="flex items-center gap-3 text-lg text-gray-200">
                <Check className="text-netflix-red w-6 h-6" />
                <span>{t('donation.check_donation')}</span>
              </div>
            </div>

            <a 
              href="https://www.paypal.com/paypalme/luismagallego" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-netflix-red hover:bg-red-700 text-white text-xl font-bold px-12 py-4 rounded flex items-center gap-3 mx-auto md:mx-0 transition-transform hover:scale-105 shadow-xl w-fit"
            >
              <Heart className="w-6 h-6 fill-current" />
              <span>{t('donation.button')}</span>
            </a>
            <p className="text-sm text-gray-500 mt-4">
               {t('donation.disclaimer')}
            </p>
          </div>

          <div className="flex-1 relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-netflix-red/20 to-transparent rounded-full blur-3xl" />
             <img 
               src="https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=2070&auto=format&fit=crop" 
               alt="Support Cycling" 
               className="relative z-10 rounded-lg shadow-2xl border border-gray-800 rotate-3 hover:rotate-0 transition-transform duration-500"
             />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Donation;
