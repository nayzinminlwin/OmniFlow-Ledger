import React, { memo, useState } from 'react';
import { format } from 'date-fns';
import { ArrowRightLeft, Info, Hammer } from 'lucide-react';
import { Transaction, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { Skeleton } from './Skeleton';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryProps {
  transactions: Transaction[];
  users: Record<string, UserProfile>;
  t: any;
  activeTab: string;
  loading?: boolean;
}

export const History: React.FC<HistoryProps> = memo(({ transactions, users, t, activeTab, loading = false }) => {
  const [hoveredTxId, setHoveredTxId] = useState<string | null>(null);

  if (activeTab !== 'history') return null;

  const safeFormatDate = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return t.na;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return t.invalidDate;
    return format(d, formatStr);
  };

  const getClassName = (cls?: string) => cls === 'Spoiled' ? t.spoiled : cls;

  return (
    <div className="lg:col-span-12 animate-in fade-in duration-500">
      <div className="glass-panel rounded-[32px] overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
          <h2 className="text-[22px] font-bold text-black tracking-tight">{t.fullLedger}</h2>
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
            {t.showingLast50}
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar pb-4">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/[0.02]">
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.dateTime}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.batch}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.brandLabel}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.seriesLabel}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.modelLabel}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.type}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.movement}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right">{t.qty}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.user}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.notes}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-4"><Skeleton className="w-24 h-5 mb-1" /><Skeleton className="w-16 h-3" /></td>
                    <td className="px-8 py-4"><Skeleton className="w-20 h-5" /></td>
                    <td className="px-8 py-4"><Skeleton className="w-24 h-5" /></td>
                    <td className="px-8 py-4"><Skeleton className="w-16 h-6 rounded-full" /></td>
                    <td className="px-8 py-4"><Skeleton className="w-32 h-5" /></td>
                    <td className="px-8 py-4 text-right"><Skeleton className="w-12 h-6 ml-auto" /></td>
                    <td className="px-8 py-4"><Skeleton className="w-40 h-4" /></td>
                  </tr>
                ))
              ) : (
                transactions.map((tx, index) => (
                <tr key={tx.id} className="hover:bg-black/[0.02] transition-colors group">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <p className="text-[15px] font-semibold text-black">
                      {safeFormatDate(tx.timestamp, 'MMM d, yyyy')}
                    </p>
                    <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                      {safeFormatDate(tx.timestamp, 'HH:mm:ss')}
                    </p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-[15px] font-semibold text-blue-600">{tx.batchId}</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-[15px] font-medium text-black">{tx.brand}</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-[15px] font-medium text-gray-600">{tx.series}</p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-[15px] font-medium text-gray-600">{tx.model}</p>
                  </td>
                  <td className="px-8 py-4 relative">
                    <div 
                      className="inline-flex items-center gap-1.5 cursor-pointer"
                      onClick={() => {
                        if (tx.type === 'BREAKDOWN' || tx.type === 'PURCHASE' || tx.type === 'INSTALL') {
                          setHoveredTxId(hoveredTxId === tx.id ? null : (tx.id || null));
                        }
                      }}
                    >
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                        tx.type === 'INCOMING' && "bg-green-500/10 text-green-700",
                        tx.type === 'PURCHASE' && "bg-emerald-500/10 text-emerald-700",
                        tx.type === 'SALE' && "bg-orange-500/10 text-orange-700",
                        tx.type === 'REPAIR' && "bg-blue-500/10 text-blue-700",
                        tx.type === 'ADJUSTMENT' && "bg-gray-500/10 text-gray-700",
                        tx.type === 'BREAKDOWN' && "bg-purple-500/10 text-purple-700",
                        tx.type === 'INSTALL' && "bg-red-500/10 text-red-700"
                      )}>
                        {(tx.type === 'BREAKDOWN' || tx.type === 'PURCHASE' || tx.type === 'INSTALL') && <Hammer className="w-3 h-3" />}
                        {tx.type === 'REPAIR' && tx.fromClass === 'UNCLASSIFIED' 
                          ? t.initClass 
                          : (t[tx.type.toLowerCase() as keyof typeof t] || tx.type)}
                      </span>
                      {(tx.type === 'BREAKDOWN' || tx.type === 'PURCHASE' || tx.type === 'INSTALL') && (
                        <Info className="w-3.5 h-3.5 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                      )}

                    <AnimatePresence>
                      {(hoveredTxId === tx.id && (tx.type === 'BREAKDOWN' || tx.type === 'PURCHASE' || tx.type === 'INSTALL')) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: index < 3 ? -10 : 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: index < 3 ? -10 : 10 }}
                          className={cn(
                            "absolute z-50 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-black/5 p-4 pointer-events-auto",
                            index < 3 ? "top-full mt-2" : "bottom-full mb-2"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between border-b border-black/5 pb-2">
                              <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                                {tx.type === 'INSTALL' ? t.installComponents : t.goodComponents}
                              </span>
                              <span className="text-[10px] font-medium text-gray-400">
                                {tx.type === 'INSTALL' || tx.type === 'PURCHASE' ? '' : `${tx.quantity} ${t.laptops}`}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                              {tx.componentChanges && Object.keys(tx.componentChanges).length > 0 ? (
                                Object.entries(tx.componentChanges).map(([comp, count]) => (
                                  <div key={comp} className="flex items-center justify-between">
                                    <span className="text-[12px] text-gray-600 truncate mr-2">{t[comp] || comp}</span>
                                    <span className="text-[12px] font-bold text-black">{count}</span>
                                  </div>
                                ))
                              ) : (
                                <div className="col-span-2 text-center py-2 text-[12px] text-gray-400 italic">
                                  No components recorded
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={cn(
                            "absolute left-6 w-4 h-4 bg-white border-black/5 rotate-45",
                            index < 3 ? "-top-2 border-l border-t" : "-bottom-2 border-r border-b"
                          )} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-[15px] font-medium text-gray-700">
                      {tx.type === 'REPAIR' ? (
                        <>{getClassName(tx.fromClass)} <ArrowRightLeft className="inline w-3 h-3 mx-1 text-gray-400" /> {getClassName(tx.toClass)}</>
                      ) : tx.type === 'INCOMING' ? (
                        <>{t.toUnclassified}</>
                      ) : tx.type === 'SALE' ? (
                        <>{t.from} {getClassName(tx.fromClass)}</>
                      ) : tx.type === 'BREAKDOWN' ? (
                        <>{t.breakdown} {t.from} {getClassName(tx.fromClass)}</>
                      ) : tx.type === 'PURCHASE' ? (
                        <>{t.buyComponents}</>
                      ) : tx.type === 'INSTALL' ? (
                        <>{t.installComponents}</>
                      ) : (
                        <>{getClassName(tx.toClass) === t.spoiled ? t.spoiled : `${t.class} ${getClassName(tx.toClass)}`}</>
                      )}
                    </p>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <p className={cn(
                      "text-[17px] font-semibold tabular-nums tracking-tight",
                      (tx.type === 'INCOMING' || tx.type === 'REPAIR' || tx.type === 'PURCHASE') ? "text-green-600" : "text-orange-600"
                    )}>
                      {tx.type === 'PURCHASE' ? (
                        `+${(Object.values(tx.componentChanges || {}) as number[]).reduce((a, b) => a + (b || 0), 0)}`
                      ) : tx.type === 'INSTALL' ? (
                        `-${(Object.values(tx.componentChanges || {}) as number[]).reduce((a, b) => a + (b || 0), 0)}`
                      ) : (
                        `${(tx.type === 'INCOMING' || tx.type === 'REPAIR') ? '+' : '-'}${tx.quantity}`
                      )}
                    </p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-[15px] font-medium text-gray-700">
                      {users[tx.userId]?.username || tx.userId || t.unknown}
                    </p>
                  </td>
                  <td className="px-8 py-4">
                    <p className="text-[13px] text-gray-500 italic max-w-xs truncate">{tx.notes || '-'}</p>
                  </td>
                </tr>
              ))
              )}
            {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-8 py-12 text-center text-gray-400 font-medium text-[15px]">
                    {t.noTransactions}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

