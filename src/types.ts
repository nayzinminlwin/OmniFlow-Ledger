export type LaptopClass = 'A' | 'B' | 'B-' | 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'D' | 'Spoiled' | 'UNCLASSIFIED';

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
  active?: boolean;
}

export type TransactionType = 'INCOMING' | 'REPAIR' | 'SALE' | 'ADJUSTMENT' | 'BREAKDOWN' | 'PURCHASE' | 'INSTALL' | 'UNDO';

export type ComponentType = 'A Cover' | 'B Cover' | 'C Cover' | 'D Cover' | 'Screen' | 'Motherboard' | 'Battery' | 'Keyboard' | 'RAM' | 'SSD' | 'Speaker' | 'Charging Adapter';

export type ComponentCounts = {
  [key in ComponentType]: number;
};

export interface ComponentModelStock {
  brand: string;
  series: string;
  model: string;
  counts: ComponentCounts;
}

export interface ComponentStock {
  items: ComponentModelStock[];
  lastUpdated: string;
}

export type ComponentTransactionType = 'BREAKDOWN' | 'INCOMING' | 'SALE' | 'ADJUSTMENT' | 'PURCHASE' | 'INSTALL' | 'UNDO';

export interface ComponentTransaction {
  id?: string;
  type: ComponentTransactionType;
  brand: string;
  series: string;
  model: string;
  fromClass?: LaptopClass; // For BREAKDOWN
  laptopQuantity?: number; // For BREAKDOWN
  componentChanges: Partial<Record<ComponentType, number>>;
  timestamp: string;
  userId: string;
  notes?: string;
  isUndone?: boolean;
}

export interface Transaction {
  id?: string;
  type: TransactionType;
  batchId: string;
  batchActive?: boolean;
  brand: string;
  series: string;
  model: string;
  fromClass?: LaptopClass;
  toClass?: LaptopClass;
  quantity: number;
  timestamp: string;
  userId: string;
  notes?: string;
  componentChanges?: Partial<Record<ComponentType, number>>;
  isUndone?: boolean;
  undoneType?: TransactionType;
}

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'admin' | 'user';
  createdAt: string;
  isUltimateAdmin?: boolean;
  isOriginalAdmin?: boolean;
  notifiedApproved?: boolean;
}
