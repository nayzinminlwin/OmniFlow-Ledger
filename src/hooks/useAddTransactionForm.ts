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
  const [error, setError] = useState<string | null>(null);
  const [fromClass, setFromClass] = useState<LaptopClass>('D');
  const [toClass, setToClass] = useState<LaptopClass>(txType === 'INCOMING' ? 'UNCLASSIFIED' : 'A');
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [notes, setNotes] = useState('');
  const [isNewBatch, setIsNewBatch] = useState(false);
  const [isNewBrand, setIsNewBrand] = useState(false);
  const [isNewSeries, setIsNewSeries] = useState(false);
  const [isNewModel, setIsNewModel] = useState(false);
  const [fieldToFocus, setFieldToFocus] = useState<'batch' | 'brand' | 'series' | 'model' | null>(null);

  const batchInputRef = useRef<HTMLInputElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);
  const seriesInputRef = useRef<HTMLInputElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNewBatch && fieldToFocus === 'batch') {
      batchInputRef.current?.focus();
      setFieldToFocus(null);
    }
  }, [isNewBatch, fieldToFocus]);

  useEffect(() => {
    if (isNewBrand && fieldToFocus === 'brand') {
      brandInputRef.current?.focus();
      setFieldToFocus(null);
    }
  }, [isNewBrand, fieldToFocus]);

  useEffect(() => {
    if (isNewSeries && fieldToFocus === 'series') {
      seriesInputRef.current?.focus();
      setFieldToFocus(null);
    }
  }, [isNewSeries, fieldToFocus]);

  useEffect(() => {
    if (isNewModel && fieldToFocus === 'model') {
      modelInputRef.current?.focus();
      setFieldToFocus(null);
    }
  }, [isNewModel, fieldToFocus]);

  // Persist values to localStorage
  useEffect(() => {
    localStorage.setItem('last_txType', txType);
    localStorage.setItem('last_batchId', batchId);
    localStorage.setItem('last_brand', brand);
    localStorage.setItem('last_series', series);
    localStorage.setItem('last_model', model);
  }, [txType, batchId, brand, series, model]);

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
    if (!brand) return [];
    const seriesSet = new Set<string>();
    batches.forEach(b => b.items?.forEach(i => {
      if (i.brand === brand && i.series) seriesSet.add(i.series);
    }));
    return Array.from(seriesSet).sort();
  }, [batches, brand]);

  const filteredModels = useMemo(() => {
    if (!brand || !series) return [];
    const modelsSet = new Set<string>();
    batches.forEach(b => b.items?.forEach(i => {
      if (i.brand === brand && i.series === series && i.model) modelsSet.add(i.model);
    }));
    return Array.from(modelsSet).sort();
  }, [batches, brand, series]);

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
    if (existingBrands.length > 0 && !brand && !isNewBrand) {
      setBrand(existingBrands[0]);
    }
  }, [existingBrands, brand, isNewBrand]);

  // Set default series if empty
  useEffect(() => {
    if (filteredSeries.length > 0 && !series && !isNewSeries) {
      setSeries(filteredSeries[0]);
    }
  }, [filteredSeries, series, isNewSeries]);

  // Set default model if empty
  useEffect(() => {
    if (filteredModels.length > 0 && !model && !isNewModel) {
      setModel(filteredModels[0]);
    }
  }, [filteredModels, model, isNewModel]);

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
      setSeries('');
      setModel('');
      setIsNewSeries(true);
      setIsNewModel(true);
      setFieldToFocus('brand');
    } else {
      setIsNewBrand(false);
      setBrand(val);
      setSeries('');
      setModel('');
      setIsNewSeries(false);
      setIsNewModel(false);
    }
  };

  const handleSeriesChange = (val: string) => {
    if (val === '__NEW__') {
      setIsNewSeries(true);
      setSeries('');
      setModel('');
      setIsNewModel(true);
      setFieldToFocus('series');
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
      setFieldToFocus('model');
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
      setFieldToFocus('batch');
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
    
    if (txType === 'REPAIR' && fromClass === toClass) {
      setError(t.sameClassRepairError || 'Cannot repair to the same class');
      return;
    }

    if (txType === 'ADJUSTMENT' && Number(quantity) === getStockCount(toClass)) {
      setError(t.sameValueAdjustmentError || 'New value must be different from current stock');
      return;
    }
    
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
  };
}
