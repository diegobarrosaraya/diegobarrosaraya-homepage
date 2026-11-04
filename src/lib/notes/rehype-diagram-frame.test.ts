import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rehypeDiagramFrame } from './rehype-diagram-frame';
import type { HastElement, HastRoot } from './rehype-callouts';

const svg = (id: string, style?: string): HastElement =>
  ({ type: 'element', tagName: 'svg', properties: { id, ...(style ? { style } : {}) }, children: [] });

test('a mermaid SVG is wrapped in a diagram figure and drawn at its natural width', () => {
  const tree: HastRoot = { type: 'root', children: [svg('mermaid-0', 'max-width: 885.5px;')] };
  rehypeDiagramFrame()(tree);
  const figure = tree.children[0] as HastElement;
  assert.equal(figure.tagName, 'figure');
  assert.deepEqual(figure.properties.className, ['diagram']);
  const inner = figure.children[0] as HastElement;
  assert.equal(inner.properties.id, 'mermaid-0');
  assert.equal(inner.properties.style, 'max-width: none; width: 885.5px;');
});

test('other SVGs and elements are left alone', () => {
  const other = svg('logo');
  const tree: HastRoot = { type: 'root', children: [other, { type: 'text', value: '\n' }] };
  rehypeDiagramFrame()(tree);
  assert.equal(tree.children[0], other);
});
