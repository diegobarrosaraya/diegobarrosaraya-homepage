import type { HastElement, HastNode, HastRoot } from './rehype-callouts';

const isDiagram = (n: HastNode): n is HastElement =>
  n.type === 'element' && n.tagName === 'svg' && String(n.properties.id ?? '').startsWith('mermaid');

// rehype-mermaid sizes each SVG to fit its column, which shrinks a wide diagram's text to a few pixels
// on a phone. Draw it at its natural width instead, inside a figure that scrolls sideways when needed.
export function rehypeDiagramFrame(): (tree: HastRoot) => void {
  return (tree) => {
    tree.children = tree.children.map((n) => {
      if (!isDiagram(n)) return n;
      const natural = String(n.properties.style ?? '').match(/max-width:\s*([\d.]+px)/)?.[1];
      if (natural) n.properties.style = `max-width: none; width: ${natural};`;
      return { type: 'element', tagName: 'figure', properties: { className: ['diagram'] }, children: [n] };
    });
  };
}
