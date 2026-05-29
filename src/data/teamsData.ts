// ============================================================
// BetPawa Virtual Football League – Deep Research Data
// Based on: RNG weighting, Strength Values, Goal Power,
// Allocated Result Percentages (ARpt), and community analysis
// ============================================================

export type TeamCategory = "strong" | "balance" | "weak";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  category: TeamCategory;
  strengthValue: number;
  goalPower: number;
  defensePower: number;
  winRate: number;
  drawRate: number;
  lossRate: number;
  homeBonus: number;
  isGoalActivator: boolean;
  league: string;
  color: string;
  emoji: string;
  over25Rate?: number;
  bttsRate?: number;
  currentStreak?: string;
}

export interface H2HRecord {
  home: string;
  away: string;
  over15Prob: number;
  over25Prob: number;
  over35Prob: number;
  bttsProb: number;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
}

// ── Premier League teams (EPL Virtual) ──────────────────────
export const EPL_TEAMS: Team[] = [
  { id:"MNC", name:"Manchester City",  shortName:"MNC", category:"strong",  strengthValue:95, goalPower:90, defensePower:85, winRate:0.62, drawRate:0.18, lossRate:0.20, homeBonus:0.07, isGoalActivator:true,  league:"EPL", color:"#6CABDD", emoji:"🔵" },
  { id:"LIV", name:"Liverpool",         shortName:"LIV", category:"strong",  strengthValue:90, goalPower:88, defensePower:80, winRate:0.58, drawRate:0.19, lossRate:0.23, homeBonus:0.06, isGoalActivator:true,  league:"EPL", color:"#C8102E", emoji:"🔴" },
  { id:"MNU", name:"Manchester United", shortName:"MNU", category:"strong",  strengthValue:82, goalPower:78, defensePower:75, winRate:0.52, drawRate:0.20, lossRate:0.28, homeBonus:0.06, isGoalActivator:false, league:"EPL", color:"#DA020E", emoji:"🔴" },
  { id:"CHE", name:"Chelsea",           shortName:"CHE", category:"strong",  strengthValue:80, goalPower:76, defensePower:74, winRate:0.50, drawRate:0.21, lossRate:0.29, homeBonus:0.05, isGoalActivator:false, league:"EPL", color:"#034694", emoji:"🔵" },
  { id:"ARS", name:"Arsenal",           shortName:"ARS", category:"strong",  strengthValue:78, goalPower:80, defensePower:72, winRate:0.50, drawRate:0.20, lossRate:0.30, homeBonus:0.06, isGoalActivator:true,  league:"EPL", color:"#EF0107", emoji:"🔴" },
  { id:"TOT", name:"Tottenham",        shortName:"TOT", category:"strong",  strengthValue:75, goalPower:74, defensePower:68, winRate:0.47, drawRate:0.21, lossRate:0.32, homeBonus:0.05, isGoalActivator:false, league:"EPL", color:"#132257", emoji:"⚪" },
  { id:"EVE", name:"Everton",           shortName:"EVE", category:"balance", strengthValue:62, goalPower:72, defensePower:58, winRate:0.40, drawRate:0.22, lossRate:0.38, homeBonus:0.04, isGoalActivator:true,  league:"EPL", color:"#003399", emoji:"🔵" },
  { id:"LEI", name:"Leicester",         shortName:"LEI", category:"balance", strengthValue:60, goalPower:65, defensePower:60, winRate:0.38, drawRate:0.23, lossRate:0.39, homeBonus:0.04, isGoalActivator:false, league:"EPL", color:"#003090", emoji:"🔵" },
  { id:"WHU", name:"West Ham",          shortName:"WHU", category:"balance", strengthValue:58, goalPower:62, defensePower:58, winRate:0.37, drawRate:0.23, lossRate:0.40, homeBonus:0.04, isGoalActivator:false, league:"EPL", color:"#7A263A", emoji:"🔨" },
  { id:"SOU", name:"Southampton",      shortName:"SOU", category:"balance", strengthValue:52, goalPower:58, defensePower:55, winRate:0.34, drawRate:0.24, lossRate:0.42, homeBonus:0.03, isGoalActivator:false, league:"EPL", color:"#D71920", emoji:"🔴" },
  { id:"WAT", name:"Watford",          shortName:"WAT", category:"balance", strengthValue:50, goalPower:55, defensePower:52, winRate:0.33, drawRate:0.24, lossRate:0.43, homeBonus:0.03, isGoalActivator:false, league:"EPL", color:"#FBEE23", emoji:"🟡" },
  { id:"CRY", name:"Crystal Palace",   shortName:"CRY", category:"balance", strengthValue:50, goalPower:54, defensePower:53, winRate:0.32, drawRate:0.24, lossRate:0.44, homeBonus:0.03, isGoalActivator:false, league:"EPL", color:"#1B458F", emoji:"🦅" },
  { id:"WOL", name:"Wolves",            shortName:"WOL", category:"balance", strengthValue:48, goalPower:52, defensePower:55, winRate:0.31, drawRate:0.25, lossRate:0.44, homeBonus:0.03, isGoalActivator:false, league:"EPL", color:"#FDB913", emoji:"🐺" },
  { id:"BOU", name:"Bournemouth",      shortName:"BOU", category:"balance", strengthValue:46, goalPower:60, defensePower:42, winRate:0.30, drawRate:0.24, lossRate:0.46, homeBonus:0.03, isGoalActivator:true,  league:"EPL", color:"#DA020E", emoji:"🍒" },
  { id:"BUR", name:"Burnley",           shortName:"BUR", category:"balance", strengthValue:44, goalPower:48, defensePower:50, winRate:0.29, drawRate:0.25, lossRate:0.46, homeBonus:0.04, isGoalActivator:false, league:"EPL", color:"#6C1D45", emoji:"🟣" },
  { id:"BRI", name:"Brighton",          shortName:"BRI", category:"balance", strengthValue:62, goalPower:60, defensePower:58, winRate:0.38, drawRate:0.24, lossRate:0.38, homeBonus:0.03, isGoalActivator:false, league:"EPL", color:"#0057B8", emoji:"🔵" },
  { id:"NWC", name:"Newcastle",        shortName:"NWC", category:"balance", strengthValue:70, goalPower:68, defensePower:65, winRate:0.44, drawRate:0.22, lossRate:0.34, homeBonus:0.04, isGoalActivator:false, league:"EPL", color:"#000000", emoji:"⚫" },
  { id:"SHU", name:"Sheffield United",  shortName:"SHU", category:"weak",    strengthValue:28, goalPower:35, defensePower:38, winRate:0.18, drawRate:0.28, lossRate:0.54, homeBonus:0.03, isGoalActivator:false, league:"EPL", color:"#EE2737", emoji:"🔴" },
  { id:"ASV", name:"Aston Villa",      shortName:"ASV", category:"balance", strengthValue:72, goalPower:70, defensePower:68, winRate:0.45, drawRate:0.22, lossRate:0.33, homeBonus:0.04, isGoalActivator:false, league:"EPL", color:"#670E36", emoji:"🟣" },
  { id:"NOR", name:"Norwich",          shortName:"NOR", category:"weak",    strengthValue:22, goalPower:28, defensePower:32, winRate:0.14, drawRate:0.28, lossRate:0.58, homeBonus:0.02, isGoalActivator:false, league:"EPL", color:"#00A650", emoji:"🟢" },
];

// ── La Liga teams (Virtual) ──────────────────────────────────
export const LALIGA_TEAMS: Team[] = [
  { id:"RMA", name:"Real Madrid",    shortName:"RMA", category:"strong",  strengthValue:96, goalPower:92, defensePower:86, winRate:0.64, drawRate:0.17, lossRate:0.19, homeBonus:0.07, isGoalActivator:true,  league:"LaLiga", color:"#FEBE10", emoji:"⚽" },
  { id:"BAR", name:"Barcelona",      shortName:"BAR", category:"strong",  strengthValue:93, goalPower:90, defensePower:82, winRate:0.61, drawRate:0.18, lossRate:0.21, homeBonus:0.07, isGoalActivator:true,  league:"LaLiga", color:"#A50044", emoji:"🔴" },
  { id:"ATM", name:"Atletico Madrid",shortName:"ATM", category:"strong",  strengthValue:85, goalPower:80, defensePower:88, winRate:0.55, drawRate:0.22, lossRate:0.23, homeBonus:0.06, isGoalActivator:false, league:"LaLiga", color:"#CB3524", emoji:"🔴" },
  { id:"SEV", name:"Sevilla",        shortName:"SEV", category:"strong",  strengthValue:76, goalPower:74, defensePower:72, winRate:0.48, drawRate:0.22, lossRate:0.30, homeBonus:0.05, isGoalActivator:false, league:"LaLiga", color:"#D4011D", emoji:"🔴" },
  { id:"VAL", name:"Valencia",       shortName:"VAL", category:"balance", strengthValue:64, goalPower:65, defensePower:62, winRate:0.40, drawRate:0.23, lossRate:0.37, homeBonus:0.04, isGoalActivator:false, league:"LaLiga", color:"#FF7F00", emoji:"🟠" },
  { id:"VIL", name:"Villarreal",     shortName:"VIL", category:"balance", strengthValue:62, goalPower:68, defensePower:60, winRate:0.39, drawRate:0.23, lossRate:0.38, homeBonus:0.04, isGoalActivator:true,  league:"LaLiga", color:"#F7D000", emoji:"🟡" },
  { id:"RBS", name:"Real Betis",     shortName:"RBS", category:"balance", strengthValue:58, goalPower:60, defensePower:58, winRate:0.37, drawRate:0.24, lossRate:0.39, homeBonus:0.04, isGoalActivator:false, league:"LaLiga", color:"#00954C", emoji:"🟢" },
  { id:"CEL", name:"Celta Vigo",     shortName:"CEL", category:"balance", strengthValue:52, goalPower:58, defensePower:50, winRate:0.33, drawRate:0.24, lossRate:0.43, homeBonus:0.03, isGoalActivator:false, league:"LaLiga", color:"#6ABFE8", emoji:"🔵" },
  { id:"ESP", name:"Espanyol",       shortName:"ESP", category:"weak",    strengthValue:38, goalPower:40, defensePower:42, winRate:0.23, drawRate:0.26, lossRate:0.51, homeBonus:0.03, isGoalActivator:false, league:"LaLiga", color:"#0064A5", emoji:"🔵" },
  { id:"GET", name:"Getafe",         shortName:"GET", category:"weak",    strengthValue:32, goalPower:35, defensePower:42, winRate:0.20, drawRate:0.27, lossRate:0.53, homeBonus:0.03, isGoalActivator:false, league:"LaLiga", color:"#005AA0", emoji:"🔵" },
];

// ── Serie A teams (Virtual Italiano) ─────────────────────────
export const SERIEA_TEAMS: Team[] = [
  { id:"JUV", name:"Juventus",    shortName:"JUV", category:"strong",  strengthValue:88, goalPower:82, defensePower:85, winRate:0.56, drawRate:0.20, lossRate:0.24, homeBonus:0.06, isGoalActivator:false, league:"SerieA", color:"#000000", emoji:"⚫" },
  { id:"INT", name:"Inter Milan", shortName:"INT", category:"strong",  strengthValue:87, goalPower:84, defensePower:83, winRate:0.55, drawRate:0.21, lossRate:0.24, homeBonus:0.06, isGoalActivator:true,  league:"SerieA", color:"#010E80", emoji:"🔵" },
  { id:"ACM", name:"AC Milan",    shortName:"ACM", category:"strong",  strengthValue:84, goalPower:80, defensePower:80, winRate:0.53, drawRate:0.21, lossRate:0.26, homeBonus:0.06, isGoalActivator:true,  league:"SerieA", color:"#FB090B", emoji:"🔴" },
  { id:"NAP", name:"Napoli",      shortName:"NAP", category:"strong",  strengthValue:80, goalPower:82, defensePower:74, winRate:0.50, drawRate:0.21, lossRate:0.29, homeBonus:0.05, isGoalActivator:true,  league:"SerieA", color:"#12A0C3", emoji:"🔵" },
  { id:"ROM", name:"AS Roma",     shortName:"ROM", category:"strong",  strengthValue:75, goalPower:74, defensePower:70, winRate:0.46, drawRate:0.22, lossRate:0.32, homeBonus:0.05, isGoalActivator:false, league:"SerieA", color:"#8B0000", emoji:"🐺" },
  { id:"LAZ", name:"Lazio",       shortName:"LAZ", category:"balance", strengthValue:68, goalPower:70, defensePower:65, winRate:0.43, drawRate:0.22, lossRate:0.35, homeBonus:0.04, isGoalActivator:false, league:"SerieA", color:"#87CEEB", emoji:"🔵" },
  { id:"ATL", name:"Atalanta",   shortName:"ATL", category:"balance", strengthValue:65, goalPower:72, defensePower:62, winRate:0.42, drawRate:0.23, lossRate:0.35, homeBonus:0.04, isGoalActivator:true,  league:"SerieA", color:"#1E3A8A", emoji:"🔵" },
  { id:"FIO", name:"Fiorentina",  shortName:"FIO", category:"balance", strengthValue:58, goalPower:60, defensePower:56, winRate:0.37, drawRate:0.24, lossRate:0.39, homeBonus:0.04, isGoalActivator:false, league:"SerieA", color:"#6B21A8", emoji:"🟣" },
  { id:"TOR", name:"Torino",      shortName:"TOR", category:"weak",    strengthValue:40, goalPower:42, defensePower:44, winRate:0.25, drawRate:0.27, lossRate:0.48, homeBonus:0.03, isGoalActivator:false, league:"SerieA", color:"#8B4513", emoji:"🟫" },
  { id:"SAM", name:"Sampdoria",   shortName:"SAM", category:"weak",    strengthValue:35, goalPower:38, defensePower:40, winRate:0.21, drawRate:0.27, lossRate:0.52, homeBonus:0.03, isGoalActivator:false, league:"SerieA", color:"#003082", emoji:"🔵" },
];

// ── Bundesliga teams (Virtual) ────────────────────────────────
export const BUNDESLIGA_TEAMS: Team[] = [
  { id:"BAY", name:"Bayern Munich",       shortName:"BAY", category:"strong",  strengthValue:97, goalPower:94, defensePower:88, winRate:0.68, drawRate:0.15, lossRate:0.17, homeBonus:0.08, isGoalActivator:true,  league:"Bundesliga", color:"#DC052D", emoji:"🔴" },
  { id:"BVB", name:"Borussia Dortmund",   shortName:"BVB", category:"strong",  strengthValue:87, goalPower:86, defensePower:76, winRate:0.57, drawRate:0.19, lossRate:0.24, homeBonus:0.07, isGoalActivator:true,  league:"Bundesliga", color:"#FDE100", emoji:"🟡" },
  { id:"RBL", name:"RB Leipzig",          shortName:"RBL", category:"strong",  strengthValue:80, goalPower:82, defensePower:74, winRate:0.52, drawRate:0.21, lossRate:0.27, homeBonus:0.06, isGoalActivator:false, league:"Bundesliga", color:"#DD0531", emoji:"🔴" },
  { id:"B04", name:"Bayer Leverkusen",    shortName:"B04", category:"strong",  strengthValue:78, goalPower:76, defensePower:72, winRate:0.50, drawRate:0.22, lossRate:0.28, homeBonus:0.06, isGoalActivator:true,  league:"Bundesliga", color:"#E40521", emoji:"🔴" },
  { id:"SGE", name:"Eintracht Frankfurt", shortName:"SGE", category:"strong",  strengthValue:74, goalPower:72, defensePower:70, winRate:0.48, drawRate:0.21, lossRate:0.31, homeBonus:0.05, isGoalActivator:false, league:"Bundesliga", color:"#E3000B", emoji:"⚫" },
  { id:"WOB", name:"Wolfsburg",           shortName:"WOB", category:"balance", strengthValue:65, goalPower:66, defensePower:64, winRate:0.42, drawRate:0.23, lossRate:0.35, homeBonus:0.04, isGoalActivator:false, league:"Bundesliga", color:"#76AB2F", emoji:"🟢" },
  { id:"M05", name:"Mainz 05",           shortName:"M05", category:"balance", strengthValue:58, goalPower:58, defensePower:60, winRate:0.37, drawRate:0.24, lossRate:0.39, homeBonus:0.04, isGoalActivator:false, league:"Bundesliga", color:"#E3000B", emoji:"🔴" },
  { id:"SCF", name:"Freiburg",           shortName:"SCF", category:"balance", strengthValue:54, goalPower:56, defensePower:55, winRate:0.34, drawRate:0.25, lossRate:0.41, homeBonus:0.03, isGoalActivator:false, league:"Bundesliga", color:"#000000", emoji:"⚫" },
  { id:"HER", name:"Hertha BSC",         shortName:"HER", category:"balance", strengthValue:48, goalPower:50, defensePower:50, winRate:0.30, drawRate:0.26, lossRate:0.44, homeBonus:0.03, isGoalActivator:false, league:"Bundesliga", color:"#005CA9", emoji:"🔵" },
  { id:"BOC", name:"Bochum",             shortName:"BOC", category:"weak",    strengthValue:38, goalPower:42, defensePower:40, winRate:0.23, drawRate:0.27, lossRate:0.50, homeBonus:0.03, isGoalActivator:false, league:"Bundesliga", color:"#005CA9", emoji:"🔵" },
];

// ── Ligue 1 teams (Virtual) ───────────────────────────────────
export const LIGUE1_TEAMS: Team[] = [
  { id:"PSG", name:"Paris Saint-Germain", shortName:"PSG", category:"strong",  strengthValue:96, goalPower:93, defensePower:84, winRate:0.67, drawRate:0.16, lossRate:0.17, homeBonus:0.08, isGoalActivator:true,  league:"Ligue1", color:"#004170", emoji:"🔵" },
  { id:"OM",  name:"Olympique Marseille", shortName:"OM",  category:"strong",  strengthValue:82, goalPower:78, defensePower:76, winRate:0.52, drawRate:0.21, lossRate:0.27, homeBonus:0.06, isGoalActivator:true,  league:"Ligue1", color:"#2FA1DC", emoji:"🔵" },
  { id:"LYO", name:"Lyon",               shortName:"LYO", category:"strong",  strengthValue:78, goalPower:76, defensePower:72, winRate:0.50, drawRate:0.21, lossRate:0.29, homeBonus:0.05, isGoalActivator:false, league:"Ligue1", color:"#021D83", emoji:"🔵" },
  { id:"MON", name:"AS Monaco",          shortName:"MON", category:"strong",  strengthValue:76, goalPower:74, defensePower:74, winRate:0.48, drawRate:0.22, lossRate:0.30, homeBonus:0.06, isGoalActivator:false, league:"Ligue1", color:"#E2002A", emoji:"🔴" },
  { id:"LOS", name:"Lille",              shortName:"LOS", category:"balance", strengthValue:68, goalPower:68, defensePower:66, winRate:0.43, drawRate:0.23, lossRate:0.34, homeBonus:0.04, isGoalActivator:false, league:"Ligue1", color:"#E2002A", emoji:"🔴" },
  { id:"REN", name:"Rennes",             shortName:"REN", category:"balance", strengthValue:60, goalPower:62, defensePower:58, winRate:0.38, drawRate:0.24, lossRate:0.38, homeBonus:0.04, isGoalActivator:true,  league:"Ligue1", color:"#E2002A", emoji:"🔴" },
  { id:"STR", name:"Strasbourg",         shortName:"STR", category:"balance", strengthValue:54, goalPower:56, defensePower:54, winRate:0.33, drawRate:0.25, lossRate:0.42, homeBonus:0.03, isGoalActivator:false, league:"Ligue1", color:"#D20A13", emoji:"🔴" },
  { id:"NAN", name:"Nantes",             shortName:"NAN", category:"balance", strengthValue:50, goalPower:52, defensePower:52, winRate:0.31, drawRate:0.25, lossRate:0.44, homeBonus:0.03, isGoalActivator:false, league:"Ligue1", color:"#F5B829", emoji:"🟡" },
  { id:"BOR", name:"Bordeaux",           shortName:"BOR", category:"weak",    strengthValue:42, goalPower:44, defensePower:46, winRate:0.25, drawRate:0.27, lossRate:0.48, homeBonus:0.03, isGoalActivator:false, league:"Ligue1", color:"#000000", emoji:"⚫" },
  { id:"MET", name:"Metz",              shortName:"MET", category:"weak",    strengthValue:36, goalPower:38, defensePower:40, winRate:0.20, drawRate:0.28, lossRate:0.52, homeBonus:0.03, isGoalActivator:false, league:"Ligue1", color:"#E2002A", emoji:"🔴" },
];

// ── Eredivisie teams (Virtual) ────────────────────────────────
export const EREDIVISIE_TEAMS: Team[] = [
  { id:"AJX", name:"Ajax",            shortName:"AJX", category:"strong",  strengthValue:84, goalPower:86, defensePower:78, winRate:0.60, drawRate:0.18, lossRate:0.22, homeBonus:0.07, isGoalActivator:true,  league:"Eredivisie", color:"#CC0000", emoji:"🔴" },
  { id:"PSV", name:"PSV Eindhoven",   shortName:"PSV", category:"strong",  strengthValue:82, goalPower:82, defensePower:76, winRate:0.58, drawRate:0.19, lossRate:0.23, homeBonus:0.07, isGoalActivator:true,  league:"Eredivisie", color:"#E4003B", emoji:"🔴" },
  { id:"FEY", name:"Feyenoord",        shortName:"FEY", category:"strong",  strengthValue:80, goalPower:80, defensePower:74, winRate:0.55, drawRate:0.20, lossRate:0.25, homeBonus:0.06, isGoalActivator:false, league:"Eredivisie", color:"#EE161F", emoji:"🔴" },
  { id:"AZ",  name:"AZ Alkmaar",       shortName:"AZ",  category:"strong",  strengthValue:72, goalPower:72, defensePower:68, winRate:0.48, drawRate:0.22, lossRate:0.30, homeBonus:0.05, isGoalActivator:false, league:"Eredivisie", color:"#F97316", emoji:"🟠" },
  { id:"UTR", name:"FC Utrecht",       shortName:"UTR", category:"balance", strengthValue:60, goalPower:60, defensePower:60, winRate:0.40, drawRate:0.23, lossRate:0.37, homeBonus:0.04, isGoalActivator:false, league:"Eredivisie", color:"#0079CF", emoji:"🔵" },
  { id:"TWB", name:"Twente",           shortName:"TWB", category:"balance", strengthValue:56, goalPower:58, defensePower:56, winRate:0.36, drawRate:0.24, lossRate:0.40, homeBonus:0.04, isGoalActivator:false, league:"Eredivisie", color:"#E4003B", emoji:"🔴" },
  { id:"SPA", name:"Sparta Rotterdam", shortName:"SPA", category:"balance", strengthValue:50, goalPower:52, defensePower:52, winRate:0.32, drawRate:0.25, lossRate:0.43, homeBonus:0.03, isGoalActivator:false, league:"Eredivisie", color:"#E4003B", emoji:"🔴" },
  { id:"HEE", name:"Heerenveen",       shortName:"HEE", category:"balance", strengthValue:48, goalPower:50, defensePower:48, winRate:0.30, drawRate:0.25, lossRate:0.45, homeBonus:0.03, isGoalActivator:false, league:"Eredivisie", color:"#0066B3", emoji:"🔵" },
  { id:"GRN", name:"Groningen",        shortName:"GRN", category:"weak",    strengthValue:38, goalPower:40, defensePower:42, winRate:0.22, drawRate:0.27, lossRate:0.51, homeBonus:0.03, isGoalActivator:false, league:"Eredivisie", color:"#0066B3", emoji:"🔵" },
  { id:"VIT", name:"Vitesse",          shortName:"VIT", category:"weak",    strengthValue:34, goalPower:36, defensePower:38, winRate:0.20, drawRate:0.28, lossRate:0.52, homeBonus:0.02, isGoalActivator:false, league:"Eredivisie", color:"#6ABDEC", emoji:"🔵" },
];

export const ALL_LEAGUES = [
  { id: "EPL",        name: "Premier League", teams: EPL_TEAMS },
  { id: "LaLiga",     name: "La Liga",        teams: LALIGA_TEAMS },
  { id: "SerieA",     name: "Serie A",        teams: SERIEA_TEAMS },
  { id: "Bundesliga", name: "Bundesliga",     teams: BUNDESLIGA_TEAMS },
  { id: "Ligue1",     name: "Ligue 1",         teams: LIGUE1_TEAMS },
  { id: "Eredivisie", name: "Eredivisie",     teams: EREDIVISIE_TEAMS },
];

// ── Key H2H matchup modifiers ──────────────────────────────
export const H2H_MODIFIERS: Record<string, Partial<H2HRecord>> = {
  "ARS-EVE": { over25Prob: 0.72, bttsProb: 0.70 },
  "EVE-ARS": { over25Prob: 0.70, bttsProb: 0.68 },
  "MNC-ARS": { over25Prob: 0.68, bttsProb: 0.65 },
  "ARS-MNC": { over25Prob: 0.67, bttsProb: 0.64 },
  "EVE-MNC": { over25Prob: 0.65, bttsProb: 0.62 },
  "MNC-EVE": { over25Prob: 0.68, bttsProb: 0.64 },
  "WOL-MNC": { over25Prob: 0.55, bttsProb: 0.50 },
  "LIV-SOU": { over25Prob: 0.70, bttsProb: 0.55 },
  "ASV-MNC": { over25Prob: 0.62, bttsProb: 0.58 },
  "BOU-EVE": { over25Prob: 0.65, bttsProb: 0.65 },
  "EVE-BRI": { over25Prob: 0.68, bttsProb: 0.60 },
  "EVE-SOU": { over25Prob: 0.64, bttsProb: 0.58 },
  "MNC-CRY": { over25Prob: 0.72, bttsProb: 0.50 },
  "BUR-MNC": { over25Prob: 0.55, bttsProb: 0.48 },
  "RMA-BAR": { over25Prob: 0.70, bttsProb: 0.68 },
  "BAR-RMA": { over25Prob: 0.68, bttsProb: 0.65 },
  "INT-JUV": { over25Prob: 0.66, bttsProb: 0.64 },
  "JUV-INT": { over25Prob: 0.64, bttsProb: 0.62 },
  "BAY-BVB": { over25Prob: 0.74, bttsProb: 0.72 },
  "BVB-BAY": { over25Prob: 0.72, bttsProb: 0.70 },
  "PSG-OM":  { over25Prob: 0.76, bttsProb: 0.74 },
  "OM-PSG":  { over25Prob: 0.68, bttsProb: 0.66 },
  "AJX-PSV": { over25Prob: 0.70, bttsProb: 0.68 },
  "PSV-AJX": { over25Prob: 0.68, bttsProb: 0.66 },
};