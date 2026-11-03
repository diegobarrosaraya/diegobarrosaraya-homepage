// @ts-nocheck -- spike: no @types/three installed.
// Throwaway spike: the movement drawn in three.js, mounted over the static SVG in its persisted stage.
// Ported from the standalone prototype (movement-3d/index.html), without orbit controls, sliders or speed.
import * as THREE from 'three';
import { AREAS, areaBySlug } from '../data/work';
import { easeOutExpo } from '../lib/zoom';

const root = document.documentElement;
const css = (n: string) => getComputedStyle(root).getPropertyValue(n).trim();
const areaSlug = () => location.pathname.match(/^\/work\/([^/]+)/)?.[1];

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // throws without WebGL: caller leaves the SVG alone
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
const canvas = renderer.domElement;
canvas.className = 'mv3d-canvas';
canvas.setAttribute('aria-hidden', 'true');
const labelsEl = document.createElement('div');
labelsEl.className = 'mv3d-labels';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 1, 5000);
camera.up.set(0, 0, 1);

const mats = { fill: [], line: [] };
const fillMat = () => { const m = new THREE.MeshBasicMaterial({ color: css('--plate'), polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, transparent: true }); mats.fill.push(m); return m; };
const lineMat = () => { const m = new THREE.LineBasicMaterial({ color: css('--ink'), transparent: true }); mats.line.push(m); return m; };

function drawn(geo, angle = 25) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, fillMat()), new THREE.LineSegments(new THREE.EdgesGeometry(geo, angle), lineMat()));
  return g;
}
const extrude = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 });

function gearShape(z, m, { spokes = 0, hub = 0.18, rim = 0.8, bore = 0 } = {}) {
  const r = m * z / 2, ra = r + m, rf = r - 1.25 * m;
  const s = new THREE.Shape();
  for (let i = 0; i < z; i++) {
    const a = i / z * Math.PI * 2, p = Math.PI * 2 / z;
    const pts = [[a, rf], [a + p * .12, rf], [a + p * .25, ra], [a + p * .5, ra], [a + p * .63, rf], [a + p, rf]];
    pts.forEach(([t, rr], j) => { const x = Math.cos(t) * rr, y = Math.sin(t) * rr; (i === 0 && j === 0) ? s.moveTo(x, y) : s.lineTo(x, y); });
  }
  if (spokes) {
    const ri = rf * rim, rh = rf * hub + m, gap = 0.22;
    for (let k = 0; k < spokes; k++) {
      const a0 = k / spokes * Math.PI * 2 + gap, a1 = (k + 1) / spokes * Math.PI * 2 - gap;
      const h = new THREE.Path(); h.absarc(0, 0, ri, a0, a1, false);
      h.lineTo(Math.cos(a1 - gap * .4) * rh * 1.6, Math.sin(a1 - gap * .4) * rh * 1.6);
      h.absarc(0, 0, rh * 1.6, a1 - gap * .4, a0 + gap * .4, true); h.closePath(); s.holes.push(h);
    }
  }
  if (bore) { const h = new THREE.Path(); h.absarc(0, 0, bore, 0, Math.PI * 2, true); s.holes.push(h); }
  return s;
}
const wheel = (z, m, depth, opts) => drawn(extrude(gearShape(z, m, opts), depth));
const pinion = (z, m, len) => drawn(extrude(gearShape(z, m, {}), len), 30);
function disc(r, depth, holeR = 0) {
  const s = new THREE.Shape(); s.absarc(0, 0, r, 0, Math.PI * 2, false);
  if (holeR) { const h = new THREE.Path(); h.absarc(0, 0, holeR, 0, Math.PI * 2, true); s.holes.push(h); }
  return drawn(extrude(s, depth));
}
function arbor(len, r = 1.6) { const g = new THREE.CylinderGeometry(r, r, len, 12); g.rotateX(Math.PI / 2); g.translate(0, 0, len / 2); return drawn(g, 40); }
const spiralLine = (n, turns, r0, r1, z) => {
  const pts = []; for (let i = 0; i <= n; i++) { const t = i / n, a = t * turns * Math.PI * 2, r = r0 + r1 * t; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z)); }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat());
};

// ---------- the train (module m, real tooth counts) ----------
const m = 1.25;
const T = { barrel: 72, cPin: 10, center: 80, tPin: 8, third: 75, fPin: 8, fourth: 80, ePin: 7, escape: 15 };
const dist = (a, b) => m * (a + b) / 2;
const place = (from, d, ang) => new THREE.Vector2(from.x + Math.cos(ang) * d, from.y + Math.sin(ang) * d);
const P: Record<string, THREE.Vector2> = { barrel: new THREE.Vector2(-70, -40) };
P.center = place(P.barrel, dist(T.barrel, T.cPin), 0.35);
P.third = place(P.center, dist(T.center, T.tPin), 1.05);
P.fourth = place(P.third, dist(T.third, T.fPin), 0.15);
P.escape = place(P.fourth, dist(T.fourth, T.ePin), -0.65);
P.balance = place(P.escape, 46, -1.55);
P.fork = new THREE.Vector2((P.escape.x + P.balance.x) / 2 + 4, (P.escape.y + P.balance.y) / 2);
{ const c = new THREE.Vector2(); const ks = Object.keys(P); ks.forEach((k) => c.add(P[k])); c.divideScalar(ks.length); ks.forEach((k) => P[k].sub(c)); }

// `site` is the PartId in work.ts this 3D part belongs to (train = centre, third and fourth; escape = escape wheel and fork).
const parts = [];
function part(id, site, pos, baseZ, build) {
  const g = new THREE.Group(); g.position.set(pos.x, pos.y, baseZ);
  const spin = new THREE.Group(); g.add(spin); build(spin);
  scene.add(g);
  const p = { id, site, g, spin, baseZ }; parts.push(p); return p;
}
const holes = ['barrel', 'center', 'third', 'fourth', 'escape', 'balance'];
const plate = part('plate', 'plate', new THREE.Vector2(0, 0), -10, (s) => {
  const sh = new THREE.Shape(); sh.absarc(0, 0, 132, 0, Math.PI * 2, false);
  for (const k of holes) { const h = new THREE.Path(); h.absarc(P[k].x, P[k].y, 4, 0, Math.PI * 2, true); sh.holes.push(h); }
  s.add(drawn(extrude(sh, 6)));
  for (const k of holes) { const j = disc(6.5, 1.2, 4); j.position.set(P[k].x, P[k].y, 6); s.add(j); }
});
const barrel = part('barrel', 'barrel', P.barrel, 4, (s) => {
  s.add(wheel(T.barrel, m, 3, { bore: 0 }));
  const drum = disc(m * T.barrel / 2 - 3, 14, m * T.barrel / 2 - 5); drum.position.z = 3; s.add(drum);
  s.add(spiralLine(420, 9, 6, 34, 9));
  s.add(arbor(22, 4));
});
const center = part('center', 'train', P.center, 24, (s) => { s.add(wheel(T.center, m, 2.2, { spokes: 4 })); s.add(pinion(T.cPin, m, -18)); s.add(arbor(10)); });
const third = part('third', 'train', P.third, 30, (s) => { s.add(wheel(T.third, m * .8, 2, { spokes: 5 })); s.add(pinion(T.tPin, m, -24)); s.add(arbor(8)); });
const fourth = part('fourth', 'train', P.fourth, 36, (s) => { s.add(wheel(T.fourth, m * .7, 2, { spokes: 5 })); s.add(pinion(T.fPin, m * .8, -30)); s.add(arbor(8)); });
const escape = part('escape', 'escape', P.escape, 42, (s) => {
  const sh = new THREE.Shape(), R = 16, r = 11;
  for (let i = 0; i < T.escape; i++) {
    const a = i / T.escape * Math.PI * 2, p = Math.PI * 2 / T.escape;
    [[a, r], [a + p * .15, R], [a + p * .35, R - 1], [a + p, r]].forEach(([t, rr], j) => { const x = Math.cos(t) * rr, y = Math.sin(t) * rr; (i === 0 && j === 0) ? sh.moveTo(x, y) : sh.lineTo(x, y); });
  }
  const h = new THREE.Path(); h.absarc(0, 0, 7, 0, Math.PI * 2, true); sh.holes.push(h);
  s.add(drawn(extrude(sh, 1.6))); s.add(pinion(T.ePin, m * .7, -36)); s.add(arbor(6));
});
const fork = part('fork', 'escape', P.fork, 46, (s) => {
  const sh = new THREE.Shape();
  sh.moveTo(-14, 6); sh.lineTo(14, 6); sh.lineTo(16, 1); sh.lineTo(3, 2); sh.lineTo(2, -20); sh.lineTo(-2, -20); sh.lineTo(-3, 2); sh.lineTo(-16, 1); sh.closePath();
  s.add(drawn(extrude(sh, 1.4))); s.add(arbor(5, 1.2));
});
const balance = part('balance', 'balance', P.balance, 58, (s) => {
  s.add(disc(30, 3, 26));
  for (let k = 0; k < 3; k++) { const g = new THREE.BoxGeometry(26, 2.4, 2); g.translate(13, 0, 1); const b = drawn(g); b.rotation.z = k / 3 * Math.PI * 2; s.add(b); }
  // smooth screwless rim (modern balance), so it doesn't read as a toothed cog
  const lip = disc(30, 4.4, 28.2); lip.position.z = -0.7; s.add(lip);
  s.add(spiralLine(500, 11, 3, 19, 6)); s.add(arbor(14, 1.4));
});

const axisMat = new THREE.LineDashedMaterial({ color: css('--hair'), dashSize: 2, gapSize: 5, transparent: true });
const axes = parts.filter((p) => p.id !== 'plate').map((p) => {
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(p.g.position.x, p.g.position.y, 0), new THREE.Vector3(p.g.position.x, p.g.position.y, 1)]);
  const l = new THREE.Line(geo, axisMat); scene.add(l); return { p, l };
});

// ---------- kinematics: escape wheel advances half a tooth per balance half-swing, the rest follow by ratio ----------
const ratio = { escape: 1, fourth: -T.ePin / T.fourth };
ratio.third = ratio.fourth * -(T.fPin / T.third);
ratio.center = ratio.third * -(T.tPin / T.center);
ratio.barrel = ratio.center * -(T.cPin / T.barrel);
const phase = { center: 0.02, third: 0.05, fourth: 0.04, escape: 0, barrel: 0.01 };
const train = { escape, fourth, third, center, barrel };
const HZ = 0.6, STEP = Math.PI * 2 / T.escape / 2;
let t = 0;
function tick(dt) {
  t += dt * HZ;
  balance.spin.rotation.z = Math.sin(t * Math.PI * 2) * 4.2;
  const half = Math.floor(t * 2), snap = Math.min(1, (t * 2 - half) * 8);
  const esc = -(half + snap) * STEP;
  fork.spin.rotation.z = (half % 2 ? 1 : -1) * 0.18;
  for (const id in ratio) train[id].spin.rotation.z = esc * ratio[id] + phase[id];
}

// ---------- explode ----------
const EXPLODE = { home: 0.5, focus: 0.7 };
let explode = EXPLODE.home;
function applyExplode(e = explode) {
  for (const p of parts) p.g.position.z = p.baseZ * (0.35 + e * 2.4) - (p.id === 'plate' ? e * 40 : 0);
  for (const { p, l } of axes) {
    const pos = l.geometry.attributes.position;
    pos.setZ(0, plate.g.position.z + 6); pos.setZ(1, p.g.position.z); pos.needsUpdate = true; l.computeLineDistances();
  }
}

// ---------- labels: real links, projected each frame ----------
const callouts = AREAS.map((area) => {
  const p = parts.find((q) => q.id === (area.part === 'train' ? 'center' : area.part));
  const a = document.createElement('a');
  a.className = 'mv3d-callout'; a.href = `/work/${area.slug}/`; a.dataset.part = area.part;
  a.setAttribute('aria-label', `${area.number} ${area.title}`);
  a.innerHTML = `<b>${area.number}</b><span>${area.title}</span>`;
  labelsEl.appendChild(a);
  return { area, p, a };
});

// ---------- camera ----------
const HOME_DIR = new THREE.Vector3(-150, -330, 330).normalize();
const FOCUS_DIR = new THREE.Vector3(-0.45, -0.7, 0.8).normalize();
const LABEL_DX = { balance: 30 }; // world x offset of each label from its part, so 03 and 04 do not collide
const cam = { pos: new THREE.Vector3(), target: new THREE.Vector3() };
let width = 1, height = 1, focusSite = null, tween = null;

const box = new THREE.Box3(), sphere = new THREE.Sphere(), v = new THREE.Vector3();
// Distance that fits a sphere of radius r in both the vertical and horizontal field of view.
function fitDist(r) {
  const vf = THREE.MathUtils.degToRad(camera.fov) / 2, hf = Math.atan(Math.tan(vf) * camera.aspect);
  return r / Math.sin(Math.min(vf, hf));
}
function view(site, e) {
  applyExplode(e); scene.updateMatrixWorld(true);
  box.makeEmpty();
  if (site) parts.filter((p) => p.site === site).forEach((p) => box.expandByObject(p.g));
  else parts.forEach((p) => box.expandByObject(p.g));
  box.getBoundingSphere(sphere);
  applyExplode(); // restore the live value
  const target = sphere.center.clone();
  // The bounding sphere is loose around a flat movement, so it is shrunk to frame the parts, not the sphere.
  const d = fitDist(sphere.radius * (site ? 0.8 : 0.72));
  return { pos: target.clone().addScaledVector(site ? FOCUS_DIR : HOME_DIR, d), target };
}

function setOpacity(p, o) { p.g.traverse((n) => { if (n.material) n.material.opacity = o; }); }
function recolor() {
  const ink = css('--ink'), active = css('--active');
  mats.fill.forEach((mm) => mm.color.set(css('--plate')));
  for (const p of parts) p.g.traverse((n) => { if (n.isLine) n.material.color.set(p.site === focusSite ? active : ink); });
  axisMat.color.set(css('--hair'));
  render();
}

function go(animate) {
  const slug = areaSlug();
  focusSite = (slug && areaBySlug(slug)?.part) || null;
  for (const p of parts) setOpacity(p, !focusSite || p.site === focusSite ? 1 : 0.1);
  axisMat.opacity = focusSite ? 0.12 : 1;
  labelsEl.classList.toggle('focused', !!focusSite);
  for (const c of callouts) c.a.classList.toggle('on', c.area.part === focusSite);
  recolor();
  const toE = focusSite ? EXPLODE.focus : EXPLODE.home;
  const to = view(focusSite, toE);
  start();
  if (!animate) { cam.pos.copy(to.pos); cam.target.copy(to.target); explode = toE; applyExplode(); tween = null; return render(); }
  const fp = cam.pos.clone(), ft = cam.target.clone(), fe = explode, t0 = performance.now();
  tween = (now) => {
    const k = easeOutExpo(Math.min(1, (now - t0) / 950));
    cam.pos.lerpVectors(fp, to.pos, k); cam.target.lerpVectors(ft, to.target, k);
    explode = fe + (toE - fe) * k; applyExplode();
    if (k >= 1) tween = null;
  };
}

// ---------- loop ----------
function render() {
  camera.position.copy(cam.pos); camera.lookAt(cam.target);
  renderer.render(scene, camera);
  for (const { p, a } of callouts) {
    if (p.id === 'plate') v.set(-118, -60, p.g.position.z + 3); // plate edge, not its centre
    else { box.setFromObject(p.g).getCenter(v); v.x += LABEL_DX[p.id] ?? -40; if (p.id === "balance") v.z += 25; }
    v.project(camera);
    const x = Math.min(width - 16, Math.max(16, (v.x * .5 + .5) * width)), y = Math.min(height - 12, Math.max(12, (-v.y * .5 + .5) * height));
    a.style.transform = `translate(${x}px, ${y}px) translate(-11px, -50%)`;
  }
}
let last = 0, visible = true, running = false;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  tick(dt); if (tween) tween(now);
  render();
}
function start() {
  const want = visible && !document.hidden;
  if (want === running) return;
  running = want; last = performance.now();
  renderer.setAnimationLoop(want ? frame : null);
}
document.addEventListener('visibilitychange', start);
const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); });

const ro = new ResizeObserver(([e]) => {
  width = Math.max(1, e.contentRect.width); height = Math.max(1, e.contentRect.height);
  renderer.setSize(width, height, false);
  camera.aspect = width / height; camera.updateProjectionMatrix();
  if (!tween) go(false);
});

new MutationObserver(recolor).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

// Called on every page load: re-attaches to a fresh stage if the persisted one was dropped (a page without the drawing).
export function mount(animate: boolean) {
  const stage = document.querySelector<HTMLElement>('.mv-stage');
  if (!stage) return;
  if (!stage.contains(canvas)) {
    stage.append(canvas, labelsEl);
    stage.dataset.three = '';
    io.disconnect(); io.observe(stage);
    ro.disconnect(); ro.observe(stage);
    animate = false;
  }
  go(animate);
}
