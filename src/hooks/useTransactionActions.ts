import { useState } from 'react';
import { 
  doc, 
  runTransaction, 
  writeBatch, 
  query, 
  collection, 
  where, 
  getDocs, 
  getDoc
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { Stock, TransactionType, Batch, LaptopClass, ModelStock, Transaction, ComponentType, ComponentModelStock, ComponentStock } from '../types';
import { COMPONENTS, INITIAL_CLASS_COUNTS, INITIAL_COMPONENT_COUNTS, INITIAL_COMPONENT_STOCK } from '../constants';
import { translations, Language } from '../translations';

const getModelStock = (items: ModelStock[], brand: string, series: string, model: string): ModelStock => {
  let ms = items.find(i => i.brand === brand && i.series === series && i.model === model);
  if (!ms) {
    ms = { brand, series, model, counts: { ...INITIAL_CLASS_COUNTS } };
    items.push(ms);
  }
  return ms;
};

const getComponentModelStock = (items: ComponentModelStock[], brand: string, series: string, model: string): ComponentModelStock => {
  let ms = items.find(i => i.brand === brand && i.series === series && i.model === model);
  if (!ms) {
    ms = { brand, series, model, counts: { ...INITIAL_COMPONENT_COUNTS } };
    items.push(ms);
  }
  return ms;
};

export function useTransactionActions(user: User | null, stock: Stock | null, lang: Language) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const t = translations[lang];

  const handleAddTransaction = async (
    txType: TransactionType,
    batchId: string,
    brand: string,
    series: string,
    model: string,
    fromClass: LaptopClass,
    toClass: LaptopClass,
    quantity: number,
    notes: string
  ) => {
    if (!user || !stock || !brand.trim() || !series.trim() || !model.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await runTransaction(db, async (transaction) => {
        const stockRef = doc(db, 'inventory', 'current');
        const batchRef = doc(db, 'batches', batchId);
        
        const stockDoc = await transaction.get(stockRef);
        const batchDoc = await transaction.get(batchRef);
        
        if (!stockDoc.exists()) {
          throw new Error(t.globalStockMissing);
        }

        const currentStock = stockDoc.data() as Stock;
        const newStock: Stock = { 
          items: (currentStock.items || []).filter(i => typeof i === 'object' && i !== null),
          lastUpdated: new Date().toISOString() 
        };

        let currentBatchStock: Batch;
        if (batchDoc.exists()) {
          const data = batchDoc.data() as Batch;
          currentBatchStock = {
            ...data,
            batchId: data.batchId || batchId,
            items: (data.items || []).filter(i => typeof i === 'object' && i !== null),
            createdAt: typeof data.createdAt === 'string' 
              ? data.createdAt 
              : (data.createdAt && (data.createdAt as any).toDate) 
                ? (data.createdAt as any).toDate().toISOString() 
                : new Date().toISOString(),
          };
        } else {
          currentBatchStock = {
            batchId,
            items: [],
            createdAt: new Date().toISOString(),
            active: true
          };
        }
        
        const newBatchStock = { ...currentBatchStock };

        const globalModelStock = getModelStock(newStock.items, brand, series, model);
        const batchModelStock = getModelStock(newBatchStock.items, brand, series, model);

        if (txType === 'INCOMING') {
          globalModelStock.counts['UNCLASSIFIED'] += quantity;
          batchModelStock.counts['UNCLASSIFIED'] += quantity;
        } else if (txType === 'SALE') {
          if (batchModelStock.counts[fromClass] < quantity) {
            throw new Error(t.insufficientStock(batchId, fromClass));
          }
          if (globalModelStock.counts[fromClass] < quantity) {
            throw new Error(t.insufficientGlobalStock(fromClass));
          }
          globalModelStock.counts[fromClass] -= quantity;
          batchModelStock.counts[fromClass] -= quantity;
        } else if (txType === 'REPAIR') {
          if (batchModelStock.counts[fromClass] < quantity) {
            throw new Error(t.insufficientStock(batchId, fromClass));
          }
          if (globalModelStock.counts[fromClass] < quantity) {
            throw new Error(t.insufficientGlobalStock(fromClass));
          }
          globalModelStock.counts[fromClass] -= quantity;
          globalModelStock.counts[toClass] += quantity;
          batchModelStock.counts[fromClass] -= quantity;
          batchModelStock.counts[toClass] += quantity;
        } else if (txType === 'ADJUSTMENT') {
          const diff = quantity - batchModelStock.counts[toClass];
          globalModelStock.counts[toClass] += diff;
          batchModelStock.counts[toClass] += diff;
          if (batchModelStock.counts[toClass] < 0) {
            throw new Error(t.adjustmentNegative(batchId, toClass));
          }
          if (globalModelStock.counts[toClass] < 0) {
            throw new Error(t.adjustmentNegativeGlobal(toClass));
          }
        }

        transaction.update(stockRef, newStock as any);
        transaction.set(batchRef, newBatchStock);
        
        const txRef = doc(collection(db, 'transactions'));
        const txData: any = {
          type: txType,
          batchId,
          batchActive: true,
          brand,
          series,
          model,
          quantity,
          timestamp: new Date().toISOString(),
          userId: user.uid,
        };
        
        if (txType !== 'INCOMING' && fromClass) {
          txData.fromClass = fromClass;
        }
        if (txType !== 'SALE' && toClass) {
          txData.toClass = toClass;
        }
        if (notes.trim()) {
          txData.notes = notes.trim();
        }

        transaction.set(txRef, txData);
      });
      setSuccess(t.transactionSuccess);
      return true;
    } catch (err: any) {
      console.error('Transaction failed:', err);
      setError(err.message || t.transactionFailed);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameBatch = async (editingBatch: Batch, newBatchName: string, selectedBatchId: string, setSelectedBatchId: (id: string) => void) => {
    if (!editingBatch || !newBatchName.trim() || !user) return;
    const oldBatchId = editingBatch.batchId;
    const newId = newBatchName.trim();
    
    if (oldBatchId === newId) return true;

    setIsRenaming(true);
    setError(null);
    setSuccess(null);

    try {
      const oldBatchRef = doc(db, 'batches', oldBatchId);
      const oldBatchSnap = await getDoc(oldBatchRef);
      if (!oldBatchSnap.exists()) throw new Error(t.batchNotFound);
      
      const newBatchRef = doc(db, 'batches', newId);
      const newBatchSnap = await getDoc(newBatchRef);
      if (newBatchSnap.exists()) throw new Error(t.batchExists);
      
      const batchData = oldBatchSnap.data();
      batchData.batchId = newId;
      
      const txQuery = query(collection(db, 'transactions'), where('batchId', '==', oldBatchId));
      const txSnaps = await getDocs(txQuery);
      
      const CHUNK_SIZE = 490;
      const txDocs = txSnaps.docs;
      
      for (let i = 0; i < txDocs.length; i += CHUNK_SIZE) {
        const chunk = txDocs.slice(i, i + CHUNK_SIZE);
        const currentBatch = writeBatch(db);
        
        if (i === 0) {
          currentBatch.set(newBatchRef, batchData);
          currentBatch.delete(oldBatchRef);
        }
        
        chunk.forEach((txDoc) => {
          currentBatch.update(txDoc.ref, { batchId: newId });
        });
        
        await currentBatch.commit();
      }
      
      if (txDocs.length === 0) {
        const emptyBatch = writeBatch(db);
        emptyBatch.set(newBatchRef, batchData);
        emptyBatch.delete(oldBatchRef);
        await emptyBatch.commit();
      }
      if (selectedBatchId === oldBatchId) {
        setSelectedBatchId(newId);
      }
      setSuccess(t.renameSuccess);
      return true;
    } catch (err: any) {
      console.error('Rename failed:', err);
      setError(err.message || t.renameFailed);
      return false;
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDeleteBatch = async (batchId: string, setSelectedBatchId: (id: string) => void) => {
    if (!user || !batchId) return;

    if (!window.confirm(t.confirmDeleteBatch)) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const batchRef = doc(db, 'batches', batchId);
      const batchDoc = await getDoc(batchRef);
      
      if (!batchDoc.exists()) {
        throw new Error(t.batchNotFound);
      }

      await runTransaction(db, async (transaction) => {
        const stockRef = doc(db, 'inventory', 'current');
        const stockDoc = await transaction.get(stockRef);
        
        if (!stockDoc.exists()) {
          throw new Error(t.globalStockMissing);
        }

        const currentStock = stockDoc.data() as Stock;
        const currentBatchData = batchDoc.data() as Batch;
        
        const newStockItems = [...currentStock.items];
        currentBatchData.items.forEach(batchItem => {
          const globalItem = newStockItems.find(gi => 
            gi.brand === batchItem.brand && 
            gi.series === batchItem.series && 
            gi.model === batchItem.model
          );
          
          if (globalItem) {
            Object.keys(batchItem.counts).forEach(cls => {
              globalItem.counts[cls as LaptopClass] -= batchItem.counts[cls as LaptopClass];
            });
          }
        });

        transaction.update(stockRef, { 
          items: newStockItems,
          lastUpdated: new Date().toISOString()
        });
        
        transaction.update(batchRef, { active: false });

        const txQuery = query(collection(db, 'transactions'), where('batchId', '==', batchId));
        const txSnaps = await getDocs(txQuery);
        txSnaps.docs.forEach(txDoc => {
          transaction.update(txDoc.ref, { batchActive: false });
        });

        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          type: 'ADJUSTMENT',
          batchId,
          batchActive: false,
          brand: 'BATCH',
          series: 'DELETION',
          model: 'ALL',
          quantity: 0,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          notes: t.batchDeletionNotes(batchId)
        });
      });

      setSelectedBatchId('');
      setSuccess(t.deleteSuccess);
      return true;
    } catch (err: any) {
      console.error('Delete failed:', err);
      setError(err.message || t.deleteFailed);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const recordComponentBreakdown = async ({
    batchId,
    brand,
    series,
    model,
    fromClass,
    laptopQuantity,
    componentChanges,
    notes
  }: {
    batchId: string;
    brand: string;
    series: string;
    model: string;
    fromClass: LaptopClass;
    laptopQuantity: number;
    componentChanges: Partial<Record<ComponentType, number>>;
    notes: string;
  }) => {
    if (!user || !stock || !brand.trim() || !series.trim() || !model.trim() || !batchId) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await runTransaction(db, async (transaction) => {
        const globalStockRef = doc(db, 'inventory', 'current');
        const compStockRef = doc(db, 'components', 'current');
        const spoiledCompStockRef = doc(db, 'components', 'spoiled');
        const batchRef = doc(db, 'batches', batchId);
        
        const globalStockDoc = await transaction.get(globalStockRef);
        const compStockDoc = await transaction.get(compStockRef);
        const spoiledCompStockDoc = await transaction.get(spoiledCompStockRef);
        const batchDoc = await transaction.get(batchRef);

        if (!globalStockDoc.exists()) {
          throw new Error(t.globalStockMissing);
        }

        if (!batchDoc.exists()) {
          throw new Error(t.batchNotFound);
        }

        const globalData = globalStockDoc.data() as Stock;
        const batchData = batchDoc.data() as Batch;

        const globalModel = getModelStock(globalData.items, brand, series, model);
        const batchModel = getModelStock(batchData.items, brand, series, model);

        if ((batchModel.counts[fromClass] || 0) < laptopQuantity) {
          throw new Error(t.insufficientStock(batchId, fromClass));
        }

        if ((globalModel.counts[fromClass] || 0) < laptopQuantity) {
          throw new Error(t.insufficientGlobalStock(fromClass));
        }

        batchModel.counts[fromClass] -= laptopQuantity;
        globalModel.counts[fromClass] -= laptopQuantity;
        globalData.lastUpdated = new Date().toISOString();

        let compData = compStockDoc.exists() ? compStockDoc.data() as ComponentStock : { ...INITIAL_COMPONENT_STOCK };
        let spoiledCompData = spoiledCompStockDoc.exists() ? spoiledCompStockDoc.data() as ComponentStock : { ...INITIAL_COMPONENT_STOCK };
        
        const compModel = getComponentModelStock(compData.items, brand, series, model);
        const spoiledCompModel = getComponentModelStock(spoiledCompData.items, brand, series, model);

        // All components from the breakdown are accounted for:
        // Either they are "good" (in componentChanges) or they are "spoiled" (laptopQuantity - goodQuantity)
        COMPONENTS.forEach(comp => {
          const goodQty = componentChanges[comp] || 0;
          const spoiledQty = laptopQuantity - goodQty;
          
          compModel.counts[comp] = (compModel.counts[comp] || 0) + goodQty;
          spoiledCompModel.counts[comp] = (spoiledCompModel.counts[comp] || 0) + spoiledQty;
        });

        compData.lastUpdated = new Date().toISOString();
        spoiledCompData.lastUpdated = new Date().toISOString();

        // Record the component transaction
        const compTxRef = doc(collection(db, 'component_transactions'));
        const compTxData = {
          type: 'BREAKDOWN',
          brand,
          series,
          model,
          fromClass,
          laptopQuantity,
          componentChanges,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          notes
        };

        // Record the laptop transaction (deduction)
        const laptopTxRef = doc(collection(db, 'transactions'));
        const laptopTxData = {
          type: 'BREAKDOWN',
          batchId,
          brand,
          series,
          model,
          fromClass,
          toClass: 'UNCLASSIFIED', // Not used for BREAKDOWN, but required by type
          quantity: laptopQuantity,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          notes: `Broken down into components: ${notes}`,
          componentChanges
        };

        transaction.set(globalStockRef, globalData);
        transaction.set(batchRef, batchData);
        transaction.set(compStockRef, compData);
        transaction.set(spoiledCompStockRef, spoiledCompData);
        transaction.set(compTxRef, compTxData);
        transaction.set(laptopTxRef, laptopTxData);
      });

      setSuccess(t.breakdownSuccess);
      return true;
    } catch (err: any) {
      console.error('Breakdown failed:', err);
      setError(err.message || t.breakdownFailed);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const recordComponentPurchase = async ({
    brand,
    series,
    model,
    componentChanges,
    notes
  }: {
    brand: string;
    series: string;
    model: string;
    componentChanges: Partial<Record<ComponentType, number>>;
    notes: string;
  }) => {
    if (!user || !brand.trim() || !series.trim() || !model.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await runTransaction(db, async (transaction) => {
        const compStockRef = doc(db, 'components', 'current');
        const compStockDoc = await transaction.get(compStockRef);

        let compData = compStockDoc.exists() ? compStockDoc.data() as ComponentStock : { ...INITIAL_COMPONENT_STOCK };
        const compModel = getComponentModelStock(compData.items, brand, series, model);

        Object.entries(componentChanges).forEach(([comp, qty]) => {
          compModel.counts[comp as ComponentType] = (compModel.counts[comp as ComponentType] || 0) + (qty || 0);
        });

        compData.lastUpdated = new Date().toISOString();

        const compTxRef = doc(collection(db, 'component_transactions'));
        const compTxData = {
          type: 'PURCHASE',
          brand,
          series,
          model,
          componentChanges,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          notes
        };

        // Also record in main ledger for visibility
        const laptopTxRef = doc(collection(db, 'transactions'));
        const laptopTxData = {
          type: 'PURCHASE',
          batchId: 'COMPONENTS',
          brand,
          series,
          model,
          quantity: 0,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          notes: `Purchased components: ${notes}`,
          componentChanges
        };

        transaction.set(compStockRef, compData);
        transaction.set(compTxRef, compTxData);
        transaction.set(laptopTxRef, laptopTxData);
      });

      setSuccess(t.purchaseSuccess);
      return true;
    } catch (err: any) {
      console.error('Purchase failed:', err);
      setError(err.message || t.purchaseFailed);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const recordComponentInstallation = async ({
    brand,
    series,
    model,
    componentChanges,
    notes
  }: {
    brand: string;
    series: string;
    model: string;
    componentChanges: Partial<Record<ComponentType, number>>;
    notes: string;
  }) => {
    if (!user || !brand.trim() || !series.trim() || !model.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await runTransaction(db, async (transaction) => {
        const compStockRef = doc(db, 'components', 'current');
        const compStockDoc = await transaction.get(compStockRef);

        let compData = compStockDoc.exists() ? compStockDoc.data() as ComponentStock : { ...INITIAL_COMPONENT_STOCK };
        const compModel = getComponentModelStock(compData.items, brand, series, model);

        Object.entries(componentChanges).forEach(([comp, qty]) => {
          const currentQty = compModel.counts[comp as ComponentType] || 0;
          if (currentQty < (qty || 0)) {
            throw new Error(t.insufficientComponentStock(t[comp] || comp));
          }
          compModel.counts[comp as ComponentType] = currentQty - (qty || 0);
        });

        compData.lastUpdated = new Date().toISOString();

        const compTxRef = doc(collection(db, 'component_transactions'));
        const compTxData = {
          type: 'INSTALL',
          brand,
          series,
          model,
          componentChanges,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          notes
        };

        // Also record in main ledger for visibility
        const laptopTxRef = doc(collection(db, 'transactions'));
        const laptopTxData = {
          type: 'INSTALL',
          batchId: 'COMPONENTS',
          brand,
          series,
          model,
          quantity: 0,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          notes: `Installed components: ${notes}`,
          componentChanges
        };

        transaction.set(compStockRef, compData);
        transaction.set(compTxRef, compTxData);
        transaction.set(laptopTxRef, laptopTxData);
      });

      setSuccess(t.installSuccess);
      return true;
    } catch (err: any) {
      console.error('Installation failed:', err);
      setError(err.message || t.installFailed);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleAddTransaction, handleRenameBatch, handleDeleteBatch, recordComponentBreakdown, recordComponentPurchase, recordComponentInstallation, isSubmitting, isRenaming, error, setError, success, setSuccess };
}
