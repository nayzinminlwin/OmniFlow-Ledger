import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Navigation } from '../src/components/Navigation';
import { translations } from '../src/translations';

describe('Navigation Component', () => {
  const mockSetActiveTab = vi.fn();
  const t = translations.en;

  beforeEach(() => {
    mockSetActiveTab.mockClear();
  });

  it('renders all standard navigation buttons', () => {
    render(
      <Navigation 
        activeTab="dashboard" 
        setActiveTab={mockSetActiveTab} 
        t={t} 
        isUltimateAdmin={false} 
      />
    );

    expect(screen.getByText(t.dashboard)).toBeInTheDocument();
    expect(screen.getByText(t.batches)).toBeInTheDocument();
    expect(screen.getByText(t.updateStock)).toBeInTheDocument();
    expect(screen.getByText(t.updateComponents)).toBeInTheDocument();
    expect(screen.getByText(t.componentInventory)).toBeInTheDocument();
    expect(screen.getByText(t.ledger)).toBeInTheDocument();
    
    // User management should not be visible for non-ultimate admins
    expect(screen.queryByText(t.userManagement)).not.toBeInTheDocument();
  });

  it('renders user management button for ultimate admins', () => {
    render(
      <Navigation 
        activeTab="dashboard" 
        setActiveTab={mockSetActiveTab} 
        t={t} 
        isUltimateAdmin={true} 
      />
    );

    expect(screen.getByText(t.userManagement)).toBeInTheDocument();
  });

  it('calls setActiveTab when a button is clicked', () => {
    render(
      <Navigation 
        activeTab="dashboard" 
        setActiveTab={mockSetActiveTab} 
        t={t} 
        isUltimateAdmin={false} 
      />
    );

    const batchesButton = screen.getByText(t.batches);
    fireEvent.click(batchesButton);

    expect(mockSetActiveTab).toHaveBeenCalledWith('batches');
    expect(mockSetActiveTab).toHaveBeenCalledTimes(1);
  });

  it('applies active styling to the currently active tab', () => {
    render(
      <Navigation 
        activeTab="history" 
        setActiveTab={mockSetActiveTab} 
        t={t} 
        isUltimateAdmin={false} 
      />
    );

    const historyButton = screen.getByText(t.ledger).closest('button');
    expect(historyButton).toHaveAttribute('data-active', 'true');
    expect(historyButton).toHaveClass('bg-white');

    const dashboardButton = screen.getByText(t.dashboard).closest('button');
    expect(dashboardButton).toHaveAttribute('data-active', 'false');
    expect(dashboardButton).not.toHaveClass('bg-white');
  });
});
