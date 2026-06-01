import { describe, it, expect } from 'vitest';
import { clamp, normalise, sigmoid, xGToScore } from '@/features/predictor/engine/utils';

describe('clamp', () => {
  it('should clamp values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('should handle boundary values', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });
});

describe('normalise', () => {
  it('should normalize three values to sum to 100', () => {
    const [h, d, a] = normalise(50, 25, 25);
    expect(h + d + a).toBe(100);
  });

  it('should handle equal distribution', () => {
    const [h, d, a] = normalise(33, 33, 34);
    expect(h + d + a).toBe(100);
  });

  it('should round values correctly', () => {
    const [h, d, a] = normalise(1, 1, 1);
    expect([h, d, a]).toEqual([33, 33, 34]);
  });

  it('should handle zero values', () => {
    const [h, d, a] = normalise(0, 0, 0);
    expect(h).toBe(0);
    expect(d).toBe(0);
    expect(a).toBe(0);
  });
});

describe('sigmoid', () => {
  it('should return 0.5 at x = 0', () => {
    expect(sigmoid(0)).toBe(0.5);
  });

  it('should approach 1 for large positive values', () => {
    expect(sigmoid(10)).toBeGreaterThan(0.99);
  });

  it('should approach 0 for large negative values', () => {
    expect(sigmoid(-10)).toBeLessThan(0.01);
  });

  it('should be monotonically increasing', () => {
    expect(sigmoid(1)).toBeGreaterThan(sigmoid(0));
    expect(sigmoid(2)).toBeGreaterThan(sigmoid(1));
  });
});

describe('xGToScore', () => {
  it('should round xG to nearest integer', () => {
    expect(xGToScore(1.5)).toBe(2);
    expect(xGToScore(1.4)).toBe(1);
    expect(xGToScore(2.7)).toBe(3);
  });

  it('should clamp to 0-6 range', () => {
    expect(xGToScore(-1)).toBe(0);
    expect(xGToScore(10)).toBe(6);
    expect(xGToScore(6)).toBe(6);
    expect(xGToScore(0)).toBe(0);
  });
});