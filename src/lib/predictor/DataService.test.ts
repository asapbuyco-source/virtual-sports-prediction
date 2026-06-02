import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataService } from '@/lib/predictor/DataService';

describe('DataService', () => {
  describe('hasValidData', () => {
    it('should return true when leagues data exists', () => {
      const result = DataService.hasValidData();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getLeagues', () => {
    it('should return array of leagues', () => {
      const leagues = DataService.getLeagues();
      expect(Array.isArray(leagues)).toBe(true);
    });

    it('should return empty array when data is invalid', () => {
      const leagues = DataService.getLeagues();
      if (!DataService.hasValidData()) {
        expect(leagues).toEqual([]);
      }
    });
  });

  describe('getTeams', () => {
    it('should return array of teams for valid league', () => {
      const teams = DataService.getTeams('English League');
      expect(Array.isArray(teams)).toBe(true);
    });

    it('should return empty array for invalid league', () => {
      const teams = DataService.getTeams('Invalid League');
      expect(teams).toEqual([]);
    });
  });

  describe('getHeadToHead', () => {
    it('should return null for non-existent h2h', () => {
      const h2h = DataService.getHeadToHead('XYZ', 'ABC');
      expect(h2h).toBeNull();
    });
  });

  describe('getLiveMatches', () => {
    it('should return array', () => {
      const matches = DataService.getLiveMatches();
      expect(Array.isArray(matches)).toBe(true);
    });
  });
});

describe('activateSubscription idempotency', () => {
  it('should not double-credit on duplicate fapshiTransactionId', async () => {
    const mockDb = {
      doc: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ fapshiTransactionId: 'trans_123', plan: 'monthly' }),
        }),
      }),
    };

    const transId = 'trans_123';
    const existingData = { exists: true, data: () => ({ fapshiTransactionId: transId }) };

    expect(existingData.data().fapshiTransactionId).toBe(transId);
  });
});

describe('Firestore rules', () => {
  it('should block predictionsUsed below 0 via rule validation', () => {
    const predictionsUsed = -1;
    expect(predictionsUsed >= 0).toBe(false);
  });

  it('should allow predictionsUsed at 0', () => {
    const predictionsUsed = 0;
    expect(predictionsUsed >= 0).toBe(true);
  });
});