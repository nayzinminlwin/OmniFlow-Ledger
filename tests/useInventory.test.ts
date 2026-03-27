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
    doc: vi.fn(),
    collection: vi.fn(),
    onSnapshot: vi.fn((ref, options, callback) => {
      if (typeof options === 'function') {
        options({ exists: () => false, data: () => ({}) });
      } else {
        callback({ exists: () => false, data: () => ({}) });
      }
      return vi.fn();
    }),
    query: vi.fn(),
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
    expect(result.current.stock).toBeNull();
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
    const mockStock = { items: [], lastUpdated: 'now' };
    
    vi.mocked(firestore.onSnapshot).mockImplementation((ref, options, callback, errorCallback) => {
      const cb = typeof options === 'function' ? options : callback;
      
      // Simulate snapshot for stock
      if (ref && (ref as any).path === 'inventory/current') {
        cb({ exists: () => true, data: () => mockStock } as any);
      } else {
        cb({ 
          forEach: (fn: any) => {},
          docs: [],
          size: 0,
          empty: true,
          metadata: {} as any,
          query: {} as any,
          docChanges: () => []
        } as any);
      }
      return vi.fn();
    });

    const { result } = renderHook(() => useInventory(mockUser, true, mockLang, true));

    await waitFor(() => {
      expect(result.current.stock).toEqual(mockStock);
    });
  });
});
