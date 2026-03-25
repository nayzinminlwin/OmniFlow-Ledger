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
  const { recordComponentBreakdown, isSubmitting, error, setError, success, setSuccess } = useTransactionActions(user, stock, lang);
  const [batchId, setBatchId] = useState('');
  const [brand, setBrand] = useState('');
  const [series, setSeries] = useState('');
  const [model, setModel] = useState('');
  const [fromClass, setFromClass] = useState<LaptopClass | ''>('');
  const [laptopQuantity, setLaptopQuantity] = useState<number>(1);
  const [componentChanges, setComponentChanges] = useState<Partial<Record<ComponentType, number>>>({});
  const [notes, setNotes] = useState('');

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

  const brands = useMemo(() => Array.from(new Set(availableModels.map(m => m.brand))), [availableModels]);
  const seriesList = useMemo(() => Array.from(new Set(availableModels.filter(m => m.brand === brand).map(m => m.series))), [availableModels, brand]);
  const modelList = useMemo(() => Array.from(new Set(availableModels.filter(m => m.brand === brand && m.series === series).map(m => m.model))), [availableModels, brand, series]);

  const eligibleClasses = ['C1', 'C2', 'C3', 'C4', 'C5', 'Spoiled'];

  const selectedModelStock = useMemo(() => {
    if (!brand || !series || !model || !selectedBatch) return null;
    return selectedBatch.items.find(m => m.brand === brand && m.series === series && m.model === model);
  }, [brand, series, model, selectedBatch]);

  const maxLaptopQuantity = useMemo(() => {
    if (!selectedModelStock || !fromClass) return 0;
    return selectedModelStock.counts?.[fromClass as LaptopClass] || 0;
  }, [selectedModelStock, fromClass]);

  const handleComponentChange = (component: ComponentType, quantity: number) => {
    // Enforce that component quantity cannot exceed laptop quantity
    const finalQuantity = Math.min(quantity, laptopQuantity);
    
    setComponentChanges(prev => {
      const newChanges = { ...prev };
      if (finalQuantity <= 0) {
        delete newChanges[component];
      } else {
        newChanges[component] = finalQuantity;
      }
      return newChanges;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !brand || !series || !model || !fromClass || laptopQuantity <= 0 || Object.keys(componentChanges).length === 0) {
      setError('Please fill all required fields and add at least one component.');
      return;
    }

    if (laptopQuantity > maxLaptopQuantity) {
      setError(`Cannot break down more than ${maxLaptopQuantity} laptops from ${fromClass}.`);
      return;
    }

    // Double check component quantities before submit
    const invalidComponents = Object.entries(componentChanges).filter(([_, qty]) => (qty || 0) > laptopQuantity);
    if (invalidComponents.length > 0) {
      setError(`Component quantity cannot exceed laptop quantity (${laptopQuantity}).`);
      return;
    }

    try {
      await recordComponentBreakdown({
        batchId,
        brand,
        series,
        model,
        fromClass: fromClass as LaptopClass,
        laptopQuantity,
        componentChanges,
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
    } catch (error) {
      console.error('Error recording breakdown:', error);
    }
  };

  if (activeTab !== 'components') return null;

  return (
    <div className="lg:col-span-12 space-y-8 animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto w-full">
        <div className="glass-panel rounded-[32px] overflow-hidden">
          <div className="px-8 py-6 border-b border-black/5 bg-black/[0.02]">
            <h2 className="text-[22px] font-bold text-black tracking-tight">{t.updateComponents}</h2>
            <p className="text-[15px] text-gray-500 mt-1">{t.breakdown}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.brandLabel}</label>
                <select
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value);
                    setSeries('');
                    setModel('');
                    setFromClass('');
                  }}
                  disabled={!batchId}
                  className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:opacity-50"
                  required
                >
                  <option value="">Select Brand</option>
                  {brands.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.seriesLabel}</label>
                <select
                  value={series}
                  onChange={(e) => {
                    setSeries(e.target.value);
                    setModel('');
                    setFromClass('');
                  }}
                  disabled={!brand}
                  className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:opacity-50"
                  required
                >
                  <option value="">Select Series</option>
                  {seriesList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.modelLabel}</label>
                <select
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setFromClass('');
                  }}
                  disabled={!series}
                  className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:opacity-50"
                  required
                >
                  <option value="">Select Model</option>
                  {modelList.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

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
                  min="1"
                  max={maxLaptopQuantity || 1}
                  value={laptopQuantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setLaptopQuantity(val);
                    // Cap all component quantities to the new laptop quantity
                    setComponentChanges(prev => {
                      const next = { ...prev };
                      Object.keys(next).forEach(key => {
                        const comp = key as ComponentType;
                        if ((next[comp] || 0) > val) {
                          next[comp] = val;
                        }
                      });
                      return next;
                    });
                  }}
                  disabled={!fromClass}
                  className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none disabled:opacity-50"
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
                        min="0"
                        max={laptopQuantity}
                        value={componentChanges[comp] || 0}
                        onChange={(e) => handleComponentChange(comp, parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-2 text-center bg-white border border-black/10 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
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

            <div className="space-y-2">
              <label className="text-[13px] font-semibold text-gray-700 uppercase tracking-wider">{t.notes}</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 bg-black/[0.03] border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none resize-none h-24"
                placeholder={t.breakdownNotes(laptopQuantity, fromClass)}
              />
            </div>

            <div className="pt-4 border-t border-black/5 flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !brand || !series || !model || !fromClass || Object.keys(componentChanges).length === 0}
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
