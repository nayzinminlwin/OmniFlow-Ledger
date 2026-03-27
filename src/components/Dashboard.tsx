import React, { memo, useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { 
  Plus, 
  Minus, 
  RefreshCw, 
  ChevronRight, 
  ArrowRightLeft, 
  Settings,
  FileSpreadsheet,
  Hammer,
  Info,
  X,
  Undo2,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingCart,
  Wrench,
  Sliders,
  PackagePlus,
  PlusCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Stock, Transaction, LaptopClass, Batch } from '../types';
import { CLASSES } from '../constants';
import { cn } from '../lib/utils';
import { Skeleton } from './Skeleton';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  stock: Stock | null;
  batches: Batch[];
  transactions: Transaction[];
  t: any;
  setActiveTab: (tab: 'dashboard' | 'history' | 'add' | 'batches') => void;
  activeTab: string;
  loading?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = memo(({ 
  stock, 
  batches,
  transactions, 
  t, 
  setActiveTab,
  activeTab,
  loading = false
}) => {
  const [hoveredTxId, setHoveredTxId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (hoveredTxId && !target.closest('.breakdown-trigger') && !target.closest('.breakdown-popup')) {
        setHoveredTxId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hoveredTxId]);

  const models = stock?.items || [];
  
  const getColumnTotal = (cls: LaptopClass) => {
    return models.reduce((sum, m) => sum + (m?.counts?.[cls] || 0), 0);
  };

  const getRowTotal = (counts: Record<LaptopClass, number>) => {
    if (!counts) return 0;
    return Object.values(counts).reduce((sum, count) => sum + (count || 0), 0);
  };

  const grandTotal = models.reduce((sum, m) => sum + getRowTotal(m?.counts), 0);

  const getClassifiedRowTotal = (counts: Record<LaptopClass, number>) => {
    if (!counts) return 0;
    return CLASSES.reduce((sum, cls) => sum + (counts[cls] || 0), 0);
  };

  const getClassifiedGrandTotal = models.reduce((sum, m) => sum + getClassifiedRowTotal(m?.counts), 0);

  const getClassName = (cls?: string) => cls === 'Spoiled' ? t.spoiled : cls;

  const handleExport = () => {
    if (!batches.length) return;

    const exportData: any[] = [];

    // Iterate through each batch to include Batch ID
    batches.forEach(batch => {
      if (!batch.items || !Array.isArray(batch.items)) return;
      
      batch.items.forEach(m => {
        const rowTotal = getRowTotal(m.counts);
        if (rowTotal === 0) return; // Skip empty rows in this batch

        const row: any = {
          [t.batchId]: batch.batchId,
          [t.brandLabel]: m.brand,
          [t.seriesLabel]: m.series,
          [t.modelLabel]: m.model,
          [t.unclassified]: m.counts?.['UNCLASSIFIED'] || 0
        };
        
        CLASSES.forEach(cls => {
          row[cls === 'Spoiled' ? t.spoiled : `${t.class} ${cls}`] = m.counts?.[cls] || 0;
        });
        
        row[t.classified] = getClassifiedRowTotal(m.counts);
        row[t.total] = rowTotal;
        exportData.push(row);
      });
    });

    // Add a separator or just the Grand Total at the end
    exportData.push({}); // Empty row for separation
    
    const totalRow: any = {
      [t.batchId]: t.grandTotal,
      [t.brandLabel]: '',
      [t.seriesLabel]: '',
      [t.modelLabel]: '',
      [t.unclassified]: getColumnTotal('UNCLASSIFIED')
    };
    CLASSES.forEach(cls => {
      totalRow[cls === 'Spoiled' ? t.spoiled : `${t.class} ${cls}`] = getColumnTotal(cls);
    });
    totalRow[t.classified] = getClassifiedGrandTotal;
    totalRow[t.total] = grandTotal;
    exportData.push(totalRow);

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t.inventoryByBatch);
    
    const fileName = `Inventory_By_Batch_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const safeFormatDate = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return t.na;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return t.invalidDate;
    return format(d, formatStr);
  };

  return (
    <div className={cn(
      "lg:col-span-12 space-y-8 animate-in fade-in duration-500",
      activeTab === 'dashboard' ? "block" : "hidden"
    )}>
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 px-2 gap-4">
          <div className="flex items-center gap-4">
            <h2 className="text-[28px] font-bold text-black tracking-tight leading-none">{t.currentInventory}</h2>
            <button 
              onClick={handleExport}
              disabled={!batches.length || loading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[14px] font-bold hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {t.export}
            </button>
          </div>
          <span className="text-[13px] font-medium text-gray-500 uppercase tracking-wider">
            {t.lastUpdated} {stock && stock.lastUpdated ? (
              safeFormatDate(stock.lastUpdated, 'HH:mm:ss')
            ) : loading ? <Skeleton className="w-16 h-4 inline-block" /> : t.never}
          </span>
        </div>
        
        <div className="glass-panel rounded-[32px] overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-black/5 bg-black/[0.02]">
                  <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{t.brandLabel}</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{t.seriesLabel}</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{t.modelLabel}</th>
                  <th className="px-6 py-4 text-[13px] font-semibold text-blue-500 uppercase tracking-wider">{t.unclassified}</th>
                  {CLASSES.map(cls => (
                    <th key={cls} className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{cls === 'Spoiled' ? t.spoiled : `${t.class} ${cls}`}</th>
                  ))}
                  <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">{t.classified}</th>
                  <th className="px-6 py-4 text-[13px] font-bold text-black uppercase tracking-wider">{t.total}</th>
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
                      {t.noInventoryData}
                    </td>
                  </tr>
                ) : (
                  [
                    ...models.map((m, index) => (
                      <tr key={`${m.brand}-${m.series}-${m.model}-${index}`} className="hover:bg-black/[0.02] transition-colors">
                        <td className="px-6 py-4 font-medium text-black">{m.brand}</td>
                        <td className="px-6 py-4 text-gray-600">{m.series}</td>
                        <td className="px-6 py-4 text-gray-600">{m.model}</td>
                        <td className="px-6 py-4 font-semibold text-blue-600 tabular-nums">{m?.counts?.['UNCLASSIFIED'] || 0}</td>
                        {CLASSES.map(cls => (
                          <td key={cls} className="px-6 py-4 text-gray-600 tabular-nums">{m?.counts?.[cls] || 0}</td>
                        ))}
                        <td className="px-6 py-4 font-semibold text-gray-700 tabular-nums">{getClassifiedRowTotal(m?.counts)}</td>
                        <td className="px-6 py-4 font-bold text-black tabular-nums">{getRowTotal(m?.counts)}</td>
                      </tr>
                    )),
                    <tr key="grand-total" className="bg-black/[0.03] border-t-2 border-black/10">
                      <td colSpan={3} className="px-6 py-4 font-bold text-black uppercase tracking-wider text-[13px]">{t.grandTotal}</td>
                      <td className="px-6 py-4 font-bold text-blue-600 tabular-nums">{getColumnTotal('UNCLASSIFIED')}</td>
                      {CLASSES.map(cls => (
                        <td key={cls} className="px-6 py-4 font-bold text-black tabular-nums">{getColumnTotal(cls)}</td>
                      ))}
                      <td className="px-6 py-4 font-bold text-gray-700 tabular-nums">{getClassifiedGrandTotal}</td>
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
            transactions.slice(0, 5).map((tx, index) => (
              <div 
                key={tx.id || index} 
                className={cn(
                  "px-8 py-5 flex items-center justify-between hover:bg-black/[0.02] transition-colors group relative cursor-pointer",
                  tx.type === 'BREAKDOWN' && "breakdown-trigger"
                )}
                onClick={() => {
                  if (tx.type === 'BREAKDOWN') {
                    setHoveredTxId(hoveredTxId === tx.id ? null : (tx.id || null));
                  }
                }}
              >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center",
                  tx.type === 'INCOMING' && "bg-green-500/10 text-green-600",
                  tx.type === 'SALE' && "bg-orange-500/10 text-orange-600",
                  tx.type === 'REPAIR' && "bg-blue-500/10 text-blue-600",
                  tx.type === 'ADJUSTMENT' && "bg-gray-500/10 text-gray-600",
                  tx.type === 'BREAKDOWN' && "bg-purple-500/10 text-purple-600",
                  tx.type === 'PURCHASE' && "bg-emerald-500/10 text-emerald-600",
                  tx.type === 'INSTALL' && "bg-pink-500/10 text-pink-600",
                  tx.type === 'UNDO' && "bg-yellow-500/10 text-yellow-600"
                )}>
                  {tx.type === 'INCOMING' && <ArrowDownLeft className="w-5 h-5" />}
                  {tx.type === 'SALE' && <ArrowUpRight className="w-5 h-5" />}
                  {tx.type === 'REPAIR' && (tx.fromClass === 'UNCLASSIFIED' ? <PlusCircle className="w-5 h-5" /> : <Wrench className="w-5 h-5" />)}
                  {tx.type === 'ADJUSTMENT' && <Sliders className="w-5 h-5" />}
                  {tx.type === 'BREAKDOWN' && <Hammer className="w-5 h-5" />}
                  {tx.type === 'PURCHASE' && <ShoppingCart className="w-5 h-5" />}
                  {tx.type === 'INSTALL' && <PackagePlus className="w-5 h-5" />}
                  {tx.type === 'UNDO' && <Undo2 className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-semibold text-[17px] text-black tracking-tight flex items-center gap-2">
                    {tx.type === 'REPAIR' ? (
                      tx.fromClass === 'UNCLASSIFIED' ? (
                        <>{t.initClass} <ArrowRightLeft className="inline w-3 h-3 mx-1 text-gray-400" /> {getClassName(tx.toClass)}</>
                      ) : (
                        <>{t.repairPrefix} {getClassName(tx.fromClass)} <ArrowRightLeft className="inline w-3 h-3 mx-1 text-gray-400" /> {getClassName(tx.toClass)}</>
                      )
                    ) : tx.type === 'BREAKDOWN' ? (
                      <span className="flex items-center gap-1.5 relative">
                        <span className="flex items-center gap-1.5">
                          {t.breakdown} {t.from} {getClassName(tx.fromClass)}
                          <Info className="w-3.5 h-3.5 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </span>

                        <AnimatePresence>
                          {hoveredTxId === tx.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: index < 3 ? -10 : 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: index < 3 ? -10 : 10 }}
                              className={cn(
                                "absolute z-50 left-0 w-64 bg-white rounded-2xl shadow-2xl border border-black/5 p-4 pointer-events-auto cursor-default breakdown-popup",
                                index < 3 ? "top-full mt-2" : "bottom-full mb-2"
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                                  <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                                    {tx.type === 'INSTALL' ? t.installComponents : tx.type === 'UNDO' ? t.undoneComponents : t.goodComponents}
                                  </span>
                                  <span className="text-[10px] font-medium text-gray-400">
                                    {tx.type === 'INSTALL' || tx.type === 'PURCHASE' || tx.type === 'UNDO' ? '' : `${tx.quantity} ${t.laptops}`}
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
                                      {t.noComponentsRecorded}
                                    </div>
                                  )}
                                </div>
                                {tx.notes && (
                                  <div className="pt-2 border-t border-black/5">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{t.notes}</p>
                                    <p className="text-[11px] text-gray-600 leading-snug line-clamp-2 italic">{tx.notes}</p>
                                  </div>
                                )}
                              </div>
                              <div className={cn(
                                "absolute left-6 w-4 h-4 bg-white border-black/5 rotate-45",
                                index < 3 ? "-top-2 border-l border-t" : "-bottom-2 border-r border-b"
                              )} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </span>
                    ) : tx.type === 'PURCHASE' ? (
                      <>{tx.componentChanges && Object.keys(tx.componentChanges).length > 0 
                        ? `${t.purchase} ${Object.keys(tx.componentChanges).map(c => t[c] || c).join(', ')}`
                        : t.buyComponents}</>
                    ) : tx.type === 'INSTALL' ? (
                      <>{tx.componentChanges && Object.keys(tx.componentChanges).length > 0 
                        ? `${t.install} ${Object.keys(tx.componentChanges).map(c => t[c] || c).join(', ')}`
                        : t.installComponents}</>
                    ) : tx.type === 'UNDO' ? (
                      <>{t.undo} {tx.undoneType === 'PURCHASE' ? t.buy : (tx.undoneType ? (t[tx.undoneType.toLowerCase() as keyof typeof t] || tx.undoneType) : '')}</>
                    ) : (
                      <>{tx.type === 'INCOMING' ? t.incoming : (t[tx.type.toLowerCase() as keyof typeof t] || tx.type)} {tx.type !== 'INCOMING' && getClassName(tx.toClass || tx.fromClass)}</>
                    )}
                  </div>
                  <p className="text-[13px] text-gray-500 font-medium mt-0.5">
                    {tx.brand} {tx.series} {tx.model} • {safeFormatDate(tx.timestamp, 'MMM d, HH:mm')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-[19px] font-semibold tabular-nums tracking-tight",
                  (tx.type === 'INCOMING' || tx.type === 'REPAIR' || tx.type === 'PURCHASE' || (tx.type === 'UNDO' && tx.quantity > 0)) ? "text-green-600" : tx.type === 'INSTALL' ? "text-pink-600" : "text-orange-600"
                )}>
                  {tx.type === 'PURCHASE' ? (
                    `+${(Object.values(tx.componentChanges || {}) as number[]).reduce((a, b) => a + (b || 0), 0)}`
                  ) : tx.type === 'INSTALL' ? (
                    `-${(Object.values(tx.componentChanges || {}) as number[]).reduce((a, b) => a + (b || 0), 0)}`
                  ) : tx.type === 'UNDO' ? (
                    tx.quantity >= 0 ? `+${tx.quantity}` : tx.quantity
                  ) : (
                    `${(tx.type === 'INCOMING' || tx.type === 'REPAIR') ? '+' : '-'}${tx.quantity}`
                  )}
                </p>
                {tx.notes && <p className="text-[11px] text-gray-400 max-w-[120px] truncate mt-0.5">{tx.notes}</p>}
              </div>
            </div>
          ))
        )}

        </div>
      </section>
    </div>
  );
});
