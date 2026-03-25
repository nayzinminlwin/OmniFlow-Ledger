import React, { useState, useMemo } from 'react';
import { Package, Plus, Minus, X } from 'lucide-react';
import { Stock, ComponentStock, ComponentType, LaptopClass, Batch } from '../types';
import { COMPONENTS } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useTransactionActions } from '../hooks/useTransactionActions';
import { cn } from '../lib/utils';
import { Language } from '../translations';
import { Toast } from './Toast';

interface UpdateComponentsProps {
  stock: Stock | null;
  componentStock: ComponentStock | null;
  batches: Batch[] | null;
  t: any;
  lang: Language;
  activeTab: string;
}

export const UpdateComponents: React.FC<UpdateComponentsProps> = ({
  stock,
  componentStock,
  batches,
  t,
  lang,
  activeTab
}) => {
  const { user } = useAuth(lang);
  const { recordComponentBreakdown, recordComponentPurchase, recordComponentInstallation, isSubmitting, error, setError, success, setSuccess } = useTransactionActions(user, stock, lang);
  const [mode, setMode] = useState<'extract' | 'buy' | 'install'>(() => (localStorage.getItem('comp_last_mode') as 'extract' | 'buy' | 'install') || 'extract');
  const [batchId, setBatchId] = useState(() => localStorage.getItem('comp_last_batchId') || '');
  const [brand, setBrand] = useState(() => localStorage.getItem('comp_last_brand') || '');
  const [series, setSeries] = useState(() => localStorage.getItem('comp_last_series') || '');
  const [model, setModel] = useState(() => localStorage.getItem('comp_last_model') || '');
  const [fromClass, setFromClass] = useState<LaptopClass | ''>('');
  const [laptopQuantity, setLaptopQuantity] = useState<number | ''>(1);
  const [componentChanges, setComponentChanges] = useState<Partial<Record<ComponentType, number | ''>>>({});
  const [selectedComponent, setSelectedComponent] = useState<ComponentType | ''>('');
  const [purchaseQuantity, setPurchaseQuantity] = useState<number | ''>(1);
  const [notes, setNotes] = useState('');
  const [isNewBrand, setIsNewBrand] = useState(() => localStorage.getItem('comp_last_isNewBrand') === 'true');
  const [isNewSeries, setIsNewSeries] = useState(() => localStorage.getItem('comp_last_isNewSeries') === 'true');
  const [isNewModel, setIsNewModel] = useState(() => localStorage.getItem('comp_last_isNewModel') === 'true');

  // Persist values to localStorage
  React.useEffect(() => {
    localStorage.setItem('comp_last_mode', mode);
    localStorage.setItem('comp_last_batchId', batchId);
    localStorage.setItem('comp_last_brand', brand);
    localStorage.setItem('comp_last_series', series);
    localStorage.setItem('comp_last_model', model);
    localStorage.setItem('comp_last_isNewBrand', String(isNewBrand));
    localStorage.setItem('comp_last_isNewSeries', String(isNewSeries));
    localStorage.setItem('comp_last_isNewModel', String(isNewModel));
  }, [mode, batchId, brand, series, model, isNewBrand, isNewSeries, isNewModel]);

  const activeBatches = useMemo(() => {
    if (!batches) return [];
    return batches.filter(b => b.active);
  }, [batches]);

  const selectedBatch = useMemo(() => {
    if (!batchId || !batches) return null;
    return batches.find(b => b.batchId === batchId);
  }, [batchId, batches]);

  const availableModels = useMemo(() => {
    if (!selectedBatch || !selectedBatch.items) return [];
    return selectedBatch.items.filter(item => {
      // Only include models that have stock in C1-C5 or Spoiled
      const hasEligibleStock = ['C1', 'C2', 'C3', 'C4', 'C5', 'Spoiled'].some(
        cls => (item.counts?.[cls as LaptopClass] || 0) > 0
      );
      return hasEligibleStock;
    });
  }, [selectedBatch]);

  const allExistingModels = useMemo(() => {
    const modelsMap = new Map<string, any>();
    
    // Add models from batches
    if (batches) {
      batches.forEach(b => {
        b.items?.forEach(item => {
          const key = `${item.brand}|${item.series}|${item.model}`;
          if (!modelsMap.has(key)) {
            modelsMap.set(key, item);
          }
        });
      });
    }

    // Add models from main stock
    if (stock?.items) {
      stock.items.forEach(item => {
        const key = `${item.brand}|${item.series}|${item.model}`;
        if (!modelsMap.has(key)) {
          modelsMap.set(key, item);
        }
      });
    }

    // Add models from component stock
    if (componentStock?.items) {
      componentStock.items.forEach(item => {
        const key = `${item.brand}|${item.series}|${item.model}`;
        if (!modelsMap.has(key)) {
          modelsMap.set(key, item);
        }
      });
    }

    return Array.from(modelsMap.values());
  }, [batches, stock, componentStock]);

  const brands = useMemo(() => {
    let source;
    if (mode === 'extract') {
      source = availableModels;
    } else if (mode === 'install') {
      source = (componentStock?.items || []).filter(m => 
        Object.values(m.counts).some(count => (count as number) > 0)
      );
    } else {
      source = allExistingModels;
    }
    return Array.from(new Set(source.map(m => m.brand))).sort();
  }, [mode, availableModels, allExistingModels, componentStock]);

  const seriesList = useMemo(() => {
    if (!brand || isNewBrand) return [];
    let source;
    if (mode === 'extract') {
      source = availableModels;
    } else if (mode === 'install') {
      source = (componentStock?.items || []).filter(m => 
        Object.values(m.counts).some(count => (count as number) > 0)
      );
    } else {
      source = allExistingModels;
    }
    return Array.from(new Set(source.filter(m => m.brand === brand).map(m => m.series))).sort();
  }, [mode, brand, isNewBrand, availableModels, allExistingModels, componentStock]);

  const modelList = useMemo(() => {
    if (!brand || isNewBrand || !series || isNewSeries) return [];
    let source;
    if (mode === 'extract') {
      source = availableModels;
    } else if (mode === 'install') {
      source = (componentStock?.items || []).filter(m => 
        Object.values(m.counts).some(count => (count as number) > 0)
      );
    } else {
      source = allExistingModels;
    }
    return Array.from(new Set(source.filter(m => m.brand === brand && m.series === series).map(m => m.model))).sort();
  }, [mode, brand, series, isNewBrand, isNewSeries, availableModels, allExistingModels, componentStock]);

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
    setFromClass('');
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
    setFromClass('');
  };

  const handleModelChange = (val: string) => {
    if (val === '__NEW__') {
      setIsNewModel(true);
      setModel('');
    } else {
      setIsNewModel(false);
      setModel(val);
    }
    setFromClass('');
  };

  const eligibleClasses = ['C1', 'C2', 'C3', 'C4', 'C5', 'Spoiled'];

  const selectedModelStock = useMemo(() => {
    if (!brand || !series || !model || !selectedBatch) return null;
    return selectedBatch.items.find(m => m.brand === brand && m.series === series && m.model === model);
  }, [brand, series, model, selectedBatch]);

  const selectedComponentModelStock = useMemo(() => {
    if (!brand || !series || !model || !componentStock) return null;
    return componentStock.items.find(m => m.brand === brand && m.series === series && m.model === model);
  }, [brand, series, model, componentStock]);

  const availableComponentCount = useMemo(() => {
    if (!selectedComponentModelStock || !selectedComponent) return 0;
    return selectedComponentModelStock.counts[selectedComponent as ComponentType] || 0;
  }, [selectedComponentModelStock, selectedComponent]);

  const maxLaptopQuantity = useMemo(() => {
    if (!selectedModelStock || !fromClass) return 0;
    return selectedModelStock.counts?.[fromClass as LaptopClass] || 0;
  }, [selectedModelStock, fromClass]);

  const handleComponentChange = (component: ComponentType, val: number | '') => {
    const finalVal = val === '' ? '' : Math.min(val, Number(laptopQuantity));
    setComponentChanges(prev => ({
      ...prev,
      [component]: finalVal
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'extract') {
      const hasValidComponents = Object.values(componentChanges).some(v => Number(v) > 0);
      if (!batchId || !brand || !series || !model || !fromClass || Number(laptopQuantity) <= 0 || !hasValidComponents) {
        setError('Please fill all required fields and add at least one component with quantity > 0.');
        return;
      }

      if (Number(laptopQuantity) > maxLaptopQuantity) {
        setError(`Cannot break down more than ${maxLaptopQuantity} laptops from ${fromClass}.`);
        return;
      }

      // Double check component quantities before submit
      const invalidComponents = Object.entries(componentChanges).filter(([_, qty]) => Number(qty) > Number(laptopQuantity));
      if (invalidComponents.length > 0) {
        setError(`Component quantity cannot exceed laptop quantity (${laptopQuantity}).`);
        return;
      }

      try {
        const cleanComponentChanges: Partial<Record<ComponentType, number>> = {};
        Object.entries(componentChanges).forEach(([k, v]) => {
          if (Number(v) > 0) cleanComponentChanges[k as ComponentType] = Number(v);
        });

        await recordComponentBreakdown({
          batchId,
          brand,
          series,
          model,
          fromClass: fromClass as LaptopClass,
          laptopQuantity: Number(laptopQuantity),
          componentChanges: cleanComponentChanges,
          notes
        });
        
        // Reset form
        setBatchId('');
        setBrand('');
        setSeries('');
        setModel('');
        setFromClass('');
        setLaptopQuantity(1);
        setComponentChanges({});
        setNotes('');
        setIsNewBrand(false);
        setIsNewSeries(false);
        setIsNewModel(false);
      } catch (error) {
        console.error('Error recording breakdown:', error);
      }
    } else {
      // Buy or Install mode
      if (!brand || !series || !model || !selectedComponent || Number(purchaseQuantity) <= 0) {
        setError('Please fill all required fields.');
        return;
      }

      try {
        if (mode === 'buy') {
          await recordComponentPurchase({
            brand,
            series,
            model,
            componentChanges: { [selectedComponent as ComponentType]: Number(purchaseQuantity) },
            notes
          });
        } else {
          await recordComponentInstallation({
            brand,
            series,
            model,
            componentChanges: { [selectedComponent as ComponentType]: Number(purchaseQuantity) },
            notes
          });
        }
        
        // Reset form
        setBrand('');
        setSeries('');
        setModel('');
        setSelectedComponent('');
        setPurchaseQuantity(1);
        setNotes('');
        setIsNewBrand(false);
        setIsNewSeries(false);
        setIsNewModel(false);
      } catch (error) {
        console.error(`Error recording ${mode}:`, error);
      }
    }
  };

  if (activeTab !== 'components') return null;

  return (
    <div className="lg:col-span-12 space-y-8 animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto w-full">
        <div className="glass-panel rounded-[32px] overflow-hidden">
          <div className="px-8 py-6 border-b border-black/5 bg-black/[0.02] flex items-center justify-between">
            <div>
              <h2 className="text-[22px] font-bold text-black tracking-tight">{t.updateComponents}</h2>
              <p className="text-[15px] text-gray-500 mt-1">
                {mode === 'extract' ? t.breakdown : mode === 'buy' ? t.buyComponents : t.installComponents}
              </p>
            </div>
            <div className="flex bg-black/5 p-1 rounded-xl">
              <button
                onClick={() => {
                  setMode('extract');
                  setBrand('');
                  setSeries('');
                  setModel('');
                  setNotes('');
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-[13px] font-bold transition-all",
                  mode === 'extract' ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {t.extractFromLaptop}
              </button>
              <button
                onClick={() => {
                  setMode('buy');
                  setBrand('');
                  setSeries('');
                  setModel('');
                  setNotes('');
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-[13px] font-bold transition-all",
                  mode === 'buy' ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {t.buy}
              </button>
              <button
                onClick={() => {
                  setMode('install');
                  setBrand('');
                  setSeries('');
                  setModel('');
                  setNotes('');
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-[13px] font-bold transition-all",
                  mode === 'install' ? "bg-white text-black shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {t.install}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {mode === 'extract' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.batch}</label>
                  <select
                    value={batchId}
                    onChange={(e) => {
                      setBatchId(e.target.value);
                      setBrand('');
                      setSeries('');
                      setModel('');
                      setFromClass('');
                    }}
                    className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    required
                  >
                    <option value="">Select Batch</option>
                    {activeBatches.map(b => <option key={b.batchId} value={b.batchId}>{b.batchId}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.brandLabel}</label>
                {!isNewBrand ? (
                  <select
                    value={brand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    disabled={mode === 'extract' && !batchId}
                    className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:opacity-50"
                    required
                  >
                    <option value="">{t.selectExisting}</option>
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                    {mode !== 'install' && (
                      <option value="__NEW__" className="font-bold text-blue-600">+ {t.newBrand}</option>
                    )}
                  </select>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={t.newBrand}
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none pr-10"
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
                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.seriesLabel}</label>
                {!isNewSeries ? (
                  <select
                    value={series}
                    onChange={(e) => handleSeriesChange(e.target.value)}
                    disabled={!brand && !isNewBrand}
                    className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:opacity-50"
                    required
                  >
                    <option value="">{t.selectExisting}</option>
                    {seriesList.map(s => <option key={s} value={s}>{s}</option>)}
                    {mode !== 'install' && (
                      <option value="__NEW__" className="font-bold text-blue-600">+ {t.newSeries}</option>
                    )}
                  </select>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={t.newSeries}
                      value={series}
                      onChange={(e) => setSeries(e.target.value)}
                      className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none pr-10"
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
                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.modelLabel}</label>
                {!isNewModel ? (
                  <select
                    value={model}
                    onChange={(e) => handleModelChange(e.target.value)}
                    disabled={(!series && !isNewSeries) || (!brand && !isNewBrand)}
                    className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:opacity-50"
                    required
                  >
                    <option value="">{t.selectExisting}</option>
                    {modelList.map(m => <option key={m} value={m}>{m}</option>)}
                    {mode !== 'install' && (
                      <option value="__NEW__" className="font-bold text-blue-600">+ {t.newModel}</option>
                    )}
                  </select>
                ) : (
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      placeholder={t.newModel}
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none pr-10"
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

            {mode === 'extract' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.fromClass}</label>
                      {fromClass && (
                        <span className={cn(
                          "text-[11px] font-bold px-2 py-0.5 rounded-full",
                          (selectedModelStock?.counts?.[fromClass as LaptopClass] || 0) <= 0 ? "text-red-600 bg-red-50" : "text-ios-blue bg-ios-blue/10"
                        )}>
                          {t.currentStock}: {selectedModelStock?.counts?.[fromClass as LaptopClass] || 0}
                        </span>
                      )}
                    </div>
                    <select
                      value={fromClass}
                      onChange={(e) => setFromClass(e.target.value as LaptopClass)}
                      disabled={!model}
                      className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:opacity-50"
                      required
                    >
                      <option value="">Select Class</option>
                      {eligibleClasses.map(cls => {
                        const count = selectedModelStock?.counts?.[cls as LaptopClass] || 0;
                        if (count === 0) return null;
                        return (
                          <option key={cls} value={cls}>
                            {cls === 'Spoiled' ? t.spoiled : cls}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.laptopQuantity}</label>
                    <input
                      type="number"
                      value={laptopQuantity}
                      onKeyDown={(e) => {
                        if (['-', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        const numVal = val === '' ? '' : parseInt(val);
                        setLaptopQuantity(numVal);
                        
                        if (numVal !== '') {
                          // Cap all component quantities to the new laptop quantity
                          setComponentChanges(prev => {
                            const next = { ...prev };
                            Object.keys(next).forEach(key => {
                              const comp = key as ComponentType;
                              if (Number(next[comp]) > numVal) {
                                next[comp] = numVal;
                              }
                            });
                            return next;
                          });
                        }
                      }}
                      disabled={!fromClass}
                      className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:opacity-50"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.componentChanges}</label>
                  <div className="bg-black/[0.02] rounded-2xl p-6 space-y-4 border border-black/5">
                    {COMPONENTS.map(comp => (
                      <div key={comp} className="flex items-center justify-between gap-4">
                        <span className="text-[15px] font-medium text-gray-700 w-1/3">{t[comp] || comp}</span>
                        <div className="flex items-center gap-3 w-2/3">
                          <button
                            type="button"
                            onClick={() => handleComponentChange(comp, (componentChanges[comp] || 0) - 1)}
                            disabled={!componentChanges[comp]}
                            className="p-2 rounded-lg bg-white border border-black/10 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            type="number"
                            value={componentChanges[comp] ?? ''}
                            onKeyDown={(e) => {
                              if (['-', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleComponentChange(comp, val === '' ? '' : parseInt(val));
                            }}
                            className="w-20 px-3 py-2 text-center bg-white border border-black/10 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={() => handleComponentChange(comp, (componentChanges[comp] || 0) + 1)}
                            disabled={(componentChanges[comp] || 0) >= laptopQuantity}
                            className="p-2 rounded-lg bg-white border border-black/10 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.components}</label>
                    {mode === 'install' && selectedComponent && (
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full",
                        availableComponentCount <= 0 ? "text-red-600 bg-red-50" : "text-ios-blue bg-ios-blue/10"
                      )}>
                        {t.currentStock}: {availableComponentCount}
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedComponent}
                    onChange={(e) => setSelectedComponent(e.target.value as ComponentType)}
                    className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    required
                  >
                    <option value="">{t.selectComponent}</option>
                    {COMPONENTS.map(comp => {
                      if (mode === 'install' && selectedComponentModelStock) {
                        const count = selectedComponentModelStock.counts[comp as ComponentType] || 0;
                        if (count <= 0) return null;
                      }
                      return (
                        <option key={comp} value={comp}>{t[comp] || comp}</option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.quantity}</label>
                  <input
                    type="number"
                    value={purchaseQuantity}
                    onKeyDown={(e) => {
                      if (['-', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      let numVal = val === '' ? '' : parseInt(val);
                      if (mode === 'install' && typeof numVal === 'number' && numVal > availableComponentCount) {
                        numVal = availableComponentCount;
                      }
                      setPurchaseQuantity(numVal);
                    }}
                    min="1"
                    max={mode === 'install' ? availableComponentCount : undefined}
                    className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.notes}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none h-24"
                placeholder={
                  mode === 'extract' 
                    ? t.breakdownNotes(laptopQuantity, fromClass) 
                    : mode === 'buy' 
                      ? t.purchase 
                      : t.install
                }
              />
            </div>

            <div className="pt-4 border-t border-black/5 flex justify-end">
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  (mode === 'extract' 
                    ? (!brand || !series || !model || !fromClass || Number(laptopQuantity) <= 0 || !Object.values(componentChanges).some(v => Number(v) > 0)) 
                    : (!brand || !series || !model || !selectedComponent || Number(purchaseQuantity) <= 0 || (mode === 'install' && Number(purchaseQuantity) > availableComponentCount))
                  )
                }
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-[15px] hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-sm"
              >
                <Package className="w-5 h-5" />
                {isSubmitting ? t.processing : t.recordEntry}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Toast 
        message={error} 
        type="error" 
        onClose={() => setError(null)} 
      />
      <Toast 
        message={success} 
        type="success" 
        onClose={() => setSuccess(null)} 
      />
    </div>
  );
};
