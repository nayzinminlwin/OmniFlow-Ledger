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

  it('shows no transactions message when empty', () => {
    render(<History {...mockProps} transactions={[]} />);
    expect(screen.getByText(translations.en.noTransactions)).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    render(<History {...mockProps} loading={true} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('toggles breakdown popup on click', async () => {
    const breakdownTx: Transaction = {
      id: 'tx-breakdown',
      type: 'BREAKDOWN',
      brand: 'Apple',
      series: 'MacBook',
      model: 'Pro',
      quantity: 1,
      fromClass: 'A',
      timestamp: new Date().toISOString(),
      userId: 'user1',
      batchId: 'batch1',
      batchActive: true,
      componentChanges: { Screen: 1, Battery: 1 }
    };

    render(<History {...mockProps} transactions={[breakdownTx]} />);

    const trigger = document.querySelector('.breakdown-trigger') as HTMLElement;
    expect(trigger).toBeInTheDocument();

    // Initially popup is not in document
    expect(screen.queryByText(translations.en.goodComponents)).not.toBeInTheDocument();

    // Click to show popup
    await act(async () => {
      trigger.click();
    });

    // Popup is rendered via portal, so it should be in document.body
    expect(screen.getByText(translations.en.goodComponents)).toBeInTheDocument();
    expect(screen.getByText('Screen')).toBeInTheDocument();
    expect(screen.getByText('Battery')).toBeInTheDocument();

    // Click again to hide
    await act(async () => {
      trigger?.click();
    });

    // Use waitFor to handle potential exit animations from AnimatePresence
    const { waitFor } = await import('@testing-library/react');
    await waitFor(() => {
      expect(screen.queryByText(translations.en.goodComponents)).not.toBeInTheDocument();
    });
  });

  it('disables undo button based on permissions', () => {
    const txFromOtherUser: Transaction = {
      ...mockTransactions[0],
      userId: 'other-user'
    };
    
    const otherUser: UserProfile = {
      uid: 'other-user',
      username: 'Other User',
      email: 'other@test.com',
      status: 'approved',
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    const regularAdmin: UserProfile = {
      uid: 'admin1',
      username: 'Admin 1',
      email: 'admin1@test.com',
      status: 'approved',
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    // Case 1: Regular admin cannot undo other user's transaction
    const { rerender } = render(
      <History 
        {...mockProps} 
        transactions={[txFromOtherUser]} 
        users={{ ...mockUsers, 'other-user': otherUser }}
        currentUserProfile={regularAdmin}
      />
    );

    const undoBtn = screen.getByTitle('Undo');
    expect(undoBtn).toBeDisabled();

    // Case 2: Ultimate admin can undo other user's transaction (if other is not ultimate/original)
    const ultimateAdmin: UserProfile = {
      ...regularAdmin,
      isUltimateAdmin: true
    };

    rerender(
      <History 
        {...mockProps} 
        transactions={[txFromOtherUser]} 
        users={{ ...mockUsers, 'other-user': otherUser }}
        currentUserProfile={ultimateAdmin}
      />
    );
    expect(undoBtn).not.toBeDisabled();

    // Case 3: Original admin can undo anything
    const originalAdmin: UserProfile = {
      ...regularAdmin,
      isOriginalAdmin: true
    };

    rerender(
      <History 
        {...mockProps} 
        transactions={[txFromOtherUser]} 
        users={{ ...mockUsers, 'other-user': otherUser }}
        currentUserProfile={originalAdmin}
      />
    );
    expect(undoBtn).not.toBeDisabled();
  });

  it('disables undo button if transaction is already undone or batch deleted', () => {
    const undoneTx: Transaction = {
      ...mockTransactions[0],
      isUndone: true
    };

    const { rerender } = render(<History {...mockProps} transactions={[undoneTx]} />);
    expect(screen.queryByTitle('Undo')).not.toBeInTheDocument();
    expect(screen.getByText(translations.en.undone)).toBeInTheDocument();

    const deletedBatchTx: Transaction = {
      ...mockTransactions[0],
      batchActive: false
    };

    rerender(<History {...mockProps} transactions={[deletedBatchTx]} />);
    expect(screen.queryByTitle('Undo')).not.toBeInTheDocument();
    expect(screen.getByText(translations.en.batchDeleted)).toBeInTheDocument();
  });
});
