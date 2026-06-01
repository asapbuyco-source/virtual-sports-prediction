import teamStats from '../../../data/team_stats.json';
import liveSyncData from '../../../data/live_sync.json';
import { PredictorEngine } from './Engine';
import type { Team, TeamCategory } from '../../data/teamsData';

const liveSync = liveSyncData || { upcoming: [], recentHistory: [], lastUpdated: null };

export class DataService {
    private static engine: PredictorEngine | null = null;

    public static getEngine(): PredictorEngine {
        if (!this.engine) {
            this.engine = new PredictorEngine(teamStats, liveSync);
        }
        return this.engine;
    }

    public static getHeadToHead(team1: string, team2: string) {
        const key = [team1, team2].sort().join(' vs ');
        return teamStats.headToHead?.[key] || null;
    }

    public static getTeamInsights(teamId: string, leagueId: string) {
        const league = teamStats.leagues?.[leagueId];
        if (!league) return null;
        const team = league.teams?.[teamId];
        if (!team) return null;

        return {
            streak: team.currentStreak || 'NEUTRAL',
            recentForm: team.recentForm || [],
            over25Rate: team.over25Rate || 0.5,
            bttsRate: team.bttsRate || 0.5,
            cleanSheetRate: team.cleanSheetRate || 0,
            failedToScoreRate: team.failedToScoreRate || 0,
        };
    }

    public static getLeagues() {
        const leagueNames: Record<string, string> = {
            'English League': 'EPL',
            'Spanish League': 'LaLiga',
            'Italian League': 'SerieA',
            'German League': 'Bundesliga',
            'French League': 'Ligue 1',
            'Dutch League': 'Eredivisie',
            'Portuguese League': 'Liga Nos',
        };
        return Object.keys(teamStats.leagues).map(id => ({
            id,
            displayName: leagueNames[id] || id,
            name: id.replace(/([A-Z])/g, ' $1').trim()
        }));
    }

    public static getTeams(leagueId: string): Team[] {
        const league = (teamStats.leagues as any)[leagueId];
        if (!league) return [];

        return Object.keys(league.teams).map(teamId => {
            const stats = league.teams[teamId];
            const teamInfo = TEAM_NAMES[teamId] || { full: teamId, emoji: "⚽" };
            return {
                id: teamId,
                name: teamInfo.full,
                shortName: teamId,
                category: this.getCategory(stats.elo),
                strengthValue: Math.round((stats.elo - 1000) / 10),
                goalPower: Math.round((stats.avgGoalsScored || stats.goalsScored / Math.max(stats.matchesPlayed, 1)) * 40),
                defensePower: Math.round(100 - (stats.avgGoalsConceded || stats.goalsConceded / Math.max(stats.matchesPlayed, 1)) * 40),
                winRate: stats.wins / Math.max(stats.matchesPlayed, 1),
                drawRate: stats.draws / Math.max(stats.matchesPlayed, 1),
                lossRate: stats.losses / Math.max(stats.matchesPlayed, 1),
                homeBonus: 0.05,
                isGoalActivator: (stats.avgGoalsScored || stats.goalsScored / Math.max(stats.matchesPlayed, 1)) > 1.5,
                league: leagueId,
                color: "#888888",
                emoji: teamInfo.emoji,
                over25Rate: stats.over25Rate || 0.5,
                bttsRate: stats.bttsRate || 0.5,
                currentStreak: stats.currentStreak || "NEUTRAL",
            };
        });
    }

    private static getCategory(elo: number): TeamCategory {
        if (elo > 1650) return "strong";
        if (elo > 1450) return "balance";
        return "weak";
    }

    public static getLiveMatches() {
        return liveSync?.upcoming || [];
    }
}
