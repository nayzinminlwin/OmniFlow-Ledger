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

  it('disables cascading dropdowns correctly', async () => {
    const user = userEvent.setup();
    render(
      <AddTransaction 
        batches={mockBatches} 
        t={t} 
        activeTab="add" 
        isAdmin={true}
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
      />
    );

    // Switch to SALE to ensure we use select elements (not "New" inputs)
    const saleBtn = screen.getByRole('radio', { name: t.sale });
    await user.click(saleBtn);

    const brandSelect = screen.getByLabelText(t.brandLabel) as HTMLSelectElement;
    const seriesSelect = screen.getByLabelText(t.seriesLabel) as HTMLSelectElement;
    const modelSelect = screen.getByLabelText(t.modelLabel) as HTMLSelectElement;

    // Reset brand to empty if it was auto-selected
    await user.selectOptions(brandSelect, "");

    expect(brandSelect.value).toBe("");
    expect(seriesSelect).toBeDisabled();
    expect(modelSelect).toBeDisabled();
  });

  it('shows stock warning and disables submit when stock is empty for SALE', async () => {
    const user = userEvent.setup();
    const batchesWithItems: Batch[] = [
      { 
        id: 'b1', 
        batchId: 'Batch 1', 
        active: true, 
        items: [{ brand: 'Dell', series: 'XPS', model: '13', counts: { ...INITIAL_CLASS_COUNTS, A: 0 } }], 
        createdAt: new Date().toISOString() 
      }
    ];

    render(
      <AddTransaction 
        batches={batchesWithItems} 
        t={t} 
        activeTab="add" 
        isAdmin={true}
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
      />
    );

    // Switch to SALE
    const saleBtn = screen.getByRole('radio', { name: t.sale });
    await user.click(saleBtn);

    // Select Dell XPS 13
    const brandSelect = screen.getByLabelText(t.brandLabel);
    await user.selectOptions(brandSelect, 'Dell');
    
    const seriesSelect = screen.getByLabelText(t.seriesLabel);
    await user.selectOptions(seriesSelect, 'XPS');

    const modelSelect = screen.getByLabelText(t.modelLabel);
    await user.selectOptions(modelSelect, '13');

    // Select Class A (which has 0 stock)
    const fromClassSelect = screen.getByLabelText(t.fromClass);
    await user.selectOptions(fromClassSelect, 'A');

    expect(screen.getByText(`${t.currentStock}: 0`)).toBeInTheDocument();
    
    const submitButton = screen.getByRole('button', { name: t.recordEntry });
    expect(submitButton).toBeDisabled();
  });

  it('changes quantity label for ADJUSTMENT', async () => {
    const user = userEvent.setup();
    render(
      <AddTransaction 
        batches={mockBatches} 
        t={t} 
        activeTab="add" 
        isAdmin={true}
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
      />
    );

    const adjBtn = screen.getByRole('radio', { name: t.adjustment });
    await user.click(adjBtn);

    expect(screen.getByText(t.newTotalCount)).toBeInTheDocument();
    expect(screen.queryByText(t.quantity)).toBeNull();
  });

  it('shows both from and to class for REPAIR', async () => {
    const user = userEvent.setup();
    render(
      <AddTransaction 
        batches={mockBatches} 
        t={t} 
        activeTab="add" 
        isAdmin={true}
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
      />
    );

    const repairBtn = screen.getByRole('radio', { name: t.repair });
    await user.click(repairBtn);

    expect(screen.getByLabelText(t.fromClass)).toBeInTheDocument();
    expect(screen.getByLabelText(t.toClass)).toBeInTheDocument();
  });

  it('disables submit button when quantity is invalid', async () => {
    const user = userEvent.setup();
    render(
      <AddTransaction 
        batches={mockBatches} 
        t={t} 
        activeTab="add" 
        isAdmin={true}
        onAddTransaction={mockHandleAddTransaction}
        isSubmitting={false}
      />
    );

    const quantityInput = screen.getByLabelText(t.quantity);
    await user.clear(quantityInput);
    
    const submitButton = screen.getByRole('button', { name: t.recordEntry });
    expect(submitButton).toBeDisabled();

    await user.type(quantityInput, '0');
    expect(submitButton).toBeDisabled();

    await user.clear(quantityInput);
    await user.type(quantityInput, '5');
    // Still disabled because brand/model not selected in this fresh render
  });
});
