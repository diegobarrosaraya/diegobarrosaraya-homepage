// Zooms the persisted movement drawing to match the page after every navigation.
// The svg survives ClientRouter swaps, so its viewBox, data-focus and .focus still describe the previous page.
import { navigate } from 'astro:transitions/client';
import { areaBySlug } from '../data/work';
import { FULL_VIEWBOX, easeOutExpo, lerpBox, parseViewBox, shouldAnimate, toViewBox, type Box } from '../lib/zoom';

const DURATION = 950;
let frame = 0;

const areaSlug = () => location.pathname.match(/^\/work\/([^/]+)/)?.[1];

function settle(onWorkPage: boolean) {
  if (onWorkPage && matchMedia('(max-width: 880px)').matches)
    document.querySelector('.detail h1')?.scrollIntoView({ block: 'start' });
}

document.addEventListener('astro:page-load', () => {
  const svg = document.querySelector<SVGSVGElement>('#movement');
  if (!svg) return;
  const slug = areaSlug();
  const area = slug ? areaBySlug(slug) : undefined;
  const part = area ? svg.querySelector<SVGGElement>(`.part[data-part="${area.part}"]`) : null;

  if (area) svg.dataset.focus = area.slug; else delete svg.dataset.focus;
  svg.querySelectorAll('.part').forEach((p) => p.classList.toggle('focus', p === part));

  cancelAnimationFrame(frame);
  delete svg.dataset.zooming;
  if (svg.closest('[data-three]')) return settle(!!area); // spike: the 3D view moves its own camera
  const from = parseViewBox(svg.getAttribute('viewBox') ?? toViewBox(FULL_VIEWBOX));
  const to: Box = part?.dataset.viewbox ? parseViewBox(part.dataset.viewbox) : FULL_VIEWBOX;
  if (toViewBox(from) === toViewBox(to)) return; // first load: the server already rendered this state

  const animate = shouldAnimate(matchMedia('(prefers-reduced-motion: reduce)').matches, 'startViewTransition' in document);
  if (!animate) {
    svg.setAttribute('viewBox', toViewBox(to));
    return settle(!!area);
  }
  svg.dataset.zooming = ''; // keeps the clip on while zooming out, after data-focus is gone
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / DURATION);
    svg.setAttribute('viewBox', toViewBox(lerpBox(from, to, easeOutExpo(t))));
    if (t < 1) frame = requestAnimationFrame(step);
    else { delete svg.dataset.zooming; settle(!!area); }
  };
  frame = requestAnimationFrame(step);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !e.defaultPrevented && document.querySelector('#movement[data-focus]')) navigate('/');
});
