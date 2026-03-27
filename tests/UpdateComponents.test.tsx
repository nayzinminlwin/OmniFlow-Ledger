import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateComponents } from '../src/components/UpdateComponents';
import { translations } from '../src/translations';
import { Stock, ComponentStock, Batch } from '../src/types';

// Mock the hooks
const mockRecordComponentBreakdown = vi.fn();
const mockRecordComponentPurchase = vi.fn();
const mockRecordComponentInstallation = vi.fn();
const mockSetError = vi.fn();
const mockSetSuccess = vi.fn();

vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'user123' } })
}));

vi.mock('../src/hooks/useTransactionActions', () => ({
  useTransactionActions: () => ({
    recordComponentBreakdown: mockRecordComponentBreakdown,
    recordComponentPurchase: mockRecordComponentPurchase,
    recordComponentInstallation: mockRecordComponentInstallation,
    isSubmitting: false,
    error: null,
    setError: mockSetError,
    success: null,
    setSuccess: mockSetSuccess
  })
}));

const mockStock: Stock = {
  items: [
    {
      brand: 'Apple',
      series: 'MacBook Pro',
      model: 'M1 2020',
      counts: { 'A': 5, 'B': 2 }
    }
  ],
  lastUpdated: new Date().toISOString()
};

const mockComponentStock: ComponentStock = {
  items: [
    {
      brand: 'Apple',
      series: 'MacBook Pro',
      model: 'M1 2020',
      counts: { 'Screen': 10, 'Battery': 5 }
    }
  ],
  lastUpdated: new Date().toISOString()
};

const mockBatches: Batch[] = [
  {
    id: 'batch1',
    batchId: 'B-2023-01',
    active: true,
    items: [
      {
        brand: 'Apple',
        series: 'MacBook Pro',
        model: 'M1 2020',
        counts: { 'A': 5, 'B': 2 }
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

describe('UpdateComponents', () => {
  const t = translations.en;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders nothing if activeTab is not components', () => {
    const { container } = render(
      <UpdateComponents 
        stock={mockStock} 
        componentStock={mockComponentStock} 
        batches={mockBatches} 
        t={t} 
        lang="en" 
        activeTab="dashboard" 
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when activeTab is components', () => {
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
    expect(screen.getByText(t.updateComponents)).toBeInTheDocument();
    expect(screen.getByText(t.extractFromLaptop)).toBeInTheDocument();
    expect(screen.getByText(t.buy)).toBeInTheDocument();
    expect(screen.getByText(t.install)).toBeInTheDocument();
  });

  it('switches modes correctly', async () => {
    const user = userEvent.setup();
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

    // Default is extract
    expect(screen.getByText(t.breakdown)).toBeInTheDocument();

    // Switch to buy
    await user.click(screen.getByText(t.buy));
    expect(screen.getByText(t.buyComponents)).toBeInTheDocument();

    // Switch to install
    await user.click(screen.getByText(t.install));
    expect(screen.getByText(t.installComponents)).toBeInTheDocument();
  });

  it('handles buy component submission', async () => {
    const user = userEvent.setup();
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

    // Switch to buy mode
    await user.click(screen.getByText(t.buy));

    // Select existing brand, series, model
    const brandSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(brandSelect, 'Apple');

    const seriesSelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(seriesSelect, 'MacBook Pro');

    const modelSelect = screen.getAllByRole('combobox')[2];
    await user.selectOptions(modelSelect, 'M1 2020');

    // Select component
    const componentSelect = screen.getAllByRole('combobox')[3];
    await user.selectOptions(componentSelect, 'Screen');

    // Enter quantity
    const quantityInput = screen.getByPlaceholderText('0');
    await user.clear(quantityInput);
    await user.type(quantityInput, '5');

    // Submit
    const submitButton = screen.getByText(t.recordEntry);
    await user.click(submitButton);

    expect(mockRecordComponentPurchase).toHaveBeenCalledWith({
      brand: 'Apple',
      series: 'MacBook Pro',
      model: 'M1 2020',
      componentChanges: { Screen: 5 },
      notes: ''
    });
  });

  it('handles install component submission', async () => {
    const user = userEvent.setup();
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

    // Switch to install mode
    await user.click(screen.getByText(t.install));

    // Select existing brand, series, model
    const brandSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(brandSelect, 'Apple');

    const seriesSelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(seriesSelect, 'MacBook Pro');

    const modelSelect = screen.getAllByRole('combobox')[2];
    await user.selectOptions(modelSelect, 'M1 2020');

    // Select component
    const componentSelect = screen.getAllByRole('combobox')[3];
    await user.selectOptions(componentSelect, 'Screen');

    // Enter quantity
    const quantityInput = screen.getByPlaceholderText('0');
    await user.clear(quantityInput);
    await user.type(quantityInput, '2');

    // Submit
    const submitButton = screen.getByText(t.recordEntry);
    await user.click(submitButton);

    expect(mockRecordComponentInstallation).toHaveBeenCalledWith({
      brand: 'Apple',
      series: 'MacBook Pro',
      model: 'M1 2020',
      componentChanges: { Screen: 2 },
      notes: ''
    });
  });
});
