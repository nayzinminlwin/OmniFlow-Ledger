import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UpdateComponents } from './UpdateComponents';
import { Batch, Stock, ComponentStock } from '../types';
import { translations } from '../translations';

// Mock hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'user123' } })
}));

vi.mock('../hooks/useTransactionActions', () => ({
  useTransactionActions: () => ({
    recordComponentBreakdown: vi.fn().mockResolvedValue(true),
    recordComponentPurchase: vi.fn().mockResolvedValue(true),
    recordComponentInstallation: vi.fn().mockResolvedValue(true),
    isSubmitting: false,
    error: null,
    setError: vi.fn(),
    success: null,
    setSuccess: vi.fn()
  })
}));

const t = translations.en;

const mockStock: Stock = {
  lastUpdated: new Date().toISOString(),
  items: [
    { brand: 'Dell', series: 'Latitude', model: '5400', counts: { A: 10, B: 0, 'B-': 0, C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, D: 0, Spoiled: 0, UNCLASSIFIED: 0 } }
  ]
};

const mockComponentStock: ComponentStock = {
  lastUpdated: new Date().toISOString(),
  items: []
};

const mockBatches: Batch[] = [
  {
    batchId: '01-01-2024',
    createdAt: new Date().toISOString(),
    active: true,
    items: [
      { brand: 'Dell', series: 'Latitude', model: '5400', counts: { A: 10, B: 0, 'B-': 0, C1: 0, C2: 0, C3: 0, C4: 0, C5: 0, D: 0, Spoiled: 0, UNCLASSIFIED: 0 } }
    ]
  }
];

describe('UpdateComponents Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders correctly with initial state', () => {
    render(
      <UpdateComponents
        stock={mockStock}
        componentStock={mockComponentStock}
        batches={mockBatches}
        t={t}
        lang="en"
        activeTab="components"
      />
    );

    // Check for mode buttons
    expect(screen.getByText(t.extractFromLaptop)).toBeDefined();
    expect(screen.getByText(t.buyComponents)).toBeDefined();
    expect(screen.getByText(t.installComponents)).toBeDefined();
  });

  it('switches modes correctly', () => {
    render(
      <UpdateComponents
        stock={mockStock}
        componentStock={mockComponentStock}
        batches={mockBatches}
        t={t}
        lang="en"
        activeTab="components"
      />
    );

    const buyBtn = screen.getByText(t.buyComponents);
    fireEvent.click(buyBtn);

    // In buy mode, we should see brand selection
    expect(screen.getByText(t.brandLabel)).toBeDefined();
  });
});
