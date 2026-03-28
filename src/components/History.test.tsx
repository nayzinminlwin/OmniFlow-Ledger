import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { History } from './History';
import { Transaction, UserProfile } from '../types';

// Mock translation function
const t = (key: string) => key;

const mockTransactions: Transaction[] = [
  {
    id: 'tx1',
    timestamp: '2024-01-01T10:00:00Z',
    batchId: '01-01-2024',
    brand: 'Dell',
    series: 'Latitude',
    model: '5400',
    type: 'INCOMING',
    fromClass: 'D',
    toClass: 'UNCLASSIFIED',
    quantity: 10,
    userId: 'user1',
    notes: 'Initial stock'
  }
];

const mockUsers: Record<string, UserProfile> = {
  'user1': { uid: 'user1', email: 'user1@example.com', role: 'admin', username: 'Admin User', status: 'approved', createdAt: new Date().toISOString() }
};

const mockCurrentUser: UserProfile = { uid: 'user1', email: 'user1@example.com', role: 'admin', username: 'Admin User', status: 'approved', createdAt: new Date().toISOString() };

describe('History Component', () => {
  const mockOnUndo = vi.fn().mockResolvedValue(true);

  it('renders correctly when active', () => {
    render(
      <History
        transactions={mockTransactions}
        users={mockUsers}
        t={t}
        activeTab="history"
        onUndo={mockOnUndo}
        currentUserProfile={mockCurrentUser}
      />
    );

    expect(screen.getByText('Dell')).toBeDefined();
    expect(screen.getByText('Latitude')).toBeDefined();
    expect(screen.getByText('5400')).toBeDefined();
    expect(screen.getByText('INCOMING')).toBeDefined();
  });

  it('does not render when not active', () => {
    const { container } = render(
      <History
        transactions={mockTransactions}
        users={mockUsers}
        t={t}
        activeTab="dashboard"
        onUndo={mockOnUndo}
        currentUserProfile={mockCurrentUser}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('calls onUndo when undo button is clicked', async () => {
    render(
      <History
        transactions={mockTransactions}
        users={mockUsers}
        t={t}
        activeTab="history"
        onUndo={mockOnUndo}
        currentUserProfile={mockCurrentUser}
      />
    );

    const undoBtn = screen.getByRole('button', { name: /undo/i });
    fireEvent.click(undoBtn);

    expect(mockOnUndo).toHaveBeenCalledWith('tx1', mockCurrentUser);
  });
});
