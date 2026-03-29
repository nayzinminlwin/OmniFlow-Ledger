import { describe, it, expect } from 'vitest';
import { isValidBatchDate, formatBatchId, padBatchId } from '../src/lib/dateUtils';

describe('dateUtils', () => {
  describe('isValidBatchDate', () => {
    it('should return true for special date 00-00-2000', () => {
      expect(isValidBatchDate('00-00-2000')).toBe(true);
    });

    it('should return true for valid dates', () => {
      expect(isValidBatchDate('01-01-2024')).toBe(true);
      expect(isValidBatchDate('29-02-2024')).toBe(true); // Leap year
    });

    it('should return false for invalid dates', () => {
      expect(isValidBatchDate('32-01-2024')).toBe(false);
      expect(isValidBatchDate('29-02-2023')).toBe(false); // Not a leap year
      expect(isValidBatchDate('01-13-2024')).toBe(false);
      expect(isValidBatchDate('01-01-1999')).toBe(false); // Out of range
      expect(isValidBatchDate('abc')).toBe(false);
    });
  });

  describe('formatBatchId', () => {
    it('should format digits to DD-MM-YYYY', () => {
      expect(formatBatchId('01012024')).toBe('01-01-2024');
    });

    it('should handle partial input', () => {
      expect(formatBatchId('01')).toBe('01');
      expect(formatBatchId('010')).toBe('01-0');
      expect(formatBatchId('0101')).toBe('01-01');
    });

    it('should replace slashes with dashes', () => {
      expect(formatBatchId('01/01/2024')).toBe('01-01-2024');
    });

    it('should auto-pad single digits when dash is typed', () => {
      expect(formatBatchId('1-', '')).toBe('01-');
      expect(formatBatchId('01-1-', '01-1')).toBe('01-01-');
    });
  });

  describe('padBatchId', () => {
    it('should pad single digit day and month', () => {
      expect(padBatchId('1-1-2024')).toBe('01-01-2024');
    });

    it('should not pad double digit day and month', () => {
      expect(padBatchId('10-10-2024')).toBe('10-10-2024');
    });

    it('should handle empty input', () => {
      expect(padBatchId('')).toBe('');
    });
  });
});
