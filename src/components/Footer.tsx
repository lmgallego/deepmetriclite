const Footer = () => {
  return (
    <footer className="bg-black py-12 text-gray-500 text-sm relative z-20 border-t border-[#222]">
      <div className="container mx-auto px-4 md:px-12 max-w-5xl">
        <p className="mb-8 hover:underline cursor-pointer">Questions? Contact us.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col gap-3">
               <a href="#" className="hover:underline">FAQ</a>
               <a href="#" className="hover:underline">Privacy</a>
               <a href="#" className="hover:underline">Speed Test</a>
            </div>
            <div className="flex flex-col gap-3">
               <a href="#" className="hover:underline">Help Center</a>
               <a href="#" className="hover:underline">Cookie Preferences</a>
               <a href="#" className="hover:underline">Legal Notices</a>
            </div>
            <div className="flex flex-col gap-3">
               <a href="#" className="hover:underline">Account</a>
               <a href="#" className="hover:underline">Ways to Watch</a>
               <a href="#" className="hover:underline">Only on DeepMetric</a>
            </div>
            <div className="flex flex-col gap-3">
               <a href="#" className="hover:underline">Media Center</a>
               <a href="#" className="hover:underline">Terms of Use</a>
               <a href="#" className="hover:underline">Contact Us</a>
            </div>
        </div>

        <div className="mb-6">
          <button className="border border-gray-500 px-4 py-2 text-gray-400 hover:text-white text-sm">
             English
          </button>
        </div>
        
        <p className="mb-4">DeepMetric Lite</p>
        
        <div className="text-xs text-gray-600">
           <p>Data powered by <a href="https://intervals.icu" target="_blank" rel="noopener noreferrer" className="hover:underline">intervals.icu</a></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
