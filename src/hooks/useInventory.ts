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
import { Stock, Transaction, Batch } from '../types';
import { INITIAL_STOCK } from '../constants';
import { handleFirestoreError, OperationType } from '../services/firestore';
import { translations, Language } from '../translations';

export function useInventory(user: User | null, isAuthReady: boolean, lang: Language) {
  const [stock, setStock] = useState<Stock | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingStates, setLoadingStates] = useState({
    stock: true,
    batches: true,
    transactions: true
  });
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  const loading = loadingStates.stock || loadingStates.batches || loadingStates.transactions;

  // Test connection
  useEffect(() => {
    if (!isAuthReady || !user) return;
    
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'inventory', 'current'));
      } catch (err) {
        if (err instanceof Error && err.message.includes('the client is offline')) {
          setError(t.firestoreOffline);
        }
      }
    }
    testConnection();
  }, [isAuthReady, user, t.firestoreOffline]);

  useEffect(() => {
    if (!isAuthReady || !user) {
      if (isAuthReady && !user) setLoadingStates({ stock: false, batches: false, transactions: false });
      return;
    }

    const stockRef = doc(db, 'inventory', 'current');
    const txQuery = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(50));
    const batchesQuery = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));

    const unsubStock = onSnapshot(stockRef, { includeMetadataChanges: true }, (snapshot: any) => {
      if (snapshot.exists()) {
        setStock(snapshot.data() as Stock);
      } else {
        setStock(null);
      }
      setLoadingStates(prev => ({ ...prev, stock: false }));
    }, (err) => {
      console.error('Stock snapshot error:', err);
      setError(t.firestoreOffline); // Or a more specific error
      setLoadingStates(prev => ({ ...prev, stock: false }));
    });

    const unsubBatches = onSnapshot(batchesQuery, { includeMetadataChanges: true }, (snapshot) => {
      const b: Batch[] = [];
      snapshot.forEach((doc) => {
        b.push({ id: doc.id, ...doc.data() } as Batch);
      });
      setBatches(b);
      setLoadingStates(prev => ({ ...prev, batches: false }));
    }, (err) => {
      console.error('Batches snapshot error:', err);
      setLoadingStates(prev => ({ ...prev, batches: false }));
    });

    const unsubTx = onSnapshot(txQuery, { includeMetadataChanges: true }, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(txs);
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    }, (err) => {
      console.error('Transactions snapshot error:', err);
      setLoadingStates(prev => ({ ...prev, transactions: false }));
    });

    return () => {
      unsubStock();
      unsubBatches();
      unsubTx();
    };
  }, [isAuthReady, user]);

  return { stock, batches, transactions, loading, error, setError };
}
