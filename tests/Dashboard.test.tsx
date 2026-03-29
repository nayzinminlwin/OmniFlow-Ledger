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
        t={t} 
        activeTab="dashboard" 
        isAdmin={true}
      />
    );

    expect(screen.getByText(t.totalInventory)).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument(); // 10+5+2+1
  });

  it('shows export report button for admin', () => {
    render(
      <Dashboard 
        stock={mockStock} 
        batches={mockBatches} 
        t={t} 
        activeTab="dashboard" 
        isAdmin={true}
      />
    );

    expect(screen.getByText(t.exportReport)).toBeInTheDocument();
  });

  it('hides export report button for non-admin', () => {
    render(
      <Dashboard 
        stock={mockStock} 
        batches={mockBatches} 
        t={t} 
        activeTab="dashboard" 
        isAdmin={false}
      />
    );

    expect(screen.queryByText(t.exportReport)).not.toBeInTheDocument();
  });

  it('renders nothing when hidden', () => {
    const { container } = render(
      <Dashboard 
        stock={mockStock} 
        batches={mockBatches} 
        t={t} 
        activeTab="history" 
        isAdmin={true}
      />
    );

    expect(container.firstChild).toHaveClass('hidden');
  });
});
