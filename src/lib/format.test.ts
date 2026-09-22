import { describe, expect, it } from 'vitest';
import { clamp, formatLog, formatLr } from './format';

describe('result formatting', () => {
  it('formats likelihood ratios for scanning', () => {
    expect(formatLr(12.345)).toBe('12.35');
    expect(formatLr(1234)).toBe('1,234');
    expect(formatLr(1_000_000)).toBe('1.00e+6');
  });

  it('shows the direction of log evidence', () => {
    expect(formatLog(2.125)).toBe('+2.13');
    expect(formatLog(-0.5)).toBe('-0.50');
  });

  it('keeps visual values in their domain', () => {
    expect(clamp(-2, 0, 100)).toBe(0);
    expect(clamp(140, 0, 100)).toBe(100);
  });
});
