import { Stock, Transaction, Batch, UserProfile, ComponentStock, ComponentTransaction } from '../types';
import { INITIAL_STOCK, INITIAL_COMPONENT_STOCK } from '../constants';

const STORAGE_KEY = 'repair_ledger_data';

interface LocalData {
  stock: Stock;
  componentStock: ComponentStock;
  spoiledComponentStock: ComponentStock;
  batches: Batch[];
  transactions: Transaction[];
  componentTransactions: ComponentTransaction[];
  users: Record<string, UserProfile>;
}

const getInitialData = (): LocalData => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      // Ensure new fields exist for backward compatibility
      if (!data.componentStock) data.componentStock = INITIAL_COMPONENT_STOCK;
      if (!data.spoiledComponentStock) data.spoiledComponentStock = INITIAL_COMPONENT_STOCK;
      if (!data.componentTransactions) data.componentTransactions = [];
      return data;
    } catch (e) {
      console.error('Failed to parse local data', e);
    }
  }
  return {
    stock: INITIAL_STOCK,
    componentStock: INITIAL_COMPONENT_STOCK,
    spoiledComponentStock: INITIAL_COMPONENT_STOCK,
    batches: [],
    transactions: [],
    componentTransactions: [],
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
  getComponentStock: () => localData.componentStock,
  getSpoiledComponentStock: () => localData.spoiledComponentStock,
  getBatches: () => localData.batches,
  getTransactions: () => localData.transactions,
  getComponentTransactions: () => localData.componentTransactions,
  getUsers: () => localData.users,
  
  updateStock: (newStock: Stock) => {
    localData.stock = newStock;
    saveData();
  },

  updateComponentStock: (newStock: ComponentStock) => {
    localData.componentStock = newStock;
    saveData();
  },

  updateSpoiledComponentStock: (newStock: ComponentStock) => {
    localData.spoiledComponentStock = newStock;
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

  addComponentTransaction: (tx: ComponentTransaction) => {
    localData.componentTransactions.unshift(tx);
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
