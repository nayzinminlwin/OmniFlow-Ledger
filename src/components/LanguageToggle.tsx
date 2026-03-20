import React from 'react';
import { Language } from '../translations';
import { cn } from '../lib/utils';

interface LanguageToggleProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ lang, setLang }) => {
  return (
    <div className="flex bg-black/5 p-1 rounded-lg shadow-inner">
      <button 
        onClick={() => setLang('en')} 
        className={cn(
          "px-3 py-1 text-[13px] font-medium rounded-md transition-all", 
          lang === 'en' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"
        )}
      >
        EN
      </button>
      <button 
        onClick={() => setLang('ms')} 
        className={cn(
          "px-3 py-1 text-[13px] font-medium rounded-md transition-all", 
          lang === 'ms' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"
        )}
      >
        BM
      </button>
      <button 
        onClick={() => setLang('zh')} 
        className={cn(
          "px-3 py-1 text-[13px] font-medium rounded-md transition-all", 
          lang === 'zh' ? "bg-white shadow-sm text-black" : "text-gray-500 hover:text-gray-700"
        )}
      >
        CN
      </button>
    </div>
  );
};
