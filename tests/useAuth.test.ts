import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../src/hooks/useAuth';
import * as fireauth from 'firebase/auth';
import * as firestore from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/auth', async () => {
  const actual = await vi.importActual('firebase/auth');
  return {
    ...actual,
    onAuthStateChanged: vi.fn(),
    signOut: vi.fn(),
    signInWithPopup: vi.fn(),
    GoogleAuthProvider: vi.fn(),
  };
});

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
  };
});

vi.mock('../src/firebase', () => ({
  auth: {},
  db: {},
}));

describe('useAuth', () => {
  const mockLang = 'en';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with auth not ready', () => {
    const { result } = renderHook(() => useAuth(mockLang));

    expect(result.current.isAuthReady).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.profile).toBeNull();
  });

  it('should set auth ready when onAuthStateChanged is called', async () => {
    vi.mocked(fireauth.onAuthStateChanged).mockImplementation((auth, callback) => {
      (callback as any)(null);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(mockLang));

    await waitFor(() => {
      expect(result.current.isAuthReady).toBe(true);
    });
    expect(result.current.user).toBeNull();
  });

  it('should handle approved user profile', async () => {
    const mockUser = { uid: 'user123', email: 'test@test.com', emailVerified: true };
    const mockProfile = { uid: 'user123', status: 'approved', role: 'admin' };

    vi.mocked(fireauth.onAuthStateChanged).mockImplementation((auth, callback) => {
      (callback as any)(mockUser);
      return vi.fn();
    });

    vi.mocked(firestore.getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockProfile,
    } as any);

    const { result } = renderHook(() => useAuth(mockLang));

    await waitFor(() => {
      expect(result.current.isAuthReady).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.profile).toEqual(mockProfile);
    });
  });

  it('should handle pending user profile and sign out', async () => {
    const mockUser = { uid: 'user123', email: 'test@test.com', emailVerified: true };
    const mockProfile = { uid: 'user123', status: 'pending', role: 'user' };

    vi.mocked(fireauth.onAuthStateChanged).mockImplementation((auth, callback) => {
      (callback as any)(mockUser);
      return vi.fn();
    });

    vi.mocked(firestore.getDoc).mockResolvedValue({
      exists: () => true,
      data: () => mockProfile,
    } as any);

    const { result } = renderHook(() => useAuth(mockLang));

    await waitFor(() => {
      expect(result.current.isAuthReady).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.profile).toBeNull();
      expect(result.current.requestSent).toBe(true);
    });
    expect(fireauth.signOut).toHaveBeenCalled();
  });

  it('should bootstrap admin if email matches', async () => {
    const mockUser = { uid: 'admin123', email: 'nayzinminlwin22@gmail.com', emailVerified: true };
    
    vi.mocked(fireauth.onAuthStateChanged).mockImplementation((auth, callback) => {
      (callback as any)(mockUser);
      return vi.fn();
    });

    vi.mocked(firestore.getDoc).mockResolvedValue({
      exists: () => false,
    } as any);

    const { result } = renderHook(() => useAuth(mockLang));

    await waitFor(() => {
      expect(result.current.isAuthReady).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.profile?.status).toBe('approved');
      expect(result.current.profile?.role).toBe('admin');
    });
    expect(firestore.setDoc).toHaveBeenCalled();
  });
});
