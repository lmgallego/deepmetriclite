import { Heart, Check } from 'lucide-react';

const Donation = () => {
  return (
    <div className="py-24 relative overflow-hidden bg-black border-t-8 border-[#222]">
      
      <div className="container mx-auto px-4 md:px-12 relative z-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-6xl mx-auto">
          
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Support the <span className="text-netflix-red">Cycling Community</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              DeepMetric Lite is and always will be free. Your support helps keep the servers running and contributes to the ecosystem.
            </p>
            
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center gap-3 text-lg text-gray-200">
                <Check className="text-netflix-red w-6 h-6" />
                <span>100% Free Tools</span>
              </div>
              <div className="flex items-center gap-3 text-lg text-gray-200">
                <Check className="text-netflix-red w-6 h-6" />
                <span>No Account Required</span>
              </div>
              <div className="flex items-center gap-3 text-lg text-gray-200">
                <Check className="text-netflix-red w-6 h-6" />
                <span>15% donated to intervals.icu</span>
              </div>
            </div>

            <button className="bg-netflix-red hover:bg-red-700 text-white text-xl font-bold px-12 py-4 rounded flex items-center gap-3 mx-auto md:mx-0 transition-transform hover:scale-105 shadow-xl">
              <Heart className="w-6 h-6 fill-current" />
              <span>Donate with PayPal</span>
            </button>
            <p className="text-sm text-gray-500 mt-4">
               Secure contributions processed by PayPal.
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
