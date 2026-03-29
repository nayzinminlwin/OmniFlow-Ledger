import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
