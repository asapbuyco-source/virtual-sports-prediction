import { describe, it, expect } from 'vitest';
import { calcFormMultiplier } from '@/features/predictor/engine/formAnalysis';
import type { FormEntry } from '@/features/predictor/engine/predictor';

describe('calcFormMultiplier', () => {
  it('should return neutral multipliers for empty form', () => {
    const result = calcFormMultiplier([]);
    expect(result.attackMult).toBe(1);
    expect(result.defenceMult).toBe(1);
    expect(result.momentum).toBe(0);
  });

  it('should boost attack multiplier for recent wins', () => {
    const form: FormEntry[] = [
      { result: 'W', goals: 3, conceded: 0 },
      { result: 'W', goals: 2, conceded: 1 },
      { result: 'W', goals: 1, conceded: 0 },
    ];
    const result = calcFormMultiplier(form);
    expect(result.attackMult).toBeGreaterThan(1);
  });

  it('should penalize attack for scoring drought', () => {
    const form: FormEntry[] = [
      { result: 'L', goals: 0, conceded: 2 },
      { result: 'L', goals: 0, conceded: 1 },
      { result: 'D', goals: 0, conceded: 1 },
    ];
    const result = calcFormMultiplier(form);
    expect(result.attackMult).toBe(1.25);
  });

  it('should penalize defense for conceding streak', () => {
    const form: FormEntry[] = [
      { result: 'L', goals: 2, conceded: 3 },
      { result: 'L', goals: 1, conceded: 2 },
      { result: 'D', goals: 0, conceded: 2 },
    ];
    const result = calcFormMultiplier(form);
    expect(result.defenceMult).toBe(0.88);
  });

  it('should handle losing streak with momentum', () => {
    const form: FormEntry[] = [
      { result: 'L', goals: 0, conceded: 2 },
      { result: 'L', goals: 1, conceded: 3 },
      { result: 'L', goals: 0, conceded: 2 },
    ];
    const result = calcFormMultiplier(form);
    expect(result.momentum).toBeLessThan(0);
  });

  it('should handle winning streak with positive momentum', () => {
    const form: FormEntry[] = [
      { result: 'W', goals: 2, conceded: 0 },
      { result: 'W', goals: 3, conceded: 1 },
      { result: 'W', goals: 2, conceded: 0 },
    ];
    const result = calcFormMultiplier(form);
    expect(result.momentum).toBeGreaterThan(0);
  });

  it('should cap momentum based on max 5 recent games', () => {
    const form: FormEntry[] = Array(8).fill(null).map((_, i) => ({
      result: 'W' as const,
      goals: 2,
      conceded: 0,
    }));
    const result = calcFormMultiplier(form);
    expect(result.attackMult).toBe(1.15);
  });
});