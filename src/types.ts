export type LaptopClass = 'A' | 'B' | 'B-' | 'C' | 'C-' | 'D' | 'UNCLASSIFIED';

export type ClassCounts = {
  [key in LaptopClass]: number;
};

export interface ModelStock {
  brand: string;
  series: string;
  model: string;
  counts: ClassCounts;
}

export interface Stock {
  items: ModelStock[];
  lastUpdated: string;
}

export interface Batch {
  id?: string;
  batchId: string;
  items: ModelStock[];
  createdAt: string;
}

export type TransactionType = 'INCOMING' | 'REPAIR' | 'SALE' | 'ADJUSTMENT';

export interface Transaction {
  id?: string;
  type: TransactionType;
  batchId: string;
  brand: string;
  series: string;
  model: string;
  fromClass?: LaptopClass;
  toClass?: LaptopClass;
  quantity: number;
  timestamp: string;
  userId: string;
  notes?: string;
}
