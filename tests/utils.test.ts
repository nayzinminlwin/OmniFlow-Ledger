import { describe, it, expect } from 'vitest';
import { cn } from '../src/lib/utils';

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
