import { TEAM_NAMES } from './teamNames';
import teamStats from '../../../data/team_stats.json';
import { PredictorEngine } from './Engine';
import type { Team, TeamCategory } from '../../data/teamsData';

function loadLiveSync() {
    try {
        return require('../../../data/live_sync.json');
    } catch {
        return { upcoming: [], recentHistory: [], lastUpdated: null };
    }
}

const liveSync = loadLiveSync();

export class DataService {
    private static engine: PredictorEngine | null = null;

    public static getEngine(): PredictorEngine {
        if (!this.engine) {
            this.engine = new PredictorEngine(teamStats, liveSync);
        }
        return this.engine;
    }

    public static getLeagues() {
        return Object.keys(teamStats.leagues).map(id => ({
            id,
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
                goalPower: Math.round((stats.goalsScored / stats.matchesPlayed) * 40),
                defensePower: Math.round(100 - (stats.goalsConceded / stats.matchesPlayed) * 40),
                winRate: stats.wins / stats.matchesPlayed,
                drawRate: stats.draws / stats.matchesPlayed,
                lossRate: stats.losses / stats.matchesPlayed,
                homeBonus: 0.05,
                isGoalActivator: (stats.goalsScored / stats.matchesPlayed) > 1.5,
                league: leagueId,
                color: "#888888",
                emoji: teamInfo.emoji
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
