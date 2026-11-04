export interface Problem {
  rule: 'deny-path' | 'private-term' | 'day-job-word' | 'embed' | 'plugin-block'
      | 'extra-h1' | 'missing-field' | 'missing-date' | 'slug' | 'image-missing' | 'bad-frontmatter'
      | 'indented-code' | 'image-collision' | 'ambiguous-link' | 'unpublished-link' | 'image-denied';
  where: string;       // note path, plus field name for frontmatter fields
  line?: number;       // 1-based; the body line from transformBody, the vault-file line from syncVault
}

export interface ParsedNote {
  relPath: string; title: string; description: string; tags: string[];
  created?: string; updated: string; body: string; publish: boolean; draft: boolean;
}
