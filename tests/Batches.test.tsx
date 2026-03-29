import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
      />
    );

    expect(screen.getByText('Batch 1')).toBeInTheDocument();
    expect(screen.getByText(/Apple/)).toBeInTheDocument();
    expect(screen.getByText(/MacBook/)).toBeInTheDocument();
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
    // One for expand/collapse, one for edit, one for delete
    expect(buttons.length).toBeGreaterThanOrEqual(3);
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

    const buttons = screen.getAllByRole('button');
    // Only expand/collapse button should be there
    expect(buttons.length).toBe(1);
  });

  it('renders nothing when hidden', () => {
    const { container } = render(
      <Batches 
        batches={mockBatches} 
        t={t} 
        activeTab="dashboard" 
        isAdmin={true}
      />
    );

    expect(container.firstChild).toHaveClass('hidden');
  });
});
