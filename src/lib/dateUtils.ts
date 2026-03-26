export const isValidBatchDate = (dateStr: string) => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  if (month < 1 || month > 12) return false;
  if (year < 2000 || year > 2100) return false;
  
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

export const formatBatchId = (val: string, prevVal: string = '') => {
  let newVal = val.replace(/\//g, '-');
  
  // If user is deleting, just let them delete
  if (newVal.length < prevVal.length) {
    return newVal;
  }

  // Auto-pad single digits when a dash is typed
  if (newVal.endsWith('-')) {
    const parts = newVal.split('-');
    if (parts.length > 1) {
      const lastPartIndex = parts.length - 2;
      if (parts[lastPartIndex].length === 1) {
        parts[lastPartIndex] = '0' + parts[lastPartIndex];
        newVal = parts.join('-');
      }
    }
  }

  // Limit digits and format DD-MM-YYYY
  const digits = newVal.replace(/\D/g, '');
  let formatted = '';
  if (digits.length > 0) {
    formatted += digits.substring(0, 2);
    if (digits.length > 2) {
      formatted += '-' + digits.substring(2, 4);
      if (digits.length > 4) {
        formatted += '-' + digits.substring(4, 8);
      }
    }
  }

  // Preserve trailing dash if it was manually typed and we haven't reached the limit
  if (newVal.endsWith('-') && !formatted.endsWith('-') && formatted.split('-').length < 3) {
    formatted += '-';
  }

  return formatted;
};

export const padBatchId = (batchId: string) => {
  if (!batchId) return '';
  const parts = batchId.split('-');
  const paddedParts = parts.map((p, i) => {
    if (i < 2 && p.length === 1) return '0' + p;
    return p;
  });
  return paddedParts.join('-');
};
