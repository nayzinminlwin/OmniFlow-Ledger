import '@testing-library/jest-dom';

// Mock scrollIntoView which is not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = function() {};
window.HTMLElement.prototype.scrollBy = function() {};
window.HTMLElement.prototype.scrollTo = function() {};
