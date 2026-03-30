import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { Dashboard } from '../src/components/Dashboard';
import { translations } from '../src/translations';
import { Stock, Batch } from '../src/types';
import { INITIAL_CLASS_COUNTS } from '../src/constants';

describe('Dashboard Component', () => {
  const t = translations.en;
  const mockStock: Stock = {
    items: [
      { 
        brand: 'Apple', 
        series: 'MacBook', 
        model: 'Pro', 
        counts: { ...INITIAL_CLASS_COUNTS, A: 10, B: 5, C1: 2, D: 1 } 
      }
    ],
    lastUpdated: new Date().toISOString()
  };
  const mockBatches: Batch[] = [];

  it('renders dashboard stats correctly', () => {
    render(
      <Dashboard 
        stock={mockStock} 
        batches={mockBatches} 
        transactions={[]}
        t={t} 
        activeTab="dashboard" 
        setActiveTab={vi.fn()}
        isAdmin={true}
      />
    );

    expect(screen.getByText(t.currentInventory)).toBeInTheDocument();
    expect(screen.getAllByText('18').length).toBeGreaterThanOrEqual(1);
  });

  it('calculates totals correctly', () => {
    render(
      <Dashboard 
        stock={mockStock} 
        batches={mockBatches} 
        transactions={[]}
        t={t} 
        activeTab="dashboard" 
        setActiveTab={vi.fn()}
        isAdmin={true}
      />
    );

    // Apple total: 10+5+2+1 = 18
    const cells = screen.getAllByRole('cell');
    const cellTexts = Array.from(cells).map(cell => cell.textContent);
    
    expect(cellTexts).toContain('18');
  });

  it('shows skeleton when loading', () => {
    render(
      <Dashboard 
        stock={null} 
        batches={mockBatches} 
        transactions={[]}
        t={t} 
        activeTab="dashboard" 
        setActiveTab={vi.fn()}
        isAdmin={true}
        loading={true}
      />
    );

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('shows export report button for admin', () => {
    render(
      <Dashboard 
        stock={mockStock} 
        batches={mockBatches} 
        transactions={[]}
        t={t} 
        activeTab="dashboard" 
        setActiveTab={vi.fn()}
        isAdmin={true}
      />
    );

    expect(screen.getByText(t.export)).toBeInTheDocument();
  });

  it('hides export report button for non-admin', () => {
    render(
      <Dashboard 
        stock={mockStock} 
        batches={mockBatches} 
        transactions={[]}
        t={t} 
        activeTab="dashboard" 
        setActiveTab={vi.fn()}
        isAdmin={false}
      />
    );

    expect(screen.queryByText(t.export)).not.toBeInTheDocument();
  });

  it('renders nothing when hidden', () => {
    const { container } = render(
      <Dashboard 
        stock={mockStock} 
        batches={mockBatches} 
        transactions={[]}
        t={t} 
        activeTab="history" 
        setActiveTab={vi.fn()}
        isAdmin={true}
      />
    );

    expect(container.firstChild).toHaveClass('hidden');
  });

  it('shows no inventory message when empty', () => {
    render(
      <Dashboard 
        stock={{ items: [], lastUpdated: null }} 
        batches={[]} 
        transactions={[]}
        t={t} 
        activeTab="dashboard" 
        setActiveTab={vi.fn()}
      />
    );

    expect(screen.getByText(t.noInventoryData)).toBeInTheDocument();
  });

  it('renders recent activity correctly', () => {
    const mockTransactions = [
      {
        id: 'tx1',
        type: 'INCOMING',
        brand: 'Apple',
        series: 'MacBook',
        model: 'Pro',
        quantity: 10,
        timestamp: new Date().toISOString(),
        toClass: 'UNCLASSIFIED'
      },
      {
        id: 'tx2',
        type: 'BREAKDOWN',
        brand: 'Apple',
        series: 'MacBook',
        model: 'Pro',
        quantity: 1,
        fromClass: 'A',
        timestamp: new Date().toISOString(),
        componentChanges: { Screen: 1, Battery: 1 }
      }
    ];

    render(
      <Dashboard 
        stock={mockStock} 
        batches={mockBatches} 
        transactions={mockTransactions as any}
        t={t} 
        activeTab="dashboard" 
        setActiveTab={vi.fn()}
      />
    );

    expect(screen.getByText(t.recentActivity)).toBeInTheDocument();
    expect(screen.getByText(t.incoming)).toBeInTheDocument();
    expect(screen.getByText(/breakdown/i)).toBeInTheDocument();
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getByText('-1')).toBeInTheDocument();
  });

  it('toggles breakdown popup on click', async () => {
    const mockTransactions = [
      {
        id: 'tx1',
        type: 'BREAKDOWN',
        brand: 'Apple',
        series: 'MacBook',
        model: 'Pro',
        quantity: 1,
        fromClass: 'A',
        timestamp: new Date().toISOString(),
        componentChanges: { Screen: 1, Battery: 1 }
      }
    ];

    render(
      <Dashboard 
        stock={mockStock} 
        batches={mockBatches} 
        transactions={mockTransactions as any}
        t={t} 
        activeTab="dashboard" 
        setActiveTab={vi.fn()}
      />
    );

    const breakdownItem = screen.getByText(/breakdown/i).closest('div[class*="cursor-pointer"]');
    expect(breakdownItem).toBeInTheDocument();

    // Initially popup is hidden
    expect(screen.queryByText(t.goodComponents)).not.toBeInTheDocument();

    // Click to show
    await act(async () => {
      if (breakdownItem) fireEvent.click(breakdownItem);
    });

    expect(screen.getByText(t.goodComponents)).toBeInTheDocument();
    expect(screen.getByText('Screen')).toBeInTheDocument();
    expect(screen.getByText('Battery')).toBeInTheDocument();

    // Click again to hide
    await act(async () => {
      if (breakdownItem) fireEvent.click(breakdownItem);
    });

    expect(screen.queryByText(t.goodComponents)).not.toBeInTheDocument();
  });

  it('navigates to history when clicking view full ledger', async () => {
    const setActiveTab = vi.fn();
    render(
      <Dashboard 
        stock={mockStock} 
        batches={mockBatches} 
        transactions={[]}
        t={t} 
        activeTab="dashboard" 
        setActiveTab={setActiveTab}
      />
    );

    const viewFullLedger = screen.getByText(t.viewFullLedger);
    await act(async () => {
      fireEvent.click(viewFullLedger);
    });

    expect(setActiveTab).toHaveBeenCalledWith('history');
  });

  it('disables export button when no batches or loading', () => {
    const { rerender } = render(
      <Dashboard 
        stock={mockStock} 
        batches={[]} 
        transactions={[]}
        t={t} 
        activeTab="dashboard" 
        setActiveTab={vi.fn()}
        isAdmin={true}
      />
    );

    const exportButton = screen.getByText(t.export).closest('button');
    expect(exportButton).toBeDisabled();

    rerender(
      <Dashboard 
        stock={mockStock} 
        batches={[{ id: '1' } as any]} 
        transactions={[]}
        t={t} 
        activeTab="dashboard" 
        setActiveTab={vi.fn()}
        isAdmin={true}
        loading={true}
      />
    );
    expect(exportButton).toBeDisabled();
  });
});
