import React, { useState, useMemo, memo, useRef, useEffect } from 'react';
import { RefreshCw, CheckCircle2, X } from 'lucide-react';
import { Batch, LaptopClass, TransactionType } from '../types';
import { CLASSES } from '../constants';
import { cn } from '../lib/utils';
import { Toast } from './Toast';

import { isValidBatchDate, formatBatchId, padBatchId } from '../lib/dateUtils';

interface AddTransactionProps {
  t: any;
  activeTab: string;
  onAddTransaction: (
    txType: TransactionType,
    batchId: string,
    brand: string,
    series: string,
    model: string,
    fromClass: LaptopClass,
    toClass: LaptopClass,
    quantity: number,
    notes: string
  ) => Promise<boolean>;
  batches: Batch[];
  isSubmitting: boolean;
}

export const AddTransaction: React.FC<AddTransactionProps> = memo(({
  t,
  activeTab,
  onAddTransaction,
  batches,
  isSubmitting,
}) => {
  const [txType, setTxType] = useState<TransactionType>(() => (localStorage.getItem('last_txType') as TransactionType) || 'INCOMING');
  const [batchId, setBatchId] = useState(() => localStorage.getItem('last_batchId') || '');
  const [brand, setBrand] = useState(() => localStorage.getItem('last_brand') || '');
  const [series, setSeries] = useState(() => localStorage.getItem('last_series') || '');
  const [model, setModel] = useState(() => localStorage.getItem('last_model') || '');
  const [isNewBrand, setIsNewBrand] = useState(() => localStorage.getItem('last_isNewBrand') === 'true');
  const [isNewSeries, setIsNewSeries] = useState(() => localStorage.getItem('last_isNewSeries') === 'true');
  const [isNewModel, setIsNewModel] = useState(() => localStorage.getItem('last_isNewModel') === 'true');
  const [error, setError] = useState<string | null>(null);
  const [fromClass, setFromClass] = useState<LaptopClass>('D');
  const [toClass, setToClass] = useState<LaptopClass>('A');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [notes, setNotes] = useState('');
  const [isNewBatch, setIsNewBatch] = useState(false);

  const batchInputRef = useRef<HTMLInputElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const seriesInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNewBatch) batchInputRef.current?.focus();
  }, [isNewBatch]);

  useEffect(() => {
    if (isNewBrand) brandInputRef.current?.focus();
  }, [isNewBrand]);

  useEffect(() => {
    if (isNewSeries && !isNewBrand) seriesInputRef.current?.focus();
  }, [isNewSeries, isNewBrand]);

  useEffect(() => {
    if (isNewModel && !isNewBrand && !isNewSeries) modelInputRef.current?.focus();
  }, [isNewModel, isNewBrand, isNewSeries]);

  // Persist values to localStorage
  React.useEffect(() => {
    localStorage.setItem('last_txType', txType);
    localStorage.setItem('last_batchId', batchId);
    localStorage.setItem('last_brand', brand);
    localStorage.setItem('last_series', series);
    localStorage.setItem('last_model', model);
    localStorage.setItem('last_isNewBrand', String(isNewBrand));
    localStorage.setItem('last_isNewSeries', String(isNewSeries));
    localStorage.setItem('last_isNewModel', String(isNewModel));
  }, [txType, batchId, brand, series, model, isNewBrand, isNewSeries, isNewModel]);

  const handleTxTypeChange = (type: TransactionType) => {
    setTxType(type);
    if (type === 'INCOMING') {
      setToClass('UNCLASSIFIED');
    } else if (type === 'REPAIR') {
      setFromClass('UNCLASSIFIED');
      if (toClass === 'UNCLASSIFIED') setToClass('A');
    } else if (type !== 'ADJUSTMENT' && toClass === 'UNCLASSIFIED') {
      setToClass('A');
    }
    // Reset "New" states if not INCOMING
    if (type !== 'INCOMING') {
      setIsNewBrand(false);
      setIsNewSeries(false);
      setIsNewModel(false);
      // If we were in "New" mode, we should also clear the values to avoid invalid state
      // or we can keep them if they happen to match existing ones, but safer to clear
      // or reset to empty so user has to pick from list.
      if (isNewBrand || isNewSeries || isNewModel) {
        setBrand('');
        setSeries('');
        setModel('');
      }
    }
  };

  const currentBatch = useMemo(() => batches.find(b => b.batchId === batchId), [batches, batchId]);
  
  const existingBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    batches.forEach(b => b.items?.forEach(i => {
      if (i.brand) brandsSet.add(i.brand);
    }));
    return Array.from(brandsSet).sort();
  }, [batches]);

  const filteredSeries = useMemo(() => {
    if (!brand || isNewBrand) return [];
    const seriesSet = new Set<string>();
    batches.forEach(b => b.items?.forEach(i => {
      if (i.brand === brand && i.series) seriesSet.add(i.series);
    }));
    return Array.from(seriesSet).sort();
  }, [batches, brand, isNewBrand]);

  const filteredModels = useMemo(() => {
    if (!brand || isNewBrand || !series || isNewSeries) return [];
    const modelsSet = new Set<string>();
    batches.forEach(b => b.items?.forEach(i => {
      if (i.brand === brand && i.series === series && i.model) modelsSet.add(i.model);
    }));
    return Array.from(modelsSet).sort();
  }, [batches, brand, series, isNewBrand, isNewSeries]);

  // Set default batchId if empty
  useEffect(() => {
    if (!batchId && batches.length > 0 && !isNewBatch) {
      setBatchId(batches[0].batchId);
    }
  }, [batches, batchId, isNewBatch]);

  // Set default brand if empty
  useEffect(() => {
    if (!brand && existingBrands.length > 0 && !isNewBrand) {
      setBrand(existingBrands[0]);
    }
  }, [existingBrands, brand, isNewBrand]);

  // Set default series if empty
  useEffect(() => {
    if (!series && filteredSeries.length > 0 && !isNewSeries) {
      setSeries(filteredSeries[0]);
    }
  }, [filteredSeries, series, isNewSeries]);

  // Set default model if empty
  useEffect(() => {
    if (!model && filteredModels.length > 0 && !isNewModel) {
      setModel(filteredModels[0]);
    }
  }, [filteredModels, model, isNewModel]);

  const handleBrandChange = (val: string) => {
    if (val === '__NEW__') {
      setIsNewBrand(true);
      setBrand('');
      setIsNewSeries(true);
      setSeries('');
      setIsNewModel(true);
      setModel('');
    } else {
      setIsNewBrand(false);
      setBrand(val);
      setSeries('');
      setIsNewSeries(false);
      setModel('');
      setIsNewModel(false);
    }
  };

  const handleSeriesChange = (val: string) => {
    if (val === '__NEW__') {
      setIsNewSeries(true);
      setSeries('');
      setIsNewModel(true);
      setModel('');
    } else {
      setIsNewSeries(false);
      setSeries(val);
      setModel('');
      setIsNewModel(false);
    }
  };

  const handleModelChange = (val: string) => {
    if (val === '__NEW__') {
      setIsNewModel(true);
      setModel('');
    } else {
      setIsNewModel(false);
      setModel(val);
    }
  };

  const getStockCount = (className: LaptopClass) => {
    if (!currentBatch || !brand || !series || !model) return 0;
    const modelStock = currentBatch.items?.find(i => i.brand === brand && i.series === series && i.model === model);
    return modelStock?.counts?.[className] || 0;
  };

  const isFromStockEmpty = (txType === 'REPAIR' || txType === 'SALE') && batchId && brand && series && model && getStockCount(fromClass) <= 0;

  const handleBatchIdChange = (val: string) => {
    if (val === '__NEW__') {
      setIsNewBatch(true);
      setBatchId('');
    } else {
      setIsNewBatch(false);
      setBatchId(val);
    }
  };

  const handleBatchIdBlur = () => {
    setBatchId(prev => padBatchId(prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim() || !series.trim() || !model.trim()) return;
    
    // Final padding and validation
    const finalBatchId = padBatchId(batchId);
    
    if (!isValidBatchDate(finalBatchId)) {
      setError(t.invalidBatchDate);
      return;
    }

    const success = await onAddTransaction(txType, finalBatchId, brand.trim(), series.trim(), model.trim(), fromClass, toClass, Number(quantity), notes);
    if (success) {
      // Reset only quantity and notes, keeping batch and model info for faster workflow
      setQuantity(1);
      setNotes('');
    }
  };

  return (
    <div className={cn(
      "lg:col-span-12 animate-in slide-in-from-bottom duration-500",
      activeTab === 'add' ? "block" : "hidden"
    )}>
      <div className="max-w-3xl mx-auto">
        <div className="glass-panel rounded-[32px] p-10">
          <h2 className="text-[32px] font-bold text-black mb-10 tracking-tight leading-none text-center">{t.recordTransaction}</h2>
          
          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.batchId}</label>
                {!isNewBatch ? (
                  <div className="relative">
                      <select
                        value={batchId}
                        onChange={(e) => handleBatchIdChange(e.target.value)}
                        className="ios-input w-full pr-10"
                        required
                      >
                        {batches.map((b, i) => (
                          <option key={b.id || b.batchId || `batch-${i}`} value={b.batchId}>{b.batchId}</option>
                        ))}
                        <option key="new-batch" value="__NEW__" className="font-bold text-blue-600">+ {t.newBatch || 'New Batch'}</option>
                      </select>
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      ref={batchInputRef}
                      type="text"
                      placeholder={t.dateExample}
                      value={batchId}
                      onChange={(e) => setBatchId(formatBatchId(e.target.value, batchId))}
                      onBlur={handleBatchIdBlur}
                      className="ios-input w-full pr-10"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => handleBatchIdChange('')}
                      className="absolute right-2 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.transactionType}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/5 p-1 rounded-[16px]">
                  {(['INCOMING', 'REPAIR', 'SALE', 'ADJUSTMENT'] as TransactionType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTxTypeChange(type)}
                      className={cn(
                        "py-3 px-2 rounded-xl text-[13px] font-bold transition-all",
                        txType === type 
                          ? "bg-white text-black shadow-md" 
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {t[type.toLowerCase() as keyof typeof t] || type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t.brandLabel}</label>
                {!isNewBrand ? (
                  <select
                    value={brand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="ios-input w-full text-[15px] py-3"
                    required
                  >
                    {existingBrands.map((b, i) => <option key={`brand-${b}-${i}`} value={b}>{b}</option>)}
                    {txType === 'INCOMING' ? (
                      <option key="new-brand" value="__NEW__" className="font-bold text-blue-600">+ {t.newBrand}</option>
                    ) : null}
                  </select>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      ref={brandInputRef}
                      type="text"
                      placeholder={t.newBrand}
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="ios-input w-full text-[15px] py-3 pr-10"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => handleBrandChange('')}
                      className="absolute right-2 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t.seriesLabel}</label>
                {!isNewSeries ? (
                  <select
                    value={series}
                    onChange={(e) => handleSeriesChange(e.target.value)}
                    className="ios-input w-full text-[15px] py-3"
                    disabled={!brand && !isNewBrand}
                    required
                  >
                    {filteredSeries.map((s, i) => <option key={`series-${s}-${i}`} value={s}>{s}</option>)}
                    {txType === 'INCOMING' ? (
                      <option key="new-series" value="__NEW__" className="font-bold text-blue-600">+ {t.newSeries}</option>
                    ) : null}
                  </select>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      ref={seriesInputRef}
                      type="text"
                      placeholder={t.newSeries}
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
                      className="ios-input w-full text-[15px] py-3 pr-10"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => handleSeriesChange('')}
                      className="absolute right-2 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t.modelLabel}</label>
                {!isNewModel ? (
                  <select
                    value={model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="ios-input w-full text-[15px] py-3"
                    disabled={(!series && !isNewSeries) || (!brand && !isNewBrand)}
                    required
                  >
                    {filteredModels.map((m, i) => <option key={`model-${m}-${i}`} value={m}>{m}</option>)}
                    {txType === 'INCOMING' ? (
                      <option key="new-model" value="__NEW__" className="font-bold text-blue-600">+ {t.newModel}</option>
                    ) : null}
                  </select>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      ref={modelInputRef}
                      type="text"
                      placeholder={t.newModel}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="ios-input w-full text-[15px] py-3 pr-10"
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => handleModelChange('')}
                      className="absolute right-2 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(txType === 'REPAIR' || txType === 'SALE') && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.fromClass}</label>
                    {currentBatch && (
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full",
                        getStockCount(fromClass) <= 0 ? "text-red-600 bg-red-50" : "text-ios-blue bg-ios-blue/10"
                      )}>
                        {t.currentStock}: {getStockCount(fromClass)}
                      </span>
                    )}
                  </div>
                  <select
                    value={fromClass}
                    onChange={(e) => setFromClass(e.target.value as LaptopClass)}
                    className="ios-input w-full"
                  >
                    <option key="unclassified" value="UNCLASSIFIED">{t.unclassified}</option>
                    {CLASSES.map((c, i) => <option key={`class-from-${c}-${i}`} value={c}>{c === 'Spoiled' ? t.spoiled : `${t.class} ${c}`}</option>)}
                  </select>
                </div>
              )}
              {(txType === 'REPAIR' || txType === 'ADJUSTMENT' || txType === 'INCOMING') && (
                <div className={cn("space-y-2", (txType === 'ADJUSTMENT' || txType === 'INCOMING') && "col-span-2")}>
                  <div className="flex justify-between items-center">
                    <label className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">
                      {(txType === 'ADJUSTMENT' || txType === 'INCOMING') ? t.targetClass : t.toClass}
                    </label>
                    {currentBatch && (
                      <span className="text-[11px] font-bold text-ios-blue bg-ios-blue/10 px-2 py-0.5 rounded-full">
                        {t.currentStock}: {getStockCount(toClass)}
                      </span>
                    )}
                  </div>
                  <select
                    value={toClass}
                    onChange={(e) => setToClass(e.target.value as LaptopClass)}
                    className="ios-input w-full"
                  >
                    {(txType === 'ADJUSTMENT' || txType === 'INCOMING' || txType === 'REPAIR') ? <option key="unclassified" value="UNCLASSIFIED">{t.unclassified}</option> : null}
                    {CLASSES.map((c, i) => <option key={`class-to-${c}-${i}`} value={c}>{c === 'Spoiled' ? t.spoiled : `${t.class} ${c}`}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">
                  {txType === 'ADJUSTMENT' ? t.newTotalCount : t.quantity}
                </label>
                <input
                  type="number"
                  value={quantity}
                  onKeyDown={(e) => {
                    if (['-', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantity('');
                    } else {
                      const parsed = Math.max(0, parseInt(val));
                      if (!isNaN(parsed)) setQuantity(parsed);
                    }
                  }}
                  className="ios-input w-full"
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.notes}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="ios-input w-full min-h-[80px] py-3 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isFromStockEmpty || !quantity || Number(quantity) <= 0}
              className={cn(
                "ios-button w-full py-5 text-[19px] mt-4",
                (isFromStockEmpty || !quantity || Number(quantity) <= 0) && "opacity-50 cursor-not-allowed bg-gray-400"
              )}
            >
              {isSubmitting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              {isSubmitting ? t.processing : t.recordEntry}
            </button>
          </form>
        </div>
      </div>

      <Toast 
        message={error} 
        type="error" 
        onClose={() => setError(null)} 
      />
    </div>
  );
});
