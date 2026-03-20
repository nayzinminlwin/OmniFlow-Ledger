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
import { Stock, TransactionType, Batch, LaptopClass } from '../types';
import { getStockKey } from '../utils/stock';
import { translations, Language } from '../translations';

export function useTransactionActions(user: User | null, stock: Stock | null, lang: Language) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const t = translations[lang];

  const handleAddTransaction = async (
    txType: TransactionType,
    batchId: string,
    fromClass: LaptopClass,
    toClass: LaptopClass,
    quantity: number,
    notes: string
  ) => {
    if (!user || !stock) return;

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
          classA: Math.max(0, Number(currentStock.classA) || 0),
          classB: Math.max(0, Number(currentStock.classB) || 0),
          classBMinus: Math.max(0, Number(currentStock.classBMinus) || 0),
          classC: Math.max(0, Number(currentStock.classC) || 0),
          classCMinus: Math.max(0, Number(currentStock.classCMinus) || 0),
          classD: Math.max(0, Number(currentStock.classD) || 0),
          unclassified: Math.max(0, Number(currentStock.unclassified) || 0),
          lastUpdated: new Date().toISOString() 
        };

        let currentBatchStock: Batch;
        if (batchDoc.exists()) {
          const data = batchDoc.data() as Batch;
          currentBatchStock = {
            ...data,
            batchId: data.batchId || batchId,
            classA: Math.max(0, Number(data.classA) || 0),
            classB: Math.max(0, Number(data.classB) || 0),
            classBMinus: Math.max(0, Number(data.classBMinus) || 0),
            classC: Math.max(0, Number(data.classC) || 0),
            classCMinus: Math.max(0, Number(data.classCMinus) || 0),
            classD: Math.max(0, Number(data.classD) || 0),
            unclassified: Math.max(0, Number(data.unclassified) || 0),
            createdAt: typeof data.createdAt === 'string' 
              ? data.createdAt 
              : (data.createdAt && (data.createdAt as any).toDate) 
                ? (data.createdAt as any).toDate().toISOString() 
                : new Date().toISOString(),
          };
        } else {
          currentBatchStock = {
            batchId,
            classA: 0,
            classB: 0,
            classBMinus: 0,
            classC: 0,
            classCMinus: 0,
            classD: 0,
            unclassified: 0,
            createdAt: new Date().toISOString()
          };
        }
        const newBatchStock = { ...currentBatchStock };

        if (txType === 'INCOMING') {
          const key = 'unclassified';
          (newStock[key] as number) += quantity;
          (newBatchStock[key] as number) += quantity;
        } else if (txType === 'SALE') {
          const key = getStockKey(fromClass);
          if ((currentBatchStock[key] as number) < quantity) {
            throw new Error(t.insufficientStock(batchId, fromClass));
          }
          if ((newStock[key] as number) < quantity) {
            throw new Error(`Insufficient global stock for Class ${fromClass}`);
          }
          (newStock[key] as number) -= quantity;
          (newBatchStock[key] as number) -= quantity;
        } else if (txType === 'REPAIR') {
          const fromKey = getStockKey(fromClass);
          const toKey = getStockKey(toClass);
          if ((currentBatchStock[fromKey] as number) < quantity) {
            throw new Error(t.insufficientStock(batchId, fromClass));
          }
          if ((newStock[fromKey] as number) < quantity) {
            throw new Error(`Insufficient global stock for Class ${fromClass}`);
          }
          (newStock[fromKey] as number) -= quantity;
          (newStock[toKey] as number) += quantity;
          (newBatchStock[fromKey] as number) -= quantity;
          (newBatchStock[toKey] as number) += quantity;
        } else if (txType === 'ADJUSTMENT') {
          const key = getStockKey(toClass);
          const diff = quantity - (currentBatchStock[key] as number);
          (newStock[key] as number) += diff;
          (newBatchStock[key] as number) += diff;
          if ((newBatchStock[key] as number) < 0) {
            throw new Error(t.adjustmentNegative(batchId, toClass));
          }
          if ((newStock[key] as number) < 0) {
            throw new Error(`Adjustment would result in negative global stock for Class ${toClass}`);
          }
        }

        transaction.update(stockRef, newStock as any);
        transaction.set(batchRef, newBatchStock);
        
        const txRef = doc(collection(db, 'transactions'));
        const txData: any = {
          type: txType,
          batchId,
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
      const batch = writeBatch(db);
      const oldBatchRef = doc(db, 'batches', oldBatchId);
      const oldBatchSnap = await getDoc(oldBatchRef);
      if (!oldBatchSnap.exists()) throw new Error(t.batchNotFound);
      
      const newBatchRef = doc(db, 'batches', newId);
      const newBatchSnap = await getDoc(newBatchRef);
      if (newBatchSnap.exists()) throw new Error(t.batchExists);
      
      const batchData = oldBatchSnap.data();
      batchData.batchId = newId;
      batch.set(newBatchRef, batchData);
      batch.delete(oldBatchRef);
      
      const txQuery = query(collection(db, 'transactions'), where('batchId', '==', oldBatchId));
      const txSnaps = await getDocs(txQuery);
      txSnaps.forEach((txDoc) => {
        batch.update(txDoc.ref, { batchId: newId });
      });
      
      await batch.commit();
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

  return { handleAddTransaction, handleRenameBatch, isSubmitting, isRenaming, error, setError, success, setSuccess };
}
