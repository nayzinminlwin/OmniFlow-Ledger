import { LaptopClass, Stock, ClassCounts } from './types';

export const CLASSES: LaptopClass[] = ['A', 'B', 'B-', 'C', 'C-', 'D'];

export const INITIAL_CLASS_COUNTS: ClassCounts = {
  'A': 0,
  'B': 0,
  'B-': 0,
  'C': 0,
  'C-': 0,
  'D': 0,
  'UNCLASSIFIED': 0
};

export const INITIAL_STOCK: Stock = {
  items: [],
  lastUpdated: new Date().toISOString()
};
