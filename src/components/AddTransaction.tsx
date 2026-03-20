import React, { useState } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { Batch, LaptopClass, TransactionType } from '../types';
import { CLASSES } from '../constants';
import { cn } from '../lib/utils';

interface AddTransactionProps {
  t: any;
  activeTab: string;
  onAddTransaction: (
    txType: TransactionType,
    batchId: string,
    fromClass: LaptopClass,
    toClass: LaptopClass,
    quantity: number,
    notes: string
  ) => Promise<boolean>;
  batches: Batch[];
  isSubmitting: boolean;
}

export const AddTransaction: React.FC<AddTransactionProps> = ({
  t,
  activeTab,
  onAddTransaction,
  batches,
  isSubmitting,
}) => {
  const [txType, setTxType] = useState<TransactionType>('INCOMING');
  const [batchId, setBatchId] = useState('');
  const [fromClass, setFromClass] = useState<LaptopClass>('D');
  const [toClass, setToClass] = useState<LaptopClass>('A');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const handleBatchIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\//g, '-');
    
    // If user is deleting, just let them delete
    if (val.length < batchId.length) {
      setBatchId(val);
      return;
    }

    // Auto-format
    const digits = val.replace(/\D/g, '');
    let formatted = '';
    if (digits.length > 0) formatted += digits.substring(0, 2);
    if (digits.length >= 3) formatted += '-' + digits.substring(2, 4);
    if (digits.length >= 5) formatted += '-' + digits.substring(4, 8);
    
    if (val.endsWith('-') && formatted.length > 0 && !formatted.endsWith('-')) {
      formatted += '-';
    }

    setBatchId(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onAddTransaction(txType, batchId, fromClass, toClass, quantity, notes);
    if (success) {
      // Reset form
      setTxType('INCOMING');
      setBatchId('');
      setQuantity(1);
      setNotes('');
    }
  };

  return (
    <div className={cn(
      "lg:col-span-4",
      activeTab !== 'add' && "hidden lg:block"
    )}>
      <div className="glass-panel rounded-[32px] p-8 sticky top-24">
        <h2 className="text-[28px] font-bold text-black mb-8 tracking-tight leading-none">{t.recordTransaction}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.batchId}</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., 16-03-2026"
                value={batchId}
                onChange={handleBatchIdChange}
                className="ios-input flex-1"
                required
              />
              <select
                onChange={(e) => setBatchId(e.target.value)}
                value={batchId}
                className="ios-input px-2 py-3 text-[15px] font-medium w-auto"
              >
                <option value="">{t.selectExisting}</option>
                {batches.map(b => <option key={b.id} value={b.batchId}>{b.batchId}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.transactionType}</label>
            <div className="grid grid-cols-2 gap-2 bg-black/5 p-1 rounded-[16px]">
              {(['INCOMING', 'REPAIR', 'SALE', 'ADJUSTMENT'] as TransactionType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTxType(type)}
                  className={cn(
                    "py-2.5 px-2 rounded-xl text-[13px] font-semibold transition-all",
                    txType === type 
                      ? "bg-white text-black shadow-sm" 
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  {t[type.toLowerCase() as keyof typeof t] || type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {(txType === 'REPAIR' || txType === 'SALE') && (
              <div>
                <label className="block text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.fromClass}</label>
                <select
                  value={fromClass}
                  onChange={(e) => setFromClass(e.target.value as LaptopClass)}
                  className="ios-input w-full"
                >
                  <option value="UNCLASSIFIED">{t.unclassified}</option>
                  {CLASSES.map(c => <option key={c} value={c}>{t.class} {c}</option>)}
                </select>
              </div>
            )}
            {(txType === 'REPAIR' || txType === 'ADJUSTMENT') && (
              <div className={cn(txType === 'ADJUSTMENT' && "col-span-2")}>
                <label className="block text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {txType === 'ADJUSTMENT' ? t.targetClass : t.toClass}
                </label>
                <select
                  value={toClass}
                  onChange={(e) => setToClass(e.target.value as LaptopClass)}
                  className="ios-input w-full"
                >
                  {CLASSES.map(c => <option key={c} value={c}>{t.class} {c}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {txType === 'ADJUSTMENT' ? t.newTotalCount : t.quantity}
            </label>
            <input
              type="number"
              min={txType === 'ADJUSTMENT' ? "0" : "1"}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="ios-input w-full"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-gray-500 uppercase tracking-wider mb-2">{t.notes}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="ios-input w-full min-h-[100px] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="ios-button w-full py-4 text-[17px] mt-4"
          >
            {isSubmitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            {isSubmitting ? t.processing : t.recordEntry}
          </button>
        </form>
      </div>
    </div>
  );
};
