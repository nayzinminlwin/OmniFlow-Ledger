import { describe, it, expect, vi } from 'vitest';
import { cn, withTimeout } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
      expect(cn('p-4', { 'bg-red-500': true, 'bg-blue-500': false })).toBe('p-4 bg-red-500');
    });
  });

  describe('withTimeout', () => {
    it('should resolve if promise completes within timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 100, 'timeout');
      expect(result).toBe('success');
    });

    it('should reject if promise takes longer than timeout', async () => {
      vi.useFakeTimers();
      const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 200));
      const timeoutPromise = withTimeout(promise, 100, 'timeout');
      
      vi.advanceTimersByTime(150);
      
      await expect(timeoutPromise).rejects.toThrow('timeout');
      vi.useRealTimers();
    });
  });
});
