import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Batches } from '../src/components/Batches';
import { translations } from '../src/translations';
import { Batch } from '../src/types';
import { INITIAL_CLASS_COUNTS } from '../src/constants';

// Mock hooks
const mockHandleRenameBatch = vi.fn();
const mockHandleDeleteBatch = vi.fn();
vi.mock('../src/hooks/useTransactionActions', () => ({
  useTransactionActions: () => ({
    handleRenameBatch: mockHandleRenameBatch,
    handleDeleteBatch: mockHandleDeleteBatch,
    isRenaming: false,
    error: null,
    success: null,
  }),
}));

describe('Batches Component', () => {
  const t = translations.en;
  const mockBatches: Batch[] = [
    { 
      id: 'b1', 
      batchId: 'Batch 1', 
      active: true, 
      items: [{ 
        brand: 'Apple', 
        series: 'MacBook', 
        model: 'Pro', 
        counts: { ...INITIAL_CLASS_COUNTS, A: 5 } 
      }], 
      createdAt: new Date().toISOString() 
    }
  ];

  const mockSetSelectedBatchId = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders batch list correctly', () => {
    render(
      <Batches 
        batches={mockBatches} 
        t={t} 
        activeTab="batches" 
        isAdmin={true}
        selectedBatchId=""
        setSelectedBatchId={mockSetSelectedBatchId}
        setEditingBatch={vi.fn()}
        setNewBatchName={vi.fn()}
        onDeleteBatch={vi.fn()}
      />
    );

    expect(screen.getAllByText('Batch 1').length).toBe(2);
  });

  it('calls setSelectedBatchId when a batch is selected from dropdown', async () => {
    const user = userEvent.setup();
    render(
      <Batches 
        batches={mockBatches} 
        t={t} 
        activeTab="batches" 
        isAdmin={true}
        selectedBatchId="Batch 1"
        setSelectedBatchId={mockSetSelectedBatchId}
        setEditingBatch={vi.fn()}
        setNewBatchName={vi.fn()}
        onDeleteBatch={vi.fn()}
      />
    );

    const select = screen.getByLabelText(`${t.selectBatch}:`);
    await user.selectOptions(select, 'Batch 1');
    expect(mockSetSelectedBatchId).toHaveBeenCalledWith('Batch 1');
  });

  it('shows batch details when selected', () => {
    render(
      <Batches 
        batches={mockBatches} 
        t={t} 
        activeTab="batches" 
        isAdmin={true}
        selectedBatchId="Batch 1"
        setSelectedBatchId={mockSetSelectedBatchId}
        setEditingBatch={vi.fn()}
        setNewBatchName={vi.fn()}
        onDeleteBatch={vi.fn()}
      />
    );

    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('MacBook')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1);
  });

  it('shows edit and delete buttons for admin', () => {
    render(
      <Batches 
        batches={mockBatches} 
        t={t} 
        activeTab="batches" 
        isAdmin={true}
      />
    );

    // Edit and Delete buttons use icons, let's check for their presence
    const buttons = screen.getAllByRole('button');
    // For each batch row, there should be 2 buttons (Edit and Delete)
    expect(buttons.length).toBe(2);
    expect(screen.getByTitle(t.editBatchName)).toBeInTheDocument();
    expect(screen.getByTitle(t.deleteBatch)).toBeInTheDocument();
  });

  it('hides edit and delete buttons for non-admin', () => {
    render(
      <Batches 
        batches={mockBatches} 
        t={t} 
        activeTab="batches" 
        isAdmin={false}
      />
    );

    const buttons = screen.queryAllByRole('button');
    // No buttons should be visible for non-admins in this view
    expect(buttons.length).toBe(0);
  });

  it('renders nothing when hidden', () => {
    const { container } = render(
      <Batches 
        batches={mockBatches} 
        t={t} 
        activeTab="dashboard" 
        isAdmin={true}
        selectedBatchId=""
        setSelectedBatchId={vi.fn()}
        setEditingBatch={vi.fn()}
        setNewBatchName={vi.fn()}
        onDeleteBatch={vi.fn()}
      />
    );

    expect(container.firstChild).toHaveClass('hidden');
  });

  it('shows empty state messages', () => {
    const { rerender } = render(
      <Batches 
        batches={[]} 
        t={t} 
        activeTab="batches" 
        isAdmin={true}
        selectedBatchId=""
        setSelectedBatchId={vi.fn()}
        setEditingBatch={vi.fn()}
        setNewBatchName={vi.fn()}
        onDeleteBatch={vi.fn()}
      />
    );

    expect(screen.getByText(t.noBatches)).toBeInTheDocument();
    expect(screen.getByText(t.selectBatchToView)).toBeInTheDocument();

    rerender(
      <Batches 
        batches={[{ ...mockBatches[0], items: [] }]} 
        t={t} 
        activeTab="batches" 
        isAdmin={true}
        selectedBatchId="Batch 1"
        setSelectedBatchId={vi.fn()}
        setEditingBatch={vi.fn()}
        setNewBatchName={vi.fn()}
        onDeleteBatch={vi.fn()}
      />
    );
    expect(screen.getByText(t.noModelsInBatch)).toBeInTheDocument();
  });

  it('handles batch deletion flow', async () => {
    const onDeleteBatch = vi.fn().mockResolvedValue(true);
    render(
      <Batches 
        batches={mockBatches} 
        t={t} 
        activeTab="batches" 
        isAdmin={true}
        selectedBatchId=""
        setSelectedBatchId={vi.fn()}
        setEditingBatch={vi.fn()}
        setNewBatchName={vi.fn()}
        onDeleteBatch={onDeleteBatch}
      />
    );

    const deleteBtn = screen.getByTitle(t.deleteBatch);
    await act(async () => {
      deleteBtn.click();
    });

    // Modal should appear
    expect(screen.getByText(t.confirmDeleteBatch)).toBeInTheDocument();

    const confirmBtn = screen.getByText(t.deleteBatch, { selector: 'button' });
    await act(async () => {
      confirmBtn.click();
    });

    expect(onDeleteBatch).toHaveBeenCalledWith('Batch 1', expect.any(Function));
  });

  it('handles batch edit flow', async () => {
    const setEditingBatch = vi.fn();
    const setNewBatchName = vi.fn();
    render(
      <Batches 
        batches={mockBatches} 
        t={t} 
        activeTab="batches" 
        isAdmin={true}
        selectedBatchId=""
        setSelectedBatchId={vi.fn()}
        setEditingBatch={setEditingBatch}
        setNewBatchName={setNewBatchName}
        onDeleteBatch={vi.fn()}
      />
    );

    const editBtn = screen.getByTitle(t.editBatchName);
    await act(async () => {
      editBtn.click();
    });

    expect(setEditingBatch).toHaveBeenCalledWith(mockBatches[0]);
    expect(setNewBatchName).toHaveBeenCalledWith('Batch 1');
  });

  it('sorts batches by ID', async () => {
    const manyBatches = [
      { ...mockBatches[0], batchId: 'Z Batch', id: 'z' },
      { ...mockBatches[0], batchId: 'A Batch', id: 'a' }
    ];
    render(
      <Batches 
        batches={manyBatches} 
        t={t} 
        activeTab="batches" 
        isAdmin={true}
        selectedBatchId=""
        setSelectedBatchId={vi.fn()}
        setEditingBatch={vi.fn()}
        setNewBatchName={vi.fn()}
        onDeleteBatch={vi.fn()}
      />
    );

    const batchIdHeader = screen.getByText(t.batchId);
    
    // Initial order might be as provided
    const getBatchIds = () => {
      const cells = screen.getAllByRole('cell').filter(c => c.querySelector('p.text-blue-600'));
      return cells.map(c => c.textContent);
    };

    expect(getBatchIds()[0]).toBe('Z Batch');

    // Click to sort asc
    await act(async () => {
      batchIdHeader.click();
    });
    expect(getBatchIds()[0]).toBe('A Batch');

    // Click to sort desc
    await act(async () => {
      batchIdHeader.click();
    });
    expect(getBatchIds()[0]).toBe('Z Batch');
  });

  it('shows skeleton when loading', () => {
    render(
      <Batches 
        batches={[]} 
        t={t} 
        activeTab="batches" 
        isAdmin={true}
        loading={true}
        selectedBatchId=""
        setSelectedBatchId={vi.fn()}
        setEditingBatch={vi.fn()}
        setNewBatchName={vi.fn()}
        onDeleteBatch={vi.fn()}
      />
    );

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });
});
