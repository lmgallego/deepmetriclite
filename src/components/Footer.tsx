import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-black py-10 text-gray-500 text-sm relative z-20 border-t border-gray-900">
      <div className="container mx-auto px-4 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-netflix-red font-bold text-lg mb-2">DeepMetric Lite</h3>
            <p>© {new Date().getFullYear()} DeepMetric Lite. All rights reserved.</p>
          </div>
          
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Privacy</a>
            <a href="#" className="hover:text-white transition">Terms</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
          
          <div className="text-right">
             <p>Data powered by</p>
             <a href="https://intervals.icu" target="_blank" rel="noopener noreferrer" className="text-white font-semibold hover:text-netflix-red transition">intervals.icu</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
