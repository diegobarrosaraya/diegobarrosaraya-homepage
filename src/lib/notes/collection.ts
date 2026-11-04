import { getCollection, type CollectionEntry } from 'astro:content';
import { noteFileCount } from './note-files';

export interface NoteSummary { slug: string; title: string; description: string; updated: string; created?: string; tags: string[] }

// Skip getCollection when there are no note files, so a build with no notes does not log an
// "empty collection" warning for every page that lists notes. astro.config.ts uses the same count.
export async function noteEntries(): Promise<CollectionEntry<'notes'>[]> {
  return noteFileCount() > 0 ? getCollection('notes') : [];
}

// Every note, newest first; ties keep a stable order by title.
export async function allNotes(): Promise<NoteSummary[]> {
  return (await noteEntries())
    .map((e) => ({ slug: e.id, ...e.data }))
    .sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title));
}
