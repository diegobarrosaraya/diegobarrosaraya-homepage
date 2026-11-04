export interface FeedItem { title: string; slug: string; description: string; updated: string }

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// RSS 2.0 for /notes/rss.xml. `updated` is an ISO date (YYYY-MM-DD); items run newest first.
export function renderRss(items: FeedItem[], site: string): string {
  const base = site.replace(/\/+$/, '');
  const notes = `${base}/notes/`;
  const entries = [...items]
    .sort((a, b) => b.updated.localeCompare(a.updated) || a.title.localeCompare(b.title))
    .map((i) => {
      const url = `${notes}${i.slug}/`;
      return [
        '    <item>',
        `      <title>${escape(i.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <description>${escape(i.description)}</description>`,
        `      <pubDate>${new Date(`${i.updated}T00:00:00Z`).toUTCString()}</pubDate>`,
        '    </item>',
      ].join('\n');
    });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>Diego Barros Araya: notes</title>',
    `    <link>${notes}</link>`,
    `    <atom:link href="${notes}rss.xml" rel="self" type="application/rss+xml" />`,
    '    <description>Notes and guides from my own work.</description>',
    '    <language>en</language>',
    ...entries,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
