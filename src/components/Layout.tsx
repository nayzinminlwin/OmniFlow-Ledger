import React from 'react';
import { User } from 'firebase/auth';
import { LayoutDashboard, LogOut, AlertCircle } from 'lucide-react';
import { LanguageToggle } from './LanguageToggle';
import { Language } from '../translations';

interface LayoutProps {
  user: User | null;
  t: any;
  lang: Language;
  setLang: (lang: Language) => void;
  handleLogout: () => void;
  setActiveTab?: (tab: any) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  user,
  t,
  lang,
  setLang,
  handleLogout,
  setActiveTab,
  children,
}) => {
  const displayName = user?.displayName || user?.email?.split('@')[0] || t.defaultUser;

  return (
    <div className="min-h-screen selection:bg-blue-200 selection:text-blue-900">
      <nav className="glass-panel sticky top-0 z-40 border-b-0 border-x-0 rounded-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div 
              className="flex items-center gap-3 group cursor-pointer"
              onClick={() => setActiveTab?.('dashboard')}
            >
              <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <LayoutDashboard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-black tracking-tight leading-none">{t.brand}</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LanguageToggle lang={lang} setLang={setLang} />
              
              {user && (
                <>
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-black/5 rounded-full">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 uppercase">
                      {displayName.charAt(0)}
                    </div>
                    <span className="text-[13px] font-medium text-gray-700 capitalize">{displayName}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-95"
                    title={t.logout}
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div 
            className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-blue-500 transition-colors"
            onClick={() => setActiveTab?.('dashboard')}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="text-[11px] font-semibold uppercase tracking-widest">{t.brand}</span>
          </div>
          <div className="flex items-center gap-6 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            <span>{t.footerFeature1}</span>
            <span>•</span>
            <span>{t.footerFeature2}</span>
            <span>•</span>
            <span>{t.footerFeature3}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
