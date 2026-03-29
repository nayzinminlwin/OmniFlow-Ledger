import { describe, it, expect, vi } from 'vitest';
import { handleFirestoreError, OperationType } from '../src/services/firestore';
import { auth } from '../src/firebase';

// Mock firebase auth
vi.mock('../src/firebase', () => ({
  auth: {
    currentUser: {
      uid: 'test-uid',
      email: 'test@example.com',
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerData: [
        {
          providerId: 'google.com',
          displayName: 'Test User',
          email: 'test@example.com',
          photoURL: 'https://example.com/photo.jpg'
        }
      ]
    }
  }
}));

describe('firestore service', () => {
  describe('handleFirestoreError', () => {
    it('should throw an error with JSON string containing error info', () => {
      const originalError = new Error('Permission denied');
      const operationType = OperationType.GET;
      const path = 'users/123';

      expect(() => handleFirestoreError(originalError, operationType, path)).toThrow();
      
      try {
        handleFirestoreError(originalError, operationType, path);
      } catch (e: any) {
        const errorInfo = JSON.parse(e.message);
        expect(errorInfo.error).toBe('Permission denied');
        expect(errorInfo.operationType).toBe(operationType);
        expect(errorInfo.path).toBe(path);
        expect(errorInfo.authInfo.userId).toBe('test-uid');
        expect(errorInfo.authInfo.email).toBe('test@example.com');
        expect(errorInfo.authInfo.providerInfo[0].providerId).toBe('google.com');
      }
    });

    it('should handle non-Error objects correctly', () => {
      const operationType = OperationType.WRITE;
      const path = 'batches/456';

      try {
        handleFirestoreError('String error', operationType, path);
      } catch (e: any) {
        const errorInfo = JSON.parse(e.message);
        expect(errorInfo.error).toBe('String error');
      }
    });
  });
});
