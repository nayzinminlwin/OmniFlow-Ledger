import React, { useState, useMemo, memo } from 'react';
import { RefreshCw, CheckCircle2, X } from 'lucide-react';
import { Batch, LaptopClass, TransactionType } from '../types';
import { CLASSES } from '../constants';
import { cn } from '../lib/utils';

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
  const [fromClass, setFromClass] = useState<LaptopClass>('D');
  const [toClass, setToClass] = useState<LaptopClass>('A');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

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
    if (!brand.trim() || !series.trim() || !model.trim()) return;
    const success = await onAddTransaction(txType, batchId, brand.trim(), series.trim(), model.trim(), fromClass, toClass, quantity, notes);
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="e.g., 16-03-2026"
                    value={batchId}
                    onChange={handleBatchIdChange}
                    className="ios-input w-full"
                    required
                  />
                  <select
                    onChange={(e) => setBatchId(e.target.value)}
                    value={batchId}
                    className="ios-input w-full text-[15px] font-medium"
                  >
                    <option value="">{t.selectExisting}</option>
                    {batches.map(b => <option key={b.id} value={b.batchId}>{b.batchId}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.transactionType}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/5 p-1 rounded-[16px]">
                  {(['INCOMING', 'REPAIR', 'SALE', 'ADJUSTMENT'] as TransactionType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTxType(type)}
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
                    <option value="">{t.selectExisting}</option>
                    {existingBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    <option value="__NEW__" className="font-bold text-blue-600">+ {t.newBrand}</option>
                  </select>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={t.newBrand}
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="ios-input w-full text-[15px] py-3 pr-10"
                      autoFocus
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
                    <option value="">{t.selectExisting}</option>
                    {filteredSeries.map(s => <option key={s} value={s}>{s}</option>)}
                    <option value="__NEW__" className="font-bold text-blue-600">+ {t.newSeries}</option>
                  </select>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={t.newSeries}
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
                      className="ios-input w-full text-[15px] py-3 pr-10"
                      autoFocus={!isNewBrand}
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
                    <option value="">{t.selectExisting}</option>
                    {filteredModels.map(m => <option key={m} value={m}>{m}</option>)}
                    <option value="__NEW__" className="font-bold text-blue-600">+ {t.newModel}</option>
                  </select>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={t.newModel}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="ios-input w-full text-[15px] py-3 pr-10"
                      autoFocus={!isNewBrand && !isNewSeries}
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
                    <option value="UNCLASSIFIED">{t.unclassified}</option>
                    {CLASSES.map(c => <option key={c} value={c}>{t.class} {c}</option>)}
                  </select>
                </div>
              )}
              {(txType === 'REPAIR' || txType === 'ADJUSTMENT') && (
                <div className={cn("space-y-2", txType === 'ADJUSTMENT' && "col-span-2")}>
                  <div className="flex justify-between items-center">
                    <label className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">
                      {txType === 'ADJUSTMENT' ? t.targetClass : t.toClass}
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
                    {CLASSES.map(c => <option key={c} value={c}>{t.class} {c}</option>)}
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
                  min={txType === 'ADJUSTMENT' ? "0" : "1"}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="ios-input w-full"
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
              disabled={isSubmitting || isFromStockEmpty}
              className={cn(
                "ios-button w-full py-5 text-[19px] mt-4",
                isFromStockEmpty && "opacity-50 cursor-not-allowed bg-gray-400"
              )}
            >
              {isSubmitting ? <RefreshCw className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
              {isSubmitting ? t.processing : t.recordEntry}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
});
