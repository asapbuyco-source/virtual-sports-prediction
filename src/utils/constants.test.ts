import { describe, it, expect } from 'vitest';
import { PLAN_LIMITS, PLANS, PLAN_DURATIONS } from '@/utils/constants';

describe('constants', () => {
  describe('PLAN_LIMITS', () => {
    it('should have limits for all plans', () => {
      expect(PLAN_LIMITS).toHaveProperty('free');
      expect(PLAN_LIMITS).toHaveProperty('daily');
      expect(PLAN_LIMITS).toHaveProperty('weekly');
      expect(PLAN_LIMITS).toHaveProperty('monthly');
      expect(PLAN_LIMITS).toHaveProperty('elite');
    });

    it('should have realistic prediction limits', () => {
      expect(PLAN_LIMITS.free).toBeGreaterThan(0);
      expect(PLAN_LIMITS.daily).toBeGreaterThan(PLAN_LIMITS.free);
      expect(PLAN_LIMITS.weekly).toBeGreaterThan(PLAN_LIMITS.daily);
      expect(PLAN_LIMITS.monthly).toBeGreaterThan(PLAN_LIMITS.weekly);
      expect(PLAN_LIMITS.elite).toBe(999999);
    });
  });

  describe('PLANS', () => {
    it('should have all plan objects', () => {
      const planIds = ['free', 'daily', 'weekly', 'monthly', 'elite'];
      planIds.forEach((id) => {
        expect(PLANS).toHaveProperty(id);
        expect(PLANS[id as keyof typeof PLANS].id).toBe(id);
      });
    });

    it('should have required fields for each plan', () => {
      Object.values(PLANS).forEach((plan) => {
        expect(plan).toHaveProperty('id');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('price');
        expect(plan).toHaveProperty('currency');
        expect(plan).toHaveProperty('features');
        expect(Array.isArray(plan.features)).toBe(true);
        expect(plan.features.length).toBeGreaterThan(0);
      });
    });

    it('should have increasing prices for paid plans', () => {
      expect(PLANS.daily.price).toBeGreaterThan(PLANS.free.price);
      expect(PLANS.weekly.price).toBeGreaterThan(PLANS.daily.price);
      expect(PLANS.monthly.price).toBeGreaterThan(PLANS.weekly.price);
      expect(PLANS.elite.price).toBeGreaterThan(PLANS.monthly.price);
    });

    it('should have exactly one highlighted plan', () => {
      const highlighted = Object.values(PLANS).filter((p) => p.highlight);
      expect(highlighted.length).toBe(1);
      expect(highlighted[0].id).toBe('monthly');
    });

    it('should have correct currency', () => {
      Object.values(PLANS).forEach((plan) => {
        expect(plan.currency).toBe('XAF');
      });
    });
  });

  describe('PLAN_DURATIONS', () => {
    it('should have durations for paid plans', () => {
      expect(PLAN_DURATIONS).toHaveProperty('daily');
      expect(PLAN_DURATIONS).toHaveProperty('weekly');
      expect(PLAN_DURATIONS).toHaveProperty('monthly');
      expect(PLAN_DURATIONS).toHaveProperty('elite');
    });

    it('should have correct durations', () => {
      expect(PLAN_DURATIONS.daily).toBe(1);
      expect(PLAN_DURATIONS.weekly).toBe(7);
      expect(PLAN_DURATIONS.monthly).toBe(30);
      expect(PLAN_DURATIONS.elite).toBe(30);
    });
  });
});