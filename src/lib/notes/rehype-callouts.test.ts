import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rehypeCallouts, type HastElement, type HastNode, type HastRoot } from './rehype-callouts';

const text = (value: string): HastNode => ({ type: 'text', value });
const el = (tagName: string, children: HastNode[], properties: Record<string, unknown> = {}): HastElement =>
  ({ type: 'element', tagName, properties, children });
// What remark-rehype gives for `> [!warning] Careful\n> Body line.`
const blockquote = (first: string, ...rest: HastNode[]) =>
  el('blockquote', [text('\n'), el('p', [text(first)]), ...rest, text('\n')]);
const run = (...children: HastNode[]): HastRoot => {
  const tree: HastRoot = { type: 'root', children };
  rehypeCallouts()(tree);
  return tree;
};
const elements = (nodes: HastNode[]) => nodes.filter((n): n is HastElement => n.type === 'element');
const textOf = (n: HastNode): string => (n.type === 'text' ? n.value : 'children' in n ? n.children.map(textOf).join('') : '');

test('a [!warning] blockquote becomes an aside with a title paragraph', () => {
  const tree = run(blockquote('[!warning] Careful'));
  const aside = tree.children[0] as HastElement;
  assert.equal(aside.tagName, 'aside');
  assert.deepEqual(aside.properties.className, ['callout', 'callout-warning']);
  const [title] = elements(aside.children);
  assert.equal(title.tagName, 'p');
  assert.deepEqual(title.properties.className, ['callout-title']);
  assert.equal(textOf(title), 'Careful');
});

test('body text on the lines after the marker stays in the aside, after the title', () => {
  const tree = run(blockquote('[!note] Heads up\nThe body line.', el('p', [text('Second paragraph.')])));
  const parts = elements((tree.children[0] as HastElement).children);
  assert.deepEqual(parts.map(textOf), ['Heads up', 'The body line.', 'Second paragraph.']);
  assert.deepEqual(parts.map((p) => p.tagName), ['p', 'p', 'p']);
});

test('inline markup in the title and body is kept', () => {
  const quote = el('blockquote', [el('p', [text('[!tip] Use '), el('code', [text('-e')]), text(' always\nThen '), el('em', [text('check')])])]);
  const parts = elements((run(quote).children[0] as HastElement).children);
  assert.equal(textOf(parts[0]), 'Use -e always');
  assert.equal(elements(parts[0].children)[0].tagName, 'code');
  assert.equal(textOf(parts[1]), 'Then check');
  assert.equal(elements(parts[1].children)[0].tagName, 'em');
});

test('a callout with no title shows its type name in sentence case', () => {
  const tree = run(blockquote('[!INFO]\nOnly a body.'));
  const aside = tree.children[0] as HastElement;
  assert.deepEqual(aside.properties.className, ['callout', 'callout-info']);
  assert.deepEqual(elements(aside.children).map(textOf), ['Info', 'Only a body.']);
});

test('the fold markers + and - are dropped', () => {
  const aside = run(blockquote('[!example]- Folded')).children[0] as HastElement;
  assert.deepEqual(aside.properties.className, ['callout', 'callout-example']);
  assert.equal(textOf(elements(aside.children)[0]), 'Folded');
});

test('a plain blockquote is unchanged', () => {
  const before = blockquote('Just a quote [!not] a marker.');
  const tree = run(structuredClone(before));
  assert.deepEqual(tree.children[0], before);
});

test('a callout nested inside a list item is converted too', () => {
  const tree = run(el('ul', [el('li', [blockquote('[!warning] Inside')])]));
  const li = elements((tree.children[0] as HastElement).children)[0];
  assert.equal(elements(li.children)[0].tagName, 'aside');
});
