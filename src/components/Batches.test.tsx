import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Batches } from './Batches';
import { Batch } from '../types';

// Mock translation function
const t = (key: string) => key;

const mockBatches: Batch[] = [
  {
    batchId: '01-01-2024',
    createdAt: '2024-01-01T10:00:00Z',
    items: [
      { brand: 'Dell', series: 'Latitude', model: '5400', counts: { A: 5, B: 0, 'B-': 0, C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, D: 0, Spoiled: 0, UNCLASSIFIED: 0 } }
    ]
  },
  {
    batchId: '02-01-2024',
    createdAt: '2024-01-02T10:00:00Z',
    items: [
      { brand: 'HP', series: 'EliteBook', model: '840', counts: { A: 2, B: 0, 'B-': 0, C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, D: 0, Spoiled: 0, UNCLASSIFIED: 0 } }
    ]
  }
];

describe('Batches Component', () => {
  const mockSetSelectedBatchId = vi.fn();
  const mockSetEditingBatch = vi.fn();
  const mockSetNewBatchName = vi.fn();
  const mockOnDeleteBatch = vi.fn();

  it('renders correctly when active', () => {
    render(
      <Batches
        t={t}
        activeTab="batches"
        selectedBatchId=""
        setSelectedBatchId={mockSetSelectedBatchId}
        batches={mockBatches}
        setEditingBatch={mockSetEditingBatch}
        setNewBatchName={mockSetNewBatchName}
        onDeleteBatch={mockOnDeleteBatch}
      />
    );

    expect(screen.getByText('01-01-2024')).toBeDefined();
    expect(screen.getByText('02-01-2024')).toBeDefined();
  });

  it('does not render when not active', () => {
    const { container } = render(
      <Batches
        t={t}
        activeTab="dashboard"
        selectedBatchId=""
        setSelectedBatchId={mockSetSelectedBatchId}
        batches={mockBatches}
        setEditingBatch={mockSetEditingBatch}
        setNewBatchName={mockSetNewBatchName}
        onDeleteBatch={mockOnDeleteBatch}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls setSelectedBatchId when a batch is clicked', () => {
    render(
      <Batches
        t={t}
        activeTab="batches"
        selectedBatchId=""
        setSelectedBatchId={mockSetSelectedBatchId}
        batches={mockBatches}
        setEditingBatch={mockSetEditingBatch}
        setNewBatchName={mockSetNewBatchName}
        onDeleteBatch={mockOnDeleteBatch}
      />
    );

    const batchRow = screen.getByText('01-01-2024');
    fireEvent.click(batchRow);

    expect(mockSetSelectedBatchId).toHaveBeenCalledWith('01-01-2024');
  });

  it('shows batch details when selected', () => {
    render(
      <Batches
        t={t}
        activeTab="batches"
        selectedBatchId="01-01-2024"
        setSelectedBatchId={mockSetSelectedBatchId}
        batches={mockBatches}
        setEditingBatch={mockSetEditingBatch}
        setNewBatchName={mockSetNewBatchName}
        onDeleteBatch={mockOnDeleteBatch}
      />
    );

    expect(screen.getByText('Dell Latitude 5400')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
  });
});
