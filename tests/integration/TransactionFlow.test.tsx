import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UpdateComponents } from '../../src/components/UpdateComponents';
import { AddTransaction } from '../../src/components/AddTransaction';
import { useTransactionActions } from '../../src/hooks/useTransactionActions';
import { translations } from '../../src/translations';
import { Stock, ComponentStock, Batch, TransactionType, LaptopClass } from '../../src/types';
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
const ComponentIntegrationWrapper = ({ 
  stock, 
  componentStock, 
  batches 
}: { 
  stock: Stock, 
  componentStock: ComponentStock, 
  batches: Batch[] 
}) => {
  const t = translations.en;
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

const LaptopIntegrationWrapper = ({ 
  batches,
  onAddTransaction
}: { 
  batches: Batch[],
  onAddTransaction: any
}) => {
  const t = translations.en;
  return (
    <AddTransaction 
      t={t}
      activeTab="add"
      onAddTransaction={onAddTransaction}
      batches={batches}
      isSubmitting={false}
    />
  );
};

describe('Integration: Inventory Flows', () => {
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

  describe('Component Transactions', () => {
    it('should successfully record a component purchase transaction', async () => {
      const user = userEvent.setup();
      
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
        <ComponentIntegrationWrapper 
          stock={mockStock} 
          componentStock={mockComponentStock} 
          batches={mockBatches} 
        />
      );

      await user.click(screen.getByText(translations.en.buy));

      const brandSelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(brandSelect, 'Apple');

      const seriesSelect = screen.getAllByRole('combobox')[1];
      await user.selectOptions(seriesSelect, 'MacBook Pro');

      const modelSelect = screen.getAllByRole('combobox')[2];
      await user.selectOptions(modelSelect, 'M1 2020');

      const componentSelect = screen.getAllByRole('combobox')[3];
      await user.selectOptions(componentSelect, 'Screen');

      const quantityInput = screen.getByPlaceholderText('0');
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      const submitButton = screen.getByText(translations.en.recordEntry);
      await act(async () => {
        await user.click(submitButton);
      });

      expect(firestore.runTransaction).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalledTimes(3);
    });

    it('should successfully record a component installation transaction', async () => {
      const user = userEvent.setup();
      
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
        <ComponentIntegrationWrapper 
          stock={mockStock} 
          componentStock={mockComponentStock} 
          batches={mockBatches} 
        />
      );

      await user.click(screen.getByText(translations.en.install));

      const brandSelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(brandSelect, 'Apple');

      const seriesSelect = screen.getAllByRole('combobox')[1];
      await user.selectOptions(seriesSelect, 'MacBook Pro');

      const modelSelect = screen.getAllByRole('combobox')[2];
      await user.selectOptions(modelSelect, 'M1 2020');

      const componentSelect = screen.getAllByRole('combobox')[3];
      await user.selectOptions(componentSelect, 'Screen');

      const quantityInput = screen.getByPlaceholderText('0');
      await user.clear(quantityInput);
      await user.type(quantityInput, '2');

      const submitButton = screen.getByText(translations.en.recordEntry);
      await act(async () => {
        await user.click(submitButton);
      });

      expect(firestore.runTransaction).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalledTimes(3);
    });

    it('should successfully record a component breakdown transaction', async () => {
      const user = userEvent.setup();
      
      const mockTransaction = {
        get: vi.fn()
          .mockResolvedValueOnce({ exists: () => true, data: () => mockStock })
          .mockResolvedValueOnce({ exists: () => true, data: () => mockComponentStock })
          .mockResolvedValueOnce({ exists: () => true, data: () => mockComponentStock })
          .mockResolvedValueOnce({ exists: () => true, data: () => mockBatches[0] }),
        update: vi.fn(),
        set: vi.fn(),
      };
      
      vi.mocked(firestore.runTransaction).mockImplementation(async (db, updateFunction) => {
        await updateFunction(mockTransaction as any);
      });

      render(
        <ComponentIntegrationWrapper 
          stock={mockStock} 
          componentStock={mockComponentStock} 
          batches={mockBatches} 
        />
      );

      const batchSelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(batchSelect, 'B-2023-01');

      const brandSelect = screen.getAllByRole('combobox')[1];
      await user.selectOptions(brandSelect, 'Apple');

      const seriesSelect = screen.getAllByRole('combobox')[2];
      await user.selectOptions(seriesSelect, 'MacBook Pro');

      const modelSelect = screen.getAllByRole('combobox')[3];
      await user.selectOptions(modelSelect, 'M1 2020');

      const classSelect = screen.getAllByRole('combobox')[4];
      await user.selectOptions(classSelect, 'A');

      const laptopQtyInput = screen.getAllByRole('spinbutton')[0];
      await user.clear(laptopQtyInput);
      await user.type(laptopQtyInput, '1');

      const screenInput = screen.getAllByRole('spinbutton')[1];
      await user.clear(screenInput);
      await user.type(screenInput, '1');

      const submitButton = screen.getByText(translations.en.recordEntry);
      await act(async () => {
        await user.click(submitButton);
      });

      expect(firestore.runTransaction).toHaveBeenCalled();
      expect(mockTransaction.set).toHaveBeenCalled();
    });
  });

  describe('Laptop Transactions', () => {
    it('should successfully record an incoming laptop transaction', async () => {
      const user = userEvent.setup();
      const onAddTransaction = vi.fn().mockResolvedValue(true);

      render(
        <LaptopIntegrationWrapper 
          batches={mockBatches}
          onAddTransaction={onAddTransaction}
        />
      );

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

      // Enter quantity
      const quantityInput = screen.getByRole('spinbutton');
      await user.clear(quantityInput);
      await user.type(quantityInput, '10');

      // Submit
      const submitButton = screen.getByText(translations.en.recordEntry);
      await act(async () => {
        await user.click(submitButton);
      });

      expect(onAddTransaction).toHaveBeenCalledWith(
        'INCOMING',
        'B-2023-01',
        'Apple',
        'MacBook Pro',
        'M1 2020',
        'D', // Default fromClass
        'UNCLASSIFIED', // Default toClass for INCOMING
        10,
        ''
      );
    });

    it('should successfully record a laptop repair transaction', async () => {
      const user = userEvent.setup();
      const onAddTransaction = vi.fn().mockResolvedValue(true);

      render(
        <LaptopIntegrationWrapper 
          batches={mockBatches}
          onAddTransaction={onAddTransaction}
        />
      );

      // Switch to repair
      await user.click(screen.getByText(translations.en.repair));

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
      const fromClassSelect = screen.getAllByRole('combobox')[4];
      await user.selectOptions(fromClassSelect, 'UNCLASSIFIED');

      // Select to class
      const toClassSelect = screen.getAllByRole('combobox')[5];
      await user.selectOptions(toClassSelect, 'A');

      // Enter quantity
      const quantityInput = screen.getByRole('spinbutton');
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      // Submit
      const submitButton = screen.getByText(translations.en.recordEntry);
      await act(async () => {
        await user.click(submitButton);
      });

      expect(onAddTransaction).toHaveBeenCalledWith(
        'REPAIR',
        'B-2023-01',
        'Apple',
        'MacBook Pro',
        'M1 2020',
        'UNCLASSIFIED',
        'A',
        5,
        ''
      );
    });

    it('should successfully record a laptop sale transaction', async () => {
      const user = userEvent.setup();
      const onAddTransaction = vi.fn().mockResolvedValue(true);

      render(
        <LaptopIntegrationWrapper 
          batches={mockBatches}
          onAddTransaction={onAddTransaction}
        />
      );

      // Switch to sale
      await user.click(screen.getByText(translations.en.sale));

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
      const fromClassSelect = screen.getAllByRole('combobox')[4];
      await user.selectOptions(fromClassSelect, 'A');

      // Enter quantity
      const quantityInput = screen.getByRole('spinbutton');
      await user.clear(quantityInput);
      await user.type(quantityInput, '3');

      // Submit
      const submitButton = screen.getByText(translations.en.recordEntry);
      await act(async () => {
        await user.click(submitButton);
      });

      expect(onAddTransaction).toHaveBeenCalledWith(
        'SALE',
        'B-2023-01',
        'Apple',
        'MacBook Pro',
        'M1 2020',
        'A',
        'D', // Default toClass for SALE
        3,
        ''
      );
    });

    it('should successfully record a laptop adjustment transaction', async () => {
      const user = userEvent.setup();
      const onAddTransaction = vi.fn().mockResolvedValue(true);

      render(
        <LaptopIntegrationWrapper 
          batches={mockBatches}
          onAddTransaction={onAddTransaction}
        />
      );

      // Switch to adjustment
      await user.click(screen.getByText(translations.en.adjustment));

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

      // Select class
      const classSelect = screen.getAllByRole('combobox')[4];
      await user.selectOptions(classSelect, 'B');

      // Enter quantity
      const quantityInput = screen.getByRole('spinbutton');
      await user.clear(quantityInput);
      await user.type(quantityInput, '-2');

      // Submit
      const submitButton = screen.getByText(translations.en.recordEntry);
      await act(async () => {
        await user.click(submitButton);
      });

      expect(onAddTransaction).toHaveBeenCalledWith(
        'ADJUSTMENT',
        'B-2023-01',
        'Apple',
        'MacBook Pro',
        'M1 2020',
        'B',
        'D', // Default toClass for ADJUSTMENT
        -2,
        ''
      );
    });

    it('should show validation error for missing fields', async () => {
      const user = userEvent.setup();
      const onAddTransaction = vi.fn();

      render(
        <LaptopIntegrationWrapper 
          batches={mockBatches}
          onAddTransaction={onAddTransaction}
        />
      );

      // Try to submit without filling fields
      const submitButton = screen.getByText(translations.en.recordEntry);
      await user.click(submitButton);

      // Should not call onAddTransaction because brand/series/model are empty
      expect(onAddTransaction).not.toHaveBeenCalled();
    });
  });
});
