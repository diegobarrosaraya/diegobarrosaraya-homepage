import type { APIRoute } from 'astro';
import { allNotes } from '../../lib/notes/collection';
import { renderRss } from '../../lib/notes/rss';

export const GET: APIRoute = async ({ site }) =>
  new Response(renderRss(await allNotes(), String(site)), { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
