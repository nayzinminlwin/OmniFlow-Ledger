import React, { memo } from 'react';
import { format } from 'date-fns';
import { ComponentStock, ComponentTransaction, UserProfile } from '../types';
import { COMPONENTS } from '../constants';
import { cn } from '../lib/utils';
import { Package, History } from 'lucide-react';

interface ComponentInventoryProps {
  componentStock: ComponentStock | null;
  spoiledComponentStock: ComponentStock | null;
  componentTransactions: ComponentTransaction[];
  users: Record<string, UserProfile>;
  t: any;
  activeTab: string;
}

export const ComponentInventory: React.FC<ComponentInventoryProps> = memo(({ componentStock, spoiledComponentStock, componentTransactions, users, t, activeTab }) => {
  if (activeTab !== 'componentInventory') return null;

  const items = componentStock?.items || [];
  const spoiledItems = spoiledComponentStock?.items || [];

  const safeFormatDate = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return t.na;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return t.invalidDate;
    return format(d, formatStr);
  };

  const renderTable = (stockItems: any[], title: string, subtitle: string) => (
    <div className="glass-panel rounded-[32px] overflow-hidden">
      <div className="px-8 py-6 border-b border-black/5 bg-black/[0.02]">
        <h2 className="text-[22px] font-bold text-black tracking-tight">{title}</h2>
        <p className="text-[15px] text-gray-500 mt-1">{subtitle}</p>
      </div>

      <div className="p-8">
        {stockItems.length === 0 || !stockItems.some(item => COMPONENTS.some(comp => (item.counts[comp] || 0) > 0)) ? (
          <div className="text-center py-12 bg-black/[0.02] rounded-2xl border border-black/5">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-[15px] font-medium text-gray-500">{t.noInventoryData}</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black/10">
                  <th className="py-4 px-4 font-bold text-[13px] text-gray-500 uppercase tracking-wider bg-black/[0.02] rounded-tl-xl whitespace-nowrap">{t.brandLabel}</th>
                  <th className="py-4 px-4 font-bold text-[13px] text-gray-500 uppercase tracking-wider bg-black/[0.02] whitespace-nowrap">{t.seriesLabel}</th>
                  <th className="py-4 px-4 font-bold text-[13px] text-gray-500 uppercase tracking-wider bg-black/[0.02] whitespace-nowrap">{t.modelLabel}</th>
                  {COMPONENTS.map((comp, idx) => (
                    <th key={comp} className={cn(
                      "py-4 px-4 font-bold text-[13px] text-gray-500 uppercase tracking-wider bg-black/[0.02] text-center whitespace-nowrap",
                      idx === COMPONENTS.length - 1 && "rounded-tr-xl"
                    )}>
                      {t[comp] || comp}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {stockItems.map((item, idx) => {
                  const hasAnyStock = COMPONENTS.some(comp => (item.counts[comp] || 0) > 0);
                  if (!hasAnyStock) return null;

                  return (
                    <tr key={`${item.brand}-${item.series}-${item.model}-${idx}`} className="hover:bg-black/[0.02] transition-colors">
                      <td className="py-4 px-4 text-[15px] font-semibold text-gray-900 whitespace-nowrap">{item.brand}</td>
                      <td className="py-4 px-4 text-[15px] text-gray-600 whitespace-nowrap">{item.series}</td>
                      <td className="py-4 px-4 text-[15px] text-gray-600 whitespace-nowrap">{item.model}</td>
                      {COMPONENTS.map(comp => {
                        const count = item.counts[comp] || 0;
                        return (
                          <td key={comp} className="py-4 px-4 text-center">
                            <span className={cn(
                              "inline-flex items-center justify-center min-w-[2.5rem] h-8 px-3 rounded-full text-[13px] font-bold",
                              count > 0 ? "bg-blue-50 text-blue-700" : "text-gray-400"
                            )}>
                              {count}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="lg:col-span-12 space-y-8 animate-in fade-in duration-500">
      {renderTable(items, t.componentInventory, t.goodComponents)}
      {renderTable(spoiledItems, t.spoiledComponents, t.spoiled)}

      {/* Component Transactions History */}
      <div className="glass-panel rounded-[32px] overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 bg-black/[0.02] flex items-center justify-between">
          <div>
            <h2 className="text-[22px] font-bold text-black tracking-tight flex items-center gap-2">
              <History className="w-6 h-6 text-blue-500" />
              {t.ledger}
            </h2>
            <p className="text-[15px] text-gray-500 mt-1">{t.recentActivity}</p>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/[0.02]">
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.dateTime}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.type}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.brandLabel}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.seriesLabel}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.modelLabel}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.componentChanges}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.user}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.notes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {componentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-12 text-center text-gray-400 font-medium text-[15px]">
                    {t.noTransactions}
                  </td>
                </tr>
              ) : (
                componentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-8 py-4 whitespace-nowrap">
                      <p className="text-[14px] font-semibold text-black">
                        {safeFormatDate(tx.timestamp, 'MMM d, yyyy')}
                      </p>
                      <p className="text-[12px] text-gray-500 font-medium">
                        {safeFormatDate(tx.timestamp, 'HH:mm:ss')}
                      </p>
                    </td>
                    <td className="px-8 py-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        tx.type === 'INCOMING' ? "bg-green-500/10 text-green-700" : 
                        tx.type === 'PURCHASE' ? "bg-emerald-500/10 text-emerald-700" :
                        tx.type === 'INSTALL' ? "bg-red-500/10 text-red-700" :
                        "bg-purple-500/10 text-purple-700"
                      )}>
                        {t[tx.type.toLowerCase() as keyof typeof t] || tx.type}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-[14px] font-medium text-black">{tx.brand}</td>
                    <td className="px-8 py-4 text-[14px] text-gray-600">{tx.series}</td>
                    <td className="px-8 py-4 text-[14px] text-gray-600">{tx.model}</td>
                    <td className="px-8 py-4">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(tx.componentChanges).map(([comp, qty]) => (
                          <span key={comp} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-[11px] font-medium text-gray-700">
                            {t[comp] || comp}: {qty}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-[14px] text-gray-700">
                      {users[tx.userId]?.username || tx.userId || t.unknown}
                    </td>
                    <td className="px-8 py-4 text-[12px] text-gray-500 italic max-w-xs truncate">
                      {tx.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
