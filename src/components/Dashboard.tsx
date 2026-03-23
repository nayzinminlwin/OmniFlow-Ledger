import React, { memo } from 'react';
import { format } from 'date-fns';
import { 
  Plus, 
  Minus, 
  RefreshCw, 
  ChevronRight, 
  ArrowRightLeft, 
  Settings
} from 'lucide-react';
import { Stock, Transaction, LaptopClass } from '../types';
import { CLASSES } from '../constants';
import { cn } from '../lib/utils';
import { Skeleton } from './Skeleton';

interface DashboardProps {
  stock: Stock | null;
  transactions: Transaction[];
  t: any;
  setActiveTab: (tab: 'dashboard' | 'history' | 'add' | 'batches') => void;
  activeTab: string;
  loading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = memo(({ 
  stock, 
  transactions, 
  t, 
  setActiveTab,
  activeTab,
  loading = false
}) => {
  const models = stock?.items || [];
  
  const getColumnTotal = (cls: LaptopClass) => {
    return models.reduce((sum, m) => sum + (m?.counts?.[cls] || 0), 0);
  };

  const getRowTotal = (counts: Record<LaptopClass, number>) => {
    if (!counts) return 0;
    return Object.values(counts).reduce((sum, count) => sum + (count || 0), 0);
  };

  const grandTotal = models.reduce((sum, m) => sum + getRowTotal(m?.counts), 0);

  return (
    <div className={cn(
      "lg:col-span-12 space-y-8 animate-in fade-in duration-500",
      activeTab === 'dashboard' ? "block" : "hidden"
    )}>
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-4">
            <h2 className="text-[28px] font-bold text-black tracking-tight leading-none">{t.currentInventory}</h2>
          </div>
          <span className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">
            {t.lastUpdated} {stock ? format(new Date(stock.lastUpdated), 'HH:mm:ss') : loading ? <Skeleton className="w-16 h-4 inline-block" /> : t.never}
          </span>
        </div>
        
        <div className="glass-panel rounded-[32px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-black/5 bg-black/[0.02]">
                  <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{t.brandLabel}</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{t.seriesLabel}</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{t.modelLabel}</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-blue-500 uppercase tracking-wider">{t.unclassified}</th>
                  {CLASSES.map(cls => (
                    <th key={cls} className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{t.class} {cls}</th>
                  ))}
                  <th className="px-6 py-4 text-[13px] font-bold text-black uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={`skeleton-${i}`}>
                      <td className="px-6 py-4"><Skeleton className="w-32 h-5" /></td>
                      <td className="px-6 py-4"><Skeleton className="w-8 h-5" /></td>
                      {CLASSES.map(cls => <td key={cls} className="px-6 py-4"><Skeleton className="w-8 h-5" /></td>)}
                      <td className="px-6 py-4"><Skeleton className="w-10 h-5" /></td>
                    </tr>
                  ))
                ) : models.length === 0 ? (
                  <tr key="empty-inventory">
                    <td colSpan={CLASSES.length + 5} className="px-6 py-12 text-center text-gray-400 text-[15px]">
                      No inventory data available.
                    </td>
                  </tr>
                ) : (
                  [
                    ...models.map(m => (
                      <tr key={`${m.brand}-${m.series}-${m.model}`} className="hover:bg-black/[0.02] transition-colors">
                        <td className="px-6 py-4 font-medium text-black">{m.brand}</td>
                        <td className="px-6 py-4 text-gray-600">{m.series}</td>
                        <td className="px-6 py-4 text-gray-600">{m.model}</td>
                        <td className="px-6 py-4 font-semibold text-blue-600 tabular-nums">{m?.counts?.['UNCLASSIFIED'] || 0}</td>
                        {CLASSES.map(cls => (
                          <td key={cls} className="px-6 py-4 text-gray-600 tabular-nums">{m?.counts?.[cls] || 0}</td>
                        ))}
                        <td className="px-6 py-4 font-bold text-black tabular-nums">{getRowTotal(m?.counts)}</td>
                      </tr>
                    )),
                    <tr key="grand-total" className="bg-black/[0.03] border-t-2 border-black/10">
                      <td colSpan={3} className="px-6 py-4 font-bold text-black uppercase tracking-wider text-[13px]">Grand Total</td>
                      <td className="px-6 py-4 font-bold text-blue-600 tabular-nums">{getColumnTotal('UNCLASSIFIED')}</td>
                      {CLASSES.map(cls => (
                        <td key={cls} className="px-6 py-4 font-bold text-black tabular-nums">{getColumnTotal(cls)}</td>
                      ))}
                      <td className="px-6 py-4 font-black text-black tabular-nums text-[17px]">{grandTotal}</td>
                    </tr>
                  ]
                )}
              </tbody>
            </table>
          </div>
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
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-xl" />
                  <div>
                    <Skeleton className="w-32 h-5 mb-1" />
                    <Skeleton className="w-24 h-3" />
                  </div>
                </div>
                <Skeleton className="w-12 h-6" />
              </div>
            ))
          ) : (
            transactions.slice(0, 5).map((tx) => (
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
                      tx.fromClass === 'UNCLASSIFIED' ? (
                        <>{t.initClass} <ArrowRightLeft className="inline w-3 h-3 mx-1 text-gray-400" /> {tx.toClass}</>
                      ) : (
                        <>{t.repairPrefix} {tx.fromClass} <ArrowRightLeft className="inline w-3 h-3 mx-1 text-gray-400" /> {tx.toClass}</>
                      )
                    ) : tx.type === 'INCOMING' ? (
                      <>{t.incomingBatch}</>
                    ) : (
                      <>{t[tx.type.toLowerCase() as keyof typeof t] || tx.type} {tx.toClass || tx.fromClass}</>
                    )}
                  </p>
                  <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                    {tx.brand} {tx.series} {tx.model} • {format(new Date(tx.timestamp), 'MMM d, HH:mm')}
                  </p>
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
          ))
        )}
        {!loading && transactions.length === 0 && (
            <div className="px-8 py-12 text-center text-gray-400 text-[15px]">
              {t.noTransactions}
            </div>
          )}
        </div>
      </section>
    </div>
  );
});
