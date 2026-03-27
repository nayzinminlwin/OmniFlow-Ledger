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
});
