import React from 'react';
import { Heart } from 'lucide-react';

const Donation = () => {
  return (
    <div className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/90 z-10" />
      <img 
        src="https://images.unsplash.com/photo-1559166631-ef208440c75a?q=80&w=2070&auto=format&fit=crop" 
        alt="Cycling Passion" 
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      />
      
      <div className="container mx-auto px-4 md:px-12 relative z-20 text-center">
        <div className="max-w-3xl mx-auto bg-black/60 backdrop-blur-md p-8 md:p-12 rounded-xl border border-gray-800">
          <Heart className="w-16 h-16 text-netflix-red mx-auto mb-6 animate-pulse" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Support the Project</h2>
          <p className="text-lg text-gray-300 mb-8">
            DeepMetric Lite is completely free to use. If you find value in these tools, consider making a donation.
            <br className="hidden md:block" />
            <span className="text-white font-semibold block mt-2">15% of all donations go directly to intervals.icu</span>
          </p>
          
          <div className="flex justify-center">
            <button className="bg-[#0070BA] hover:bg-[#003087] text-white px-8 py-3 rounded-full font-bold text-lg transition duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              <span>Donate via PayPal</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Secure payment processing by PayPal. No account required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Donation;
