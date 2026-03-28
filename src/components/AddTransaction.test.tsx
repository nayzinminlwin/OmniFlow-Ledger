import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddTransaction } from './AddTransaction';
import { Batch } from '../types';

// Mock translation function
const t = (key: string) => key;

const mockBatches: Batch[] = [
  {
    batchId: '01-01-2024',
    createdAt: new Date().toISOString(),
    items: [
      { brand: 'Dell', series: 'Latitude', model: '5400', counts: { A: 10, B: 0, 'B-': 0, C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, D: 0, Spoiled: 0, UNCLASSIFIED: 0 } },
      { brand: 'HP', series: 'EliteBook', model: '840', counts: { A: 0, B: 5, 'B-': 0, C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, D: 0, Spoiled: 0, UNCLASSIFIED: 0 } }
    ]
  }
];

describe('AddTransaction Component', () => {
  const mockOnAddTransaction = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders correctly with initial state', () => {
    render(
      <AddTransaction
        t={t}
        activeTab="add"
        onAddTransaction={mockOnAddTransaction}
        batches={mockBatches}
        isSubmitting={false}
      />
    );

    expect(screen.getByText('INCOMING')).toBeDefined();
    expect(screen.getByText('OUTGOING')).toBeDefined();
    expect(screen.getByText('REPAIR')).toBeDefined();
  });

  it('automatically sets toClass to UNCLASSIFIED for INCOMING transactions', () => {
    render(
      <AddTransaction
        t={t}
        activeTab="add"
        onAddTransaction={mockOnAddTransaction}
        batches={mockBatches}
        isSubmitting={false}
      />
    );

    // Default is INCOMING
    const toClassSelect = screen.getByLabelText('To Class') as HTMLSelectElement;
    expect(toClassSelect.value).toBe('UNCLASSIFIED');
    expect(toClassSelect.disabled).toBe(true);
  });

  it('changes toClass when txType changes to OUTGOING', async () => {
    render(
      <AddTransaction
        t={t}
        activeTab="add"
        onAddTransaction={mockOnAddTransaction}
        batches={mockBatches}
        isSubmitting={false}
      />
    );

    const outgoingBtn = screen.getByText('OUTGOING');
    fireEvent.click(outgoingBtn);

    const toClassSelect = screen.getByLabelText('To Class') as HTMLSelectElement;
    expect(toClassSelect.value).not.toBe('UNCLASSIFIED');
    expect(toClassSelect.disabled).toBe(false);
  });

  it('automatically selects the first available brand if none selected', () => {
    render(
      <AddTransaction
        t={t}
        activeTab="add"
        onAddTransaction={mockOnAddTransaction}
        batches={mockBatches}
        isSubmitting={false}
      />
    );

    const brandSelect = screen.getByLabelText('Brand') as HTMLSelectElement;
    expect(brandSelect.value).toBe('Dell');
  });

  it('resets "New" state if the typed brand already exists', async () => {
    // Set sticky localStorage
    localStorage.setItem('last_isNewBrand', 'true');
    localStorage.setItem('last_brand', 'Dell');

    render(
      <AddTransaction
        t={t}
        activeTab="add"
        onAddTransaction={mockOnAddTransaction}
        batches={mockBatches}
        isSubmitting={false}
      />
    );

    // It should reconcile and set isNewBrand to false because 'Dell' exists
    const brandSelect = screen.queryByLabelText('Brand');
    expect(brandSelect).not.toBeNull();
    expect((brandSelect as HTMLSelectElement).value).toBe('Dell');
    
    // The input for new brand should not be visible
    expect(screen.queryByPlaceholderText('Enter new brand')).toBeNull();
  });

  it('calls onAddTransaction with correct values on submit', async () => {
    render(
      <AddTransaction
        t={t}
        activeTab="add"
        onAddTransaction={mockOnAddTransaction}
        batches={mockBatches}
        isSubmitting={false}
      />
    );

    // Fill in details
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '5' } });
    
    const submitBtn = screen.getByText('Record Transaction');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnAddTransaction).toHaveBeenCalledWith(
        'INCOMING',
        '01-01-2024',
        'Dell',
        'Latitude',
        '5400',
        'D',
        'UNCLASSIFIED',
        5,
        ''
      );
    });
  });
});
