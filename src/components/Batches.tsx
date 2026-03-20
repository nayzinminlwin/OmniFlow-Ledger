import React from 'react';
import { format } from 'date-fns';
import { Settings, Edit2 } from 'lucide-react';
import { Batch } from '../types';
import { CLASSES } from '../constants';
import { getStockKey } from '../utils/stock';
import { cn } from '../lib/utils';

interface BatchesProps {
  t: any;
  activeTab: string;
  selectedBatchId: string;
  setSelectedBatchId: (id: string) => void;
  batches: Batch[];
  setEditingBatch: (batch: Batch) => void;
  setNewBatchName: (name: string) => void;
}

export const Batches: React.FC<BatchesProps> = ({
  t,
  activeTab,
  selectedBatchId,
  setSelectedBatchId,
  batches,
  setEditingBatch,
  setNewBatchName,
}) => {
  return (
    <div className={cn(
      "lg:col-span-12 space-y-8",
      activeTab !== 'batches' && "hidden"
    )}>
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

        {selectedBatchId ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {(() => {
              const b = batches.find(x => x.batchId === selectedBatchId);
              return (
                <>
                  <div className="glass-panel p-6 rounded-[24px] hover:scale-[1.02] transition-transform group relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5"></div>
                    <div className="relative z-10">
                      <div className="text-[11px] font-semibold text-blue-500 uppercase tracking-widest mb-2">{t.unclassified}</div>
                      <div className="text-[34px] font-bold text-black tracking-tight tabular-nums leading-none">
                        {b ? b.unclassified : 0}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-2 font-medium">{t.inBatch} {selectedBatchId}</div>
                    </div>
                  </div>
                  {CLASSES.map((cls) => (
                    <div key={cls} className="glass-panel p-6 rounded-[24px] hover:scale-[1.02] transition-transform group">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors">{t.class} {cls}</div>
                      <div className="text-[34px] font-bold text-black tracking-tight tabular-nums leading-none">
                        {b ? (b as any)[getStockKey(cls)] : 0}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-2 font-medium">{t.inBatch} {selectedBatchId}</div>
                    </div>
                  ))}
                </>
              );
            })()}
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
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.batchId}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{t.created}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">{t.unclassified}</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">A</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">B</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">B-</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">C</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">C-</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-center">D</th>
                <th className="px-8 py-4 text-[11px] font-semibold text-gray-400 uppercase tracking-widest text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-black/[0.02] transition-colors">
                  <td className="px-8 py-4">
                    <p className="text-[15px] font-semibold text-blue-600">{b.batchId}</p>
                  </td>
                  <td className="px-8 py-4 whitespace-nowrap">
                    <p className="text-[13px] font-medium text-gray-500">{format(new Date(b.createdAt), 'MMM d, yyyy')}</p>
                  </td>
                  <td className="px-8 py-4 text-center font-semibold text-blue-900 bg-blue-500/5">{b.unclassified}</td>
                  <td className="px-8 py-4 text-center font-semibold text-black">{b.classA}</td>
                  <td className="px-8 py-4 text-center font-semibold text-black">{b.classB}</td>
                  <td className="px-8 py-4 text-center font-semibold text-black">{b.classBMinus}</td>
                  <td className="px-8 py-4 text-center font-semibold text-black">{b.classC}</td>
                  <td className="px-8 py-4 text-center font-semibold text-black">{b.classCMinus}</td>
                  <td className="px-8 py-4 text-center font-semibold text-black">{b.classD}</td>
                  <td className="px-8 py-4 text-right">
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
                  </td>
                </tr>
              ))}
              {batches.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-8 py-12 text-center text-gray-400 font-medium text-[15px]">
                    {t.noBatches}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
