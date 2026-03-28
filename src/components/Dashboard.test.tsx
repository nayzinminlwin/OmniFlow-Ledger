import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { Stock, Batch, Transaction } from '../types';

// Mock translation function
const t = (key: string) => key;

const mockStock: Stock = {
  lastUpdated: new Date().toISOString(),
  items: [
    {
      brand: 'Dell',
      series: 'Latitude',
      model: '5400',
      counts: {
        A: 5,
        B: 3,
        'B-': 0,
        C1: 2,
        C2: 0,
        C3: 0,
        C4: 0,
        C5: 0,
        D: 0,
        UNCLASSIFIED: 10,
        Spoiled: 1
      }
    },
    {
      brand: 'HP',
      series: 'EliteBook',
      model: '840',
      counts: {
        A: 2,
        B: 2,
        'B-': 0,
        C1: 2,
        C2: 0,
        C3: 0,
        C4: 0,
        C5: 0,
        D: 2,
        UNCLASSIFIED: 2,
        Spoiled: 2
      }
    }
  ]
};

const mockBatches: Batch[] = [];
const mockTransactions: Transaction[] = [];

describe('Dashboard Component', () => {
  const mockSetActiveTab = vi.fn();

  it('renders correctly with stock data', () => {
    render(
      <Dashboard
        stock={mockStock}
        batches={mockBatches}
        transactions={mockTransactions}
        t={t}
        setActiveTab={mockSetActiveTab}
        activeTab="dashboard"
      />
    );

    expect(screen.getByText('Dell')).toBeInTheDocument();
    expect(screen.getByText('Latitude')).toBeInTheDocument();
    expect(screen.getByText('5400')).toBeInTheDocument();
    expect(screen.getByText('HP')).toBeInTheDocument();
    expect(screen.getByText('EliteBook')).toBeInTheDocument();
    expect(screen.getByText('840')).toBeInTheDocument();
  });

  it('calculates totals correctly', () => {
    render(
      <Dashboard
        stock={mockStock}
        batches={mockBatches}
        transactions={mockTransactions}
        t={t}
        setActiveTab={mockSetActiveTab}
        activeTab="dashboard"
      />
    );

    // Dell total: 5+3+2+0+10+1 = 21
    // HP total: 2+2+2+2+2+2 = 12
    // Grand total: 21 + 12 = 33
    
    const cells = screen.getAllByRole('cell');
    const cellTexts = Array.from(cells).map(cell => cell.textContent);
    
    expect(cellTexts).toContain('21');
    expect(cellTexts).toContain('12');
    expect(cellTexts).toContain('33');
  });

  it('shows skeleton when loading', () => {
    render(
      <Dashboard
        stock={null}
        batches={mockBatches}
        transactions={mockTransactions}
        t={t}
        setActiveTab={mockSetActiveTab}
        activeTab="dashboard"
        loading={true}
      />
    );

    // Skeleton should be visible
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('does not render when not active', () => {
    const { container } = render(
      <Dashboard
        stock={mockStock}
        batches={mockBatches}
        transactions={mockTransactions}
        t={t}
        setActiveTab={mockSetActiveTab}
        activeTab="history"
      />
    );

    expect(container.firstChild).toHaveClass('hidden');
  });
});
