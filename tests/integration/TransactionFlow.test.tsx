import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateComponents } from '../../src/components/UpdateComponents';
import { useTransactionActions } from '../../src/hooks/useTransactionActions';
import { translations } from '../../src/translations';
import { Stock, ComponentStock, Batch } from '../../src/types';
import { INITIAL_CLASS_COUNTS, INITIAL_COMPONENT_COUNTS } from '../../src/constants';
import * as firestore from 'firebase/firestore';

// Mock Firebase
vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn(),
    collection: vi.fn(),
    runTransaction: vi.fn(),
    writeBatch: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
  };
});

vi.mock('../../src/firebase', () => ({
  db: {},
}));

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({ user: { uid: 'user123' } })
}));

// Create a wrapper component to provide the hook's context
const IntegrationWrapper = ({ 
  stock, 
  componentStock, 
  batches 
}: { 
  stock: Stock, 
  componentStock: ComponentStock, 
  batches: Batch[] 
}) => {
  const t = translations.en;
  
  // We use the real hook here, but we mock the firestore calls it makes
  const actions = useTransactionActions({ uid: 'user123' } as any, stock, 'en');
  
  // We need to inject the real hook's methods into the component.
  // Since UpdateComponents calls useTransactionActions internally, we need to mock it 
  // to return the instance we just created, OR we can just let UpdateComponents call it 
  // and we mock firestore. UpdateComponents calls useTransactionActions internally.
  
  return (
    <UpdateComponents 
      stock={stock} 
      componentStock={componentStock} 
      batches={batches} 
      t={t} 
      lang="en" 
      activeTab="components" 
    />
  );
};

describe('Integration: Update Components Flow', () => {
  const mockStock: Stock = {
    items: [
      {
        brand: 'Apple',
        series: 'MacBook Pro',
        model: 'M1 2020',
        counts: { ...INITIAL_CLASS_COUNTS, 'A': 5, 'B': 2 }
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
      batchId: 'B-2023-01',
      active: true,
      items: [
        {
          brand: 'Apple',
          series: 'MacBook Pro',
          model: 'M1 2020',
          counts: { ...INITIAL_CLASS_COUNTS, 'A': 5, 'B': 2 }
        }
      ],
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should successfully record a component purchase transaction', async () => {
    const user = userEvent.setup();
    
    // Mock runTransaction to simulate a successful firestore transaction
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({ 
        exists: () => true, 
        data: () => mockComponentStock 
      }),
      update: vi.fn(),
      set: vi.fn(),
    };
    
    vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
      await updateFunction(mockTransaction as any);
    });

    render(
      <IntegrationWrapper 
        stock={mockStock} 
        componentStock={mockComponentStock} 
        batches={mockBatches} 
      />
    );

    // Switch to buy mode
    await user.click(screen.getByText(translations.en.buy));

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
    const submitButton = screen.getByText(translations.en.recordEntry);
    await act(async () => {
      await user.click(submitButton);
    });

    // Verify runTransaction was called
    expect(firestore.runTransaction).toHaveBeenCalled();
    
    // Verify the transaction operations
    expect(mockTransaction.get).toHaveBeenCalled();
    expect(mockTransaction.set).toHaveBeenCalledTimes(3); // Updates component stock, creates comp tx, creates laptop tx
  });

  it('should successfully record a component installation transaction', async () => {
    const user = userEvent.setup();
    
    // Mock runTransaction to simulate a successful firestore transaction
    const mockTransaction = {
      get: vi.fn().mockResolvedValue({ 
        exists: () => true, 
        data: () => mockComponentStock 
      }),
      update: vi.fn(),
      set: vi.fn(),
    };
    
    vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
      await updateFunction(mockTransaction as any);
    });

    render(
      <IntegrationWrapper 
        stock={mockStock} 
        componentStock={mockComponentStock} 
        batches={mockBatches} 
      />
    );

    // Switch to install mode
    await user.click(screen.getByText(translations.en.install));

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
    const submitButton = screen.getByText(translations.en.recordEntry);
    await act(async () => {
      await user.click(submitButton);
    });

    // Verify runTransaction was called
    expect(firestore.runTransaction).toHaveBeenCalled();
    
    // Verify the transaction operations
    expect(mockTransaction.get).toHaveBeenCalled();
    expect(mockTransaction.set).toHaveBeenCalledTimes(3); // Updates component stock, creates comp tx, creates laptop tx
  });

  it('should successfully record a component breakdown transaction', async () => {
    const user = userEvent.setup();
    
    // Mock runTransaction to simulate a successful firestore transaction
    const mockTransaction = {
      get: vi.fn()
        .mockResolvedValueOnce({ 
          exists: () => true, 
          data: () => mockStock 
        })
        .mockResolvedValueOnce({ 
          exists: () => true, 
          data: () => mockComponentStock 
        })
        .mockResolvedValueOnce({ 
          exists: () => true, 
          data: () => mockComponentStock 
        })
        .mockResolvedValueOnce({ 
          exists: () => true, 
          data: () => mockBatches[0] 
        }),
      update: vi.fn(),
      set: vi.fn(),
    };
    
    vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
      await updateFunction(mockTransaction as any);
    });

    render(
      <IntegrationWrapper 
        stock={mockStock} 
        componentStock={mockComponentStock} 
        batches={mockBatches} 
      />
    );

    // Default is extract mode
    // Select batch
    const batchSelect = screen.getAllByRole('combobox')[0];
    await user.selectOptions(batchSelect, 'B-2023-01');

    // Select brand, series, model
    const brandSelect = screen.getAllByRole('combobox')[1];
    await user.selectOptions(brandSelect, 'Apple');

    const seriesSelect = screen.getAllByRole('combobox')[2];
    await user.selectOptions(seriesSelect, 'MacBook Pro');

    const modelSelect = screen.getAllByRole('combobox')[3];
    await user.selectOptions(modelSelect, 'M1 2020');

    // Select from class
    const classSelect = screen.getAllByRole('combobox')[4];
    await user.selectOptions(classSelect, 'A');

    // Enter laptop quantity
    const laptopQtyInput = screen.getAllByRole('spinbutton')[0];
    await user.clear(laptopQtyInput);
    await user.type(laptopQtyInput, '1');

    // Add a component (e.g., Screen)
    // The component inputs are the remaining spinbuttons. Screen is the first one based on COMPONENTS array.
    // Let's just find the input next to the "Screen" label or use the spinbutton index.
    // In UpdateComponents, the component inputs are rendered in order of COMPONENTS array.
    const screenInput = screen.getAllByRole('spinbutton')[1]; // First component input
    await user.clear(screenInput);
    await user.type(screenInput, '1');

    // Submit
    const submitButton = screen.getByText(translations.en.recordEntry);
    await act(async () => {
      await user.click(submitButton);
    });

    // Verify runTransaction was called
    expect(firestore.runTransaction).toHaveBeenCalled();
    
    // Verify the transaction operations
    expect(mockTransaction.get).toHaveBeenCalledTimes(4); // Gets globalStock, compStock, spoiledCompStock, batch
    expect(mockTransaction.set).toHaveBeenCalledTimes(6); // Updates globalStock, compStock, spoiledCompStock, batch, creates 2 tx records
  });
});
