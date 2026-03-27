import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { History } from '../src/components/History';
import { Transaction, UserProfile } from '../src/types';
import { translations } from '../src/translations';

// Mock hooks
const mockHandleUndoTransaction = vi.fn();
vi.mock('../src/hooks/useTransactionActions', () => ({
  useTransactionActions: () => ({
    handleUndoTransaction: mockHandleUndoTransaction,
  }),
}));

describe('History Component', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx1',
      type: 'INCOMING',
      brand: 'Dell',
      series: 'XPS',
      model: '13',
      quantity: 1,
      timestamp: new Date().toISOString(),
      userId: 'user1',
      batchId: 'batch1',
      batchActive: true,
    },
    {
      id: 'tx2',
      type: 'UNDO',
      brand: 'HP',
      series: 'Pavilion',
      model: '15',
      quantity: 1,
      timestamp: new Date().toISOString(),
      userId: 'user1',
      batchId: 'batch2',
      batchActive: true,
      notes: 'Undid Repair for HP Pavilion',
    },
  ];

  const mockUsers: Record<string, UserProfile> = {
    user1: { uid: 'user1', username: 'John Doe', email: 'john@test.com', status: 'approved', role: 'admin', createdAt: new Date().toISOString() },
  };

  const mockProps = {
    transactions: mockTransactions,
    users: mockUsers,
    lang: 'en' as const,
    isUltimateAdmin: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render transaction list correctly', () => {
    render(<History {...mockProps} />);

    expect(screen.getByText('Dell XPS')).toBeInTheDocument();
    expect(screen.getByText('HP Pavilion')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display Undo type with correct label', () => {
    render(<History {...mockProps} />);

    const undoLabel = screen.getByText('Undo');
    expect(undoLabel).toBeInTheDocument();
    // Check if it has yellow styling (assuming it uses yellow-100 or similar)
    expect(undoLabel.className).toContain('yellow');
  });

  it('should show undo button for non-undo transactions when user is admin', () => {
    render(<History {...mockProps} />);

    const undoButtons = screen.getAllByRole('button');
    // For tx1, there should be an undo button. tx2 is already an Undo type.
    // Let's check if the button with Undo2 icon exists.
    const undoButton = undoButtons.find(btn => btn.querySelector('svg'));
    expect(undoButton).toBeInTheDocument();
  });

  it('should call handleUndoTransaction when undo button is clicked', () => {
    render(<History {...mockProps} />);

    const undoButton = screen.getAllByRole('button')[0];
    fireEvent.click(undoButton);

    expect(mockHandleUndoTransaction).toHaveBeenCalledWith(mockTransactions[0]);
  });

  it('should filter transactions by search term', () => {
    render(<History {...mockProps} />);

    const searchInput = screen.getByPlaceholderText(translations.en.searchTransactions);
    fireEvent.change(searchInput, { target: { value: 'Dell' } });

    expect(screen.getByText('Dell XPS')).toBeInTheDocument();
    expect(screen.queryByText('HP Pavilion')).not.toBeInTheDocument();
  });
});
