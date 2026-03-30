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
import { UserProfile, Stock, TransactionType, Batch, LaptopClass, ModelStock, Transaction, ComponentType, ComponentModelStock, ComponentStock } from '../types';
import { COMPONENTS, INITIAL_CLASS_COUNTS, INITIAL_COMPONENT_COUNTS, INITIAL_COMPONENT_STOCK } from '../constants';
import { translations, Language } from '../translations';
import { withTimeout } from '../lib/utils';

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

export function useTransactionActions(user: User | null, lang: Language) {
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
    if (!user || !brand.trim() || !series.trim() || !model.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await withTimeout(
        runTransaction(db, async (transaction) => {
          if (txType === 'EXPORT') {
            const txRef = doc(collection(db, 'transactions'));
            const txData: any = {
              type: 'EXPORT',
              batchId: 'ALL',
              batchActive: true,
              brand: 'ALL',
              series: 'ALL',
              model: 'ALL',
              quantity: 1,
              timestamp: new Date().toISOString(),
              userId: user.uid,
              notes: notes.trim()
            };
            transaction.set(txRef, txData);
            return;
          }

          const batchRef = doc(db, 'batches', batchId);
        
        const batchDoc = await transaction.get(batchRef);
        
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

        const batchModelStock = getModelStock(newBatchStock.items, brand, series, model);

        let adjustmentDiff = 0;
        if (txType === 'INCOMING') {
          batchModelStock.counts[toClass] += quantity;
        } else if (txType === 'SALE') {
          if (batchModelStock.counts[fromClass] < quantity) {
            throw new Error(t.insufficientStock(batchId, fromClass));
          }
          batchModelStock.counts[fromClass] -= quantity;
        } else if (txType === 'REPAIR') {
          if (batchModelStock.counts[fromClass] < quantity) {
            throw new Error(t.insufficientStock(batchId, fromClass));
          }
          batchModelStock.counts[fromClass] -= quantity;
          batchModelStock.counts[toClass] += quantity;
        } else if (txType === 'ADJUSTMENT') {
          adjustmentDiff = quantity - batchModelStock.counts[toClass];
          batchModelStock.counts[toClass] += adjustmentDiff;
          if (batchModelStock.counts[toClass] < 0) {
            throw new Error(t.adjustmentNegative(batchId, toClass));
          }
        }

        transaction.set(batchRef, newBatchStock);
        
        const txRef = doc(collection(db, 'transactions'));
        const txData: any = {
          type: txType,
          batchId,
          batchActive: true,
          brand,
          series,
          model,
          quantity: txType === 'ADJUSTMENT' ? adjustmentDiff : quantity,
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
      }), 15000, t.transactionTimeout || 'Transaction timed out. Please check your connection and try again.');
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
      await withTimeout((async () => {
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
      })(), 30000, t.transactionTimeout || 'Transaction timed out. Please check your connection and try again.');
      
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
    if (!user || !batchId) return false;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await withTimeout((async () => {
        const batchRef = doc(db, 'batches', batchId);
        const batchDoc = await getDoc(batchRef);
      
      if (!batchDoc.exists()) {
        throw new Error(t.batchNotFound);
      }

      await runTransaction(db, async (transaction) => {
        const currentBatchData = batchDoc.data() as Batch;
        let totalBatchQty = 0;
        
        currentBatchData.items.forEach(batchItem => {
          Object.keys(batchItem.counts).forEach(cls => {
            const count = batchItem.counts[cls as LaptopClass] || 0;
            totalBatchQty += count;
          });
        });
        
        transaction.update(batchRef, { active: false });

        const txQuery = query(collection(db, 'transactions'), where('batchId', '==', batchId));
        const txSnaps = await getDocs(txQuery);
        txSnaps.docs.forEach(txDoc => {
          transaction.update(txDoc.ref, { batchActive: false });
        });

        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          type: 'DELETION',
          batchId,
          batchActive: true,
          brand: 'BATCH',
          series: 'DELETION',
          model: 'ALL',
          quantity: -totalBatchQty,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          notes: t.batchDeletionNotes(batchId)
        });
      });
      })(), 15000, t.transactionTimeout || 'Transaction timed out. Please check your connection and try again.');

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
    if (!user || !brand.trim() || !series.trim() || !model.trim() || !batchId) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await withTimeout(
        runTransaction(db, async (transaction) => {
          const compStockRef = doc(db, 'components', 'current');
          const spoiledCompStockRef = doc(db, 'components', 'spoiled');
          const batchRef = doc(db, 'batches', batchId);
        
        const compStockDoc = await transaction.get(compStockRef);
        const spoiledCompStockDoc = await transaction.get(spoiledCompStockRef);
        const batchDoc = await transaction.get(batchRef);

        if (!batchDoc.exists()) {
          throw new Error(t.batchNotFound);
        }

        const batchData = batchDoc.data() as Batch;

        const batchModel = getModelStock(batchData.items, brand, series, model);

        const allowedClasses: LaptopClass[] = ['A', 'B', 'B-', 'C1', 'C2', 'C3', 'C4', 'C5', 'Spoiled', 'UNCLASSIFIED'];
        if (!allowedClasses.includes(fromClass)) {
          throw new Error(`Breakdown not allowed for class ${fromClass}`);
        }

        if ((batchModel.counts[fromClass] || 0) < laptopQuantity) {
          throw new Error(t.insufficientStock(batchId, fromClass));
        }

        batchModel.counts[fromClass] -= laptopQuantity;

        let compData = compStockDoc.exists() ? compStockDoc.data() as ComponentStock : { ...INITIAL_COMPONENT_STOCK };
        let spoiledCompData = spoiledCompStockDoc.exists() ? spoiledCompStockDoc.data() as ComponentStock : { ...INITIAL_COMPONENT_STOCK };
        
        const compModel = getComponentModelStock(compData.items, brand, series, model);
        const spoiledCompModel = getComponentModelStock(spoiledCompData.items, brand, series, model);

        const actualComponentChanges: Record<ComponentType, number> = {} as Record<ComponentType, number>;

        // All components from the breakdown are accounted for:
        // Either they are "good" (in componentChanges) or they are "spoiled" (laptopQuantity - goodQty)
        COMPONENTS.forEach(comp => {
          const goodQty = componentChanges[comp] ?? laptopQuantity;
          const spoiledQty = laptopQuantity - goodQty;
          
          actualComponentChanges[comp] = goodQty;
          
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
          componentChanges: actualComponentChanges,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          notes
        };

        // Record the laptop transaction (deduction)
        const laptopTxRef = doc(collection(db, 'transactions'));
        const laptopTxData = {
          type: 'BREAKDOWN',
          batchId,
          batchActive: batchData.active ?? true,
          brand,
          series,
          model,
          fromClass,
          toClass: 'UNCLASSIFIED', // Not used for BREAKDOWN, but required by type
          quantity: laptopQuantity,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          notes: `Broken down into components: ${notes}`,
          componentChanges: actualComponentChanges
        };

        transaction.set(batchRef, batchData);
        transaction.set(compStockRef, compData);
        transaction.set(spoiledCompStockRef, spoiledCompData);
        transaction.set(compTxRef, compTxData);
        transaction.set(laptopTxRef, laptopTxData);
      }), 15000, t.transactionTimeout || 'Transaction timed out. Please check your connection and try again.');

      setSuccess(t.breakdownSuccess);
      return true;
    } catch (err: any) {
      console.error('Breakdown failed:', err);
      setError(err.message || t.breakdownFailed);
      return false;
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
    if (!user || !brand.trim() || !series.trim() || !model.trim()) return false;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await withTimeout(
        runTransaction(db, async (transaction) => {
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
          batchActive: true,
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
      }), 15000, t.transactionTimeout || 'Transaction timed out. Please check your connection and try again.');

      setSuccess(t.purchaseSuccess);
      return true;
    } catch (err: any) {
      console.error('Purchase failed:', err);
      setError(err.message || t.purchaseFailed);
      return false;
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
    if (!user || !brand.trim() || !series.trim() || !model.trim()) return false;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await withTimeout(
        runTransaction(db, async (transaction) => {
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
          batchActive: true,
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
      }), 15000, t.transactionTimeout || 'Transaction timed out. Please check your connection and try again.');

      setSuccess(t.installSuccess);
      return true;
    } catch (err: any) {
      console.error('Installation failed:', err);
      setError(err.message || t.installFailed);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUndoTransaction = async (transactionId: string, currentUserProfile: UserProfile | null) => {
    if (!user || !currentUserProfile || !transactionId) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await withTimeout(
        runTransaction(db, async (transaction) => {
          const txRef = doc(db, 'transactions', transactionId);
          const txDoc = await transaction.get(txRef);

        if (!txDoc.exists()) {
          throw new Error('Transaction not found');
        }

        const txData = txDoc.data() as Transaction;

        if (txData.isUndone) {
          throw new Error('Transaction is already undone');
        }

        if (txData.type === 'UNDO') {
          throw new Error('Cannot undo an undo transaction. Please perform the action manually.');
        }

        // Permission Check
        const isOwnTransaction = txData.userId === user.uid;
        const isUltimateAdmin = currentUserProfile.isUltimateAdmin;
        const isOriginalAdmin = currentUserProfile.isOriginalAdmin;

        let canUndo = false;

        if (isOriginalAdmin) {
          canUndo = true; // Original Admin can undo anything
        } else if (isUltimateAdmin) {
          // Ultimate Admin can undo their own, or normal users' transactions
          if (isOwnTransaction) {
            canUndo = true;
          } else {
            // Need to fetch the user profile of the transaction owner to check their role
            const ownerRef = doc(db, 'users', txData.userId);
            const ownerDoc = await transaction.get(ownerRef);
            if (ownerDoc.exists()) {
              const ownerProfile = ownerDoc.data() as UserProfile;
              if (!ownerProfile.isUltimateAdmin && !ownerProfile.isOriginalAdmin) {
                canUndo = true;
              }
            }
          }
        } else if (isOwnTransaction) {
          canUndo = true; // Normal users can only undo their own
        }

        if (!canUndo) {
          throw new Error('You do not have permission to undo this transaction.');
        }

        // Reverse the transaction logic
        const batchRef = doc(db, 'batches', txData.batchId);
        
        const batchDoc = await transaction.get(batchRef);

        let newBatchStock: Batch | null = null;
        if (batchDoc.exists()) {
          const data = batchDoc.data() as Batch;
          newBatchStock = {
            ...data,
            batchId: data.batchId || txData.batchId,
            items: (data.items || []).filter(i => typeof i === 'object' && i !== null),
          };
        } else if (txData.type === 'DELETION') {
          throw new Error("Cannot undo deletion: Batch record missing.");
        }

        const quantity = txData.quantity;

        let batchModelStock: ModelStock | null = null;

        // Only initialize laptop model stock for types that affect laptop inventory directly
        const laptopAffectingTypes: TransactionType[] = ['INCOMING', 'SALE', 'REPAIR', 'ADJUSTMENT', 'BREAKDOWN'];
        if (laptopAffectingTypes.includes(txData.type)) {
          if (newBatchStock) {
            batchModelStock = getModelStock(newBatchStock.items, txData.brand, txData.series, txData.model);
          }
        }

        if (txData.type === 'INCOMING') {
          if (batchModelStock) batchModelStock.counts['UNCLASSIFIED'] -= quantity;
        } else if (txData.type === 'SALE') {
          if (txData.fromClass) {
            if (batchModelStock) batchModelStock.counts[txData.fromClass] += quantity;
          }
        } else if (txData.type === 'REPAIR') {
          if (txData.fromClass && txData.toClass) {
            if (batchModelStock) {
              batchModelStock.counts[txData.toClass] -= quantity;
              batchModelStock.counts[txData.fromClass] += quantity;
            }
          }
        } else if (txData.type === 'ADJUSTMENT') {
           if (txData.toClass) {
              if (batchModelStock) batchModelStock.counts[txData.toClass] -= quantity;
           }
        } else if (txData.type === 'BREAKDOWN') {
           if (txData.fromClass) {
              if (batchModelStock) batchModelStock.counts[txData.fromClass] += quantity;
           }
           // Reverse component changes
           const compStockRef = doc(db, 'components', 'current');
           const spoiledCompStockRef = doc(db, 'components', 'spoiled');
           const compStockDoc = await transaction.get(compStockRef);
           const spoiledCompStockDoc = await transaction.get(spoiledCompStockRef);

           let compData = compStockDoc.exists() ? compStockDoc.data() as ComponentStock : { ...INITIAL_COMPONENT_STOCK };
           let spoiledCompData = spoiledCompStockDoc.exists() ? spoiledCompStockDoc.data() as ComponentStock : { ...INITIAL_COMPONENT_STOCK };
           
           const compModel = getComponentModelStock(compData.items, txData.brand, txData.series, txData.model);
           const spoiledCompModel = getComponentModelStock(spoiledCompData.items, txData.brand, txData.series, txData.model);

           if (txData.componentChanges) {
             COMPONENTS.forEach(comp => {
               const goodQty = txData.componentChanges![comp] || 0;
               const spoiledQty = quantity - goodQty;
               
               compModel.counts[comp] = (compModel.counts[comp] || 0) - goodQty;
               spoiledCompModel.counts[comp] = (spoiledCompModel.counts[comp] || 0) - spoiledQty;
             });
           }
           compData.lastUpdated = new Date().toISOString();
           spoiledCompData.lastUpdated = new Date().toISOString();
           transaction.set(compStockRef, compData);
           transaction.set(spoiledCompStockRef, spoiledCompData);
        } else if (txData.type === 'PURCHASE') {
           const compStockRef = doc(db, 'components', 'current');
           const compStockDoc = await transaction.get(compStockRef);
           let compData = compStockDoc.exists() ? compStockDoc.data() as ComponentStock : { ...INITIAL_COMPONENT_STOCK };
           const compModel = getComponentModelStock(compData.items, txData.brand, txData.series, txData.model);

           if (txData.componentChanges) {
             Object.entries(txData.componentChanges).forEach(([comp, qty]) => {
               compModel.counts[comp as ComponentType] = (compModel.counts[comp as ComponentType] || 0) - (qty || 0);
             });
           }
           compData.lastUpdated = new Date().toISOString();
           transaction.set(compStockRef, compData);
        } else if (txData.type === 'INSTALL') {
           const compStockRef = doc(db, 'components', 'current');
           const compStockDoc = await transaction.get(compStockRef);
           let compData = compStockDoc.exists() ? compStockDoc.data() as ComponentStock : { ...INITIAL_COMPONENT_STOCK };
           const compModel = getComponentModelStock(compData.items, txData.brand, txData.series, txData.model);

           if (txData.componentChanges) {
             Object.entries(txData.componentChanges).forEach(([comp, qty]) => {
               compModel.counts[comp as ComponentType] = (compModel.counts[comp as ComponentType] || 0) + (qty || 0);
             });
           }
           compData.lastUpdated = new Date().toISOString();
           transaction.set(compStockRef, compData);
        } else if (txData.type === 'DELETION') {
           if (newBatchStock) {
              newBatchStock.active = true;
           }
           const txQuery = query(collection(db, 'transactions'), where('batchId', '==', txData.batchId));
           const txSnaps = await getDocs(txQuery);
           txSnaps.docs.forEach(txDoc => {
             if (txDoc.id !== transactionId) {
               transaction.update(txDoc.ref, { batchActive: true });
             }
           });
        }

        // Update batch stock if it exists
        if (newBatchStock && batchDoc.exists()) {
           transaction.set(batchRef, newBatchStock);
        }

        // Mark original transaction as undone
        transaction.update(txRef, { isUndone: true });

        // Calculate the correct quantity for the UNDO record to show opposite sign in ledger
        let undoQuantity = -txData.quantity;
        if (txData.type === 'SALE' || txData.type === 'BREAKDOWN') {
          undoQuantity = txData.quantity;
        } else if (txData.type === 'PURCHASE') {
          const totalComponents = Object.values(txData.componentChanges || {}).reduce((a, b) => a + (b || 0), 0);
          undoQuantity = -totalComponents;
        } else if (txData.type === 'INSTALL') {
          const totalComponents = Object.values(txData.componentChanges || {}).reduce((a, b) => a + (b || 0), 0);
          undoQuantity = totalComponents;
        } else if (txData.type === 'DELETION') {
          undoQuantity = -txData.quantity; // txData.quantity is negative, so undoQuantity becomes positive
        }

        // Create a new UNDO transaction record
        const undoTxRef = doc(collection(db, 'transactions'));
        const undoTxData: any = {
          type: 'UNDO',
          undoneType: txData.type,
          batchId: txData.batchId,
          batchActive: txData.batchActive ?? true,
          brand: txData.brand,
          series: txData.series,
          model: txData.model,
          quantity: undoQuantity,
          timestamp: new Date().toISOString(),
          userId: user.uid,
          notes: `Undid ${txData.type} for ${txData.brand} ${txData.model}`,
        };
        if (txData.fromClass) undoTxData.fromClass = txData.fromClass;
        if (txData.toClass) undoTxData.toClass = txData.toClass;
        if (txData.componentChanges) undoTxData.componentChanges = txData.componentChanges;

        transaction.set(undoTxRef, undoTxData);

        // Also record in component_transactions if it was a component-related transaction
        if (txData.type === 'BREAKDOWN' || txData.type === 'PURCHASE' || txData.type === 'INSTALL') {
          const compTxRef = doc(collection(db, 'component_transactions'));
          const compUndoChanges: Partial<Record<ComponentType, number>> = {};
          
          if (txData.componentChanges) {
            Object.entries(txData.componentChanges).forEach(([comp, qty]) => {
              // For BREAKDOWN and PURCHASE, undo means removing components (negative)
              // For INSTALL, undo means adding components back (positive)
              const multiplier = (txData.type === 'BREAKDOWN' || txData.type === 'PURCHASE') ? -1 : 1;
              compUndoChanges[comp as ComponentType] = (qty || 0) * multiplier;
            });
          }

          const compUndoTxData: any = {
            type: 'UNDO',
            undoneType: txData.type,
            brand: txData.brand,
            series: txData.series,
            model: txData.model,
            componentChanges: compUndoChanges,
            timestamp: new Date().toISOString(),
            userId: user.uid,
            notes: `Undid ${txData.type} for ${txData.brand} ${txData.model}`,
          };

          if (txData.type === 'BREAKDOWN') {
            compUndoTxData.fromClass = txData.fromClass;
            compUndoTxData.laptopQuantity = txData.quantity;
          }

          transaction.set(compTxRef, compUndoTxData);
        }
      }), 15000, t.transactionTimeout || 'Transaction timed out. Please check your connection and try again.');

      setSuccess(t.undoSuccess);
      return true;
    } catch (err: any) {
      console.error('Undo failed:', err);
      setError(err.message || t.undoFailed);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleAddTransaction, handleRenameBatch, handleDeleteBatch, recordComponentBreakdown, recordComponentPurchase, recordComponentInstallation, handleUndoTransaction, isSubmitting, isRenaming, error, setError, success, setSuccess };
}
