import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Batch, LaptopClass, TransactionType } from '../types';
import { isValidBatchDate, formatBatchId, padBatchId } from '../lib/dateUtils';

interface UseAddTransactionFormProps {
  batches: Batch[];
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
  t: any;
}

export function useAddTransactionForm({ batches, onAddTransaction, t }: UseAddTransactionFormProps) {
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
  const [toClass, setToClass] = useState<LaptopClass>(txType === 'INCOMING' ? 'UNCLASSIFIED' : 'A');
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
  useEffect(() => {
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

  // Ensure toClass is 'UNCLASSIFIED' for INCOMING transactions
  useEffect(() => {
    if (txType === 'INCOMING') {
      setToClass('UNCLASSIFIED');
    }
  }, [txType]);

  // Set default batchId if empty
  useEffect(() => {
    if (!batchId && batches.length > 0 && !isNewBatch) {
      setBatchId(batches[0].batchId);
    }
  }, [batches, batchId, isNewBatch]);

  // Set default brand if empty
  useEffect(() => {
    if (existingBrands.length > 0) {
      if (!brand) {
        setBrand(existingBrands[0]);
        setIsNewBrand(false);
      }
    } else if (txType === 'INCOMING' && !isNewBrand) {
      setIsNewBrand(true);
      setBrand('');
      setIsNewSeries(true);
      setSeries('');
      setIsNewModel(true);
      setModel('');
    }
  }, [existingBrands, brand, isNewBrand, txType]);

  // Set default series if empty
  useEffect(() => {
    if (filteredSeries.length > 0 && !series) {
      setSeries(filteredSeries[0]);
      setIsNewSeries(false);
    }
  }, [filteredSeries, series]);

  // Set default model if empty
  useEffect(() => {
    if (filteredModels.length > 0 && !model) {
      setModel(filteredModels[0]);
      setIsNewModel(false);
    }
  }, [filteredModels, model]);

  // Reconcile "New" state with existing data
  useEffect(() => {
    if (existingBrands.length > 0 && isNewBrand && brand && existingBrands.includes(brand)) {
      setIsNewBrand(false);
    }
  }, [existingBrands, isNewBrand, brand]);

  useEffect(() => {
    if (filteredSeries.length > 0 && isNewSeries && series && filteredSeries.includes(series)) {
      setIsNewSeries(false);
    }
  }, [filteredSeries, isNewSeries, series]);

  useEffect(() => {
    if (filteredModels.length > 0 && isNewModel && model && filteredModels.includes(model)) {
      setIsNewModel(false);
    }
  }, [filteredModels, isNewModel, model]);

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
    
    const finalBatchId = padBatchId(batchId);
    
    if (!isValidBatchDate(finalBatchId)) {
      setError(t.invalidBatchDate);
      return;
    }

    const result = await onAddTransaction(txType, finalBatchId, brand.trim(), series.trim(), model.trim(), fromClass, toClass, Number(quantity), notes);
    if (result) {
      setQuantity(1);
      setNotes('');
      setIsNewBrand(false);
      setIsNewSeries(false);
      setIsNewModel(false);
    }
  };

  return {
    txType,
    batchId,
    setBatchId,
    brand,
    setBrand,
    series,
    setSeries,
    model,
    setModel,
    isNewBrand,
    isNewSeries,
    isNewModel,
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
  };
}
