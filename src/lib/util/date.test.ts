import { describe, it, expect } from 'vitest';
import { getFullTimeBetween } from './date';

describe('Date utils', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  it('Does the thing', () => {    
    const resp = getFullTimeBetween(yesterday);
    console.info(resp);
  });
})