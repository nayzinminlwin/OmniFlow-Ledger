import React, { memo } from 'react';
import { RefreshCw, CheckCircle2, X } from 'lucide-react';
import { Batch, LaptopClass, TransactionType } from '../types';
import { CLASSES } from '../constants';
import { cn } from '../lib/utils';
import { Toast } from './Toast';
import { useAddTransactionForm } from '../hooks/useAddTransactionForm';
import { formatBatchId } from '../lib/dateUtils';

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
  isAdmin?: boolean;
}

export const AddTransaction: React.FC<AddTransactionProps> = memo(({
  t,
  activeTab,
  onAddTransaction,
  batches,
  isSubmitting,
  isAdmin,
}) => {
  const {
    txType,
    batchId,
    setBatchId,
    brand,
    setBrand,
    series,
    setSeries,
    model,
    setModel,
    error,
    setError,
    fromClass,
    setFromClass,
    toClass,
    setToClass,
    quantity,
    setQuantity,
    notes,
    setNotes,
    isNewBatch,
    isNewBrand,
    isNewSeries,
    isNewModel,
    batchInputRef,
    brandInputRef,
    seriesInputRef,
    modelInputRef,
    handleTxTypeChange,
    existingBrands,
    filteredSeries,
    filteredModels,
    handleBrandChange,
    handleSeriesChange,
    handleModelChange,
    getStockCount,
    isFromStockEmpty,
    handleBatchIdChange,
    handleBatchIdBlur,
    handleSubmit
  } = useAddTransactionForm({ batches, onAddTransaction, t });

  if (!isAdmin) {
    return (
      <div className={cn(
        "lg:col-span-12 animate-in slide-in-from-bottom duration-500",
        activeTab === 'add' ? "block" : "hidden"
      )}>
        <div className="max-w-3xl mx-auto">
          <div className="glass-panel rounded-[32px] p-10 text-center">
            <h2 className="text-[32px] font-bold text-black mb-6 tracking-tight leading-none">{t.recordTransaction}</h2>
            <p className="text-gray-500 text-[17px]">{t.accessRestricted}</p>
          </div>
        </div>
      </div>
    );
  }

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
                <label htmlFor="batch-select" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.batchId}</label>
                {!isNewBatch ? (
                  <div className="relative">
                      <select
                        id="batch-select"
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
                      id="batch-select"
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
                <span id="transaction-type-label" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.transactionType}</span>
                <div 
                  role="radiogroup" 
                  aria-labelledby="transaction-type-label"
                  className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/5 p-1 rounded-[16px]"
                >
                  {(['INCOMING', 'REPAIR', 'SALE', 'ADJUSTMENT'] as TransactionType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={txType === type}
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
                <label htmlFor="brand-select" className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t.brandLabel}</label>
                {!isNewBrand ? (
                  <div className="relative">
                    <select
                      id="brand-select"
                      value={brand}
                      onChange={(e) => handleBrandChange(e.target.value)}
                      className="ios-input w-full text-[15px] py-3 pr-10"
                      required
                    >
                      <option value="" disabled>{t.selectBrand}</option>
                      {existingBrands.map((b, i) => <option key={`brand-${b}-${i}`} value={b}>{b}</option>)}
                      {brand && !existingBrands.includes(brand) && <option value={brand}>{brand}</option>}
                      {txType === 'INCOMING' ? (
                        <option key="new-brand" value="__NEW__" className="font-bold text-blue-600">+ {t.newBrand}</option>
                      ) : null}
                    </select>
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      id="brand-select"
                      ref={brandInputRef}
                      type="text"
                      placeholder={t.brandLabel}
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
                <label htmlFor="series-select" className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t.seriesLabel}</label>
                {!isNewSeries ? (
                  <div className="relative">
                    <select
                      id="series-select"
                      value={series}
                      onChange={(e) => handleSeriesChange(e.target.value)}
                      className="ios-input w-full text-[15px] py-3 pr-10"
                      disabled={!brand || isNewBrand}
                      required
                    >
                      <option value="" disabled>{t.selectSeries}</option>
                      {filteredSeries.map((s, i) => <option key={`series-${s}-${i}`} value={s}>{s}</option>)}
                      {series && !filteredSeries.includes(series) && <option value={series}>{series}</option>}
                      {txType === 'INCOMING' ? (
                        <option key="new-series" value="__NEW__" className="font-bold text-blue-600">+ {t.newSeries}</option>
                      ) : null}
                    </select>
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      id="series-select"
                      ref={seriesInputRef}
                      type="text"
                      placeholder={t.seriesLabel}
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
                <label htmlFor="model-select" className="block text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t.modelLabel}</label>
                {!isNewModel ? (
                  <div className="relative">
                    <select
                      id="model-select"
                      value={model}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="ios-input w-full text-[15px] py-3 pr-10"
                      disabled={!series || !brand || isNewSeries}
                      required
                    >
                      <option value="" disabled>{t.selectModel}</option>
                      {filteredModels.map((m, i) => <option key={`model-${m}-${i}`} value={m}>{m}</option>)}
                      {model && !filteredModels.includes(model) && <option value={model}>{model}</option>}
                      {txType === 'INCOMING' ? (
                        <option key="new-model" value="__NEW__" className="font-bold text-blue-600">+ {t.newModel}</option>
                      ) : null}
                    </select>
                  </div>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      id="model-select"
                      ref={modelInputRef}
                      type="text"
                      placeholder={t.modelLabel}
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

            <div className={cn("grid grid-cols-1 gap-8", txType === 'REPAIR' && "md:grid-cols-2")}>
              {(txType === 'REPAIR' || txType === 'SALE') && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="from-class-select" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.fromClass}</label>
                    <span className={cn(
                      "text-[11px] font-bold px-2 py-0.5 rounded-full",
                      getStockCount(fromClass) <= 0 ? "text-red-600 bg-red-50" : "text-ios-blue bg-ios-blue/10"
                    )}>
                      {t.currentStock}: {getStockCount(fromClass)}
                    </span>
                  </div>
                  <select
                    id="from-class-select"
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
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label htmlFor="to-class-select" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">
                      {(txType === 'ADJUSTMENT' || txType === 'INCOMING') ? t.targetClass : t.toClass}
                    </label>
                    <span className="text-[11px] font-bold text-ios-blue bg-ios-blue/10 px-2 py-0.5 rounded-full">
                      {t.currentStock}: {getStockCount(toClass)}
                    </span>
                  </div>
                  <select
                    id="to-class-select"
                    value={toClass}
                    onChange={(e) => setToClass(e.target.value as LaptopClass)}
                    className={cn("ios-input w-full", txType === 'INCOMING' && "bg-gray-100 cursor-not-allowed")}
                    disabled={txType === 'INCOMING'}
                  >
                    {(txType === 'ADJUSTMENT' || txType === 'INCOMING' || txType === 'REPAIR') ? <option key="unclassified" value="UNCLASSIFIED">{t.unclassified}</option> : null}
                    {CLASSES.map((c, i) => <option key={`class-to-${c}-${i}`} value={c}>{c === 'Spoiled' ? t.spoiled : `${t.class} ${c}`}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label htmlFor="quantity-input" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">
                  {txType === 'ADJUSTMENT' ? t.newTotalCount : t.quantity}
                </label>
                <input
                  id="quantity-input"
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
                <label htmlFor="notes-input" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.notes}</label>
                <textarea
                  id="notes-input"
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
        t={t}
      />
    </div>
  );
});
