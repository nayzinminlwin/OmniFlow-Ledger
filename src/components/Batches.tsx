import React, { memo, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Settings, Edit2, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { Batch, LaptopClass } from '../types';
import { CLASSES } from '../constants';
import { cn } from '../lib/utils';
import { Skeleton } from './Skeleton';

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
}) => {
  const [sortField, setSortField] = useState<'batchId' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const safeFormatDate = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return format(d, formatStr);
  };

  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'batchId') {
        comparison = (a.batchId || '').localeCompare(b.batchId || '');
      } else {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [batches, sortField, sortOrder]);

  if (activeTab !== 'batches') return null;

  const selectedBatch = batches.find(x => x.batchId === selectedBatchId);
  const models = selectedBatch?.items || [];

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

  const getBatchTotal = (batch: Batch, cls: LaptopClass | 'UNCLASSIFIED') => {
    return batch.items?.reduce((sum, m) => sum + (m?.counts?.[cls as LaptopClass] || 0), 0) || 0;
  };

  const handleSort = (field: 'batchId' | 'createdAt') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: 'batchId' | 'createdAt' }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="lg:col-span-12 space-y-8 animate-in fade-in duration-500">
      <section>
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-[28px] font-bold text-black tracking-tight leading-none">{t.batchStockLevels}</h2>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            className="ios-input py-2 px-4 shadow-sm w-auto"
          >
            <option value="">{t.selectBatch}</option>
            {batches.map(b => <option key={b.id} value={b.batchId}>{b.batchId}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="glass-panel rounded-[32px] overflow-hidden p-6">
            <Skeleton className="w-full h-32" />
          </div>
        ) : selectedBatchId ? (
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
                    <th className="px-6 py-4 text-[13px] font-semibold text-gray-500 uppercase tracking-wider">Classified</th>
                    <th className="px-6 py-4 text-[13px] font-bold text-black uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {models.length === 0 ? (
                    <tr key="empty-batch">
                      <td colSpan={CLASSES.length + 5} className="px-6 py-12 text-center text-gray-400 text-[15px]">
                        No models in this batch.
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
                        <td colSpan={3} className="px-6 py-4 font-bold text-black uppercase tracking-wider text-[13px]">Batch Total</td>
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
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/[0.02]">
                <th 
                  className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-black transition-colors"
                  onClick={() => handleSort('batchId')}
                >
                  <div className="flex items-center">
                    {t.batchId}
                    <SortIcon field="batchId" />
                  </div>
                </th>
                <th 
                  className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-black transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    {t.created}
                    <SortIcon field="createdAt" />
                  </div>
                </th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">{t.unclassified}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">A</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">B</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">B-</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">C</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">C-</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">D</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">Classified</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right"></th>
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
                  <td colSpan={10} className="px-8 py-12 text-center text-gray-400 font-medium text-[15px]">
                    {t.noBatches}
                  </td>
                </tr>
              ) : (
                sortedBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="px-8 py-4">
                      <p className="text-[15px] font-semibold text-blue-600">{b.batchId}</p>
                    </td>
                    <td className="px-8 py-4 whitespace-nowrap">
                      <p className="text-[13px] font-medium text-gray-500">{safeFormatDate(b.createdAt, 'MMM d, yyyy')}</p>
                    </td>
                    <td className="px-8 py-4 text-center font-semibold text-blue-900 bg-blue-500/5">{getBatchTotal(b, 'UNCLASSIFIED')}</td>
                    <td className="px-8 py-4 text-center font-semibold text-black">{getBatchTotal(b, 'A')}</td>
                    <td className="px-8 py-4 text-center font-semibold text-black">{getBatchTotal(b, 'B')}</td>
                    <td className="px-8 py-4 text-center font-semibold text-black">{getBatchTotal(b, 'B-')}</td>
                    <td className="px-8 py-4 text-center font-semibold text-black">{getBatchTotal(b, 'C')}</td>
                    <td className="px-8 py-4 text-center font-semibold text-black">{getBatchTotal(b, 'C-')}</td>
                    <td className="px-8 py-4 text-center font-semibold text-black">{getBatchTotal(b, 'D')}</td>
                    <td className="px-8 py-4 text-center font-bold text-gray-700 bg-gray-500/5">
                      {CLASSES.reduce((sum, cls) => sum + getBatchTotal(b, cls), 0)}
                    </td>
                    <td className="px-8 py-4 text-right">
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
                            onDeleteBatch(b.batchId, setSelectedBatchId);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors active:scale-95"
                          title={t.deleteBatch || 'Delete Batch'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
});
