import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercentage, clamp, formatNumber } from '@/utils/format';

describe('format', () => {
  describe('formatNumber', () => {
    it('should format number with default 1 decimal', () => {
      expect(formatNumber(3.14159)).toBe('3.1');
      expect(formatNumber(2)).toBe('2.0');
    });

    it('should format with specified decimals', () => {
      expect(formatNumber(3.14159, 2)).toBe('3.14');
      expect(formatNumber(3.14159, 0)).toBe('3');
    });
  });

  describe('formatCurrency', () => {
    it('should format XAF currency', () => {
      const result = formatCurrency(3500, 'XAF');
      expect(result).toContain('3');
      expect(result).toContain('500');
      expect(result).toContain('XAF');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage', () => {
      expect(formatPercentage(75.5)).toBe('76%');
      expect(formatPercentage(50)).toBe('50%');
      expect(formatPercentage(100)).toBe('100%');
    });
  });

  describe('clamp', () => {
    it('should clamp values within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });
});