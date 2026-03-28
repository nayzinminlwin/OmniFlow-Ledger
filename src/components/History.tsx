import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRightLeft, Info, Hammer, Undo2, ArrowDownLeft, ArrowUpRight, ShoppingCart, Wrench, Sliders, PackagePlus, PlusCircle } from 'lucide-react';
import { Transaction, UserProfile } from '../types';
import { COMPONENTS } from '../constants';
import { cn } from '../lib/utils';
import { Skeleton } from './Skeleton';
import { motion, AnimatePresence } from 'motion/react';
import { useHistoryLogic } from '../hooks/useHistoryLogic';

interface HistoryProps {
  transactions: Transaction[];
  users: Record<string, UserProfile>;
  t: any;
  activeTab: string;
  loading?: boolean;
  onUndo: (transactionId: string, currentUserProfile: UserProfile | null) => Promise<boolean | undefined>;
  currentUserProfile: UserProfile | null;
}

export const History: React.FC<HistoryProps> = memo(({ transactions, users, t, activeTab, loading = false, onUndo, currentUserProfile }) => {
  const {
    hoveredTxId,
    popupConfig,
    undoingTxId,
    scrollContainerRef,
    safeFormatDate,
    getClassName,
    handleUndo,
    togglePopup,
    searchTerm,
    setSearchTerm,
    filteredTransactions,
    setHoveredTxId,
    setPopupConfig
  } = useHistoryLogic({
    transactions,
    t,
    onUndo,
    currentUserProfile
  });

  if (activeTab !== 'history') return null;

  return (
    <div className="lg:col-span-12 animate-in fade-in duration-500">
      <div className="glass-panel rounded-[32px] overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 flex flex-col sm:flex-row items-center justify-between bg-black/[0.02] gap-4">
          <h2 className="text-[22px] font-bold text-black tracking-tight">{t.fullLedger}</h2>
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder={t.searchTransactions}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ios-input w-full pl-10 py-2 text-[13px]"
              />
              <ArrowRightLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest whitespace-nowrap">
              {t.showingLast50}
            </div>
          </div>
        </div>
        <div ref={scrollContainerRef} className="overflow-x-auto overflow-y-auto custom-scrollbar max-h-[calc(100vh-320px)] relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-[#F8F8F8] shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#F8F8F8]">{t.dateTime}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#F8F8F8]">{t.batch}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#F8F8F8]">{t.brandLabel}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#F8F8F8]">{t.seriesLabel}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#F8F8F8]">{t.modelLabel}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#F8F8F8]">{t.type}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#F8F8F8]">{t.movement}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right bg-[#F8F8F8]">{t.qty}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#F8F8F8]">{t.user}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#F8F8F8]">{t.notes}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest bg-[#F8F8F8]">{t.undo}</th>
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
                    <td className="px-8 py-4"><Skeleton className="w-8 h-8 rounded-full" /></td>
                  </tr>
                ))
              ) : (
                filteredTransactions.map((tx, index) => {
                  const username = users[tx.userId]?.username || tx.userId || t.unknown;
                  const wordCount = username.split(/\s+/).filter(Boolean).length;
                  const txUniqueId = tx.id || `tx-${index}`;
                  
                  return (
                    <tr key={txUniqueId} className="hover:bg-black/[0.02] transition-colors group">
                      <td className="px-8 py-4 whitespace-nowrap">
                        <span className="text-[14px] font-semibold text-black">
                          {safeFormatDate(tx.timestamp, 'MMM d, yyyy')}
                        </span>
                        <span className="text-[12px] text-gray-400 font-medium ml-2">
                          {safeFormatDate(tx.timestamp, 'HH:mm:ss')}
                        </span>
                      </td>
                      <td className="px-8 py-4 whitespace-nowrap">
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
                          className={cn(
                            "inline-flex items-center gap-1.5",
                            (tx.type === 'BREAKDOWN' || tx.type === 'PURCHASE' || tx.type === 'INSTALL' || (tx.type === 'UNDO' && tx.componentChanges)) && "cursor-pointer breakdown-trigger"
                          )}
                          onClick={(e) => togglePopup(tx, txUniqueId, index, e)}
                        >
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5",
                            tx.type === 'INCOMING' && "bg-green-500/10 text-green-700",
                            tx.type === 'PURCHASE' && "bg-emerald-500/10 text-emerald-700",
                            tx.type === 'SALE' && "bg-orange-500/10 text-orange-700",
                            tx.type === 'REPAIR' && "bg-blue-500/10 text-blue-700",
                            tx.type === 'ADJUSTMENT' && "bg-gray-500/10 text-gray-700",
                            tx.type === 'DELETION' && "bg-red-500/10 text-red-700",
                            tx.type === 'UNDO' && "bg-yellow-500/10 text-yellow-700",
                            tx.type === 'BREAKDOWN' && "bg-purple-500/10 text-purple-700",
                            tx.type === 'INSTALL' && "bg-pink-500/10 text-pink-700"
                          )}>
                            {tx.type === 'INCOMING' && <ArrowDownLeft className="w-3 h-3" />}
                            {tx.type === 'PURCHASE' && <ShoppingCart className="w-3 h-3" />}
                            {tx.type === 'SALE' && <ArrowUpRight className="w-3 h-3" />}
                            {tx.type === 'REPAIR' && (tx.fromClass === 'UNCLASSIFIED' ? <PlusCircle className="w-3 h-3" /> : <Wrench className="w-3 h-3" />)}
                            {tx.type === 'ADJUSTMENT' && <Sliders className="w-3 h-3" />}
                            {tx.type === 'DELETION' && <PlusCircle className="w-3 h-3 rotate-45" />}
                            {tx.type === 'UNDO' && <Undo2 className="w-3 h-3" />}
                            {tx.type === 'BREAKDOWN' && <Hammer className="w-3 h-3" />}
                            {tx.type === 'INSTALL' && <PackagePlus className="w-3 h-3" />}
                            {tx.type === 'REPAIR' && tx.fromClass === 'UNCLASSIFIED' 
                              ? t.initClass 
                              : tx.type === 'UNDO' 
                                ? `${t.undo} ${tx.undoneType === 'PURCHASE' ? t.buy : (tx.undoneType ? (t[tx.undoneType.toLowerCase() as keyof typeof t] || tx.undoneType) : '')}`
                                : (t[tx.type.toLowerCase() as keyof typeof t] || tx.type)}
                          </span>
                          {(tx.type === 'BREAKDOWN' || tx.type === 'PURCHASE' || tx.type === 'INSTALL' || (tx.type === 'UNDO' && tx.componentChanges)) && (
                            <Info className="w-3.5 h-3.5 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                          )}
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
                            <>{tx.componentChanges && Object.keys(tx.componentChanges).length > 0 
                              ? `${t.purchase} ${Object.keys(tx.componentChanges).map(c => t[c] || c).join(', ')}`
                              : t.buyComponents}</>
                          ) : tx.type === 'INSTALL' ? (
                            <>{tx.componentChanges && Object.keys(tx.componentChanges).length > 0 
                              ? `${t.install} ${Object.keys(tx.componentChanges).map(c => t[c] || c).join(', ')}`
                              : t.installComponents}</>
                          ) : tx.type === 'UNDO' ? (
                            <span className="text-yellow-600 font-semibold">
                              {tx.undoneType === 'BREAKDOWN' ? (
                                <>{t.components} <ArrowRightLeft className="inline w-3 h-3 mx-1 text-gray-400" /> {getClassName(tx.fromClass)}</>
                              ) : tx.fromClass && tx.toClass ? (
                                `${getClassName(tx.toClass)} → ${getClassName(tx.fromClass)}`
                              ) : tx.fromClass ? (
                                `${t.to} ${getClassName(tx.fromClass)}`
                              ) : tx.toClass ? (
                                `${t.from} ${getClassName(tx.toClass)}`
                              ) : t.undo}
                            </span>
                          ) : tx.type === 'DELETION' ? (
                            <span className="text-red-600 font-semibold">{t.batchDeletion}</span>
                          ) : (
                            <>{getClassName(tx.toClass) === t.spoiled ? t.spoiled : `${t.class} ${getClassName(tx.toClass)}`}</>
                          )}
                        </p>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <p className={cn(
                          "text-[17px] font-semibold tabular-nums tracking-tight",
                          (tx.type === 'INCOMING' || tx.type === 'REPAIR' || tx.type === 'PURCHASE' || ((tx.type === 'ADJUSTMENT' || tx.type === 'UNDO') && tx.quantity > 0)) ? "text-green-600" : (tx.type === 'INSTALL' || tx.type === 'DELETION' || (tx.type === 'ADJUSTMENT' && tx.quantity < 0)) ? "text-red-600" : "text-orange-600"
                        )}>
                          {tx.type === 'PURCHASE' ? (
                            `+${(Object.values(tx.componentChanges || {}) as number[]).reduce((a, b) => a + (b || 0), 0)}`
                          ) : tx.type === 'INSTALL' ? (
                            `-${(Object.values(tx.componentChanges || {}) as number[]).reduce((a, b) => a + (b || 0), 0)}`
                          ) : (tx.type === 'ADJUSTMENT' || tx.type === 'UNDO' || tx.type === 'DELETION') ? (
                            tx.quantity >= 0 ? `+${tx.quantity}` : tx.quantity
                          ) : (
                            `${(tx.type === 'INCOMING' || tx.type === 'REPAIR') ? '+' : '-'}${tx.quantity}`
                          )}
                        </p>
                      </td>
                      <td className="px-8 py-4">
                        <p className={cn(
                          "text-[15px] font-medium text-gray-700",
                          wordCount > 5 ? "whitespace-nowrap" : ""
                        )}>
                          {username}
                        </p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="text-[13px] text-gray-500 italic max-w-xs truncate">{tx.notes || '-'}</p>
                      </td>
                      <td className="px-8 py-4">
                        {tx.isUndone ? (
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.undone}</span>
                        ) : tx.batchActive === false ? (
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.batchDeleted}</span>
                        ) : tx.type === 'UNDO' ? (
                          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest opacity-50">{t.undo}</span>
                        ) : (
                          <button
                            onClick={() => tx.id && handleUndo(tx.id)}
                            disabled={undoingTxId === tx.id || !currentUserProfile || (
                              !currentUserProfile.isOriginalAdmin && 
                              !(currentUserProfile.isUltimateAdmin && (!users[tx.userId]?.isUltimateAdmin && !users[tx.userId]?.isOriginalAdmin || tx.userId === currentUserProfile.uid)) &&
                              tx.userId !== currentUserProfile.uid
                            )}
                            className={cn(
                              "p-2 rounded-full transition-colors",
                              undoingTxId === tx.id ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100 text-gray-400 hover:text-red-500",
                              (!currentUserProfile || (
                                !currentUserProfile.isOriginalAdmin && 
                                !(currentUserProfile.isUltimateAdmin && (!users[tx.userId]?.isUltimateAdmin && !users[tx.userId]?.isOriginalAdmin || tx.userId === currentUserProfile.uid)) &&
                                tx.userId !== currentUserProfile.uid
                              )) && "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-gray-400"
                            )}
                            title={t.undo}
                          >
                            {undoingTxId === tx.id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Undo2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            {!loading && transactions.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-8 py-12 text-center text-gray-400 font-medium text-[15px]">
                    {t.noTransactions}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {popupConfig && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: popupConfig.index < 10 ? -10 : 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: popupConfig.index < 10 ? -10 : 10 }}
              style={{
                position: 'fixed',
                top: popupConfig.index < 10 ? popupConfig.top + 40 : popupConfig.top - 10,
                left: popupConfig.left,
                transform: popupConfig.index < 10 ? 'none' : 'translateY(-100%)',
                zIndex: 9999
              }}
              className={cn(
                "w-64 bg-white rounded-2xl shadow-2xl border border-black/5 p-4 pointer-events-auto breakdown-popup"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
                    {popupConfig.tx.type === 'INSTALL' ? t.installComponents : popupConfig.tx.type === 'UNDO' ? t.undoneComponents : t.goodComponents}
                  </span>
                  <span className="text-[10px] font-medium text-gray-400">
                    {popupConfig.tx.type === 'INSTALL' || popupConfig.tx.type === 'PURCHASE' || popupConfig.tx.type === 'UNDO' ? '' : `${popupConfig.tx.quantity} ${t.laptops}`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {popupConfig.tx.componentChanges && Object.keys(popupConfig.tx.componentChanges).length > 0 ? (
                    Object.entries(popupConfig.tx.componentChanges)
                      .sort(([a], [b]) => COMPONENTS.indexOf(a as any) - COMPONENTS.indexOf(b as any))
                      .map(([comp, count]) => (
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
                "absolute w-4 h-4 bg-white border-black/5 rotate-45",
                popupConfig.index < 10 ? "-top-2 border-l border-t" : "-bottom-2 border-r border-b"
              )} 
              style={{
                left: 'calc(50% - 8px)'
              }}
              />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
});

