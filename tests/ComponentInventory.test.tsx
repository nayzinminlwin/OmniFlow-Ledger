import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComponentInventory } from '../src/components/ComponentInventory';
import { translations } from '../src/translations';
import { ComponentStock, ComponentTransaction, UserProfile } from '../src/types';
import { COMPONENTS } from '../src/constants';

describe('ComponentInventory Component', () => {
  const t = translations.en;
  const mockUsers: Record<string, UserProfile> = {
    'u1': { uid: 'u1', email: 'admin@test.com', role: 'admin', displayName: 'Admin User', username: 'Admin User' }
  };

  const mockStock: ComponentStock = {
    items: [
      {
        brand: 'Dell',
        series: 'XPS',
        model: '13',
        counts: { Screen: 5, Battery: 2 } as any
      }
    ],
    lastUpdated: new Date().toISOString()
  };

  const mockTransactions: ComponentTransaction[] = [
    {
      id: 'tx1',
      type: 'PURCHASE',
      timestamp: new Date().toISOString(),
      userId: 'u1',
      brand: 'Dell',
      series: 'XPS',
      model: '13',
      componentChanges: { Screen: 5, Battery: 2 } as any,
      notes: 'Initial purchase'
    }
  ];

  it('renders correctly when active', () => {
    render(
      <ComponentInventory
        componentStock={mockStock}
        spoiledComponentStock={null}
        componentTransactions={mockTransactions}
        users={mockUsers}
        t={t}
        activeTab="componentInventory"
      />
    );

    expect(screen.getByText(t.componentInventory)).toBeInTheDocument();
    expect(screen.getAllByText('Dell').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('XPS').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('13').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('5').length).toBeGreaterThanOrEqual(1); // Screen count
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1); // Battery count
    expect(screen.getByText(t.ledger)).toBeInTheDocument();
    expect(screen.getByText('Initial purchase')).toBeInTheDocument();
  });

  it('renders nothing when hidden', () => {
    const { container } = render(
      <ComponentInventory
        componentStock={mockStock}
        spoiledComponentStock={null}
        componentTransactions={mockTransactions}
        users={mockUsers}
        t={t}
        activeTab="dashboard"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows empty state messages', () => {
    render(
      <ComponentInventory
        componentStock={null}
        spoiledComponentStock={null}
        componentTransactions={[]}
        users={mockUsers}
        t={t}
        activeTab="componentInventory"
      />
    );

    const emptyMessages = screen.getAllByText(t.noInventoryData);
    expect(emptyMessages.length).toBeGreaterThan(0);
    expect(screen.getByText(t.noTransactions)).toBeInTheDocument();
  });

  it('renders spoiled components table', () => {
    const mockSpoiled: ComponentStock = {
      items: [
        {
          brand: 'HP',
          series: 'Spectre',
          model: 'x360',
          counts: { Keyboard: 1 } as any
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    render(
      <ComponentInventory
        componentStock={null}
        spoiledComponentStock={mockSpoiled}
        componentTransactions={[]}
        users={mockUsers}
        t={t}
        activeTab="componentInventory"
      />
    );

    expect(screen.getByText(t.spoiledComponents)).toBeInTheDocument();
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('Spectre')).toBeInTheDocument();
    expect(screen.getByText('x360')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('correctly resolves usernames in transactions', () => {
    render(
      <ComponentInventory
        componentStock={null}
        spoiledComponentStock={null}
        componentTransactions={mockTransactions}
        users={mockUsers}
        t={t}
        activeTab="componentInventory"
      />
    );

    expect(screen.getByText('Admin User')).toBeInTheDocument();
  });

  it('renders undo transaction type correctly', () => {
    const undoTx: ComponentTransaction = {
      ...mockTransactions[0],
      id: 'tx2',
      type: 'UNDO',
      undoneType: 'PURCHASE'
    };

    render(
      <ComponentInventory
        componentStock={null}
        spoiledComponentStock={null}
        componentTransactions={[undoTx]}
        users={mockUsers}
        t={t}
        activeTab="componentInventory"
      />
    );

    expect(screen.getByText(`${t.undo} ${t.purchase}`)).toBeInTheDocument();
  });
});
