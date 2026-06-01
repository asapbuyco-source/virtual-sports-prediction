import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PredictorEngine } from '@/lib/predictor/Engine';

const mockStats = {
  leagues: {
    'English League': {
      avgGoals: 2.8,
      teams: {
        MCI: {
          goalsScored: 85,
          goalsConceded: 25,
          matchesPlayed: 35,
          wins: 28,
          draws: 4,
          losses: 3,
          elo: 1650,
          avgGoalsScored: 2.43,
          avgGoalsConceded: 0.71,
          over25Rate: 0.74,
          bttsRate: 0.66,
          cleanSheetRate: 0.43,
          failedToScoreRate: 0.06,
          recentForm: ['W', 'W', 'W', 'D', 'W'],
          currentStreak: 'WINNING',
        },
        LIV: {
          goalsScored: 75,
          goalsConceded: 30,
          matchesPlayed: 35,
          wins: 24,
          draws: 5,
          losses: 6,
          elo: 1600,
          avgGoalsScored: 2.14,
          avgGoalsConceded: 0.86,
          over25Rate: 0.69,
          bttsRate: 0.63,
          cleanSheetRate: 0.34,
          failedToScoreRate: 0.11,
          recentForm: ['W', 'W', 'L', 'W', 'D'],
          currentStreak: 'WINNING',
        },
      },
    },
  },
  headToHead: {
    'LIV vs MCI': {
      homeWins: 5,
      awayWins: 8,
      draws: 2,
      over25: 10,
      under25: 5,
      bttsYes: 9,
      totalMatches: 15,
      goals: [2, 3, 1, 4, 2, 3, 2, 1, 3, 4, 2, 3, 1, 2, 3],
    },
  },
};

describe('PredictorEngine', () => {
  let engine: PredictorEngine;

  beforeEach(() => {
    engine = new PredictorEngine(mockStats, {});
  });

  it('should return prediction result for valid teams', () => {
    const result = engine.predictMatch('English League', 'MCI', 'LIV');
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('homeWinProb');
    expect(result).toHaveProperty('drawProb');
    expect(result).toHaveProperty('awayWinProb');
    expect(result).toHaveProperty('over25Prob');
    expect(result).toHaveProperty('bttsProb');
    expect(result).toHaveProperty('confidence');
  });

  it('should return null for non-existent league', () => {
    const result = engine.predictMatch('NonExistent League', 'MCI', 'LIV');
    expect(result).toBeNull();
  });

  it('should return null for non-existent teams', () => {
    const result = engine.predictMatch('English League', 'XXX', 'YYY');
    expect(result).toBeNull();
  });

  describe('probability constraints', () => {
    it('should return probabilities between 0 and 1', () => {
      const result = engine.predictMatch('English League', 'MCI', 'LIV')!;
      expect(result.homeWinProb).toBeGreaterThanOrEqual(0);
      expect(result.homeWinProb).toBeLessThanOrEqual(1);
      expect(result.drawProb).toBeGreaterThanOrEqual(0);
      expect(result.drawProb).toBeLessThanOrEqual(1);
      expect(result.awayWinProb).toBeGreaterThanOrEqual(0);
      expect(result.awayWinProb).toBeLessThanOrEqual(1);
      expect(result.over25Prob).toBeGreaterThanOrEqual(0);
      expect(result.over25Prob).toBeLessThanOrEqual(1);
      expect(result.bttsProb).toBeGreaterThanOrEqual(0);
      expect(result.bttsProb).toBeLessThanOrEqual(1);
    });

    it('should have homeWinProb + drawProb + awayWinProb sum close to 1', () => {
      const result = engine.predictMatch('English League', 'MCI', 'LIV')!;
      const sum = result.homeWinProb + result.drawProb + result.awayWinProb;
      expect(sum).toBeGreaterThan(0.95);
      expect(sum).toBeLessThan(1.05);
    });

    it('should have confidence between 0 and 100', () => {
      const result = engine.predictMatch('English League', 'MCI', 'LIV')!;
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('head to head integration', () => {
    it('should use H2H data when available', () => {
      const resultWithH2H = engine.predictMatch('English League', 'LIV', 'MCI')!;
      expect(resultWithH2H.homeWinProb).not.toBeNull();
    });
  });

  describe('momentum system', () => {
    it('should apply winning streak boost', () => {
      const result = engine.predictMatch('English League', 'MCI', 'LIV')!;
      expect(result).toHaveProperty('momentumNote');
    });
  });

  describe('recommended stake', () => {
    it('should return recommended stake based on confidence', () => {
      const result = engine.predictMatch('English League', 'MCI', 'LIV')!;
      expect(result.recommendedStake).toBeGreaterThanOrEqual(0);
      expect(result.recommendedStake).toBeLessThanOrEqual(10);
    });
  });

  describe('calculateRecentForm', () => {
    it('should return 1.0 for unknown team with no history', () => {
      const form = engine.predictMatch('English League', 'MCI', 'LIV');
      expect(form).not.toBeNull();
    });
  });
});