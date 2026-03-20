import React from 'react';
import { format } from 'date-fns';
import { 
  Plus, 
  Minus, 
  RefreshCw, 
  ChevronRight, 
  ArrowRightLeft, 
  Settings 
} from 'lucide-react';
import { Stock, Transaction } from '../types';
import { CLASSES } from '../constants';
import { getStockKey } from '../utils/stock';
import { cn } from '../lib/utils';

interface DashboardProps {
  stock: Stock | null;
  transactions: Transaction[];
  t: any;
  setActiveTab: (tab: 'dashboard' | 'history' | 'add' | 'batches') => void;
  activeTab: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  stock, 
  transactions, 
  t, 
  setActiveTab,
  activeTab
}) => {
  return (
    <div className={cn(
      "lg:col-span-8 space-y-8",
      activeTab !== 'dashboard' && "hidden lg:block"
    )}>
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-[28px] font-bold text-black tracking-tight leading-none">{t.currentInventory}</h2>
          <span className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">
            {t.lastUpdated} {stock ? format(new Date(stock.lastUpdated), 'HH:mm:ss') : t.never}
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          <div className="glass-panel p-6 rounded-[24px] hover:scale-[1.02] transition-transform group relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-500/5"></div>
            <div className="relative z-10">
              <div className="text-[11px] font-semibold text-blue-500 uppercase tracking-widest mb-2">{t.unclassified}</div>
              <div className="text-[34px] font-bold text-black tracking-tight tabular-nums leading-none">
                {stock ? stock.unclassified : 0}
              </div>
            </div>
          </div>
          {CLASSES.map((cls) => (
            <div key={cls} className="glass-panel p-6 rounded-[24px] hover:scale-[1.02] transition-transform group">
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors">{t.class} {cls}</div>
              <div className="text-[34px] font-bold text-black tracking-tight tabular-nums leading-none">
                {stock ? stock[getStockKey(cls)] : 0}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[32px] overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between">
          <h2 className="text-[22px] font-bold text-black tracking-tight">{t.recentActivity}</h2>
          <button onClick={() => setActiveTab('history')} className="text-blue-500 text-[15px] font-medium hover:opacity-80 flex items-center gap-1 transition-opacity">
            {t.viewFullLedger} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-black/5">
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className="px-8 py-5 flex items-center justify-between hover:bg-black/[0.02] transition-colors">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  tx.type === 'INCOMING' && "bg-green-500/10 text-green-600",
                  tx.type === 'SALE' && "bg-orange-500/10 text-orange-600",
                  tx.type === 'REPAIR' && "bg-blue-500/10 text-blue-600",
                  tx.type === 'ADJUSTMENT' && "bg-gray-500/10 text-gray-600"
                )}>
                  {tx.type === 'INCOMING' && <Plus className="w-5 h-5" />}
                  {tx.type === 'SALE' && <Minus className="w-5 h-5" />}
                  {tx.type === 'REPAIR' && <RefreshCw className="w-5 h-5" />}
                  {tx.type === 'ADJUSTMENT' && <Settings className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-semibold text-[17px] text-black tracking-tight">
                    {tx.type === 'REPAIR' ? (
                      <>{t.repairPrefix} {tx.fromClass} <ArrowRightLeft className="inline w-3 h-3 mx-1 text-gray-400" /> {tx.toClass}</>
                    ) : tx.type === 'INCOMING' ? (
                      <>{t.incomingBatch}</>
                    ) : (
                      <>{t[tx.type.toLowerCase() as keyof typeof t] || tx.type} {tx.toClass || tx.fromClass}</>
                    )}
                  </p>
                  <p className="text-[13px] text-gray-500 font-medium mt-0.5">{format(new Date(tx.timestamp), 'MMM d, HH:mm')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-[19px] font-semibold tabular-nums tracking-tight",
                  (tx.type === 'INCOMING' || tx.type === 'REPAIR') ? "text-green-600" : "text-orange-600"
                )}>
                  {tx.type === 'INCOMING' || tx.type === 'REPAIR' ? '+' : '-'}{tx.quantity}
                </p>
                {tx.notes && <p className="text-[11px] text-gray-400 max-w-[120px] truncate mt-0.5">{tx.notes}</p>}
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="px-8 py-12 text-center text-gray-400 text-[15px]">
              {t.noTransactions}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
