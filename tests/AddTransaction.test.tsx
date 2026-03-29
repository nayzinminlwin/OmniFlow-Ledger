import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AddTransaction } from '../src/components/AddTransaction';
import { translations } from '../src/translations';
import { Stock, Batch } from '../src/types';

// Mock hooks
const mockHandleAddTransaction = vi.fn();
vi.mock('../src/hooks/useTransactionActions', () => ({
  useTransactionActions: () => ({
    handleAddTransaction: mockHandleAddTransaction,
    isSubmitting: false,
    error: null,
    success: null,
  }),
}));

describe('AddTransaction Component', () => {
  const t = translations.en;
  const mockStock: Stock = { items: [], lastUpdated: new Date().toISOString() };
  const mockBatches: Batch[] = [
    { id: 'b1', batchId: 'Batch 1', active: true, items: [], createdAt: new Date().toISOString() }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly for admin', () => {
    render(
      <AddTransaction 
        stock={mockStock} 
        batches={mockBatches} 
        t={t} 
        activeTab="update" 
        isAdmin={true}
      />
    );

    expect(screen.getByText(t.transactionType)).toBeInTheDocument();
    expect(screen.getByText(t.recordEntry)).toBeInTheDocument();
  });

  it('shows access restricted for non-admin', () => {
    render(
      <AddTransaction 
        stock={mockStock} 
        batches={mockBatches} 
        t={t} 
        activeTab="update" 
        isAdmin={false}
      />
    );

    expect(screen.getByText(t.accessRestricted)).toBeInTheDocument();
    expect(screen.queryByText(t.transactionType)).not.toBeInTheDocument();
  });

  it('renders nothing when hidden', () => {
    const { container } = render(
      <AddTransaction 
        stock={mockStock} 
        batches={mockBatches} 
        t={t} 
        activeTab="dashboard" 
        isAdmin={true}
      />
    );

    expect(container.firstChild).toHaveClass('hidden');
  });

  it('submits form correctly for admin', async () => {
    mockHandleAddTransaction.mockResolvedValue(true);
    render(
      <AddTransaction 
        stock={mockStock} 
        batches={mockBatches} 
        t={t} 
        activeTab="update" 
        isAdmin={true}
      />
    );

    // Fill form
    const typeSelect = screen.getByLabelText(t.transactionType);
    fireEvent.change(typeSelect, { target: { value: 'INCOMING' } });

    const batchInput = screen.getByLabelText(t.selectBatch);
    fireEvent.change(batchInput, { target: { value: 'Batch 1' } });

    const brandInput = screen.getByLabelText(t.brandLabel);
    fireEvent.change(brandInput, { target: { value: 'Dell' } });

    const seriesInput = screen.getByLabelText(t.seriesLabel);
    fireEvent.change(seriesInput, { target: { value: 'XPS' } });

    const modelInput = screen.getByLabelText(t.modelLabel);
    fireEvent.change(modelInput, { target: { value: '13' } });

    const quantityInput = screen.getByLabelText(t.quantity);
    fireEvent.change(quantityInput, { target: { value: '5' } });

    const submitButton = screen.getByText(t.recordEntry);
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(mockHandleAddTransaction).toHaveBeenCalled();
  });
});
