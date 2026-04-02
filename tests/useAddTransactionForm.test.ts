import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAddTransactionForm } from '../src/hooks/useAddTransactionForm';
import { Batch, TransactionType, LaptopClass } from '../src/types';
import { translations } from '../src/translations';
import { INITIAL_CLASS_COUNTS } from '../src/constants';

describe('useAddTransactionForm Hook', () => {
  const t = translations.en;
  const mockOnAddTransaction = vi.fn();
  const mockBatches: Batch[] = [
    { 
      batchId: '01-01-2026', 
      active: true, 
      items: [{ brand: 'Dell', series: 'XPS', model: '13', counts: { ...INITIAL_CLASS_COUNTS, A: 10, B: 5 } }], 
      createdAt: new Date().toISOString() 
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAddTransactionForm({ batches: mockBatches, onAddTransaction: mockOnAddTransaction, t }));

    expect(result.current.txType).toBe('INCOMING');
    expect(result.current.batchId).toBe('01-01-2026');
    expect(result.current.brand).toBe('Dell');
    expect(result.current.series).toBe('XPS');
    expect(result.current.model).toBe('13');
  });

  it('should prevent REPAIR to the same class', async () => {
    const { result } = renderHook(() => useAddTransactionForm({ batches: mockBatches, onAddTransaction: mockOnAddTransaction, t }));

    await act(async () => {
      result.current.handleTxTypeChange('REPAIR');
      result.current.setFromClass('A');
      result.current.setToClass('A');
    });

    await act(async () => {
      const e = { preventDefault: vi.fn() } as any;
      await result.current.handleSubmit(e);
    });

    expect(result.current.error).toBe(t.sameClassRepairError);
    expect(mockOnAddTransaction).not.toHaveBeenCalled();
  });

  it('should prevent ADJUSTMENT to the same value as current stock', async () => {
    const { result } = renderHook(() => useAddTransactionForm({ batches: mockBatches, onAddTransaction: mockOnAddTransaction, t }));

    await act(async () => {
      result.current.handleTxTypeChange('ADJUSTMENT');
      result.current.setBatchId('01-01-2026');
      result.current.setBrand('Dell');
      result.current.setSeries('XPS');
      result.current.setModel('13');
      result.current.setToClass('A'); // Current stock for A is 10
      result.current.setQuantity(10); // Setting new total to 10 (no change)
    });

    await act(async () => {
      const e = { preventDefault: vi.fn() } as any;
      await result.current.handleSubmit(e);
    });

    expect(result.current.error).toBe(t.sameValueAdjustmentError);
    expect(mockOnAddTransaction).not.toHaveBeenCalled();
  });

  it('should allow ADJUSTMENT to a different value', async () => {
    mockOnAddTransaction.mockResolvedValue(true);
    const { result } = renderHook(() => useAddTransactionForm({ batches: mockBatches, onAddTransaction: mockOnAddTransaction, t }));

    await act(async () => {
      result.current.handleTxTypeChange('ADJUSTMENT');
      result.current.setBatchId('01-01-2026');
      result.current.setBrand('Dell');
      result.current.setSeries('XPS');
      result.current.setModel('13');
      result.current.setToClass('A'); // Current stock for A is 10
      result.current.setQuantity(15); // Setting new total to 15 (change of +5)
    });

    await act(async () => {
      const e = { preventDefault: vi.fn() } as any;
      await result.current.handleSubmit(e);
    });

    expect(result.current.error).toBeNull();
    expect(mockOnAddTransaction).toHaveBeenCalledWith(
      'ADJUSTMENT',
      '01-01-2026',
      'Dell',
      'XPS',
      '13',
      expect.anything(),
      'A',
      15,
      ''
    );
  });

  it('should allow REPAIR to a different class', async () => {
    mockOnAddTransaction.mockResolvedValue(true);
    const { result } = renderHook(() => useAddTransactionForm({ batches: mockBatches, onAddTransaction: mockOnAddTransaction, t }));

    await act(async () => {
      result.current.handleTxTypeChange('REPAIR');
      result.current.setFromClass('A');
      result.current.setToClass('B');
    });

    await act(async () => {
      const e = { preventDefault: vi.fn() } as any;
      await result.current.handleSubmit(e);
    });

    expect(result.current.error).toBeNull();
    expect(mockOnAddTransaction).toHaveBeenCalled();
  });
});
