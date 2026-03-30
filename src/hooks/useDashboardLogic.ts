import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Stock, Transaction, LaptopClass, Batch, ComponentStock, UserProfile } from '../types';
import { CLASSES } from '../constants';
import { useExport } from './useExport';

interface UseDashboardLogicProps {
  stock: Stock | null;
  componentStock: ComponentStock | null;
  batches: Batch[];
  transactions: Transaction[];
  t: any;
  onAddTransaction: (
    txType: any,
    batchId: string,
    brand: string,
    series: string,
    model: string,
    fromClass: any,
    toClass: any,
    quantity: number,
    notes: string
  ) => Promise<boolean>;
  currentUserProfile: UserProfile | null;
}

export const useDashboardLogic = ({ stock, componentStock, batches, transactions, t, onAddTransaction, currentUserProfile }: UseDashboardLogicProps) => {
  const [hoveredTxId, setHoveredTxId] = useState<string | null>(null);
  const { handleExport } = useExport({ batches, componentStock, t, onAddTransaction, currentUserProfile });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (hoveredTxId && !target.closest('.breakdown-trigger') && !target.closest('.breakdown-popup')) {
        setHoveredTxId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hoveredTxId]);

  const models = useMemo(() => stock?.items || [], [stock]);

  const getColumnTotal = (cls: LaptopClass) => {
    return models.reduce((sum, m) => sum + (m?.counts?.[cls] || 0), 0);
  };

  const getRowTotal = (counts: Record<LaptopClass, number>) => {
    if (!counts) return 0;
    return Object.values(counts).reduce((sum, count) => sum + (count || 0), 0);
  };

  const grandTotal = useMemo(() => 
    models.reduce((sum, m) => sum + getRowTotal(m?.counts), 0),
  [models]);

  const getClassifiedRowTotal = (counts: Record<LaptopClass, number>) => {
    if (!counts) return 0;
    return CLASSES.reduce((sum, cls) => sum + (counts[cls] || 0), 0);
  };

  const getClassifiedGrandTotal = useMemo(() => 
    models.reduce((sum, m) => sum + getClassifiedRowTotal(m?.counts), 0),
  [models]);

  const getClassName = (cls?: string) => cls === 'Spoiled' ? t.spoiled : cls;

  const safeFormatDate = (dateStr: string | undefined, formatStr: string) => {
    if (!dateStr) return t.na;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return t.invalidDate;
    return format(d, formatStr);
  };

  return {
    hoveredTxId,
    setHoveredTxId,
    models,
    getColumnTotal,
    getRowTotal,
    grandTotal,
    getClassifiedRowTotal,
    getClassifiedGrandTotal,
    getClassName,
    handleExport,
    safeFormatDate
  };
};
