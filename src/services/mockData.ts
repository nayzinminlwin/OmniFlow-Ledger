import { Stock, Transaction, Batch, UserProfile } from '../types';
import { INITIAL_STOCK } from '../constants';

const STORAGE_KEY = 'repair_ledger_data';

interface LocalData {
  stock: Stock;
  batches: Batch[];
  transactions: Transaction[];
  users: Record<string, UserProfile>;
}

const getInitialData = (): LocalData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse local data', e);
    }
  }
  return {
    stock: INITIAL_STOCK,
    batches: [],
    transactions: [],
    users: {
      'mock-admin': {
        uid: 'mock-admin',
        username: 'Admin (Local)',
        email: 'admin@local.test',
        status: 'approved',
        role: 'admin',
        isUltimateAdmin: true,
        isOriginalAdmin: true,
        createdAt: new Date().toISOString()
      }
    }
  };
};

let localData = getInitialData();

const saveData = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localData));
};

export const mockService = {
  getStock: () => localData.stock,
  getBatches: () => localData.batches,
  getTransactions: () => localData.transactions,
  getUsers: () => localData.users,
  
  updateStock: (newStock: Stock) => {
    localData.stock = newStock;
    saveData();
  },
  
  updateBatch: (batch: Batch) => {
    const index = localData.batches.findIndex(b => b.batchId === batch.batchId);
    if (index >= 0) {
      localData.batches[index] = batch;
    } else {
      localData.batches.push(batch);
    }
    saveData();
  },
  
  addTransaction: (tx: Transaction) => {
    localData.transactions.unshift(tx);
    saveData();
  },
  
  deleteBatch: (batchId: string) => {
    const batch = localData.batches.find(b => b.batchId === batchId);
    if (batch) {
      batch.active = false;
      localData.transactions.forEach(tx => {
        if (tx.batchId === batchId) tx.batchActive = false;
      });
      saveData();
    }
  },
  
  renameBatch: (oldId: string, newId: string, newData: any) => {
    const index = localData.batches.findIndex(b => b.batchId === oldId);
    if (index >= 0) {
      localData.batches[index] = { ...newData, batchId: newId };
      localData.transactions.forEach(tx => {
        if (tx.batchId === oldId) tx.batchId = newId;
      });
      saveData();
    }
  }
};
