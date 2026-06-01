import { describe, it, expect } from 'vitest';
import { DataService } from '@/lib/predictor/DataService';
import teamStats from '@/data/team_stats.json';
import liveSyncData from '@/data/live_sync.json';

describe('DataService', () => {
  describe('getLeagues', () => {
    it('should return an array of leagues', () => {
      const leagues = DataService.getLeagues();
      expect(Array.isArray(leagues)).toBe(true);
      expect(leagues.length).toBeGreaterThan(0);
    });

    it('should have id and displayName for each league', () => {
      const leagues = DataService.getLeagues();
      leagues.forEach((league: any) => {
        expect(league).toHaveProperty('id');
        expect(league).toHaveProperty('displayName');
      });
    });
  });

  describe('getTeams', () => {
    it('should return non-empty array for valid league', () => {
      const leagues = DataService.getLeagues();
      if (leagues.length > 0) {
        const teams = DataService.getTeams(leagues[0].id);
        expect(Array.isArray(teams)).toBe(true);
        expect(teams.length).toBeGreaterThan(0);
      }
    });

    it('should return empty array for invalid league', () => {
      const teams = DataService.getTeams('Invalid League');
      expect(teams).toEqual([]);
    });

    it('should have required team properties', () => {
      const teams = DataService.getTeams('English League');
      if (teams.length > 0) {
        const team = teams[0];
        expect(team).toHaveProperty('id');
        expect(team).toHaveProperty('name');
        expect(team).toHaveProperty('shortName');
        expect(team).toHaveProperty('league');
        expect(team).toHaveProperty('strengthValue');
        expect(team).toHaveProperty('goalPower');
        expect(team).toHaveProperty('defensePower');
      }
    });

    it('should have strength values in reasonable range', () => {
      const teams = DataService.getTeams('English League');
      teams.forEach((team: any) => {
        expect(team.strengthValue).toBeGreaterThanOrEqual(0);
        expect(team.strengthValue).toBeLessThanOrEqual(100);
        expect(team.goalPower).toBeGreaterThanOrEqual(0);
        expect(team.goalPower).toBeLessThanOrEqual(100);
        expect(team.defensePower).toBeGreaterThanOrEqual(0);
        expect(team.defensePower).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('getEngine', () => {
    it('should return a singleton engine instance', () => {
      const engine1 = DataService.getEngine();
      const engine2 = DataService.getEngine();
      expect(engine1).toBe(engine2);
    });

    it('should produce valid predictions', () => {
      const engine = DataService.getEngine();
      const teams = DataService.getTeams('English League');
      if (teams.length >= 2) {
        const result = engine.predictMatch('English League', teams[0].id, teams[1].id);
        if (result) {
          expect(result.homeWinProb).toBeGreaterThanOrEqual(0);
          expect(result.homeWinProb).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  describe('getLiveMatches', () => {
    it('should return an array', () => {
      const matches = DataService.getLiveMatches();
      expect(Array.isArray(matches)).toBe(true);
    });
  });

  describe('getTeamInsights', () => {
    it('should return insights for valid team', () => {
      const teams = DataService.getTeams('English League');
      if (teams.length > 0) {
        const insights = DataService.getTeamInsights(teams[0].id, 'English League');
        expect(insights).not.toBeNull();
        expect(insights).toHaveProperty('streak');
        expect(insights).toHaveProperty('over25Rate');
        expect(insights).toHaveProperty('bttsRate');
      }
    });

    it('should return null for invalid team', () => {
      const insights = DataService.getTeamInsights('INVALID', 'English League');
      expect(insights).toBeNull();
    });
  });

  describe('data integrity', () => {
    it('team_stats.json should have valid league structure', () => {
      expect(teamStats).toHaveProperty('leagues');
      const leagues = Object.keys(teamStats.leagues as object);
      expect(leagues.length).toBeGreaterThan(0);
    });

    it('each league should have teams', () => {
      const leagues = Object.keys(teamStats.leagues as object);
      leagues.forEach((leagueId: string) => {
        const league = (teamStats.leagues as any)[leagueId];
        expect(league).toHaveProperty('teams');
        const teams = Object.keys(league.teams);
        expect(teams.length).toBeGreaterThan(0);
      });
    });

    it('live_sync.json should have valid structure', () => {
      expect(liveSyncData).toBeDefined();
    });
  });
});