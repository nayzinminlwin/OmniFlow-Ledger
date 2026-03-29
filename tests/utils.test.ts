import { describe, it, expect, vi } from 'vitest';
import { cn, withTimeout } from '../src/lib/utils';

describe('cn utility', () => {
  it('should merge tailwind classes correctly', () => {
    expect(cn('p-4', 'm-4')).toBe('p-4 m-4');
  });

  it('should handle conditional classes', () => {
    expect(cn('p-4', true && 'bg-red-500', false && 'text-white')).toBe('p-4 bg-red-500');
  });

  it('should resolve tailwind conflicts using tailwind-merge', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8');
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
  });

  it('should handle arrays and objects', () => {
    expect(cn(['p-4', 'm-4'], { 'bg-red-500': true, 'text-white': false })).toBe('p-4 m-4 bg-red-500');
  });
});

describe('withTimeout utility', () => {
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
