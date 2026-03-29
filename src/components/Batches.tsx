import React, { memo, useMemo } from 'react';
import { Settings, Edit2, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Batch, LaptopClass } from '../types';
import { CLASSES } from '../constants';
import { cn } from '../lib/utils';
import { Skeleton } from './Skeleton';
import { ConfirmationModal } from './ConfirmationModal';
import { useBatchesLogic } from '../hooks/useBatchesLogic';

interface BatchesProps {
  t: any;
  activeTab: string;
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  batches: Batch[];
  setEditingBatch: (batch: Batch) => void;
  setNewBatchName: (name: string) => void;
  onDeleteBatch: (batchId: string, setSelectedBatchId: (id: string) => void) => Promise<boolean>;
  loading?: boolean;
  isAdmin?: boolean;
}

export const Batches: React.FC<BatchesProps> = memo(({
  t,
  activeTab,
  selectedBatchId,
  setSelectedBatchId,
  batches,
  setEditingBatch,
  setNewBatchName,
  onDeleteBatch,
  loading = false,
  isAdmin,
}) => {
  const {
    sortField,
    sortOrder,
    isDeleteDialogOpen,
    isDeleting,
    safeFormatDate,
    sortedBatches,
    getColumnTotal,
    getRowTotal,
    getClassifiedRowTotal,
    getBatchTotal,
    handleSort,
    handleDeleteConfirm,
    handleDeleteCancel,
    initiateDelete
  } = useBatchesLogic({
    batches,
    t,
    onDeleteBatch,
    setSelectedBatchId
  });

  const selectedBatch = batches.find(x => x.batchId === selectedBatchId);
  const models = selectedBatch?.items || [];

  const grandTotal = models.reduce((sum, m) => sum + getRowTotal(m?.counts), 0);
  const getClassifiedGrandTotal = models.reduce((sum, m) => sum + getClassifiedRowTotal(m?.counts), 0);

  const SortIcon = ({ field }: { field: 'batchId' | 'createdAt' }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className={cn(
      "lg:col-span-12 space-y-8 animate-in fade-in duration-500",
      activeTab === 'batches' ? "block" : "hidden"
    )}>
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-[28px] font-bold text-black tracking-tight leading-none">{t.batchStockLevels}</h2>
          <div className="flex items-center gap-3">
            <label htmlFor="batch-view-select" className="text-[13px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap hidden sm:block">
              {t.selectBatch}:
            </label>
            <select
              id="batch-view-select"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="ios-input py-2 px-4 shadow-sm w-auto"
            >
              {batches.map((b, i) => <option key={b.id || b.batchId || `batch-${i}`} value={b.batchId}>{b.batchId}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="glass-panel rounded-[32px] overflow-hidden p-6">
            <Skeleton className="w-full h-32" />
          </div>
        ) : selectedBatchId ? (
          <div className="glass-panel rounded-[32px] overflow-hidden">
            <div className="overflow-x-auto overflow-y-auto custom-scrollbar max-h-[calc(100vh-450px)] relative">
              <table className="w-full text-left border-separate border-spacing-0 whitespace-nowrap">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-[#F8F8F8] shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                    <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider bg-[#F8F8F8]">{t.brandLabel}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider bg-[#F8F8F8]">{t.seriesLabel}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider bg-[#F8F8F8]">{t.modelLabel}</th>
                    <th className="px-6 py-4 text-[13px] font-semibold text-blue-500 uppercase tracking-wider bg-[#F8F8F8]">{t.unclassified}</th>
                    {CLASSES.map(cls => (
                      <th key={cls} className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider bg-[#F8F8F8]">{t.class} {cls}</th>
                    ))}
                    <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider bg-[#F8F8F8]">{t.classified}</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-black uppercase tracking-wider bg-[#F8F8F8]">{t.total}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {models.length === 0 ? (
                    <tr key="empty-batch">
                      <td colSpan={CLASSES.length + 5} className="px-6 py-12 text-center text-gray-400 text-[15px]">
                        {t.noModelsInBatch}
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
                          <td className="px-6 py-4 font-semibold text-gray-700 tabular-nums">{getClassifiedRowTotal(m?.counts)}</td>
                          <td className="px-6 py-4 font-bold text-black tabular-nums">{getRowTotal(m?.counts)}</td>
                        </tr>
                      )),
                      <tr key="batch-total" className="bg-black/[0.03] border-t-2 border-black/10">
                        <td colSpan={3} className="px-6 py-4 font-bold text-black uppercase tracking-wider text-[13px]">{t.batchTotal}</td>
                        <td className="px-6 py-4 font-bold text-blue-600 tabular-nums">{getColumnTotal(models, 'UNCLASSIFIED')}</td>
                        {CLASSES.map(cls => (
                          <td key={cls} className="px-6 py-4 font-bold text-black tabular-nums">{getColumnTotal(models, cls)}</td>
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
        ) : (
          <div className="glass-panel rounded-[32px] border-dashed border-black/10 p-12 text-center">
            <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium text-[15px]">{t.selectBatchToView}</p>
          </div>
        )}
      </section>

      <section className="glass-panel rounded-[32px] overflow-hidden">
        <div className="px-8 py-6 border-b border-black/5 bg-black/[0.02]">
          <h2 className="text-[22px] font-bold text-black tracking-tight">{t.allBatchesSummary}</h2>
        </div>
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar max-h-[calc(100vh-350px)] relative">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20">
              <tr className="bg-[#F8F8F8] shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                <th 
                  className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-black transition-colors bg-[#F8F8F8]"
                  onClick={() => handleSort('batchId')}
                >
                  <div className="flex items-center">
                    {t.batchId}
                    <SortIcon field="batchId" />
                  </div>
                </th>
                <th 
                  className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-black transition-colors bg-[#F8F8F8]"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    {t.created}
                    <SortIcon field="createdAt" />
                  </div>
                </th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center bg-[#F8F8F8]">{t.unclassified}</th>
                {CLASSES.map(cls => (
                  <th key={cls} className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center bg-[#F8F8F8]">{cls === 'Spoiled' ? t.spoiled : cls}</th>
                ))}
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center bg-[#F8F8F8]">{t.classified}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right bg-[#F8F8F8]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`skeleton-${i}`}>
                    <td className="px-8 py-4"><Skeleton className="w-20 h-5" /></td>
                    <td className="px-8 py-4"><Skeleton className="w-24 h-4" /></td>
                    <td className="px-8 py-4 text-center"><Skeleton className="w-10 h-5 mx-auto" /></td>
                    <td className="px-8 py-4 text-center"><Skeleton className="w-10 h-5 mx-auto" /></td>
                    <td className="px-8 py-4 text-center"><Skeleton className="w-10 h-5 mx-auto" /></td>
                    <td className="px-8 py-4 text-center"><Skeleton className="w-10 h-5 mx-auto" /></td>
                    <td className="px-8 py-4 text-center"><Skeleton className="w-10 h-5 mx-auto" /></td>
                    <td className="px-8 py-4 text-center"><Skeleton className="w-10 h-5 mx-auto" /></td>
                    <td className="px-8 py-4 text-center"><Skeleton className="w-10 h-5 mx-auto" /></td>
                    <td className="px-8 py-4 text-right"><Skeleton className="w-8 h-8 rounded-full ml-auto" /></td>
                  </tr>
                ))
              ) : batches.length === 0 ? (
                <tr key="no-batches">
                  <td colSpan={CLASSES.length + 4} className="px-8 py-12 text-center text-gray-400 font-medium text-[15px]">
                    {t.noBatches}
                  </td>
                </tr>
              ) : (
                sortedBatches.map((b, index) => (
                  <tr key={b.id || index} className="hover:bg-black/[0.02] transition-colors">
                  <td className="px-8 py-4 whitespace-nowrap">
                    <p className="text-[15px] font-semibold text-blue-600">{b.batchId}</p>
                  </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <span className="text-[14px] font-semibold text-black">
                        {safeFormatDate(b.createdAt, 'MMM d, yyyy')}
                      </span>
                      <span className="text-[12px] text-gray-400 font-medium ml-2">
                        {safeFormatDate(b.createdAt, 'HH:mm:ss')}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center font-semibold text-blue-900 bg-blue-500/5">{getBatchTotal(b, 'UNCLASSIFIED')}</td>
                    {CLASSES.map(cls => (
                      <td key={cls} className="px-8 py-4 text-center font-semibold text-black">{getBatchTotal(b, cls)}</td>
                    ))}
                    <td className="px-8 py-4 text-center font-bold text-gray-700 bg-gray-500/5">
                      {CLASSES.reduce((sum, cls) => sum + getBatchTotal(b, cls), 0)}
                    </td>
                    <td className="px-8 py-4 text-right">
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBatch(b);
                              setNewBatchName(b.batchId);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors active:scale-95"
                            title={t.editBatchName}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              initiateDelete(b.batchId);
                            }}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors active:scale-95"
                            title={t.deleteBatch}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <ConfirmationModal
        isOpen={isDeleteDialogOpen}
        title={t.deleteBatch}
        message={t.confirmDeleteBatch}
        confirmText={t.deleteBatch}
        cancelText={t.cancel}
        isProcessing={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
});
