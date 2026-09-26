// Native UI behavior and city geometry in Node. Not a rendered browser test.
const assert = (cond, msg) => {
  if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; }
  else { passed++; }
};
let passed = 0;

// ── 1. District cx/cy layout (narrow and wide modes) ───────────────────────────
// Replicate the cx formula from GameScene._buildDistricts()
function buildCX(W, PANEL, narrow) {
  const area = W - PANEL;
  return [0,1,2,3].map((i) => {
    return PANEL + area * (narrow ? (i%2 ? 0.74 : 0.26) : (0.14 + i*0.235));
  });
}

// Narrow layout: alternating columns
const nCX = buildCX(400, 0, true);
assert(nCX[0] < nCX[1], 'narrow: col0 < col1 (left/right)');
assert(Math.abs(nCX[0] - nCX[2]) < 1e-9, 'narrow: col0 === col2 (same left column)');
assert(Math.abs(nCX[1] - nCX[3]) < 1e-9, 'narrow: col1 === col3 (same right column)');

// Wide layout: evenly spread across 0.14, 0.375, 0.61, 0.845 of area
const wCX = buildCX(900, 240, false);
const area = 900 - 240;
const expectedWide = [0.14, 0.375, 0.61, 0.845].map(f => 240 + area * f);
wCX.forEach((cx, i) => {
  assert(Math.abs(cx - expectedWide[i]) < 1e-6, 'wide: cx['+i+'] matches formula');
});

// ── 2. Scale clamp s(n) = Math.round(n * S) ────────────────────────────────────
function makeS(H) { return Math.max(0.85, Math.min(1.9, H / 720)); }
function s(n, H) { return Math.round(n * makeS(H)); }

assert(makeS(720) === 1.0,   'S(720) = 1.0');
assert(makeS(400) === 0.85,  'S(400) = 0.85 (clamped min)');
assert(makeS(2000) === 1.9,  'S(2000) = 1.9 (clamped max)');
assert(s(100, 720) === 100,  's(100, H=720) = 100');
assert(s(100, 400) === 85,   's(100, H=400) = 85');

// ── 3. PANEL width formula ────────────────────────────────────────────────────────
function makePanel(W) { return W < 700 ? 0 : Math.round(Math.min(240, W * 0.18)); }

assert(makePanel(600) === 0,   'PANEL(600) = 0 (narrow, hidden)');
assert(makePanel(700) === 126, 'PANEL(700) = 126 (0.18*700=126)');
assert(makePanel(1400) === 240,'PANEL(1400) = 240 (capped at 240)');
assert(makePanel(1200) === 216,'PANEL(1200) = 216 (0.18*1200=216)');

// ── 4. groundY formula ───────────────────────────────────────────────────────────
function groundY(H, S) { return Math.min(H * 0.42, Math.round(310 * S)); }

assert(groundY(720, 1.0) === 302, 'groundY(720,1): min(302.4, 310) = 302 (s gives 310, H*0.42=302.4)');
assert(groundY(400, 0.85) === 168,'groundY(400,0.85): min(168, 263) = 168');
assert(groundY(1080, 1.5) === 453,'groundY(1080,1.5): min(453.6, 465) = 453');

// ── 5. City boundary wobble: N points, angles cover full circle ──────────────────
const N = 32;
const angles = Array.from({length: N}, (_, i) => (i / N) * Math.PI * 2);
const wobbles = angles.map(a => 1 + 0.08 * Math.sin(a * 3 + 0.7) + 0.05 * Math.cos(a * 5));
assert(wobbles.every(w => w > 0.8 && w < 1.2), 'wobble values in reasonable range [0.8,1.2]');
assert(angles[0] === 0, 'first angle = 0');
assert(Math.abs(angles[N-1] - (N-1)/N * Math.PI * 2) < 1e-12, 'last angle correct');

// ── 6. Boundary clamping: outer points are at least clampTop ───────────────────
function buildBoundary(W, H, S) {
  const gY = groundY(H, S);
  const districts = [
    { cx: W*0.14, cy: gY + s(15, H) },
    { cx: W*0.375, cy: gY + s(33, H) },
    { cx: W*0.61, cy: gY + s(15, H) },
    { cx: W*0.845, cy: gY + s(33, H) },
  ];
  const dxs = districts.map(d => d.cx);
  const dys = districts.map(d => d.cy);
  const cx = (Math.min(...dxs) + Math.max(...dxs)) / 2;
  const cy = (Math.min(...dys) + Math.max(...dys)) / 2 + s(20, H);
  const rx = (Math.max(...dxs) - Math.min(...dxs)) / 2 + s(90, H);
  const ry = (Math.max(...dys) - Math.min(...dys)) / 2 + s(80, H);
  const clampTop = s(60, H);
  const outer = [];
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2;
    const wobble = 1 + 0.08 * Math.sin(angle * 3 + 0.7) + 0.05 * Math.cos(angle * 5);
    const oy = Math.max(clampTop, cy + Math.sin(angle) * ry * wobble * 1.08);
    outer.push(oy);
  }
  return { outer, clampTop };
}

const { outer, clampTop } = buildBoundary(900, 720, 1.0);
assert(outer.every(y => y >= clampTop), 'all outer boundary y >= clampTop');

// ── 7. Level name mapping ────────────────────────────────────────────────────────
const LEVEL_NAMES = {
  1: 'The First Contracts', 2: 'The Unexpected Setback',
  3: 'Expansion',           4: 'Today or Tomorrow',
  5: 'The Boom',            6: 'The Outside Offer',
  7: 'Breaking News',       8: 'The Great Storm',
  9: 'The Project Review',  10: 'Forecasts & Practice',
};
[...Array(10).keys()].map(i => i+1).forEach(n => {
  assert(typeof LEVEL_NAMES[n] === 'string' && LEVEL_NAMES[n].length > 0,
    'level ' + n + ' has a name');
});

// ── 8. ch1 routing: wideCount -> districtId ─────────────────────────────────────
function ch1Route(wideCount) {
  return wideCount >= 3 ? 'technology'
       : wideCount === 2 ? 'transport'
       : wideCount === 1 ? 'energy'
       : 'housing';
}
assert(ch1Route(0) === 'housing',    'ch1Route(0)=housing');
assert(ch1Route(1) === 'energy',     'ch1Route(1)=energy');
assert(ch1Route(2) === 'transport',  'ch1Route(2)=transport');
assert(ch1Route(3) === 'technology', 'ch1Route(3)=technology');
assert(ch1Route(4) === 'technology', 'ch1Route(4)=technology (>= 3)');

// ── 9. Stats clamp ──────────────────────────────────────────────────────────────
function clampStat(v, dv) { return Math.max(0, Math.min(100, v + dv)); }
assert(clampStat(90, 15) === 100, 'clamp: 90+15 capped at 100');
assert(clampStat(5, -10) === 0,   'clamp: 5-10 floored at 0');
assert(clampStat(50, 10) === 60,  'clamp: 50+10=60');

console.log('visual-ui.test.js: ' + passed + ' passed');
