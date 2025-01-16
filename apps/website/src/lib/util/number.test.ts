import { describe, it, expect } from 'vitest';
import { formatNumber, ordinalSuffix } from './numbers';

describe('formatNumber', () => {
  it('Works with USD', () => {
    expect(formatNumber(1_000.55)).toBe('$1,000.55');
    expect(formatNumber(2_345_678.89)).toBe('$2,345,678.89');
  });
  it('Works with JPY', () => {
    expect(formatNumber(1_000.55, 'JPY')).toBe('¥1,001');
    expect(formatNumber(2_345_678.89, 'JPY')).toBe('¥2,345,679');
  });
  it('Works with EUR', () => {
    expect(formatNumber(1_000.55, 'EUR')).toBe('€1,000.55');
    expect(formatNumber(2_345_678.89, 'EUR')).toBe('€2,345,678.89');
  });
  it('Works with Peso(MXN)', () => {
    expect(formatNumber(1_000.55, 'MXN')).toBe('MX$1,000.55');
    expect(formatNumber(2_345_678.89, 'MXN')).toBe('MX$2,345,678.89');
  });
});

describe('ordinalSuffix', () => {
  it('Works with single digit numbers', () => {
    expect(ordinalSuffix(1)).toBe('st');
    expect(ordinalSuffix(2)).toBe('nd');
    expect(ordinalSuffix(3)).toBe('rd');
    expect(ordinalSuffix(4)).toBe('th');
    expect(ordinalSuffix(7)).toBe('th');
    expect(ordinalSuffix(9)).toBe('th');
  });
  it('Works with teen numbers in english', () => {
    expect(ordinalSuffix(11)).toBe('th');
    expect(ordinalSuffix(14)).toBe('th');
    expect(ordinalSuffix(17)).toBe('th');
    expect(ordinalSuffix(19)).toBe('th');
  });

  it('Works with assorted numbers', () => {
    expect(ordinalSuffix(101)).toBe('st');
    expect(ordinalSuffix(53)).toBe('rd');
    expect(ordinalSuffix(72)).toBe('nd');
  });
});
