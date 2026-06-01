import { describe, it, expect } from 'vitest';
import { poissonCDF } from '@/features/predictor/engine/poisson';

describe('poissonCDF', () => {
  it('should return 0 for lambda 0', () => {
    expect(poissonCDF(0, 0)).toBe(1);
  });

  it('should clamp values between 0 and 1', () => {
    expect(poissonCDF(100, 0)).toBeGreaterThanOrEqual(0);
    expect(poissonCDF(100, 0)).toBeLessThanOrEqual(1);
  });

  it('should handle lambda = 1 with various k values', () => {
    expect(poissonCDF(1, 0)).toBeCloseTo(0.3679, 3);
    expect(poissonCDF(1, 1)).toBeCloseTo(0.9197, 3);
  });

  it('should always return values between 0 and 1', () => {
    for (let lambda = 0.5; lambda <= 5; lambda += 0.5) {
      for (let k = 0; k <= 10; k++) {
        const result = poissonCDF(lambda, k);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(1);
      }
    }
  });

  it('should monotonically increase with k', () => {
    let prev = 0;
    for (let k = 0; k <= 8; k++) {
      const current = poissonCDF(2.5, k);
      expect(current).toBeGreaterThanOrEqual(prev);
      prev = current;
    }
  });
});