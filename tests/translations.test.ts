import { describe, it, expect } from 'vitest';
import { translations } from '../src/translations';

describe('Translations', () => {
  it('should have english, malay, and chinese translations', () => {
    expect(translations).toHaveProperty('en');
    expect(translations).toHaveProperty('ms');
    expect(translations).toHaveProperty('zh');
  });

  it('should have matching keys across all languages', () => {
    const enKeys = Object.keys(translations.en).sort();
    const msKeys = Object.keys(translations.ms).sort();
    const zhKeys = Object.keys(translations.zh).sort();

    expect(enKeys).toEqual(msKeys);
    expect(enKeys).toEqual(zhKeys);
  });

  it('should correctly format dynamic translation strings', () => {
    // English
    expect(translations.en.adjustmentNegative('BATCH-1', 'A')).toBe('Adjustment would result in negative stock for Batch BATCH-1, Class A');
    expect(translations.en.insufficientStock('BATCH-2', 'B')).toBe('Insufficient stock in Batch BATCH-2, Class B');
    
    // Malay
    expect(translations.ms.adjustmentNegative('BATCH-1', 'A')).toBe('Pelarasan akan mengakibatkan stok negatif untuk Batch BATCH-1, Kelas A');
    
    // Chinese
    expect(translations.zh.adjustmentNegative('BATCH-1', 'A')).toBe('调整将导致批次 BATCH-1 等级 A 的库存为负数');
  });
});
