import { getCollection, type CollectionEntry } from 'astro:content';

export interface NoteSummary { slug: string; title: string; description: string; updated: string; created?: string; tags: string[] }

// The sync may leave the folder with only .gitkeep. Skip getCollection then, so a build with no notes
// does not log an "empty collection" warning for every page that lists notes.
const hasNoteFiles = Object.keys(import.meta.glob('/src/content/notes/*.md')).length > 0;

export async function noteEntries(): Promise<CollectionEntry<'notes'>[]> {
  return hasNoteFiles ? getCollection('notes') : [];
}

// Every note, newest first; ties keep a stable order by title.
export async function allNotes(): Promise<NoteSummary[]> {
  return (await noteEntries())
    .map((e) => ({ slug: e.id, ...e.data }))
    .sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title));
}
