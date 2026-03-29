import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddTransaction } from '../src/components/AddTransaction';
import { translations } from '../src/translations';
import { Stock, Batch } from '../src/types';
import { INITIAL_CLASS_COUNTS } from '../src/constants';

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
        activeTab="add" 
        isAdmin={true}
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
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
        activeTab="add" 
        isAdmin={false}
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
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
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
      />
    );

    expect(container.firstChild).toHaveClass('hidden');
  });

  it('automatically sets toClass to UNCLASSIFIED for INCOMING transactions', () => {
    render(
      <AddTransaction 
        stock={mockStock} 
        batches={mockBatches} 
        t={t} 
        activeTab="add" 
        isAdmin={true}
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
      />
    );

    const toClassSelect = screen.getByLabelText(t.targetClass) as HTMLSelectElement;
    expect(toClassSelect.value).toBe('UNCLASSIFIED');
    expect(toClassSelect.disabled).toBe(true);
  });

  it('changes toClass when txType changes to SALE', async () => {
    const user = userEvent.setup();
    render(
      <AddTransaction 
        stock={mockStock} 
        batches={mockBatches} 
        t={t} 
        activeTab="add" 
        isAdmin={true}
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
      />
    );

    const saleBtn = screen.getByRole('radio', { name: t.sale });
    await user.click(saleBtn);

    expect(screen.queryByLabelText(t.toClass)).toBeNull();
    expect(screen.queryByLabelText(t.targetClass)).toBeNull();
  });

  it('automatically selects the first available brand if none selected', () => {
    const batchesWithItems: Batch[] = [
      { 
        id: 'b1', 
        batchId: 'Batch 1', 
        active: true, 
        items: [{ brand: 'Dell', series: 'XPS', model: '13', counts: INITIAL_CLASS_COUNTS }], 
        createdAt: new Date().toISOString() 
      }
    ];

    render(
      <AddTransaction 
        stock={mockStock} 
        batches={batchesWithItems} 
        t={t} 
        activeTab="add" 
        isAdmin={true}
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
      />
    );

    const brandSelect = screen.getByLabelText(t.brandLabel) as HTMLSelectElement;
    expect(brandSelect.value).toBe('Dell');
  });

  it('resets "New" state if the typed brand already exists', async () => {
    const batchesWithItems: Batch[] = [
      { 
        id: 'b1', 
        batchId: 'Batch 1', 
        active: true, 
        items: [{ brand: 'Dell', series: 'XPS', model: '13', counts: INITIAL_CLASS_COUNTS }], 
        createdAt: new Date().toISOString() 
      }
    ];

    localStorage.setItem('last_isNewBrand', 'true');
    localStorage.setItem('last_brand', 'Dell');

    render(
      <AddTransaction 
        stock={mockStock} 
        batches={batchesWithItems} 
        t={t} 
        activeTab="add" 
        isAdmin={true}
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
      />
    );

    const brandSelect = screen.getByLabelText(t.brandLabel) as HTMLSelectElement;
    expect(brandSelect.value).toBe('Dell');
    expect(screen.queryByPlaceholderText(t.newBrand)).toBeNull();
  });

  it('submits form correctly for admin', async () => {
    const user = userEvent.setup();
    mockHandleAddTransaction.mockResolvedValue(true);
    render(
      <AddTransaction 
        stock={mockStock} 
        batches={mockBatches} 
        t={t} 
        activeTab="add" 
        isAdmin={true}
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
      />
    );

    // Fill form
    const incomingButton = screen.getByRole('radio', { name: t.incoming });
    await user.click(incomingButton);

    const batchSelect = screen.getByLabelText(t.batchId);
    await user.selectOptions(batchSelect, '__NEW__');
    
    const batchInput = await screen.findByPlaceholderText('e.g., 16-03-2026');
    await user.type(batchInput, '29032026'); // formatBatchId will turn this into 29-03-2026

    const brandInput = screen.getByLabelText(t.brandLabel);
    await user.type(brandInput, 'Dell');

    const seriesInput = screen.getByLabelText(t.seriesLabel);
    await user.type(seriesInput, 'XPS');

    const modelInput = screen.getByLabelText(t.modelLabel);
    await user.type(modelInput, '13');

    const quantityInput = screen.getByLabelText(t.quantity);
    await user.clear(quantityInput);
    await user.type(quantityInput, '5');

    const submitButton = screen.getByRole('button', { name: t.recordEntry });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockHandleAddTransaction).toHaveBeenCalled();
    });
  });
});
