import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Stock, Transaction, LaptopClass, Batch } from '../types';
import { CLASSES } from '../constants';

interface UseDashboardLogicProps {
  stock: Stock | null;
  batches: Batch[];
  transactions: Transaction[];
  t: any;
}

export const useDashboardLogic = ({ stock, batches, transactions, t }: UseDashboardLogicProps) => {
  const [hoveredTxId, setHoveredTxId] = useState<string | null>(null);

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

  const handleExport = () => {
    if (!batches.length) return;

    const exportData: any[] = [];

    batches.forEach(batch => {
      if (!batch.items || !Array.isArray(batch.items)) return;
      
      batch.items.forEach(m => {
        const rowTotal = getRowTotal(m.counts);
        if (rowTotal === 0) return;

        const row: any = {
          [t.batchId]: batch.batchId,
          [t.brandLabel]: m.brand,
          [t.seriesLabel]: m.series,
          [t.modelLabel]: m.model,
          [t.unclassified]: m.counts?.['UNCLASSIFIED'] || 0
        };
        
        CLASSES.forEach(cls => {
          row[cls === 'Spoiled' ? t.spoiled : `${t.class} ${cls}`] = m.counts?.[cls] || 0;
        });
        
        row[t.classified] = getClassifiedRowTotal(m.counts);
        row[t.total] = rowTotal;
        exportData.push(row);
      });
    });

    exportData.push({});
    
    const totalRow: any = {
      [t.batchId]: t.grandTotal,
      [t.brandLabel]: '',
      [t.seriesLabel]: '',
      [t.modelLabel]: '',
      [t.unclassified]: getColumnTotal('UNCLASSIFIED')
    };
    CLASSES.forEach(cls => {
      totalRow[cls === 'Spoiled' ? t.spoiled : `${t.class} ${cls}`] = getColumnTotal(cls);
    });
    totalRow[t.classified] = getClassifiedGrandTotal;
    totalRow[t.total] = grandTotal;
    exportData.push(totalRow);

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, t.inventoryByBatch);
    
    const fileName = `Inventory_By_Batch_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

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
