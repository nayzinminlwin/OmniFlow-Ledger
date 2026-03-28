import { beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Configure act environment for React 18
global.IS_REACT_ACT_ENVIRONMENT = true;

// Mock scrollIntoView which is not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = function() {};
window.HTMLElement.prototype.scrollBy = function() {};
window.HTMLElement.prototype.scrollTo = function() {};

// Clear localStorage before each test
beforeEach(() => {
  localStorage.clear();
});
