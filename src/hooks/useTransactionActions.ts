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
import { Stock, TransactionType, Batch, LaptopClass, ModelStock } from '../types';
import { INITIAL_CLASS_COUNTS } from '../constants';
import { translations, Language } from '../translations';

const getModelStock = (items: ModelStock[], brand: string, series: string, model: string): ModelStock => {
  let ms = items.find(i => i.brand === brand && i.series === series && i.model === model);
  if (!ms) {
    ms = { brand, series, model, counts: { ...INITIAL_CLASS_COUNTS } };
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
            throw new Error(`Insufficient global stock for Class ${fromClass}`);
          }
          globalModelStock.counts[fromClass] -= quantity;
          batchModelStock.counts[fromClass] -= quantity;
        } else if (txType === 'REPAIR') {
          if (batchModelStock.counts[fromClass] < quantity) {
            throw new Error(t.insufficientStock(batchId, fromClass));
          }
          if (globalModelStock.counts[fromClass] < quantity) {
            throw new Error(`Insufficient global stock for Class ${fromClass}`);
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
            throw new Error(`Adjustment would result in negative global stock for Class ${toClass}`);
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
      
      // Firestore batches are limited to 500 operations.
      // We have 2 ops for the batch document itself (set new, delete old).
      // So we can process up to 498 transactions per batch.
      const CHUNK_SIZE = 490;
      const txDocs = txSnaps.docs;
      
      for (let i = 0; i < txDocs.length; i += CHUNK_SIZE) {
        const chunk = txDocs.slice(i, i + CHUNK_SIZE);
        const currentBatch = writeBatch(db);
        
        if (i === 0) {
          // Only do the batch rename in the first chunk
          currentBatch.set(newBatchRef, batchData);
          currentBatch.delete(oldBatchRef);
        }
        
        chunk.forEach((txDoc) => {
          currentBatch.update(txDoc.ref, { batchId: newId });
        });
        
        await currentBatch.commit();
      }
      
      if (txDocs.length === 0) {
        // If there were no transactions, we still need to commit the batch rename
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
        
        // Subtract batch items from global stock
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
        
        // Soft delete: set active to false
        transaction.update(batchRef, { active: false });

        // Update all transactions for this batch to be inactive
        const txQuery = query(collection(db, 'transactions'), where('batchId', '==', batchId));
        const txSnaps = await getDocs(txQuery);
        txSnaps.docs.forEach(txDoc => {
          transaction.update(txDoc.ref, { batchActive: false });
        });

        // Record a deletion transaction
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
          notes: `Batch ${batchId} deleted (soft delete)`
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

  return { handleAddTransaction, handleRenameBatch, handleDeleteBatch, isSubmitting, isRenaming, error, setError, success, setSuccess };
}
