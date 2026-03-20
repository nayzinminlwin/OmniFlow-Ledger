import { LaptopClass, Stock } from './types';

export const CLASSES: LaptopClass[] = ['A', 'B', 'B-', 'C', 'C-', 'D'];

export const INITIAL_STOCK: Stock = {
  classA: 0,
  classB: 0,
  classBMinus: 0,
  classC: 0,
  classCMinus: 0,
  classD: 0,
  unclassified: 0,
  lastUpdated: new Date().toISOString()
};
