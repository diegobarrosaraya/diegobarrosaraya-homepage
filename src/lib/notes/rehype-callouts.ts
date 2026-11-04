// Turns Obsidian callouts (`> [!type] Title`) into quiet asides.
// Minimal hast types, so the plugin needs no extra dependency.
export interface HastText { type: 'text'; value: string }
export interface HastElement { type: 'element'; tagName: string; properties: Record<string, unknown>; children: HastNode[] }
export interface HastRoot { type: 'root'; children: HastNode[] }
export type HastNode = HastText | HastElement | HastRoot | { type: 'comment' | 'doctype' | 'raw'; value?: string };

const MARKER = /^\s*\[!([A-Za-z0-9-]+)\][+-]?[ \t]*/;

const isElement = (n: HastNode, tag?: string): n is HastElement => n.type === 'element' && (!tag || n.tagName === tag);
const isBlank = (n: HastNode) => n.type === 'text' && !n.value.trim();
const p = (children: HastNode[], className?: string[]): HastElement =>
  ({ type: 'element', tagName: 'p', properties: className ? { className } : {}, children });

// Splits a paragraph's children at the first newline in a text node: the title line, then the rest.
function splitFirstLine(children: HastNode[]): [HastNode[], HastNode[]] {
  for (let i = 0; i < children.length; i++) {
    const n = children[i];
    if (n.type !== 'text' || !n.value.includes('\n')) continue;
    const cut = n.value.indexOf('\n');
    const head = n.value.slice(0, cut).trimEnd();
    const tail = n.value.slice(cut + 1);
    return [
      [...children.slice(0, i), ...(head ? [{ type: 'text', value: head } as HastText] : [])],
      [...(tail ? [{ type: 'text', value: tail } as HastText] : []), ...children.slice(i + 1)],
    ];
  }
  return [children, []];
}

function toCallout(quote: HastElement): HastElement | undefined {
  const firstIndex = quote.children.findIndex((n) => !isBlank(n));
  const first = quote.children[firstIndex];
  if (!first || !isElement(first, 'p')) return;
  const lead = first.children[0];
  const m = lead?.type === 'text' ? lead.value.match(MARKER) : null;
  if (!m || lead.type !== 'text') return;
  const type = m[1].toLowerCase();
  const rest = lead.value.slice(m[0].length);
  const [titleNodes, bodyNodes] = splitFirstLine([...(rest ? [{ type: 'text', value: rest } as HastText] : []), ...first.children.slice(1)]);
  const title = titleNodes.length ? titleNodes : [{ type: 'text', value: type[0].toUpperCase() + type.slice(1) } as HastText];
  const body = bodyNodes.some((n) => !isBlank(n)) ? [p(bodyNodes)] : [];
  return {
    type: 'element', tagName: 'aside', properties: { className: ['callout', `callout-${type}`] },
    children: [p(title, ['callout-title']), ...body, ...quote.children.slice(firstIndex + 1)],
  };
}

function walk(node: HastNode) {
  if (!('children' in node)) return;
  node.children = node.children.map((child) => (isElement(child, 'blockquote') && toCallout(child)) || child);
  node.children.forEach(walk);
}

export function rehypeCallouts(): (tree: HastRoot) => void {
  return (tree) => walk(tree);
}
