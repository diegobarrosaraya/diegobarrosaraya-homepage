import { execSync } from 'node:child_process';

export function buildInfo(): { date: string; commit: string } {
  const date = new Date().toISOString().slice(0, 10);
  if (process.env.GITHUB_SHA) return { date, commit: process.env.GITHUB_SHA.slice(0, 7) };
  try {
    const commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    return { date, commit: commit || 'local' };
  } catch {
    return { date, commit: 'local' };
  }
}
