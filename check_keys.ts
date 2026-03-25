
import { translations } from './src/translations';

const enKeys = Object.keys(translations.en).sort();
const msKeys = Object.keys(translations.ms).sort();
const zhKeys = Object.keys(translations.zh).sort();

console.log('EN Keys Count:', enKeys.length);
console.log('MS Keys Count:', msKeys.length);
console.log('ZH Keys Count:', zhKeys.length);

const allKeys = new Set([...enKeys, ...msKeys, ...zhKeys]);

allKeys.forEach(key => {
  const inEn = enKeys.includes(key);
  const inMs = msKeys.includes(key);
  const inZh = zhKeys.includes(key);
  
  if (!inEn || !inMs || !inZh) {
    console.log(`Key "${key}" is missing in: ${[!inEn && 'EN', !inMs && 'MS', !inZh && 'ZH'].filter(Boolean).join(', ')}`);
  }
});
