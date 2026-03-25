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
    <div className="flex justify-center mb-8">
      <div className="flex bg-black/5 p-1 rounded-xl shadow-inner overflow-x-auto no-scrollbar w-full max-w-4xl">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
            activeTab === 'dashboard' ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          {t.dashboard}
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
            activeTab === 'batches' ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Settings className="w-4 h-4" />
          {t.batches}
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
            activeTab === 'add' ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Edit2 className="w-4 h-4" />
          {t.updateStock}
        </button>
        <button
          onClick={() => setActiveTab('components')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
            activeTab === 'components' ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Cpu className="w-4 h-4" />
          {t.updateComponents}
        </button>
        <button
          onClick={() => setActiveTab('componentInventory')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
            activeTab === 'componentInventory' ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <Cpu className="w-4 h-4" />
          {t.componentInventory}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
            activeTab === 'history' ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <History className="w-4 h-4" />
          {t.ledger}
        </button>
        {isUltimateAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
              activeTab === 'users' ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Users className="w-4 h-4" />
            {t.userManagement}
          </button>
        )}
      </div>
    </div>
  );
});
