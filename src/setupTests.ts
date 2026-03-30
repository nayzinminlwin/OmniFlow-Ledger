// Configure act environment for React 18
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock scrollIntoView which is not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = function() {};
window.HTMLElement.prototype.scrollBy = function() {};
window.HTMLElement.prototype.scrollTo = function() {};

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
