import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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
    t: translations.en,
    activeTab: 'history',
    onUndo: mockHandleUndoTransaction,
    currentUserProfile: mockUsers.user1,
    isAdmin: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render transaction list correctly', () => {
    render(<History {...mockProps} />);

    expect(screen.getByText(/Dell/)).toBeInTheDocument();
    expect(screen.getByText(/XPS/)).toBeInTheDocument();
    expect(screen.getAllByText(/HP/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Pavilion/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
  });

  it('should display Undo type with correct label', () => {
    render(<History {...mockProps} />);

    const undoLabels = screen.getAllByText('Undo');
    expect(undoLabels.length).toBeGreaterThan(0);
    // Check if at least one has yellow styling
    const yellowUndo = undoLabels.find(el => el.className.includes('yellow'));
    expect(yellowUndo).toBeDefined();
  });

  it('should show undo button for non-undo transactions when user is admin', () => {
    render(<History {...mockProps} />);

    const undoButtons = screen.getAllByRole('button');
    // For tx1, there should be an undo button. tx2 is already an Undo type.
    // Let's check if the button with Undo2 icon exists.
    const undoButton = undoButtons.find(btn => btn.querySelector('svg'));
    expect(undoButton).toBeInTheDocument();
  });

  it('should hide undo button for non-admin users', () => {
    render(<History {...mockProps} isAdmin={false} />);

    const undoButtons = screen.queryAllByRole('button');
    expect(undoButtons.length).toBe(0);
  });

  it('should call onUndo when undo button is clicked', async () => {
    render(<History {...mockProps} />);

    const undoButton = screen.getByTitle('Undo');
    await act(async () => {
      fireEvent.click(undoButton);
    });

    expect(mockHandleUndoTransaction).toHaveBeenCalledWith(mockTransactions[0].id, mockUsers.user1);
  });

  it('should filter transactions by search term', () => {
    render(<History {...mockProps} />);

    const searchInput = screen.getByPlaceholderText(translations.en.searchTransactions);
    fireEvent.change(searchInput, { target: { value: 'Dell' } });

    expect(screen.getByText(/Dell/)).toBeInTheDocument();
    expect(screen.queryByText(/HP/)).not.toBeInTheDocument();
  });

  it('renders nothing when hidden', () => {
    const { container } = render(<History {...mockProps} activeTab="dashboard" />);
    expect(container.firstChild).toHaveClass('hidden');
  });
});
