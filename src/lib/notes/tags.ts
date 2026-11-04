// URL fragment for a tag: lowercase, runs of anything else than a-z and 0-9 become one hyphen.
export function tagSlug(tag: string): string {
  return tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// One unique id per tag (`tag-<slug>`), for the /notes/ groups and the links to them. Tags are taken
// in code-unit order, so a clash ("c", "C", "c++") always gives the same tag the plain id and the
// others `-2`, `-3`. A tag of only symbols is named after the Other group.
export function tagAnchors(tags: Iterable<string>): Map<string, string> {
  const ids = new Map<string, string>();
  const used = new Set<string>();
  for (const tag of [...new Set(tags)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))) {
    const base = `tag-${tagSlug(tag) || 'other'}`;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    ids.set(tag, id);
  }
  return ids;
}
