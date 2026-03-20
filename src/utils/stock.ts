import { LaptopClass, Stock } from '../types';

export const getStockKey = (className: LaptopClass): keyof Stock => {
  switch (className) {
    case 'A': return 'classA';
    case 'B': return 'classB';
    case 'B-': return 'classBMinus';
    case 'C': return 'classC';
    case 'C-': return 'classCMinus';
    case 'D': return 'classD';
    case 'UNCLASSIFIED': return 'unclassified';
  }
};
