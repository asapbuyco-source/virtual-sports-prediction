import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = 'data';
const TEAM_STATS_PATH = 'data/team_stats.json';

async function checkData() {
  console.log('Checking data files...');

  try {
    await fs.access(TEAM_STATS_PATH);
    const stats = await fs.readFile(TEAM_STATS_PATH, 'utf8');
    const data = JSON.parse(stats);

    if (!data.leagues || Object.keys(data.leagues).length === 0) {
      console.warn('team_stats.json is empty or invalid, regenerating...');
      await regenerateStats();
      return;
    }

    console.log(`team_stats.json OK (${Object.keys(data.leagues).length} leagues)`);
  } catch {
    console.warn('team_stats.json not found or invalid, regenerating...');
    await regenerateStats();
  }
}

async function regenerateStats() {
  try {
    const { execSync } = await import('child_process');
    console.log('Running: node scripts/process_stats.js');
    execSync('node scripts/process_stats.js', { stdio: 'inherit' });
  } catch {
    console.error('Failed to regenerate team_stats.json');
    process.exit(1);
  }
}

checkData();