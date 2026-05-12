import type { FormEntry } from "./predictor";

export function calcFormMultiplier(form: FormEntry[]): {
  attackMult: number;
  defenceMult: number;
  momentum: number;
} {
  if (!form || form.length === 0)
    return { attackMult: 1, defenceMult: 1, momentum: 0 };

  const recent = form.slice(-5);
  const wins = recent.filter((f) => f.result === "W").length;
  const losses = recent.filter((f) => f.result === "L").length;
  const avgGoals = recent.reduce((s, f) => s + f.goals, 0) / recent.length;
  const avgConceded = recent.reduce((s, f) => s + f.conceded, 0) / recent.length;

  const momentum = ((wins - losses) / Math.max(recent.length, 1)) * 1.5;

  const scoringDrought = recent.slice(-3).every((f) => f.goals === 0);
  const concedingStreak = recent.slice(-3).every((f) => f.conceded > 1);

  const attackMult = scoringDrought
    ? 1.25
    : avgGoals > 2
    ? 1.15
    : avgGoals > 1
    ? 1.05
    : 0.95;

  const defenceMult = concedingStreak
    ? 0.88
    : avgConceded < 0.5
    ? 1.08
    : avgConceded > 1.5
    ? 0.90
    : 1.00;

  return { attackMult, defenceMult, momentum };
}