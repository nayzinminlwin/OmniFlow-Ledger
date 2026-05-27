import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  query, 
  orderBy, 
  limit,
  getDocFromServer
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { Stock, Transaction, Batch, UserProfile, ComponentStock, ComponentTransaction, ModelStock } from '../types';
import { INITIAL_STOCK, INITIAL_COMPONENT_STOCK, INITIAL_CLASS_COUNTS } from '../constants';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { translations, Language } from '../translations';

export function useInventory(user: User | null, isAuthReady: boolean, lang: Language, isApproved: boolean) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stock, setStock] = useState<Stock | null>(null);
  const [componentStock, setComponentStock] = useState<ComponentStock | null>(null);
  const [spoiledComponentStock, setSpoiledComponentStock] = useState<ComponentStock | null>(null);
  const [componentTransactions, setComponentTransactions] = useState<ComponentTransaction[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [loadingStates, setLoadingStates] = useState({
    stock: true,
    batches: true,
    transactions: true,
    componentStock: true,
    spoiledComponentStock: true,
    componentTransactions: true,
    users: true
  });
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  const loading = loadingStates.stock || loadingStates.batches || loadingStates.transactions || loadingStates.users || loadingStates.componentStock || loadingStates.componentTransactions;

  // Test connection - removed inventory/current check as it's being deprecated
  useEffect(() => {
    if (!isAuthReady || !user || !isApproved) return;
    
    async function testConnection() {
      try {
        // Test with batches collection instead
        await getDocFromServer(doc(collection(db, 'batches'), 'test'));
      } catch (err) {
        if (err instanceof Error && err.message.includes('the client is offline')) {
          setError(t.firestoreOffline);
        }
      }
    }
    testConnection();
  }, [isAuthReady, user, isApproved, t.firestoreOffline]);

  // Derive global stock from batches
  useEffect(() => {
    if (batches.length === 0) {
      setStock({ items: [], lastUpdated: new Date().toISOString() });
      setLoadingStates(prev => ({ ...prev, stock: false }));
      return;
    }

    const aggregatedItems: ModelStock[] = [];
    
    batches.forEach(batch => {
      if (batch.active === false || !batch.items || !Array.isArray(batch.items)) return;
      
      batch.items.forEach(batchItem => {
        if (!batchItem || !batchItem.brand || !batchItem.model) return;
        
        let globalItem = aggregatedItems.find(i => 
          i.brand === batchItem.brand && 
          i.series === batchItem.series && 
          i.model === batchItem.model
        );
        
        if (!globalItem) {
          globalItem = {
            brand: batchItem.brand,
            series: batchItem.series,
            model: batchItem.model,
            counts: { ...INITIAL_CLASS_COUNTS }
          };
          aggregatedItems.push(globalItem);
        }
        
        if (!batchItem.counts || typeof batchItem.counts !== 'object') return;
        
        Object.entries(batchItem.counts).forEach(([cls, count]) => {
          if (globalItem) {
            globalItem.counts[cls as any] = (globalItem.counts[cls as any] || 0) + (Number(count) || 0);
          }
        });
      });
    });
    
    setStock({
      items: aggregatedItems,
      lastUpdated: new Date().toISOString()
    });
    setLoadingStates(prev => ({ ...prev, stock: false }));
  }, [batches]);

  useEffect(() => {
    if (!isAuthReady || !user || !isApproved) {
      if (isAuthReady && (!user || !isApproved)) {
        setLoadingStates({ stock: false, batches: false, transactions: false, users: false, componentStock: false, componentTransactions: false });
      }
      return;
    }

    const compStockRef = doc(db, 'components', 'current');
    const spoiledCompStockRef = doc(db, 'components', 'spoiled');
    const txQuery = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(50));
    const compTxQuery = query(collection(db, 'component_transactions'), orderBy('timestamp', 'desc'), limit(50));
    const batchesQuery = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));
    const usersQuery = query(collection(db, 'users'));

    const unsubCompStock = onSnapshot(compStockRef, { includeMetadataChanges: true }, (snapshot: any) => {
      if (snapshot.exists()) {
        setComponentStock(snapshot.data() as ComponentStock);
      } else {
        setComponentStock(null);
      }
      setLoadingStates(prev => ({ ...prev, componentStock: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'components/current');
      setLoadingStates(prev => ({ ...prev, componentStock: false }));
    });

    const unsubSpoiledCompStock = onSnapshot(spoiledCompStockRef, { includeMetadataChanges: true }, (snapshot: any) => {
      if (snapshot.exists()) {
        setSpoiledComponentStock(snapshot.data() as ComponentStock);
      } else {
        setSpoiledComponentStock(null);
      }
      setLoadingStates(prev => ({ ...prev, spoiledComponentStock: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'components/spoiled');
      setLoadingStates(prev => ({ ...prev, spoiledComponentStock: false }));
    });

    const unsubBatches = onSnapshot(batchesQuery, { includeMetadataChanges: true }, (snapshot) => {
      const b: Batch[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Batch;
        // Filter out empty skeleton documents and inactive batches
        if (data.batchId && data.active !== false) {
          b.push({ id: doc.id, ...data } as Batch);
        }
      });
      setBatches(b);
      setLoadingStates(prev => ({ ...prev, batches: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'batches');
      setLoadingStates(prev => ({ ...prev, batches: false }));
    });

    const unsubTx = onSnapshot(txQuery, { includeMetadataChanges: true }, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Transaction;
        // Filter out empty skeleton documents
        if (data.type) {
          txs.push({ id: doc.id, ...data } as Transaction);
        }
      });
      setTransactions(txs);
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'transactions');
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    });

    const unsubCompTx = onSnapshot(compTxQuery, { includeMetadataChanges: true }, (snapshot) => {
      const txs: ComponentTransaction[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as ComponentTransaction;
        // Filter out empty skeleton documents
        if (data.type) {
          txs.push({ id: doc.id, ...data } as ComponentTransaction);
        }
      });
      setComponentTransactions(txs);
      setLoadingStates(prev => ({ ...prev, componentTransactions: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'component_transactions');
      setLoadingStates(prev => ({ ...prev, componentTransactions: false }));
    });

    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const uMap: Record<string, UserProfile> = {};
      snapshot.forEach((doc) => {
        const data = doc.data() as UserProfile;
        // Filter out empty skeleton documents
        if (data.uid || data.email) {
          uMap[doc.id] = data;
        }
      });
      setUsers(uMap);
      setLoadingStates(prev => ({ ...prev, users: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
      setLoadingStates(prev => ({ ...prev, users: false }));
    });

    return () => {
      unsubCompStock();
      unsubSpoiledCompStock();
      unsubBatches();
      unsubTx();
      unsubCompTx();
      unsubUsers();
    };
  }, [isAuthReady, user, isApproved]);

  return { stock, componentStock, spoiledComponentStock, batches, transactions, componentTransactions, users, loading, error, setError };
}
