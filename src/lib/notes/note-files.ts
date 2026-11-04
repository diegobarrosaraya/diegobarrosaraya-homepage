import { existsSync, readdirSync } from 'node:fs';

// The folder the sync writes and the notes collection reads (glob `*.md`), relative to the repo root.
export const NOTES_DIR = 'src/content/notes';

// How many notes the build will see. The sync may leave the folder with only .gitkeep.
export function noteFileCount(dir = NOTES_DIR): number {
  return existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).length : 0;
}
