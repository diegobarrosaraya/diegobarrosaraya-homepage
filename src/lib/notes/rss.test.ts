import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderRss, type FeedItem } from './rss';

const item = (over: Partial<FeedItem>): FeedItem => ({ title: 'T', slug: 's', description: 'D', updated: '2026-01-01', ...over });
const site = 'https://example.com';

test('the feed is RSS 2.0 XML with the notes link', () => {
  const xml = renderRss([], site);
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.match(xml, /<rss version="2\.0"/);
  assert.match(xml, /<link>https:\/\/example\.com\/notes\/<\/link>/);
  assert.doesNotMatch(xml, /<item>/);
});

test('titles and descriptions escape &, < and >', () => {
  const xml = renderRss([item({ title: 'Fish & <chips>', description: 'a > b & c' })], site);
  assert.match(xml, /<title>Fish &amp; &lt;chips&gt;<\/title>/);
  assert.match(xml, /<description>a &gt; b &amp; c<\/description>/);
  assert.doesNotMatch(xml, /<chips>/);
});

test('items are ordered newest first', () => {
  const xml = renderRss([
    item({ slug: 'old', updated: '2026-01-02' }),
    item({ slug: 'new', updated: '2026-09-30' }),
    item({ slug: 'mid', updated: '2026-05-11' }),
  ], site);
  const order = ['new', 'mid', 'old'].map((s) => xml.indexOf(`/notes/${s}/`));
  assert.ok(order.every((i) => i > 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test('each item links to its page and dates use RFC 822', () => {
  const xml = renderRss([item({ slug: 'a-note', updated: '2026-08-14' })], `${site}/`);
  assert.match(xml, /<link>https:\/\/example\.com\/notes\/a-note\/<\/link>/);
  assert.match(xml, /<guid isPermaLink="true">https:\/\/example\.com\/notes\/a-note\/<\/guid>/);
  assert.match(xml, /<pubDate>Fri, 14 Aug 2026 00:00:00 GMT<\/pubDate>/);
});
