import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransactionActions } from '../src/hooks/useTransactionActions';
import { User } from 'firebase/auth';
import { Stock, UserProfile } from '../src/types';
import * as firestore from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(),
    collection: vi.fn(),
    runTransaction: vi.fn(),
    writeBatch: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
  };
});

vi.mock('../src/firebase', () => ({
  db: {},
}));

describe('useTransactionActions', () => {
  const mockUser = { uid: 'user123' } as User;
  const mockStock: Stock = { items: [], lastUpdated: new Date().toISOString() };
  const mockLang = 'en';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isRenaming).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.success).toBeNull();
  });

  describe('handleUndoTransaction', () => {
    it('should return early if user or transactionId is missing', async () => {
      const { result } = renderHook(() => useTransactionActions(null, mockStock, mockLang));
      const res = await result.current.handleUndoTransaction('tx1', null);
      expect(res).toBeUndefined();
    });

    it('should throw an error if transaction is not found', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      const mockTransaction = {
        get: vi.fn().mockResolvedValueOnce({ exists: () => false }),
      };
      
      vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
        await updateFunction(mockTransaction as any);
      });

      const mockProfile: UserProfile = { uid: 'user123', username: 'test', email: 'test@test.com', status: 'approved', role: 'user', createdAt: '' };

      await act(async () => {
        await result.current.handleUndoTransaction('tx1', mockProfile);
      });

      expect(result.current.error).toBe('Transaction not found');
    });

    it('should throw an error if transaction is already undone', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      const mockTransaction = {
        get: vi.fn().mockResolvedValueOnce({ 
          exists: () => true,
          data: () => ({ isUndone: true })
        }),
      };
      
      vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
        await updateFunction(mockTransaction as any);
      });

      const mockProfile: UserProfile = { uid: 'user123', username: 'test', email: 'test@test.com', status: 'approved', role: 'user', createdAt: '' };

      await act(async () => {
        await result.current.handleUndoTransaction('tx1', mockProfile);
      });

      expect(result.current.error).toBe('Transaction is already undone');
    });

    it('should deny permission for normal user trying to undo another user transaction', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      const mockTransaction = {
        get: vi.fn().mockResolvedValueOnce({ 
          exists: () => true,
          data: () => ({ isUndone: false, userId: 'otherUser' })
        }),
      };
      
      vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
        await updateFunction(mockTransaction as any);
      });

      const mockProfile: UserProfile = { uid: 'user123', username: 'test', email: 'test@test.com', status: 'approved', role: 'user', createdAt: '' };

      await act(async () => {
        await result.current.handleUndoTransaction('tx1', mockProfile);
      });

      expect(result.current.error).toBe('You do not have permission to undo this transaction.');
    });

    it('should allow Original Admin to undo any transaction', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      const mockTxData = { 
        isUndone: false, 
        userId: 'otherUser',
        type: 'INCOMING',
        batchId: 'batch1',
        brand: 'Apple',
        series: 'MacBook',
        model: 'Pro',
        quantity: 5
      };

      const mockTransaction = {
        get: vi.fn()
          .mockResolvedValueOnce({ exists: () => true, data: () => mockTxData }) // txDoc
          .mockResolvedValueOnce({ exists: () => true, data: () => mockStock }) // stockDoc
          .mockResolvedValueOnce({ exists: () => true, data: () => ({ batchId: 'batch1', items: [] }) }), // batchDoc
        update: vi.fn(),
        set: vi.fn(),
      };
      
      vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
        await updateFunction(mockTransaction as any);
      });

      const mockProfile: UserProfile = { uid: 'user123', username: 'test', email: 'test@test.com', status: 'approved', role: 'user', createdAt: '', isOriginalAdmin: true };

      await act(async () => {
        await result.current.handleUndoTransaction('tx1', mockProfile);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.success).toBe('Transaction undone successfully!');
    });
  });

  describe('handleAddTransaction', () => {
    it('should successfully record an incoming transaction', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => mockStock }),
        set: vi.fn(),
        update: vi.fn(),
      };
      
      vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
        await updateFunction(mockTransaction as any);
      });

      await act(async () => {
        const res = await result.current.handleAddTransaction(
          'INCOMING',
          'B-2023-01',
          'Apple',
          'MacBook',
          'Pro',
          'D',
          'UNCLASSIFIED',
          10,
          'Test incoming'
        );
        expect(res).toBe(true);
      });

      expect(firestore.runTransaction).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalledTimes(3); // Stock, Batch, Transaction
      expect(result.current.success).toBe('Transaction recorded successfully!');
    });

    it('should handle errors in transaction', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      vi.mocked(firestore.runTransaction).mockRejectedValue(new Error('Firestore error'));

      await act(async () => {
        const res = await result.current.handleAddTransaction(
          'INCOMING',
          'B-2023-01',
          'Apple',
          'MacBook',
          'Pro',
          'D',
          'UNCLASSIFIED',
          10,
          'Test incoming'
        );
        expect(res).toBe(false);
      });

      expect(result.current.error).toBe('Firestore error');
    });

    it('should successfully record a repair transaction', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => mockStock }),
        set: vi.fn(),
        update: vi.fn(),
      };
      
      vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
        await updateFunction(mockTransaction as any);
      });

      await act(async () => {
        const res = await result.current.handleAddTransaction(
          'REPAIR',
          'B-2023-01',
          'Apple',
          'MacBook',
          'Pro',
          'UNCLASSIFIED',
          'A',
          5,
          'Test repair'
        );
        expect(res).toBe(true);
      });

      expect(firestore.runTransaction).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalledTimes(3); // Stock, Batch, Transaction
      expect(result.current.success).toBe('Transaction recorded successfully!');
    });

    it('should successfully record an adjustment transaction', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => mockStock }),
        set: vi.fn(),
        update: vi.fn(),
      };
      
      vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
        await updateFunction(mockTransaction as any);
      });

      await act(async () => {
        const res = await result.current.handleAddTransaction(
          'ADJUSTMENT',
          'B-2023-01',
          'Apple',
          'MacBook',
          'Pro',
          'D',
          'A',
          2,
          'Test adjustment'
        );
        expect(res).toBe(true);
      });

      expect(firestore.runTransaction).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalledTimes(3); // Stock, Batch, Transaction
      expect(result.current.success).toBe('Transaction recorded successfully!');
    });
  });

  describe('handleRenameBatch', () => {
    it('should successfully rename a batch', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      vi.mocked(firestore.getDoc)
        .mockResolvedValueOnce({ exists: () => true, data: () => ({ batchId: 'oldBatch' }) } as any)
        .mockResolvedValueOnce({ exists: () => false } as any);

      vi.mocked(firestore.getDocs).mockResolvedValue({ docs: [] } as any);

      const mockSetSelectedBatchId = vi.fn();

      await act(async () => {
        const res = await result.current.handleRenameBatch(
          { batchId: 'oldBatch', items: [], createdAt: '' },
          'newBatch',
          'oldBatch',
          mockSetSelectedBatchId
        );
        expect(res).toBe(true);
      });

      expect(firestore.writeBatch).toHaveBeenCalled();
      expect(result.current.success).toBe('Batch renamed successfully!');
    });
  });

  describe('handleDeleteBatch', () => {
    it('should successfully delete a batch', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      const mockBatch = { batchId: 'batch1', items: [{ brand: 'Apple', series: 'MacBook', model: 'Pro', counts: { A: 5 } }] };
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => mockStock }),
        update: vi.fn(),
        set: vi.fn(),
      };
      
      vi.mocked(firestore.getDoc).mockResolvedValue({ exists: () => true, data: () => mockBatch } as any);
      vi.mocked(firestore.getDocs).mockResolvedValue({ docs: [] } as any);
      vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
        await updateFunction(mockTransaction as any);
      });

      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const mockSetSelectedBatchId = vi.fn();

      await act(async () => {
        const res = await result.current.handleDeleteBatch('batch1', mockSetSelectedBatchId);
        expect(res).toBe(true);
      });

      expect(firestore.runTransaction).toHaveBeenCalled();
      expect(mockTransaction.update).toHaveBeenCalled();
      expect(result.current.success).toBe('Batch deleted successfully!');
    });
  });

  describe('recordComponentPurchase', () => {
    it('should successfully record a component purchase', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ items: [] }) }),
        set: vi.fn(),
      };
      
      vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
        await updateFunction(mockTransaction as any);
      });

      await act(async () => {
        const res = await result.current.recordComponentPurchase({
          brand: 'Apple',
          series: 'MacBook',
          model: 'Pro',
          componentChanges: { Screen: 10 },
          notes: 'Bought screens'
        });
        expect(res).toBe(true);
      });

      expect(firestore.runTransaction).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalledTimes(3); // ComponentStock, CompTx, LaptopTx
      expect(result.current.success).toBe('Component purchase recorded successfully!');
    });
  });

  describe('recordComponentInstallation', () => {
    it('should successfully record a component installation', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: () => true, data: () => ({ items: [{ brand: 'Apple', series: 'MacBook', model: 'Pro', counts: { Screen: 10 } }] }) }),
        set: vi.fn(),
      };
      
      vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
        await updateFunction(mockTransaction as any);
      });

      await act(async () => {
        const res = await result.current.recordComponentInstallation({
          brand: 'Apple',
          series: 'MacBook',
          model: 'Pro',
          componentChanges: { Screen: 2 },
          notes: 'Installed screens'
        });
        expect(res).toBe(true);
      });

      expect(firestore.runTransaction).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalledTimes(3);
      expect(result.current.success).toBe('Component installation recorded successfully!');
    });
  });

  describe('recordComponentBreakdown', () => {
    it('should successfully record a component breakdown', async () => {
      const { result } = renderHook(() => useTransactionActions(mockUser, mockStock, mockLang));
      
      const mockBatch = { batchId: 'batch1', items: [{ brand: 'Apple', series: 'MacBook', model: 'Pro', counts: { A: 5 } }] };
      const mockTransaction = {
        get: vi.fn()
          .mockResolvedValueOnce({ exists: () => true, data: () => mockStock })
          .mockResolvedValueOnce({ exists: () => true, data: () => ({ items: [] }) })
          .mockResolvedValueOnce({ exists: () => true, data: () => ({ items: [] }) })
          .mockResolvedValueOnce({ exists: () => true, data: () => mockBatch }),
        set: vi.fn(),
      };
      
      vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
        await updateFunction(mockTransaction as any);
      });

      await act(async () => {
        const res = await result.current.recordComponentBreakdown({
          batchId: 'batch1',
          brand: 'Apple',
          series: 'MacBook',
          model: 'Pro',
          fromClass: 'A',
          laptopQuantity: 1,
          componentChanges: { Screen: 1 },
          notes: 'Breakdown'
        });
        expect(res).toBe(true);
      });

      expect(firestore.runTransaction).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalled();
      expect(result.current.success).toBe('Breakdown recorded successfully!');
    });
  });
});
