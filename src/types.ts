export type LaptopClass = 'A' | 'B' | 'B-' | 'C' | 'C-' | 'D' | 'UNCLASSIFIED';

export interface Stock {
  classA: number;
  classB: number;
  classBMinus: number;
  classC: number;
  classCMinus: number;
  classD: number;
  unclassified: number;
  lastUpdated: string;
}

export interface Batch {
  id?: string;
  batchId: string;
  classA: number;
  classB: number;
  classBMinus: number;
  classC: number;
  classCMinus: number;
  classD: number;
  unclassified: number;
  createdAt: string;
}

export type TransactionType = 'INCOMING' | 'REPAIR' | 'SALE' | 'ADJUSTMENT';

export interface Transaction {
  id?: string;
  type: TransactionType;
  batchId: string;
  fromClass?: LaptopClass;
  toClass?: LaptopClass;
  quantity: number;
  timestamp: string;
  userId: string;
  notes?: string;
}
