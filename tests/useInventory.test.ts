import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInventory } from '../src/hooks/useInventory';
import { User } from 'firebase/auth';
import * as firestore from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn((db, coll, id) => ({ id: id || 'mock-id', type: 'document', path: `${coll}/${id}` })),
    collection: vi.fn((db, path) => ({ id: path, type: 'collection', path })),
    onSnapshot: vi.fn((ref, options, callback) => {
      const cb = typeof options === 'function' ? options : callback;
      
      const safeRef = ref || {};
      const isQuery = (safeRef as any).type !== 'document';

      const mockSnapshot = {
        exists: () => true,
        data: () => ({}),
        forEach: (fn: any) => {},
        docs: [],
        size: 0,
        empty: true,
        metadata: { fromCache: false, hasPendingWrites: false },
        query: {},
        docChanges: () => []
      };

      // Trigger callback in next tick to allow hook to initialize
      setTimeout(() => {
        if (cb) cb(mockSnapshot);
      }, 0);
      
      return vi.fn(); // Unsubscribe function
    }),
    query: vi.fn((ref) => ref),
    orderBy: vi.fn(),
    limit: vi.fn(),
    getDocFromServer: vi.fn().mockResolvedValue({ exists: () => true }),
  };
});

vi.mock('../src/firebase', () => ({
  db: {},
}));

describe('useInventory', () => {
  const mockUser = { uid: 'user123', email: 'test@test.com' } as User;
  const mockLang = 'en';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useInventory(null, false, mockLang, false));

    expect(result.current.loading).toBe(true);
    // Stock initializes to { items: [], ... } if batches is empty
    expect(result.current.batches).toEqual([]);
  });

  it('should stop loading when auth is ready but no user', async () => {
    const { result } = renderHook(() => useInventory(null, true, mockLang, false));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should set up snapshots when user is approved', async () => {
    const { result } = renderHook(() => useInventory(mockUser, true, mockLang, true));

    expect(firestore.onSnapshot).toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle snapshot data correctly', async () => {
    const mockBatch = { 
      batchId: 'B-2023-01', 
      items: [{ brand: 'Apple', series: 'MacBook', model: 'Pro', counts: { A: 5 } }],
      createdAt: new Date().toISOString(),
      active: true
    };
    
    vi.mocked(firestore.onSnapshot).mockImplementation((ref, options, callback) => {
      const cb = typeof options === 'function' ? options : callback;
      
      const isQuery = (ref as any)?.type !== 'document';

      if (isQuery) {
        cb({ 
          forEach: (fn: any) => {
            // Only provide data for the batches query in this test
            // We can check the path if we want to be more specific
            if ((ref as any)?.path === 'batches') {
              fn({ id: 'batch1', data: () => mockBatch });
            }
          },
          docs: (ref as any)?.path === 'batches' ? [{ id: 'batch1', data: () => mockBatch }] : [],
          size: (ref as any)?.path === 'batches' ? 1 : 0,
          empty: (ref as any)?.path !== 'batches',
          metadata: { fromCache: false, hasPendingWrites: false },
          query: {},
          docChanges: () => []
        } as any);
      } else {
        cb({ 
          exists: () => true, 
          data: () => ({ items: [], lastUpdated: new Date().toISOString() }),
          metadata: { fromCache: false, hasPendingWrites: false }
        } as any);
      }
      return vi.fn();
    });

    const { result } = renderHook(() => useInventory(mockUser, true, mockLang, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.batches.length).toBe(1);
    expect(result.current.batches[0].batchId).toBe('B-2023-01');
    expect(result.current.stock).not.toBeNull();
    expect(result.current.stock?.items.length).toBe(1);
    expect(result.current.stock?.items[0].model).toBe('Pro');
    expect(result.current.stock?.items[0].counts.A).toBe(5);
  });
  
  it('should handle batches with missing counts gracefully', async () => {
    const mockBatchWithMissingCounts = { 
      batchId: 'B-MISSING', 
      items: [{ brand: 'Apple', series: 'MacBook', model: 'Pro' }], // Missing counts
      createdAt: new Date().toISOString(),
      active: true
    };
    
    vi.mocked(firestore.onSnapshot).mockImplementation((ref, options, callback) => {
      const cb = typeof options === 'function' ? options : callback;
      const isQuery = (ref as any)?.type !== 'document';

      if (isQuery) {
        cb({ 
          forEach: (fn: any) => {
            if ((ref as any)?.path === 'batches') {
              fn({ id: 'batch-missing', data: () => mockBatchWithMissingCounts });
            }
          },
          docs: (ref as any)?.path === 'batches' ? [{ id: 'batch-missing', data: () => mockBatchWithMissingCounts }] : [],
          size: (ref as any)?.path === 'batches' ? 1 : 0,
          empty: (ref as any)?.path !== 'batches',
          metadata: { fromCache: false, hasPendingWrites: false },
          query: {},
          docChanges: () => []
        } as any);
      } else {
        cb({ 
          exists: () => true, 
          data: () => ({ items: [], lastUpdated: new Date().toISOString() }),
          metadata: { fromCache: false, hasPendingWrites: false }
        } as any);
      }
      return vi.fn();
    });

    const { result } = renderHook(() => useInventory(mockUser, true, mockLang, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.batches.length).toBe(1);
    expect(result.current.stock?.items.length).toBe(1);
    // Should still have default counts from INITIAL_CLASS_COUNTS
    expect(result.current.stock?.items[0].counts.A).toBe(0);
  });

  it('should handle malformed batch data (missing items or not an array) gracefully', async () => {
    const malformedBatches = [
      { batchId: 'B-NO-ITEMS', createdAt: new Date().toISOString(), active: true }, // Missing items
      { batchId: 'B-ITEMS-NOT-ARRAY', items: 'not-an-array', createdAt: new Date().toISOString(), active: true }, // items not an array
      { batchId: 'B-NULL-ITEM', items: [null], createdAt: new Date().toISOString(), active: true }, // null item in array
      { batchId: 'B-MISSING-BRAND', items: [{ model: 'Pro' }], createdAt: new Date().toISOString(), active: true }, // missing brand
    ];
    
    vi.mocked(firestore.onSnapshot).mockImplementation((ref, options, callback) => {
      const cb = typeof options === 'function' ? options : callback;
      const isQuery = (ref as any)?.type !== 'document';

      if (isQuery) {
        cb({ 
          forEach: (fn: any) => {
            if ((ref as any)?.path === 'batches') {
              malformedBatches.forEach((batch, i) => {
                fn({ id: `batch-malformed-${i}`, data: () => batch });
              });
            }
          },
          docs: (ref as any)?.path === 'batches' ? malformedBatches.map((batch, i) => ({ id: `batch-malformed-${i}`, data: () => batch })) : [],
          size: (ref as any)?.path === 'batches' ? malformedBatches.length : 0,
          empty: (ref as any)?.path !== 'batches',
          metadata: { fromCache: false, hasPendingWrites: false },
          query: {},
          docChanges: () => []
        } as any);
      } else {
        cb({ 
          exists: () => true, 
          data: () => ({ items: [], lastUpdated: new Date().toISOString() }),
          metadata: { fromCache: false, hasPendingWrites: false }
        } as any);
      }
      return vi.fn();
    });

    const { result } = renderHook(() => useInventory(mockUser, true, mockLang, true));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should not crash and should have filtered out the invalid items
    expect(result.current.batches.length).toBe(4);
    expect(result.current.stock?.items.length).toBe(0);
  });
});
