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
import { Stock, Transaction, Batch, UserProfile, ComponentStock, ComponentTransaction } from '../types';
import { INITIAL_STOCK, INITIAL_COMPONENT_STOCK } from '../constants';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { translations, Language } from '../translations';
import { mockService } from '../services/mockData';

export function useInventory(user: User | null, isAuthReady: boolean, lang: Language, isApproved: boolean) {
  const [stock, setStock] = useState<Stock | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [componentStock, setComponentStock] = useState<ComponentStock | null>(null);
  const [componentTransactions, setComponentTransactions] = useState<ComponentTransaction[]>([]);
  const [users, setUsers] = useState<Record<string, UserProfile>>({});
  const [loadingStates, setLoadingStates] = useState({
    stock: true,
    batches: true,
    transactions: true,
    componentStock: true,
    componentTransactions: true,
    users: true
  });
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  const isMockMode = !user || user.uid === 'mock-admin';

  const loading = loadingStates.stock || loadingStates.batches || loadingStates.transactions || loadingStates.users || loadingStates.componentStock || loadingStates.componentTransactions;

  // Test connection
  useEffect(() => {
    if (!isAuthReady || !user || !isApproved || isMockMode) return;
    
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'inventory', 'current'));
      } catch (err) {
        if (err instanceof Error && err.message.includes('the client is offline')) {
          setError(t.firestoreOffline);
        } else {
          handleFirestoreError(err, OperationType.GET, 'inventory/current');
        }
      }
    }
    testConnection();
  }, [isAuthReady, user, isApproved, t.firestoreOffline, isMockMode]);

  useEffect(() => {
    if (!isAuthReady || !user || !isApproved) {
      if (isAuthReady && (!user || !isApproved)) {
        setLoadingStates({ stock: false, batches: false, transactions: false, users: false, componentStock: false, componentTransactions: false });
      }
      return;
    }

    if (isMockMode) {
      setStock(mockService.getStock());
      setBatches(mockService.getBatches().filter(b => b.active !== false));
      setTransactions(mockService.getTransactions().filter(tx => tx.batchActive !== false));
      setComponentStock(INITIAL_COMPONENT_STOCK);
      setComponentTransactions([]);
      setUsers(mockService.getUsers());
      setLoadingStates({ stock: false, batches: false, transactions: false, users: false, componentStock: false, componentTransactions: false });
      return;
    }

    const stockRef = doc(db, 'inventory', 'current');
    const compStockRef = doc(db, 'components', 'current');
    const txQuery = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(50));
    const compTxQuery = query(collection(db, 'component_transactions'), orderBy('timestamp', 'desc'), limit(50));
    const batchesQuery = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));
    const usersQuery = query(collection(db, 'users'));

    const unsubStock = onSnapshot(stockRef, { includeMetadataChanges: true }, (snapshot: any) => {
      if (snapshot.exists()) {
        setStock(snapshot.data() as Stock);
      } else {
        setStock(null);
      }
      setLoadingStates(prev => ({ ...prev, stock: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'inventory/current');
      setLoadingStates(prev => ({ ...prev, stock: false }));
    });

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

    const unsubBatches = onSnapshot(batchesQuery, { includeMetadataChanges: true }, (snapshot) => {
      const b: Batch[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Batch;
        if (data.active !== false) {
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
        // Only show transactions for active batches
        if (data.batchActive !== false) {
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
        txs.push({ id: doc.id, ...doc.data() } as ComponentTransaction);
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
        uMap[doc.id] = doc.data() as UserProfile;
      });
      setUsers(uMap);
      setLoadingStates(prev => ({ ...prev, users: false }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'users');
      setLoadingStates(prev => ({ ...prev, users: false }));
    });

    return () => {
      unsubStock();
      unsubCompStock();
      unsubBatches();
      unsubTx();
      unsubCompTx();
      unsubUsers();
    };
  }, [isAuthReady, user, isApproved, isMockMode]);

  return { stock, componentStock, batches, transactions, componentTransactions, users, loading, error, setError };
}
