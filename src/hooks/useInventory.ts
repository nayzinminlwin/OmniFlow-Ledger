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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

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
      if (isAuthReady && !user) setLoading(false);
      return;
    }

    const stockRef = doc(db, 'inventory', 'current');
    const txQuery = query(collection(db, 'transactions'), orderBy('timestamp', 'desc'), limit(50));
    const batchesQuery = query(collection(db, 'batches'), orderBy('createdAt', 'desc'));

    const unsubStock = onSnapshot(stockRef, (doc) => {
      if (doc.exists()) {
        setStock(doc.data() as Stock);
      } else {
        setDoc(stockRef, INITIAL_STOCK).catch(err => handleFirestoreError(err, OperationType.WRITE, 'inventory/current'));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'inventory/current'));

    const unsubBatches = onSnapshot(batchesQuery, (snapshot) => {
      const b: Batch[] = [];
      snapshot.forEach((doc) => {
        b.push({ id: doc.id, ...doc.data() } as Batch);
      });
      setBatches(b);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'batches'));

    const unsubTx = onSnapshot(txQuery, (snapshot) => {
      const txs: Transaction[] = [];
      snapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(txs);
    }, (err) => handleFirestoreError(err, OperationType.GET, 'transactions'));

    return () => {
      unsubStock();
      unsubBatches();
      unsubTx();
    };
  }, [isAuthReady, user]);

  return { stock, batches, transactions, loading, error, setError };
}
