import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Batch } from '../types';

interface RenameBatchModalProps {
  t: any;
  editingBatch: Batch | null;
  setEditingBatch: (batch: Batch | null) => void;
  newBatchName: string;
  setNewBatchName: (name: string) => void;
  isRenaming: boolean;
  handleRenameBatch: () => Promise<void>;
}

export const RenameBatchModal: React.FC<RenameBatchModalProps> = ({
  t,
  editingBatch,
  setEditingBatch,
  newBatchName,
  setNewBatchName,
  isRenaming,
  handleRenameBatch,
}) => {
  if (!editingBatch) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-panel rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl">
        <div className="px-8 py-6 border-b border-white/10 bg-red-500/5">
          <div className="flex items-center gap-3 text-red-500 mb-2">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-[22px] font-semibold tracking-tight">{t.renameBatch}</h3>
          </div>
          <p className="text-[15px] text-red-500/80 font-medium leading-relaxed">
            {t.renameWarning}
          </p>
        </div>
        <div className="p-8">
          <div className="mb-6">
            <label className="block text-[13px] font-semibold text-[var(--color-ios-text-secondary)] uppercase tracking-wider mb-2">{t.newBatchName}</label>
            <input
              type="text"
              value={newBatchName}
              onChange={(e) => setNewBatchName(e.target.value)}
              className="ios-input w-full"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setEditingBatch(null)}
              disabled={isRenaming}
              className="px-6 py-3 text-[15px] font-semibold text-[var(--color-ios-text-secondary)] hover:bg-black/5 rounded-xl transition-colors disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleRenameBatch}
              disabled={isRenaming || !newBatchName.trim() || newBatchName.trim() === editingBatch.batchId}
              className="px-6 py-3 text-[15px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {isRenaming ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {t.renaming}
                </>
              ) : (
                t.confirmRename
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
