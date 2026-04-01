import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Batch, ComponentStock, LaptopClass, Stock, ComponentType } from '../types';
import { COMPONENTS } from '../constants';
import { useAuth } from './useAuth';
import { useTransactionActions } from './useTransactionActions';
import { Language } from '../translations';
import { padBatchId } from '../lib/dateUtils';

interface UseUpdateComponentsFormProps {
  stock: Stock | null;
  componentStock: ComponentStock | null;
  batches: Batch[] | null;
  lang: Language;
  t: any;
}

export function useUpdateComponentsForm({
  stock,
  componentStock,
  batches,
  lang,
  t
}: UseUpdateComponentsFormProps) {
  const { user } = useAuth(lang);
  const { 
    recordComponentBreakdown, 
    recordComponentPurchase, 
    recordComponentInstallation, 
    isSubmitting, 
    error, 
    setError, 
    success, 
    setSuccess 
  } = useTransactionActions(user, lang);

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
  useEffect(() => {
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
      return Object.values(item.counts || {}).some(count => (count as number) > 0);
    });
  }, [selectedBatch]);

  const allExistingModels = useMemo(() => {
    const modelsMap = new Map<string, any>();
    if (batches) {
      batches.forEach(b => {
        b.items?.forEach(item => {
          const key = `${item.brand}|${item.series}|${item.model}`;
          if (!modelsMap.has(key)) modelsMap.set(key, item);
        });
      });
    }
    if (stock?.items) {
      stock.items.forEach(item => {
        const key = `${item.brand}|${item.series}|${item.model}`;
        if (!modelsMap.has(key)) modelsMap.set(key, item);
      });
    }
    if (componentStock?.items) {
      componentStock.items.forEach(item => {
        const key = `${item.brand}|${item.series}|${item.model}`;
        if (!modelsMap.has(key)) modelsMap.set(key, item);
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
        m.counts && Object.values(m.counts).some(count => (count as number) > 0)
      );
    } else {
      source = allExistingModels;
    }
    return Array.from(new Set(source.map(m => m.brand).filter(Boolean))).sort() as string[];
  }, [mode, availableModels, allExistingModels, componentStock]);

  const seriesList = useMemo(() => {
    if (!brand || isNewBrand) return [];
    let source;
    if (mode === 'extract') {
      source = availableModels;
    } else if (mode === 'install') {
      source = (componentStock?.items || []).filter(m => 
        m.counts && Object.values(m.counts).some(count => (count as number) > 0)
      );
    } else {
      source = allExistingModels;
    }
    return Array.from(new Set(source.filter(m => m.brand === brand).map(m => m.series).filter(Boolean))).sort() as string[];
  }, [mode, brand, isNewBrand, availableModels, allExistingModels, componentStock]);

  const modelList = useMemo(() => {
    if (!brand || isNewBrand || !series || isNewSeries) return [];
    let source;
    if (mode === 'extract') {
      source = availableModels;
    } else if (mode === 'install') {
      source = (componentStock?.items || []).filter(m => 
        m.counts && Object.values(m.counts).some(count => (count as number) > 0)
      );
    } else {
      source = allExistingModels;
    }
    return Array.from(new Set(source.filter(m => m.brand === brand && m.series === series).map(m => m.model).filter(Boolean))).sort() as string[];
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
    return selectedComponentModelStock?.counts?.[selectedComponent as ComponentType] || 0;
  }, [selectedComponentModelStock, selectedComponent]);

  useEffect(() => {
    if (!batchId && activeBatches.length > 0 && !isNewBatch) {
      setBatchId(activeBatches[0].batchId);
    }
  }, [activeBatches, batchId, isNewBatch]);

  useEffect(() => {
    if (brands.length > 0) {
      if (!brand) {
        setBrand(brands[0]);
        setIsNewBrand(false);
      }
    } else if (mode === 'buy' && brands.length === 0 && !isNewBrand) {
      setIsNewBrand(true);
      setBrand('');
      setIsNewSeries(true);
      setSeries('');
      setIsNewModel(true);
      setModel('');
    }
  }, [brands, brand, isNewBrand, mode]);

  useEffect(() => {
    if (seriesList.length > 0 && !series) {
      setSeries(seriesList[0]);
      setIsNewSeries(false);
    }
  }, [seriesList, series]);

  useEffect(() => {
    if (modelList.length > 0 && !model) {
      setModel(modelList[0]);
      setIsNewModel(false);
    }
  }, [modelList, model]);

  useEffect(() => {
    if (brands.length > 0 && isNewBrand && brand && brands.includes(brand)) {
      setIsNewBrand(false);
    }
  }, [brands, isNewBrand, brand]);

  useEffect(() => {
    if (seriesList.length > 0 && isNewSeries && series && seriesList.includes(series)) {
      setIsNewSeries(false);
    }
  }, [seriesList, isNewSeries, series]);

  useEffect(() => {
    if (modelList.length > 0 && isNewModel && model && modelList.includes(model)) {
      setIsNewModel(false);
    }
  }, [modelList, isNewModel, model]);

  useEffect(() => {
    if (mode === 'extract') {
      setComponentChanges(prev => {
        let hasChanges = false;
        const newChanges = { ...prev };
        for (const comp in newChanges) {
          if (newChanges[comp as ComponentType]! > laptopQuantity) {
            newChanges[comp as ComponentType] = laptopQuantity;
            hasChanges = true;
          }
        }
        return hasChanges ? newChanges : prev;
      });
    }
  }, [laptopQuantity, mode]);

  const handleModeChange = (newMode: 'extract' | 'buy' | 'install') => {
    setMode(newMode);
    setBrand('');
    setSeries('');
    setModel('');
    setIsNewBrand(false);
    setIsNewSeries(false);
    setIsNewModel(false);
    setFromClass('');
    setLaptopQuantity(1);
    setComponentChanges({});
    setSelectedComponent('');
    setPurchaseQuantity(1);
    setNotes('');
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'extract') {
      if (!batchId || !brand || !series || !model || !laptopQuantity || !fromClass) return;
      const result = await recordComponentBreakdown({
        batchId,
        brand,
        series,
        model,
        fromClass: fromClass as LaptopClass,
        laptopQuantity: Number(laptopQuantity),
        componentChanges,
        notes
      });
      if (result) {
        setComponentChanges({});
        setNotes('');
        setLaptopQuantity(1);
      }
    } else if (mode === 'buy') {
      if (!brand || !series || !model || !selectedComponent || !purchaseQuantity) return;
      const result = await recordComponentPurchase({
        brand,
        series,
        model,
        componentChanges: { [selectedComponent as ComponentType]: Number(purchaseQuantity) },
        notes
      });
      if (result) {
        setPurchaseQuantity(1);
        setNotes('');
      }
    } else if (mode === 'install') {
      if (!brand || !series || !model || !selectedComponent || !purchaseQuantity) return;
      const result = await recordComponentInstallation({
        brand,
        series,
        model,
        componentChanges: { [selectedComponent as ComponentType]: Number(purchaseQuantity) },
        notes
      });
      if (result) {
        setPurchaseQuantity(1);
        setNotes('');
      }
    }
  };

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

  return {
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
    selectedComponentModelStock,
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
  };
}
