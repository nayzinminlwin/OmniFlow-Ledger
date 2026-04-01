import React, { memo, useMemo } from 'react';
import { RefreshCw, CheckCircle2, X, Plus, Minus } from 'lucide-react';
import { Stock, ComponentStock, ComponentType, LaptopClass, Batch } from '../types';
import { COMPONENTS } from '../constants';
import { cn } from '../lib/utils';
import { Language } from '../translations';
import { Toast } from './Toast';
import { useUpdateComponentsForm } from '../hooks/useUpdateComponentsForm';
import { formatBatchId } from '../lib/dateUtils';

interface UpdateComponentsProps {
  stock: Stock | null;
  componentStock: ComponentStock | null;
  batches: Batch[] | null;
  t: any;
  lang: Language;
  activeTab: string;
  isAdmin?: boolean;
}

export const UpdateComponents: React.FC<UpdateComponentsProps> = memo(({
  stock,
  componentStock,
  batches,
  t,
  lang,
  activeTab,
  isAdmin,
}) => {
  const {
    mode,
    batchId,
    setBatchId,
    brand,
    setBrand,
    series,
    setSeries,
    model,
    setModel,
    fromClass,
    setFromClass,
    laptopQuantity,
    setLaptopQuantity,
    componentChanges,
    setComponentChanges,
    selectedComponent,
    setSelectedComponent,
    purchaseQuantity,
    setPurchaseQuantity,
    notes,
    setNotes,
    isNewBrand,
    isNewSeries,
    isNewModel,
    isNewBatch,
    batchInputRef,
    brandInputRef,
    seriesInputRef,
    modelInputRef,
    activeBatches,
    selectedBatch,
    availableModels,
    brands,
    seriesList,
    modelList,
    selectedModelStock,
    availableComponentCount,
    isSubmitting,
    error,
    setError,
    success,
    setSuccess,
    handleBrandChange,
    handleSeriesChange,
    handleModelChange,
    handleModeChange,
    handleSubmit,
    handleBatchIdChange,
    handleBatchIdBlur
  } = useUpdateComponentsForm({
    stock,
    componentStock,
    batches,
    lang,
    t
  });

  const eligibleClasses: LaptopClass[] = ['C1', 'C2', 'C3', 'C4', 'C5', 'D', 'Spoiled', 'UNCLASSIFIED'];

  const handleComponentQuantityChange = (comp: ComponentType, qty: number) => {
    setComponentChanges(prev => ({
      ...prev,
      [comp]: qty
    }));
  };

  const maxLaptopQuantity = useMemo(() => {
    if (!selectedModelStock) return 0;
    if (mode === 'extract') {
      return (fromClass && selectedModelStock.counts) ? (selectedModelStock.counts[fromClass as LaptopClass] || 0) : 0;
    }
    return 0;
  }, [selectedModelStock, mode, fromClass]);

  if (!isAdmin) {
    return (
      <div className={cn(
        "lg:col-span-12 animate-in slide-in-from-bottom duration-500",
        activeTab === 'components' ? "block" : "hidden"
      )}>
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel rounded-[32px] p-10 text-center">
            <h2 className="text-[32px] font-bold text-black mb-6 tracking-tight leading-none">{t.updateComponents}</h2>
            <p className="text-gray-500 text-[17px]">{t.accessRestricted}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "lg:col-span-12 animate-in slide-in-from-bottom duration-500",
      activeTab === 'components' ? "block" : "hidden"
    )}>
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel rounded-[32px] p-10">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <h2 className="text-[32px] font-bold text-black tracking-tight leading-none">{t.updateInventory}</h2>
            <div className="flex bg-black/5 p-1 rounded-[16px] w-full md:w-auto">
              <button
                onClick={() => handleModeChange('extract')}
                className={cn(
                  "flex-1 md:flex-none py-3 px-6 rounded-xl text-[13px] font-bold transition-all",
                  mode === 'extract' ? "bg-white text-black shadow-md" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {t.extractFromLaptop}
              </button>
              <button
                onClick={() => handleModeChange('buy')}
                className={cn(
                  "flex-1 md:flex-none py-3 px-6 rounded-xl text-[13px] font-bold transition-all",
                  mode === 'buy' ? "bg-white text-black shadow-md" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {t.buyComponents}
              </button>
              <button
                onClick={() => handleModeChange('install')}
                className={cn(
                  "flex-1 md:flex-none py-3 px-6 rounded-xl text-[13px] font-bold transition-all",
                  mode === 'install' ? "bg-white text-black shadow-md" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {t.installComponents}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-8">
              {mode === 'extract' && (
                <div className="space-y-3">
                  <label htmlFor="update-batch-select" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.batchId}</label>
                  {!isNewBatch ? (
                    <div className="relative">
                      <select
                        id="update-batch-select"
                        value={batchId}
                        onChange={(e) => handleBatchIdChange(e.target.value)}
                        className="ios-input w-full pr-10"
                        required
                      >
                        <option value="" disabled>{t.selectBatch}</option>
                        {activeBatches.map((b, i) => (
                          <option key={`update-batch-${b.batchId}-${i}`} value={b.batchId}>{b.batchId}</option>
                        ))}
                        {mode === 'buy' && <option value="__NEW__" className="font-bold text-blue-600">+ {t.newBatch || 'New Batch'}</option>}
                      </select>
                    </div>
                  ) : (
                    <div className="relative flex items-center">
                      <input
                        id="update-batch-input"
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
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label htmlFor="update-brand-select" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.brandLabel}</label>
                  {!isNewBrand ? (
                    <select
                      id="update-brand-select"
                      value={brand}
                      onChange={(e) => handleBrandChange(e.target.value)}
                      className="ios-input w-full"
                      required
                    >
                      <option value="" disabled>{t.selectBrand}</option>
                      {brands.map((b, i) => <option key={`update-brand-${b}-${i}`} value={b}>{b}</option>)}
                      {mode === 'buy' && <option value="__NEW__" className="font-bold text-blue-600">+ {t.newBrand}</option>}
                    </select>
                  ) : (
                    <div className="relative flex items-center">
                      <input
                        id="update-brand-input"
                        ref={brandInputRef}
                        type="text"
                        placeholder={t.newBrand}
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="ios-input w-full pr-10"
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

                <div className="space-y-3">
                  <label htmlFor="update-series-select" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.seriesLabel}</label>
                  {!isNewSeries ? (
                    <select
                      id="update-series-select"
                      value={series}
                      onChange={(e) => handleSeriesChange(e.target.value)}
                      className="ios-input w-full"
                      disabled={!brand && !isNewBrand}
                      required
                    >
                      <option value="" disabled>{t.selectSeries}</option>
                      {seriesList.map((s, i) => <option key={`update-series-${s}-${i}`} value={s}>{s}</option>)}
                      {mode === 'buy' && <option value="__NEW__" className="font-bold text-blue-600">+ {t.newSeries}</option>}
                    </select>
                  ) : (
                    <div className="relative flex items-center">
                      <input
                        id="update-series-input"
                        ref={seriesInputRef}
                        type="text"
                        placeholder={t.newSeries}
                        value={series}
                        onChange={(e) => setSeries(e.target.value)}
                        className="ios-input w-full pr-10"
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

                <div className="space-y-3">
                  <label htmlFor="update-model-select" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.modelLabel}</label>
                  {!isNewModel ? (
                    <select
                      id="update-model-select"
                      value={model}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="ios-input w-full"
                      disabled={(!series && !isNewSeries) || (!brand && !isNewBrand)}
                      required
                    >
                      <option value="" disabled>{t.selectModel}</option>
                      {modelList.map((m, i) => <option key={`update-model-${m}-${i}`} value={m}>{m}</option>)}
                      {mode === 'buy' && <option value="__NEW__" className="font-bold text-blue-600">+ {t.newModel}</option>}
                    </select>
                  ) : (
                    <div className="relative flex items-center">
                      <input
                        id="update-model-input"
                        ref={modelInputRef}
                        type="text"
                        placeholder={t.newModel}
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        className="ios-input w-full pr-10"
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
            </div>

            {mode === 'extract' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label htmlFor="from-class-select" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.fromClass}</label>
                      {selectedModelStock && (
                        <span className={cn(
                          "text-[11px] font-bold px-2 py-0.5 rounded-full",
                          maxLaptopQuantity <= 0 ? "text-red-600 bg-red-50" : "text-ios-blue bg-ios-blue/10"
                        )}>
                          {t.availableLaptops}: {maxLaptopQuantity}
                        </span>
                      )}
                    </div>
                    <select
                      id="from-class-select"
                      value={fromClass}
                      onChange={(e) => setFromClass(e.target.value as LaptopClass)}
                      className="ios-input w-full"
                      required
                    >
                      <option value="" disabled>{t.selectClass}</option>
                      {eligibleClasses.map((c, i) => <option key={`class-opt-${c}-${i}`} value={c}>{c === 'Spoiled' ? t.spoiled : `${t.class} ${c}`}</option>)}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="extract-laptop-quantity" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.laptopQuantity}</label>
                    <input
                      id="extract-laptop-quantity"
                      type="number"
                      value={laptopQuantity}
                      onChange={(e) => setLaptopQuantity(Math.min(maxLaptopQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="ios-input w-full"
                      required
                    />
                  </div>
                </div>

                <fieldset className="space-y-4 border-none p-0 m-0">
                  <legend className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4">COMPONENT CHANGES</legend>
                  <div className="bg-[#F8F8F8] rounded-[24px] p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {COMPONENTS.map((comp) => (
                      <div key={`comp-${comp}`} className="flex items-center justify-between">
                        <span className="text-[13px] font-semibold text-gray-600">{t[comp.toLowerCase() as keyof typeof t] || comp}</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            aria-label={`Decrease ${t[comp.toLowerCase() as keyof typeof t] || comp} quantity`}
                            onClick={() => handleComponentQuantityChange(comp as ComponentType, Math.max(0, (componentChanges[comp as ComponentType] ?? laptopQuantity) - 1))}
                            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-500" />
                          </button>
                          <input
                            type="number"
                            aria-label={`${t[comp.toLowerCase() as keyof typeof t] || comp} quantity`}
                            value={componentChanges[comp as ComponentType] ?? laptopQuantity}
                            onChange={(e) => handleComponentQuantityChange(comp as ComponentType, Math.max(0, Math.min(laptopQuantity, parseInt(e.target.value) || 0)))}
                            className="w-16 text-center bg-white border border-gray-200 rounded-lg py-1 text-[13px] font-bold"
                          />
                          <button
                            type="button"
                            aria-label={`Increase ${t[comp.toLowerCase() as keyof typeof t] || comp} quantity`}
                            onClick={() => handleComponentQuantityChange(comp as ComponentType, Math.min(laptopQuantity, (componentChanges[comp as ComponentType] ?? laptopQuantity) + 1))}
                            className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}

            {mode === 'buy' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label htmlFor="buy-component-select" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.componentLabel}</label>
                      {selectedComponent && (
                        <span className={cn(
                          "text-[11px] font-bold px-2 py-0.5 rounded-full",
                          availableComponentCount <= 0 ? "text-red-600 bg-red-50" : "text-ios-blue bg-ios-blue/10"
                        )}>
                          {t.availableStock}: {availableComponentCount}
                        </span>
                      )}
                    </div>
                    <select
                      id="buy-component-select"
                      value={selectedComponent}
                      onChange={(e) => setSelectedComponent(e.target.value as ComponentType)}
                      className="ios-input w-full"
                      required
                    >
                      <option value="" disabled>{t.selectComponent}</option>
                      {COMPONENTS.map((comp) => (
                        <option key={`buy-comp-${comp}`} value={comp}>{t[comp.toLowerCase() as keyof typeof t] || comp}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="buy-quantity-input" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.quantity}</label>
                    <input
                      id="buy-quantity-input"
                      type="number"
                      value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="ios-input w-full"
                      required
                    />
                  </div>
                </div>
              </div>
            )}



            {mode === 'install' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label htmlFor="install-component-select" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.componentLabel}</label>
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full",
                        availableComponentCount <= 0 ? "text-red-600 bg-red-50" : "text-ios-blue bg-ios-blue/10"
                      )}>
                        {t.availableStock}: {availableComponentCount}
                      </span>
                    </div>
                    <select
                      id="install-component-select"
                      value={selectedComponent}
                      onChange={(e) => setSelectedComponent(e.target.value as ComponentType)}
                      className="ios-input w-full"
                      required
                    >
                      <option value="" disabled>{t.selectComponent}</option>
                      {COMPONENTS.map((comp) => (
                        <option key={`install-comp-${comp}`} value={comp}>{t[comp.toLowerCase() as keyof typeof t] || comp}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label htmlFor="install-quantity-input" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.quantity}</label>
                    <input
                      id="install-quantity-input"
                      type="number"
                      value={purchaseQuantity}
                      onChange={(e) => setPurchaseQuantity(Math.min(availableComponentCount, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="ios-input w-full"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label htmlFor="update-notes-input" className="block text-[13px] font-bold text-gray-400 uppercase tracking-widest">{t.notes}</label>
              <textarea
                id="update-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="ios-input w-full min-h-[100px] py-4 resize-none"
                placeholder={t.optionalNotes}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (mode === 'extract' && maxLaptopQuantity <= 0) || (mode === 'extract' && COMPONENTS.every(comp => (componentChanges[comp] ?? laptopQuantity) === 0)) || (mode === 'install' && availableComponentCount <= 0)}
              className={cn(
                "ios-button w-full py-5 text-[19px] mt-4",
                (isSubmitting || (mode === 'extract' && maxLaptopQuantity <= 0) || (mode === 'extract' && COMPONENTS.every(comp => (componentChanges[comp] ?? laptopQuantity) === 0)) || (mode === 'install' && availableComponentCount <= 0)) && "opacity-50 cursor-not-allowed bg-gray-400"
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
      <Toast 
        message={success} 
        type="success" 
        onClose={() => setSuccess(null)} 
        t={t}
      />
    </div>
  );
});
