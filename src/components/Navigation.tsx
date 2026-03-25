import React, { memo } from 'react';
import { LayoutDashboard, Edit2, History, Settings, Users, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavigationProps {
  activeTab: 'dashboard' | 'history' | 'add' | 'components' | 'componentInventory' | 'batches' | 'users';
  setActiveTab: (tab: 'dashboard' | 'history' | 'add' | 'components' | 'componentInventory' | 'batches' | 'users') => void;
  t: any;
  isUltimateAdmin?: boolean;
}

export const Navigation: React.FC<NavigationProps> = memo(({ activeTab, setActiveTab, t, isUltimateAdmin }) => {
  return (
    <div className="flex justify-center mb-8 px-4">
      <div className="relative w-full max-w-4xl group">
        {/* Left fade indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#F2F2F7] to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <div className="flex bg-black/5 p-1 rounded-2xl shadow-inner overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
              activeTab === 'dashboard' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            {t.dashboard}
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
              activeTab === 'batches' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
            )}
          >
            <Settings className="w-4 h-4" />
            {t.batches}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
              activeTab === 'add' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
            )}
          >
            <Edit2 className="w-4 h-4" />
            {t.updateStock}
          </button>
          <button
            onClick={() => setActiveTab('components')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
              activeTab === 'components' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
            )}
          >
            <Cpu className="w-4 h-4" />
            {t.updateComponents}
          </button>
          <button
            onClick={() => setActiveTab('componentInventory')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
              activeTab === 'componentInventory' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
            )}
          >
            <Cpu className="w-4 h-4" />
            {t.componentInventory}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
              activeTab === 'history' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
            )}
          >
            <History className="w-4 h-4" />
            {t.ledger}
          </button>
          {isUltimateAdmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[13px] font-semibold transition-all whitespace-nowrap",
                activeTab === 'users' ? "bg-white text-black shadow-sm scale-[1.02]" : "text-gray-500 hover:text-gray-700 hover:bg-black/5"
              )}
            >
              <Users className="w-4 h-4" />
              {t.userManagement}
            </button>
          )}
        </div>

        {/* Right fade indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#F2F2F7] to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
});
