import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t, i18n } = useTranslation();

  return (
    <footer className="bg-black py-12 text-gray-500 text-sm relative z-20 border-t border-[#222]">
      <div className="container mx-auto px-4 md:px-12 max-w-5xl">
        <p className="mb-8 hover:underline cursor-pointer">{t('footer.questions')}</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="flex flex-col gap-3">
               <a href="#" className="hover:underline">{t('footer.links.faq')}</a>
               <a href="#" className="hover:underline">{t('footer.links.privacy')}</a>
               <a href="#" className="hover:underline">{t('footer.links.speed_test')}</a>
            </div>
            <div className="flex flex-col gap-3">
               <a href="#" className="hover:underline">{t('footer.links.help_center')}</a>
               <a href="#" className="hover:underline">{t('footer.links.cookies')}</a>
               <a href="#" className="hover:underline">{t('footer.links.legal')}</a>
            </div>
            <div className="flex flex-col gap-3">
               <a href="#" className="hover:underline">{t('footer.links.account')}</a>
               <a href="#" className="hover:underline">{t('footer.links.ways_to_watch')}</a>
               <a href="#" className="hover:underline">{t('footer.links.only_on')}</a>
            </div>
            <div className="flex flex-col gap-3">
               <a href="#" className="hover:underline">{t('footer.links.media_center')}</a>
               <a href="#" className="hover:underline">{t('footer.links.terms')}</a>
               <a href="#" className="hover:underline">{t('footer.links.contact')}</a>
            </div>
        </div>

        <div className="mb-6">
          <button className="border border-gray-500 px-4 py-2 text-gray-400 hover:text-white text-sm">
             {i18n.language === 'en' ? 'English' : 'Español'}
          </button>
        </div>
        
        <p className="mb-4">DeepMetric Lite</p>
        
        <div className="text-xs text-gray-600">
           <p>{t('footer.powered_by')} <a href="https://intervals.icu" target="_blank" rel="noopener noreferrer" className="hover:underline">intervals.icu</a></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
