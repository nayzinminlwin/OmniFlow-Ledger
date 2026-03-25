import { LaptopClass, Stock, ClassCounts, ComponentType, ComponentCounts, ComponentStock } from './types';

export const CLASSES: LaptopClass[] = ['A', 'B', 'B-', 'C1', 'C2', 'C3', 'C4', 'C5', 'D', 'Spoiled'];

export const COMPONENTS: ComponentType[] = [
  'A Cover', 'B Cover', 'C Cover', 'D Cover', 'Screen', 
  'Motherboard', 'Battery', 'Keyboard', 'RAM', 'SSD', 'Speaker'
];

export const INITIAL_COMPONENT_COUNTS: ComponentCounts = {
  'A Cover': 0, 'B Cover': 0, 'C Cover': 0, 'D Cover': 0, 'Screen': 0,
  'Motherboard': 0, 'Battery': 0, 'Keyboard': 0, 'RAM': 0, 'SSD': 0, 'Speaker': 0
};

export const INITIAL_COMPONENT_STOCK: ComponentStock = {
  items: [],
  lastUpdated: new Date().toISOString()
};

export const INITIAL_CLASS_COUNTS: ClassCounts = {
  'A': 0,
  'B': 0,
  'B-': 0,
  'C1': 0,
  'C2': 0,
  'C3': 0,
  'C4': 0,
  'C5': 0,
  'D': 0,
  'Spoiled': 0,
  'UNCLASSIFIED': 0
};

export const INITIAL_STOCK: Stock = {
  items: [],
  lastUpdated: new Date().toISOString()
};
