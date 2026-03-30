import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Batch, ComponentStock, LaptopClass, UserProfile } from '../types';
import { CLASSES, COMPONENTS } from '../constants';
import { toast } from 'sonner';

interface UseExportProps {
  batches: Batch[];
  componentStock: ComponentStock | null;
  t: any;
  onAddTransaction?: (
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
  currentUserProfile?: UserProfile | null;
}

export const useExport = ({ batches, componentStock, t, onAddTransaction, currentUserProfile }: UseExportProps) => {
  const getRowTotal = (counts: Record<LaptopClass, number>) => {
    if (!counts) return 0;
    return Object.values(counts).reduce((sum, count) => sum + (count || 0), 0);
  };

  const getClassifiedRowTotal = (counts: Record<LaptopClass, number>) => {
    if (!counts) return 0;
    return CLASSES.reduce((sum, cls) => sum + (counts[cls] || 0), 0);
  };

  const getColumnTotal = (models: any[], cls: LaptopClass) => {
    return models.reduce((sum, m) => sum + (m?.counts?.[cls] || 0), 0);
  };

  const handleExport = async () => {
    if (!batches.length) return;

    const workbook = XLSX.utils.book_new();

    // 1. Inventory By Batch Sheet
    const inventoryData: any[] = [];
    const allModels: any[] = [];
    
    batches.forEach(batch => {
      if (!batch.items || !Array.isArray(batch.items)) return;
      
      batch.items.forEach(m => {
        const rowTotal = getRowTotal(m.counts);
        if (rowTotal === 0) return;
        allModels.push(m);

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
        inventoryData.push(row);
      });
    });

    inventoryData.push({});
    
    const totalRow: any = {
      [t.batchId]: t.grandTotal,
      [t.brandLabel]: '',
      [t.seriesLabel]: '',
      [t.modelLabel]: '',
      [t.unclassified]: getColumnTotal(allModels, 'UNCLASSIFIED')
    };
    CLASSES.forEach(cls => {
      totalRow[cls === 'Spoiled' ? t.spoiled : `${t.class} ${cls}`] = getColumnTotal(allModels, cls);
    });
    
    const classifiedGrandTotal = allModels.reduce((sum, m) => sum + getClassifiedRowTotal(m?.counts), 0);
    const grandTotal = allModels.reduce((sum, m) => sum + getRowTotal(m?.counts), 0);
    
    totalRow[t.classified] = classifiedGrandTotal;
    totalRow[t.total] = grandTotal;
    inventoryData.push(totalRow);

    const inventoryWorksheet = XLSX.utils.json_to_sheet(inventoryData);
    XLSX.utils.book_append_sheet(workbook, inventoryWorksheet, t.inventoryByBatch);

    // 2. Components Sheet
    if (componentStock && componentStock.items.length > 0) {
      const componentsData: any[] = [];
      componentStock.items.forEach(m => {
        if (!m.counts) return;
        const hasComponents = Object.values(m.counts).some(count => count > 0);
        if (!hasComponents) return;

        const row: any = {
          [t.brandLabel]: m.brand,
          [t.seriesLabel]: m.series,
          [t.modelLabel]: m.model
        };

        COMPONENTS.forEach(comp => {
          row[t[comp] || comp] = m.counts[comp] || 0;
        });

        componentsData.push(row);
      });

      const componentsWorksheet = XLSX.utils.json_to_sheet(componentsData);
      XLSX.utils.book_append_sheet(workbook, componentsWorksheet, t.components);
    }
    
    try {
      console.log("Starting export process...");
      toast.info(t.exporting || "Exporting inventory...");
      const fileName = `Inventory_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      
      console.log("Writing file:", fileName);
      XLSX.writeFile(workbook, fileName);

      toast.success(t.exportSuccess || "Inventory exported successfully");

      // Record the export action in the ledger
      if (onAddTransaction && currentUserProfile) {
        const userName = currentUserProfile.username || currentUserProfile.email || 'Unknown User';
        const notes = `${t.inventoryExportedBy || 'Inventory exported by'} ${userName}`;
        
        await onAddTransaction(
          'EXPORT',
          'ALL',
          'ALL',
          'ALL',
          'ALL',
          'UNCLASSIFIED',
          'UNCLASSIFIED',
          1,
          notes
        );
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(t.exportError || "Export failed. Please try again.");
    }
  };

  return { handleExport };
};
