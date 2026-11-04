export interface Problem {
  rule: 'deny-path' | 'private-term' | 'day-job-word' | 'embed' | 'plugin-block'
      | 'extra-h1' | 'missing-field' | 'missing-date' | 'slug' | 'image-missing' | 'bad-frontmatter';
  where: string;       // note path, plus field name for frontmatter fields
  line?: number;       // 1-based line in the body when known
}

export interface ParsedNote {
  relPath: string; title: string; description: string; tags: string[];
  created?: string; updated: string; body: string; publish: boolean; draft: boolean;
}
