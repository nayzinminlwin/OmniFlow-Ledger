import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
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
      isAdmin={true}
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
      isAdmin={true}
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
        counts: { ...INITIAL_CLASS_COUNTS, 'A': 5, 'B': 2, 'UNCLASSIFIED': 10 }
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
          counts: { ...INITIAL_CLASS_COUNTS, 'A': 5, 'B': 2, 'UNCLASSIFIED': 10 }
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

      await user.click(screen.getByRole('button', { name: translations.en.buyComponents }));

      const brandSelect = screen.getAllByRole('combobox')[0];
      await user.selectOptions(brandSelect, 'Apple');

      const seriesSelect = screen.getAllByRole('combobox')[1];
      await user.selectOptions(seriesSelect, 'MacBook Pro');

      const modelSelect = screen.getAllByRole('combobox')[2];
      await user.selectOptions(modelSelect, 'M1 2020');

      const componentSelect = screen.getAllByRole('combobox')[3];
      await user.selectOptions(componentSelect, 'Screen');

      const quantityInput = screen.getByLabelText(translations.en.quantity);
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

      await user.click(screen.getByRole('button', { name: translations.en.installComponents }));

      const batchSelect = screen.getByLabelText(translations.en.batchId);
      await user.selectOptions(batchSelect, '16-03-2026');

      const brandSelect = screen.getByLabelText(translations.en.brandLabel);
      await user.selectOptions(brandSelect, 'Apple');

      const seriesSelect = screen.getByLabelText(translations.en.seriesLabel);
      await user.selectOptions(seriesSelect, 'MacBook Pro');

      const modelSelect = screen.getByLabelText(translations.en.modelLabel);
      await user.selectOptions(modelSelect, 'M1 2020');

      const componentSelect = screen.getByLabelText(translations.en.componentLabel);
      await user.selectOptions(componentSelect, 'Screen');

      const quantityInput = screen.getByLabelText(translations.en.quantity);
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
          .mockResolvedValueOnce({ exists: () => true, data: () => mockComponentStock }) // compStock
          .mockResolvedValueOnce({ exists: () => true, data: () => mockComponentStock }) // spoiledCompStock
          .mockResolvedValueOnce({ exists: () => true, data: () => mockBatches[0] }), // batch
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

      const batchSelect = screen.getByLabelText(translations.en.batchId);
      await user.selectOptions(batchSelect, '16-03-2026');

      const brandSelect = screen.getByLabelText(translations.en.brandLabel);
      await user.selectOptions(brandSelect, 'Apple');

      const seriesSelect = screen.getByLabelText(translations.en.seriesLabel);
      await user.selectOptions(seriesSelect, 'MacBook Pro');

      const modelSelect = screen.getByLabelText(translations.en.modelLabel);
      await user.selectOptions(modelSelect, 'M1 2020');

      const classSelect = await screen.findByLabelText(translations.en.fromClass);
      await user.selectOptions(classSelect, 'A');

      const laptopQtyInput = screen.getByLabelText(translations.en.laptopQuantityToExtract);
      await user.clear(laptopQtyInput);
      await user.type(laptopQtyInput, '1');

      const screenButton = screen.getByRole('button', { name: 'Screen' });
      await user.click(screenButton);

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

      // Wait for defaults
      await waitFor(() => {
        expect(screen.getByLabelText(translations.en.brandLabel)).toHaveValue('Apple');
      });

      // Enter quantity
      const quantityInput = screen.getByLabelText(translations.en.quantity);
      await user.clear(quantityInput);
      await user.type(quantityInput, '10');

      // Submit
      const submitButton = screen.getByRole('button', { name: translations.en.recordEntry });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onAddTransaction).toHaveBeenCalledWith(
          'INCOMING',
          '16-03-2026',
          'Apple',
          'MacBook Pro',
          'M1 2020',
          'D', // Default fromClass
          'UNCLASSIFIED', // Default toClass for INCOMING
          10,
          ''
        );
      });
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

      // Wait for defaults
      await waitFor(() => {
        expect(screen.getByLabelText(translations.en.brandLabel)).toHaveValue('Apple');
      });

      // Switch to repair
      await user.click(screen.getByRole('radio', { name: translations.en.repair }));

      // Select from/to classes
      await user.selectOptions(screen.getByLabelText(translations.en.fromClass), 'UNCLASSIFIED');
      await user.selectOptions(screen.getByLabelText(translations.en.toClass), 'A');

      // Enter quantity
      const quantityInput = screen.getByLabelText(translations.en.quantity);
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');

      // Submit
      const submitButton = screen.getByRole('button', { name: translations.en.recordEntry });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onAddTransaction).toHaveBeenCalledWith(
          'REPAIR',
          '16-03-2026',
          'Apple',
          'MacBook Pro',
          'M1 2020',
          'UNCLASSIFIED',
          'A',
          5,
          ''
        );
      });
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

      // Wait for defaults
      await waitFor(() => {
        expect(screen.getByLabelText(translations.en.brandLabel)).toHaveValue('Apple');
      });

      // Switch to sale
      await user.click(screen.getByRole('radio', { name: translations.en.sale }));

      // Select from class
      await user.selectOptions(screen.getByLabelText(translations.en.fromClass), 'A');

      // Enter quantity
      const quantityInput = screen.getByLabelText(translations.en.quantity);
      await user.clear(quantityInput);
      await user.type(quantityInput, '3');

      // Submit
      const submitButton = screen.getByRole('button', { name: translations.en.recordEntry });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onAddTransaction).toHaveBeenCalledWith(
          'SALE',
          '16-03-2026',
          'Apple',
          'MacBook Pro',
          'M1 2020',
          'A',
          'A', // toClass remains A after switch from INCOMING (UNCLASSIFIED -> A)
          3,
          ''
        );
      });
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

      // Wait for defaults
      await waitFor(() => {
        expect(screen.getByLabelText(translations.en.brandLabel)).toHaveValue('Apple');
      });

      // Switch to adjustment
      await user.click(screen.getByRole('radio', { name: translations.en.adjustment }));

      // Select class
      await user.selectOptions(screen.getByLabelText(translations.en.targetClass), 'B');

      // Enter quantity
      const quantityInput = screen.getByLabelText(translations.en.newTotalCount);
      await user.clear(quantityInput);
      await user.type(quantityInput, '4');

      // Submit
      const submitButton = screen.getByRole('button', { name: translations.en.recordEntry });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onAddTransaction).toHaveBeenCalledWith(
          'ADJUSTMENT',
          '16-03-2026',
          'Apple',
          'MacBook Pro',
          'M1 2020',
          'D', // fromClass remains D
          'B', // toClass set to B
          4,
          ''
        );
      });
    });

    it('should show validation error for missing fields', async () => {
      const user = userEvent.setup();
      const onAddTransaction = vi.fn();

      render(
        <LaptopIntegrationWrapper 
          batches={[]} // Use empty batches to avoid auto-filling brand/series/model
          onAddTransaction={onAddTransaction}
        />
      );

      // Try to submit without filling fields
      const submitButton = screen.getByRole('button', { name: translations.en.recordEntry });
      await user.click(submitButton);

      // Should not call onAddTransaction because brand/series/model are empty
      expect(onAddTransaction).not.toHaveBeenCalled();
    });
  });
});
