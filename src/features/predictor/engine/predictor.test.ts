import { describe, it, expect, vi, beforeEach } from 'vitest';
import { predict } from '@/features/predictor/engine/predictor';
import type { FormEntry } from '@/features/predictor/engine/predictor';

const mockTeam = {
  id: 'MCI',
  name: 'Manchester City',
  shortName: 'MCI',
  category: 'strong' as const,
  strengthValue: 95,
  goalPower: 90,
  defensePower: 85,
  winRate: 0.62,
  drawRate: 0.18,
  lossRate: 0.20,
  homeBonus: 0.07,
  isGoalActivator: true,
  league: 'English League',
  color: '#6CABDD',
  emoji: '🔵',
  over25Rate: 0.74,
  bttsRate: 0.66,
  currentStreak: 'WINNING',
};

describe('predict', () => {
  it('should return a MatchPrediction object', () => {
    const result = predict(mockTeam, { ...mockTeam, id: 'LIV', name: 'Liverpool', shortName: 'LIV' }, [], [], 1);
    expect(result).toHaveProperty('homeWinProb');
    expect(result).toHaveProperty('drawProb');
    expect(result).toHaveProperty('awayWinProb');
    expect(result).toHaveProperty('over15Prob');
    expect(result).toHaveProperty('over25Prob');
    expect(result).toHaveProperty('over35Prob');
    expect(result).toHaveProperty('bttsProb');
    expect(result).toHaveProperty('expectedGoals');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('valueRating');
    expect(result).toHaveProperty('signals');
    expect(result).toHaveProperty('tips');
    expect(result).toHaveProperty('predictedScore');
    expect(result).toHaveProperty('riskLevel');
    expect(result).toHaveProperty('formAnalysis');
    expect(result).toHaveProperty('activatorAlert');
  });

  it('should return probabilities in 0-100 range', () => {
    const result = predict(mockTeam, { ...mockTeam, id: 'LIV', name: 'Liverpool', shortName: 'LIV' }, [], [], 1);
    expect(result.homeWinProb).toBeGreaterThanOrEqual(0);
    expect(result.homeWinProb).toBeLessThanOrEqual(100);
    expect(result.drawProb).toBeGreaterThanOrEqual(0);
    expect(result.drawProb).toBeLessThanOrEqual(100);
    expect(result.awayWinProb).toBeGreaterThanOrEqual(0);
    expect(result.awayWinProb).toBeLessThanOrEqual(100);
  });

  it('should include activator signal for goal activator teams', () => {
    const result = predict(mockTeam, { ...mockTeam, id: 'LIV', name: 'Liverpool' }, [], [], 1);
    expect(result.activatorAlert).toBe(true);
  });

  it('should not include activator for non-activator teams', () => {
    const nonActivator = { ...mockTeam, isGoalActivator: false };
    const result = predict(nonActivator, { ...mockTeam, id: 'LIV', name: 'Liverpool', isGoalActivator: false }, [], [], 1);
    expect(result.activatorAlert).toBe(false);
  });

  it('should generate signals array', () => {
    const result = predict(mockTeam, { ...mockTeam, id: 'LIV', name: 'Liverpool' }, [], [], 1);
    expect(Array.isArray(result.signals)).toBe(true);
  });

  it('should generate bet tips array', () => {
    const result = predict(mockTeam, { ...mockTeam, id: 'LIV', name: 'Liverpool' }, [], [], 1);
    expect(Array.isArray(result.tips)).toBe(true);
    if (result.tips.length > 0) {
      const tip = result.tips[0];
      expect(tip).toHaveProperty('market');
      expect(tip).toHaveProperty('pick');
      expect(tip).toHaveProperty('confidence');
      expect(tip).toHaveProperty('reasoning');
      expect(tip).toHaveProperty('tag');
      expect(['SAFE', 'VALUE', 'RISKY']).toContain(tip.tag);
    }
  });

  it('should have valid valueRating', () => {
    const result = predict(mockTeam, { ...mockTeam, id: 'LIV', name: 'Liverpool' }, [], [], 1);
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(result.valueRating);
  });

  it('should have valid riskLevel', () => {
    const result = predict(mockTeam, { ...mockTeam, id: 'LIV', name: 'Liverpool' }, [], [], 1);
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.riskLevel);
  });

  it('should have predictedScore in format "X-Y"', () => {
    const result = predict(mockTeam, { ...mockTeam, id: 'LIV', name: 'Liverpool' }, [], [], 1);
    expect(result.predictedScore).toMatch(/^\d+-\d+$/);
  });

  it('should incorporate form entries into formAnalysis', () => {
    const homeForm: FormEntry[] = [
      { result: 'W', goals: 2, conceded: 0 },
      { result: 'W', goals: 3, conceded: 1 },
    ];
    const awayForm: FormEntry[] = [
      { result: 'L', goals: 0, conceded: 2 },
      { result: 'D', goals: 1, conceded: 1 },
    ];
    const result = predict(mockTeam, { ...mockTeam, id: 'LIV', name: 'Liverpool' }, homeForm, awayForm, 1);
    expect(result.formAnalysis).toContain('W');
  });

  it('should handle missing team data gracefully', () => {
    const minimalTeam = {
      id: 'XXX',
      name: 'Unknown',
      shortName: 'UNK',
      category: 'balance' as const,
      strengthValue: 50,
      goalPower: 50,
      defensePower: 50,
      winRate: 0.33,
      drawRate: 0.33,
      lossRate: 0.34,
      homeBonus: 0.05,
      isGoalActivator: false,
      league: 'Unknown',
      color: '#888888',
      emoji: '⚽',
    };
    const result = predict(minimalTeam, { ...minimalTeam, id: 'YYY', name: 'Unknown2' }, [], [], 1);
    expect(result).toHaveProperty('homeWinProb');
    expect(result).toHaveProperty('confidence');
  });
});