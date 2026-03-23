import React, { memo } from 'react';
import { LayoutDashboard, Edit2, History, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavigationProps {
  activeTab: 'dashboard' | 'history' | 'add' | 'batches';
  setActiveTab: (tab: 'dashboard' | 'history' | 'add' | 'batches') => void;
  t: any;
}

export const Navigation: React.FC<NavigationProps> = memo(({ activeTab, setActiveTab, t }) => {
  return (
    <div className="flex justify-center mb-8">
      <div className="flex bg-black/5 p-1 rounded-xl shadow-inner overflow-x-auto no-scrollbar w-full max-w-2xl">
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
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
            activeTab === 'history' ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
          )}
        >
          <History className="w-4 h-4" />
          {t.ledger}
        </button>
      </div>
    </div>
  );
});
