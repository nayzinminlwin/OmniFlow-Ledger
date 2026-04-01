import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateComponents } from '../src/components/UpdateComponents';
import { translations } from '../src/translations';
import { Stock, ComponentStock, Batch } from '../src/types';
import { INITIAL_CLASS_COUNTS, INITIAL_COMPONENT_COUNTS } from '../src/constants';

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
      counts: { ...INITIAL_CLASS_COUNTS, 'A': 5, 'B': 2, 'C1': 10 }
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
      counts: { ...INITIAL_COMPONENT_COUNTS, 'Screen': 10, 'Battery': 5 }
    }
  ],
  lastUpdated: new Date().toISOString()
};

const mockBatches: Batch[] = [
  {
    id: 'batch1',
    batchId: '16-03-2026',
    active: true,
    items: [
      {
        brand: 'Apple',
        series: 'MacBook Pro',
        model: 'M1 2020',
        counts: { ...INITIAL_CLASS_COUNTS, 'A': 5, 'B': 2, 'C1': 10 }
      }
    ],
    createdAt: new Date().toISOString()
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
        isAdmin={true}
      />
    );
    expect(container.firstChild).toHaveClass('hidden');
  });

  it('renders correctly when activeTab is components and user is admin', () => {
    render(
      <UpdateComponents 
        stock={mockStock} 
        componentStock={mockComponentStock} 
        batches={mockBatches} 
        t={t} 
        lang="en" 
        activeTab="components" 
        isAdmin={true}
      />
    );
    expect(screen.getByText(translations.en.extractFromLaptop)).toBeInTheDocument();
    expect(screen.getByText(translations.en.buyComponents)).toBeInTheDocument();
    expect(screen.getByText(translations.en.installComponents)).toBeInTheDocument();
  });

  it('renders access restricted message for non-admin users', () => {
    render(
      <UpdateComponents 
        stock={mockStock} 
        componentStock={mockComponentStock} 
        batches={mockBatches} 
        t={t} 
        lang="en" 
        activeTab="components" 
        isAdmin={false}
      />
    );
    expect(screen.getByText(t.accessRestricted)).toBeInTheDocument();
    expect(screen.queryByText(t.extractFromLaptop)).not.toBeInTheDocument();
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
        isAdmin={true}
      />
    );

    // Default is extract
    expect(screen.getByText(translations.en.extractFromLaptop)).toBeInTheDocument();

    // Switch to buy
    await user.click(screen.getByText(translations.en.buyComponents));
    expect(screen.getByText(translations.en.buyComponents)).toBeInTheDocument();

    // Switch to install
    await user.click(screen.getByText(translations.en.installComponents));
    expect(screen.getByText(translations.en.installComponents)).toBeInTheDocument();
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
        isAdmin={true}
      />
    );

    // Switch to buy mode
    await user.click(screen.getByText(t.buyComponents));

    // Select existing brand, series, model
    const brandSelect = screen.getByLabelText(t.brandLabel);
    await user.selectOptions(brandSelect, 'Apple');

    const seriesSelect = screen.getByLabelText(t.seriesLabel);
    await user.selectOptions(seriesSelect, 'MacBook Pro');

    const modelSelect = screen.getByLabelText(t.modelLabel);
    await user.selectOptions(modelSelect, 'M1 2020');

    // Select component
    const componentSelect = screen.getByLabelText(t.componentLabel);
    await user.selectOptions(componentSelect, 'Screen');

    // Enter quantity
    const quantityInput = screen.getByLabelText(t.quantity);
    fireEvent.change(quantityInput, { target: { value: '5' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: t.recordEntry });
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
        isAdmin={true}
      />
    );

    // Switch to install mode
    await user.click(screen.getByText(t.installComponents));

    // Select brand, series, model
    const brandSelect = screen.getByLabelText(t.brandLabel);
    await user.selectOptions(brandSelect, 'Apple');

    const seriesSelect = screen.getByLabelText(t.seriesLabel);
    await user.selectOptions(seriesSelect, 'MacBook Pro');

    const modelSelect = screen.getByLabelText(t.modelLabel);
    await user.selectOptions(modelSelect, 'M1 2020');

    // Select component
    const componentSelect = screen.getByLabelText(t.componentLabel);
    await user.selectOptions(componentSelect, 'Screen');

    // Enter quantity
    const quantityInput = screen.getByLabelText(t.quantity);
    fireEvent.change(quantityInput, { target: { value: '2' } });

    console.log('Available text:', screen.queryByText(/Available:/)?.textContent);

    // Submit
    const submitButton = screen.getByRole('button', { name: t.recordEntry });
    console.log('Submit button disabled:', (submitButton as HTMLButtonElement).disabled);
    await user.click(submitButton);

    expect(mockRecordComponentInstallation).toHaveBeenCalledWith({
      brand: 'Apple',
      series: 'MacBook Pro',
      model: 'M1 2020',
      componentChanges: { Screen: 2 },
      notes: ''
    });
  });

  it('handles component breakdown (extract mode) submission', async () => {
    const user = userEvent.setup();
    render(
      <UpdateComponents 
        stock={mockStock} 
        componentStock={mockComponentStock} 
        batches={mockBatches} 
        t={t} 
        lang="en" 
        activeTab="components" 
        isAdmin={true}
      />
    );

    // Default is extract mode

    // Select batch
    const batchSelect = screen.getByLabelText(t.batchId);
    await user.selectOptions(batchSelect, '16-03-2026');

    // Select brand, series, model
    const brandSelect = screen.getByLabelText(t.brandLabel);
    await user.selectOptions(brandSelect, 'Apple');

    const seriesSelect = screen.getByLabelText(t.seriesLabel);
    await user.selectOptions(seriesSelect, 'MacBook Pro');

    const modelSelect = screen.getByLabelText(t.modelLabel);
    await user.selectOptions(modelSelect, 'M1 2020');

    // Select class
    const classSelect = screen.getByLabelText(t.fromClass);
    await user.selectOptions(classSelect, 'C1');

    // Enter laptop quantity
    const laptopQtyInput = screen.getByLabelText(t.laptopQuantity);
    fireEvent.change(laptopQtyInput, { target: { value: '2' } });

    // Select component to extract
    const screenQtyInput = screen.getByLabelText('Screen quantity');
    fireEvent.change(screenQtyInput, { target: { value: '1' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: t.recordEntry }) as HTMLButtonElement;
    await user.click(submitButton);

    expect(mockRecordComponentBreakdown).toHaveBeenCalledWith({
      batchId: '16-03-2026',
      brand: 'Apple',
      series: 'MacBook Pro',
      model: 'M1 2020',
      fromClass: 'C1',
      laptopQuantity: 2,
      componentChanges: { Screen: 1 },
      notes: ''
    });
  });

  it('disables cascading dropdowns correctly', () => {
    // Use empty stock and empty batches to ensure no brand is auto-selected
    render(
      <UpdateComponents 
        stock={{ items: [], lastUpdated: '' }} 
        componentStock={{ items: [], lastUpdated: '' }} 
        batches={[]} 
        t={t} 
        lang="en" 
        activeTab="components" 
        isAdmin={true}
      />
    );

    const brandSelect = screen.getByLabelText(t.brandLabel) as HTMLSelectElement;
    const seriesSelect = screen.getByLabelText(t.seriesLabel) as HTMLSelectElement;
    const modelSelect = screen.getByLabelText(t.modelLabel) as HTMLSelectElement;

    expect(brandSelect.value).toBe("");
    expect(seriesSelect).toBeDisabled();
    expect(modelSelect).toBeDisabled();
  });

  it('disables submit when laptop stock is empty for BREAKDOWN', async () => {
    const user = userEvent.setup();
    const emptyBatch: Batch = {
      ...mockBatches[0],
      items: [
        {
          brand: 'Apple',
          series: 'MacBook Pro',
          model: 'M1 2020',
          counts: { ...INITIAL_CLASS_COUNTS, 'C1': 0, 'B': 1 } // Keep one to allow selection
        }
      ]
    };

    render(
      <UpdateComponents 
        stock={mockStock} 
        componentStock={mockComponentStock} 
        batches={[emptyBatch]} 
        t={t} 
        lang="en" 
        activeTab="components" 
        isAdmin={true}
      />
    );

    // Select batch, brand, series, model
    await user.selectOptions(screen.getByLabelText(t.batchId), '16-03-2026');
    await user.selectOptions(screen.getByLabelText(t.brandLabel), 'Apple');
    await user.selectOptions(screen.getByLabelText(t.seriesLabel), 'MacBook Pro');
    await user.selectOptions(screen.getByLabelText(t.modelLabel), 'M1 2020');
    
    // Select Class C1 (which has 0)
    await user.selectOptions(screen.getByLabelText(t.fromClass), 'C1');

    const laptopStockDisplay = screen.getByLabelText(t.fromClass).closest('div')?.querySelector('span');
    expect(laptopStockDisplay).toHaveTextContent(`${t.availableLaptops}: 0`);
    expect(screen.getByRole('button', { name: t.recordEntry })).toBeDisabled();
  });

  it('disables submit when component stock is empty for INSTALL', async () => {
    const user = userEvent.setup();
    const emptyComponentStock: ComponentStock = {
      items: [
        {
          brand: 'Apple',
          series: 'MacBook Pro',
          model: 'M1 2020',
          counts: { ...INITIAL_COMPONENT_COUNTS, 'Screen': 0, 'Battery': 10 } // Keep one component to show the brand
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    render(
      <UpdateComponents 
        stock={mockStock} 
        componentStock={emptyComponentStock} 
        batches={mockBatches} 
        t={t} 
        lang="en" 
        activeTab="components" 
        isAdmin={true}
      />
    );

    // Switch to install
    await user.click(screen.getByText(t.installComponents));

    // Select brand, series, model
    await user.selectOptions(screen.getByLabelText(t.brandLabel), 'Apple');
    await user.selectOptions(screen.getByLabelText(t.seriesLabel), 'MacBook Pro');
    await user.selectOptions(screen.getByLabelText(t.modelLabel), 'M1 2020');
    
    // Select Screen
    await user.selectOptions(screen.getByLabelText(t.componentLabel), 'Screen');

    const componentStockDisplay = screen.getByLabelText(t.componentLabel).closest('div')?.querySelector('span');
    expect(componentStockDisplay).toHaveTextContent(`${t.availableStock}: 0`);
    expect(screen.getByRole('button', { name: t.recordEntry })).toBeDisabled();
  });
});
