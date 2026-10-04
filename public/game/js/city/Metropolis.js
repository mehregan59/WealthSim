// One continuous isometric metropolis filling the whole canvas.
//
// Everything is drawn by the engine, so it is all mathematically aligned:
// the river, the bridge, the boulevards, the rail line and the side streets
// are polylines, and every car, tram and train travels strictly along one of
// them. No floating islands, no props layered over a photograph.
//
// Scenery only: nothing in here touches decisions, levels or scoring.
class Metropolis {
  constructor(scene) {
    this.scene = scene;
    this.S = scene.S || 1;
    this.t = 0;
    this.night = 0;
    this.reducedMotion = !!scene.reducedMotion;

    this.ground = scene.add.graphics().setDepth(-12);
    this.water = scene.add.graphics().setDepth(-11);
    this.roadGfx = scene.add.graphics().setDepth(-10);
    this.blockGfx = scene.add.graphics().setDepth(-9);
    // Night covers the whole city including district buildings (depth 8);
    // all moving lights (anim) and district windows (10) draw above it.
    this.anim = scene.add.graphics().setDepth(9.5);
    this.dusk = scene.add.graphics().setDepth(9).setAlpha(0);

    this._layout();
    this._drawGround();
    this._drawRiver();
    this._drawRoads();
    this._drawBlocks();
    this._seedTraffic();
    this._seedWalkers();
    this._drawDusk();
  }

  s(v) { return Math.round(v * this.S); }
  get W() { return this.scene.scale.width; }
  get H() { return this.scene.scale.height; }
  ux(u) { const P = this.scene.PANEL || 0; return P + (this.W - P) * u; }
  vy(v) { return this.H * v; }
  p(u, v) { return { x: this.ux(u), y: this.vy(v) }; }

  // ---- layout -------------------------------------------------------------

  _layout() {
    const p = (u, v) => this.p(u, v);

    // The river runs from the north-west corner down to the south, cutting
    // the old town off from the rest of the city until the bridge.
    this.river = [p(0.30, -0.06), p(0.275, 0.20), p(0.245, 0.46), p(0.205, 0.74), p(0.165, 1.06)];
    this.riverW = Math.max(this.s(56), (this.W - (this.scene.PANEL || 0)) * 0.062);

    // Roads. Every one of them is continuous and meets the others.
    this.roads = {
      boulevard: [p(-0.05, 0.665), p(0.10, 0.655), p(0.235, 0.628), p(0.38, 0.598),
                  p(0.52, 0.578), p(0.68, 0.545), p(0.84, 0.505), p(1.05, 0.478)],
      northAve:  [p(0.455, 0.588), p(0.448, 0.470), p(0.436, 0.352), p(0.430, 0.215), p(0.425, -0.05)],
      southAve:  [p(0.605, 0.560), p(0.617, 0.680), p(0.632, 0.800), p(0.650, 1.06)],
      hillRoad:  [p(0.815, 0.512), p(0.848, 0.455), p(0.878, 0.400), p(0.905, 0.345)],
      quay:      [p(0.055, 0.845), p(0.20, 0.838), p(0.36, 0.820), p(0.56, 0.800), p(0.80, 0.780), p(1.05, 0.762)],
      crossSt:   [p(0.36, 0.605), p(0.395, 0.760), p(0.425, 0.905)],
      rail:      [p(-0.05, 0.268), p(0.18, 0.258), p(0.36, 0.248), p(0.52, 0.240), p(0.72, 0.228), p(1.05, 0.215)],
    };

    // Bridge: the boulevard crossing the river.
    this.bridge = { a: p(0.175, 0.640), b: p(0.320, 0.612) };
    // Rail bridge further north.
    this.railBridge = { a: p(0.205, 0.262), b: p(0.345, 0.250) };

    // District anchors — quarters of this same city.
    this.districtPoints = [
      p(0.115, 0.430),  // Housing — west bank old town
      p(0.635, 0.195),  // Transport — moved right and up, clear of the avenue
      p(0.400, 0.820),  // Technology — shifted left into the south-east office streets
      p(0.900, 0.195),  // Energy — solar field lifted farther above the hill road
    ];


  }

  // ---- static painting ----------------------------------------------------

  _drawGround() {
    const g = this.ground, W = this.W, H = this.H;
    g.fillStyle(0x86ab6f, 1); g.fillRect(0, 0, W, H);
    // Distance haze at the top, warmer ground in the foreground.
    g.fillStyle(0xa9c98c, 0.85); g.fillRect(0, 0, W, H * 0.30);
    g.fillStyle(0x9cc083, 0.55); g.fillRect(0, H * 0.28, W, H * 0.14);
    g.fillStyle(0x6f9a63, 0.30); g.fillRect(0, H * 0.78, W, H * 0.22);

    // North-east hills the energy quarter sits on.
    const hill = (u, v, w, h, c, a) => {
      g.fillStyle(c, a);
      g.beginPath();
      g.moveTo(this.ux(u - w), this.vy(v));
      g.lineTo(this.ux(u - w * 0.45), this.vy(v - h));
      g.lineTo(this.ux(u + w * 0.35), this.vy(v - h * 0.9));
      g.lineTo(this.ux(u + w), this.vy(v));
      g.closePath(); g.fillPath();
    };
    hill(0.86, 0.470, 0.26, 0.20, 0x7ba86a, 1);
    hill(0.93, 0.430, 0.20, 0.17, 0x8cb877, 1);
    hill(0.78, 0.440, 0.14, 0.11, 0x93bd7d, 1);

    // Parks and fields so the ground never reads as flat paint.
    const patch = (u, v, rw, rh, c, a) => { g.fillStyle(c, a); g.fillEllipse(this.ux(u), this.vy(v), (this.W) * rw, this.H * rh); };
    patch(0.52, 0.475, 0.09, 0.055, 0x74a566, 0.55);
    patch(0.30, 0.880, 0.10, 0.045, 0x74a566, 0.45);
    patch(0.74, 0.900, 0.12, 0.05, 0x74a566, 0.42);
    patch(0.075, 0.300, 0.07, 0.05, 0x74a566, 0.45);
  }

  _drawRiver() {
    const g = this.water, w = this.riverW;
    const stroke = (width, color, alpha) => {
      g.lineStyle(width, color, alpha);
      g.beginPath(); g.moveTo(this.river[0].x, this.river[0].y);
      for (let i = 1; i < this.river.length; i++) g.lineTo(this.river[i].x, this.river[i].y);
      g.strokePath();
    };
    stroke(w + this.s(14), 0x9aa98a, 1);      // stone embankment
    stroke(w, 0x3f7f96, 1);                   // water
    stroke(w * 0.55, 0x4d90a6, 0.9);
    stroke(w * 0.22, 0x6fb0c2, 0.55);
  }

  _drawRoads() {
    const g = this.roadGfx;
    const line = (pts, width, color, alpha) => {
      g.lineStyle(width, color, alpha);
      g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.strokePath();
    };
    const road = (pts, w) => {
      line(pts, w + this.s(10), 0xcfcdb9, 1);       // pavements
      line(pts, w, 0x4a5658, 1);                    // asphalt
      g.lineStyle(Math.max(1, this.s(1.6)), 0xf0d97f, 0.7);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], steps = 7;
        for (let k = 0; k < steps; k += 2) {
          const t0 = k / steps, t1 = (k + 1) / steps;
          g.lineBetween(a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0,
                        a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1);
        }
      }
    };

    road(this.roads.boulevard, this.s(26));
    road(this.roads.northAve, this.s(22));
    road(this.roads.southAve, this.s(22));
    road(this.roads.quay, this.s(18));
    road(this.roads.crossSt, this.s(14));
    road(this.roads.hillRoad, this.s(14));

    // Rail line with sleepers, on its own embankment.
    line(this.roads.rail, this.s(16), 0x8e9382, 1);
    line(this.roads.rail, this.s(10), 0x6a6f63, 1);
    g.lineStyle(Math.max(1, this.s(1.4)), 0xd8d6c6, 0.85);
    const r = this.roads.rail;
    for (let i = 0; i < r.length - 1; i++) {
      const a = r[i], b = r[i + 1], n = 26;
      for (let k = 0; k < n; k++) {
        const t = k / n, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        g.lineBetween(x, y - this.s(5), x, y + this.s(5));
      }
    }
    g.lineStyle(Math.max(1, this.s(1.6)), 0xe6e3d2, 0.9);
    [-3, 3].forEach(o => {
      g.beginPath(); g.moveTo(r[0].x, r[0].y + this.s(o));
      for (let i = 1; i < r.length; i++) g.lineTo(r[i].x, r[i].y + this.s(o));
      g.strokePath();
    });

    this._drawBridge(this.bridge, this.s(30), 3);
    this._drawBridge(this.railBridge, this.s(20), 2);

    // Crossings where the avenues meet the boulevard.
    [[0.455, 0.588], [0.605, 0.560], [0.36, 0.605], [0.815, 0.512]].forEach(c => {
      const q = this.p(c[0], c[1]);
      g.fillStyle(0xeceadb, 0.85);
      for (let i = -2; i <= 2; i++) g.fillRect(q.x + i * this.s(6) - this.s(2), q.y - this.s(12), this.s(4), this.s(24));
    });
  }

  _drawBridge(b, w, arches) {
    const g = this.roadGfx;
    const dx = b.b.x - b.a.x, dy = b.b.y - b.a.y, len = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx), nx = -Math.sin(ang), ny = Math.cos(ang);
    const quad = (o1, o2) => {
      g.beginPath();
      g.moveTo(b.a.x + nx * o1, b.a.y + ny * o1);
      g.lineTo(b.b.x + nx * o1, b.b.y + ny * o1);
      g.lineTo(b.b.x + nx * o2, b.b.y + ny * o2);
      g.lineTo(b.a.x + nx * o2, b.a.y + ny * o2);
      g.closePath(); g.fillPath();
    };
    g.fillStyle(0x7d8172, 1); quad(-w / 2 - this.s(8), w / 2 + this.s(10));
    g.fillStyle(0xd7d3c0, 1); quad(-w / 2 - this.s(6), -w / 2 - this.s(2));
    g.fillStyle(0x4a5658, 1); quad(-w / 2, w / 2);
    g.fillStyle(0xd7d3c0, 1); quad(w / 2 + this.s(2), w / 2 + this.s(7));
    // Arches under the deck.
    g.fillStyle(0xb9b5a2, 1);
    for (let i = 0; i < arches; i++) {
      const t = (i + 0.5) / arches;
      const x = b.a.x + dx * t, y = b.a.y + dy * t + w / 2 + this.s(6);
      g.fillEllipse(x, y, len / arches * 0.72, this.s(16));
    }
  }

  // Filler city blocks so the quarters are joined by real urban fabric
  // instead of empty grass. Placed clear of the roads, river and districts.
  _drawBlocks() {
    const g = this.blockGfx;
    const spots = [
      // west bank, around the old town
      [0.045, 0.615, 0.9], [0.145, 0.600, 0.85], [0.055, 0.700, 0.8], [0.135, 0.725, 0.75],
      [0.035, 0.430, 0.8], [0.125, 0.415, 0.75], [0.185, 0.505, 0.7],
      // between the bridge and the terminal
      [0.315, 0.540, 0.9], [0.355, 0.455, 0.95], [0.310, 0.380, 0.85], [0.360, 0.150, 0.8],
      [0.490, 0.380, 0.95], [0.520, 0.300, 0.9], [0.545, 0.180, 0.85],
      // eastern core between the avenues
      [0.545, 0.640, 1.0], [0.700, 0.620, 1.0], [0.730, 0.505, 0.95], [0.760, 0.640, 0.9],
      [0.560, 0.470, 0.9], [0.660, 0.430, 0.85], [0.700, 0.330, 0.8], [0.790, 0.290, 0.75],
      // southern riverside quarter
      [0.290, 0.720, 0.8], [0.470, 0.700, 0.85], [0.520, 0.880, 0.9], [0.720, 0.870, 0.9],
      [0.860, 0.700, 0.85], [0.930, 0.600, 0.8], [0.940, 0.840, 0.85], [0.380, 0.950, 0.8],
      [0.830, 0.960, 0.85], [0.960, 0.240, 0.7], [0.640, 0.085, 0.7], [0.790, 0.110, 0.7],
    ];
    this.blockWindows = [];
    spots.forEach((sp, i) => {
      const q = this.p(sp[0], sp[1]), k = sp[2];
      // leave the district quarters free: their landmarks stand there
      if (this.districtPoints.some((d,index) => Math.abs(d.x - q.x) < this.s(index===1?180:120) && Math.abs(d.y - q.y) < this.s(index===1?150:80))) return;
      const tall = i % 5 === 0;
      const hw = this.s(30 * k), hd = this.s(15 * k), h = this.s((tall ? 58 : 32) * k);
      const warm = i % 3 === 0;
      this._block(g, q.x, q.y, hw, hd, h,
        warm ? 0xe7d9bd : 0xdbe4e2,
        warm ? 0xa9794f : 0x5d7c80,
        warm ? 0xc79a6c : 0x7b9a9c);
      // roof detail: pitched old town roofs or green roofs downtown
      if (warm) {
        g.fillStyle(0xb1543f, 1);
        g.beginPath();
        g.moveTo(q.x - hw, q.y - h); g.lineTo(q.x, q.y - h - hd * 0.8);
        g.lineTo(q.x + hw, q.y - h); g.lineTo(q.x, q.y - h + hd);
        g.closePath(); g.fillPath();
      } else {
        g.fillStyle(0x6ea86a, 0.85);
        g.fillEllipse(q.x, q.y - h, hw * 1.0, hd * 0.9);
      }
      // window grid, reused at night
      const rows = tall ? 4 : 2;
      for (let r = 0; r < rows; r++) for (let c = -1; c <= 1; c++) {
        const wx = q.x + c * hw * 0.45, wy = q.y - h * (0.22 + r * 0.2) + hd * 0.25;
        g.fillStyle(0xbcdfe4, 0.75); g.fillRect(wx - this.s(3), wy - this.s(3), this.s(6), this.s(5));
        this.blockWindows.push({ x: wx, y: wy, on: Math.random() < 0.65, ph: Math.random() * 6.28 });
      }
      // street trees at the kerb
      this._tree(g, q.x - hw - this.s(12), q.y + hd * 0.6, k);
      this._tree(g, q.x + hw + this.s(12), q.y + hd * 0.5, k * 0.9);
    });

    // Background turbines and solar rows on the hills, behind the energy quarter.
    this.hillTurbines = [];
    [[0.800, 0.300, 0.85], [0.925, 0.250, 1.0], [0.985, 0.310, 0.9]].forEach(t => {
      const q = this.p(t[0], t[1]), k = t[2], h = this.s(52 * k);
      g.fillStyle(0xf6f5ee, 1);
      g.fillTriangle(q.x - this.s(3 * k), q.y, q.x + this.s(3 * k), q.y, q.x, q.y - h);
      this.hillTurbines.push({ x: q.x, y: q.y - h, r: this.s(24 * k), a: Math.random() * 6.28, sp: 0.8 + Math.random() * 0.5 });
    });
    for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) {
      const q = this.p(0.80 + i * 0.030, 0.335 + row * 0.026), w=this.s(22), h=this.s(11);
      g.fillStyle(0x4d5a58,1);g.fillRect(q.x-this.s(1),q.y,this.s(2),this.s(7));
      g.fillStyle(0x27566b,1);g.beginPath();g.moveTo(q.x-w/2,q.y);g.lineTo(q.x+w/2,q.y-this.s(5));g.lineTo(q.x+w/2,q.y+h-this.s(5));g.lineTo(q.x-w/2,q.y+h);g.closePath();g.fillPath();
      g.lineStyle(1,0x8ed6df,.8);g.lineBetween(q.x,q.y-this.s(2),q.x,q.y+h-this.s(2));
    }
  }

  _tree(g, x, y, k) {
    const s = (k || 1);
    g.fillStyle(0x1f3a2e, 0.18); g.fillEllipse(x, y + this.s(3), this.s(14 * s), this.s(5 * s));
    g.fillStyle(0x6b5942, 1); g.fillRect(x - this.s(1.6 * s), y - this.s(11 * s), this.s(3.2 * s), this.s(12 * s));
    g.fillStyle(0x37784d, 1); g.fillCircle(x, y - this.s(16 * s), this.s(9 * s));
    g.fillStyle(0x6fb56b, 0.9); g.fillCircle(x - this.s(3 * s), y - this.s(19 * s), this.s(5 * s));
  }

  _block(g, x, y, hw, hd, h, top, left, right) {
    g.fillStyle(0x203a34, 0.20); g.fillEllipse(x + hw * 0.25, y + hd * 0.7, hw * 2.1, hd * 1.5);
    const poly = (pts, c, a) => {
      g.fillStyle(c, a === undefined ? 1 : a);
      g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
      g.closePath(); g.fillPath();
    };
    const L = { x: x - hw, y }, B = { x, y: y + hd }, R = { x: x + hw, y }, T = { x, y: y - hd };
    poly([L, B, { x: B.x, y: B.y - h }, { x: L.x, y: L.y - h }], left);
    poly([B, R, { x: R.x, y: R.y - h }, { x: B.x, y: B.y - h }], right);
    poly([{ x: L.x, y: L.y - h }, { x: B.x, y: B.y - h }, { x: R.x, y: R.y - h }, { x: T.x, y: T.y - h }], top);
  }

  _drawDusk() {
    // A single, deep night layer sitting UNDER every animated light
    // (depth 3, below the anim layer at 4). Real dark-mode night: the
    // ground and blocks go dark, while windows, headlights, street lamps
    // and signage stay at full brightness on top instead of being washed
    // out by a grey film over the whole screen.
    const g = this.dusk;
    g.fillStyle(0x050f22, 0.80); g.fillRect(0, 0, this.W, this.H);
    g.fillStyle(0x0b2038, 0.30); g.fillRect(0, this.H * 0.45, this.W, this.H * 0.55);
  }

  // ---- moving city --------------------------------------------------------

  _seedTraffic() {
    const palette = [0x8fb6dc, 0xd9816a, 0x8fcf9b, 0xe3d17d, 0xb18ad0, 0xf2f1ea, 0x53606d];
    const pick = () => palette[Phaser.Math.Between(0, palette.length - 1)];
    this.movers = [];
    const add = (route, count, opts) => {
      for (let i = 0; i < count; i++) {
        this.movers.push(Object.assign({
          route, p: (i + Math.random()) / count, dir: i % 2 ? -1 : 1,
          sp: 0.030 + Math.random() * 0.026, type: 'car', color: pick(),
          lane: (i % 2 ? -1 : 1) * this.s(7),
        }, opts || {}));
      }
    };
    add('boulevard', 10);
    add('northAve', 6);
    add('southAve', 6);
    add('quay', 7);
    add('crossSt', 3, { lane: this.s(4) });
    add('hillRoad', 2, { lane: this.s(4) });
    // Commuter trains, always on the rails.
    this.movers.push({ route: 'rail', p: 0.1, dir: 1, sp: 0.055, type: 'train', color: 0xc4482f, cars: 4, lane: -this.s(3) });
    this.movers.push({ route: 'rail', p: 0.6, dir: -1, sp: 0.048, type: 'train', color: 0xdfe4e2, cars: 3, lane: this.s(3) });
    // Trams share the boulevard kerb lane.
    this.movers.push({ route: 'boulevard', p: 0.25, dir: 1, sp: 0.024, type: 'train', color: 0x3f8f97, cars: 2, lane: -this.s(16) });
    this.movers.push({ route: 'boulevard', p: 0.75, dir: -1, sp: 0.024, type: 'train', color: 0x3f8f97, cars: 2, lane: this.s(16) });
    // Boats on the river.
    this.boats = [];
    for (let i = 0; i < 2; i++) this.boats.push({ p: Math.random(), sp: 0.012 + Math.random() * 0.008 });
  }

  _seedWalkers() {
    this.walkers = [];
    const along = (route, n, off) => {
      for (let i = 0; i < n; i++) {
        this.walkers.push({
          route, p: Math.random(), sp: (0.010 + Math.random() * 0.012) * (Math.random() < 0.5 ? -1 : 1),
          lane: off * (Math.random() < 0.5 ? -1 : 1), bob: Math.random() * 6.28,
          shirt: [0x296b72, 0xe0a82e, 0xc96b4b, 0xf2e7c9, 0x44708f][Phaser.Math.Between(0, 4)],
          skin: [0xe7b98f, 0x9d6847, 0x6f4938, 0xf0c9a4][Phaser.Math.Between(0, 3)],
        });
      }
    };
    along('boulevard', 12, this.s(22));
    along('quay', 8, this.s(15));
    along('northAve', 6, this.s(19));
    along('southAve', 6, this.s(19));
    along('crossSt', 4, this.s(12));
  }

  _at(route, t, lane) {
    const pts = this.roads[route];
    const clamped = ((t % 1) + 1) % 1;
    const seg = clamped * (pts.length - 1);
    const i = Math.min(Math.floor(seg), pts.length - 2), f = seg - i;
    const a = pts[i], b = pts[i + 1];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const off = lane || 0;
    return {
      x: a.x + (b.x - a.x) * f - Math.sin(ang) * off,
      y: a.y + (b.y - a.y) * f + Math.cos(ang) * off,
      ang,
    };
  }

  _riverAt(t) {
    const pts = this.river, clamped = ((t % 1) + 1) % 1;
    const seg = clamped * (pts.length - 1);
    const i = Math.min(Math.floor(seg), pts.length - 2), f = seg - i;
    const a = pts[i], b = pts[i + 1];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  setNight(k) {
    this.night = Math.max(0, Math.min(1, k));
    if (this.dusk) this.dusk.setAlpha(this.night);
  }

  update(_time, delta) {
    if (!this.anim) return;
    const dt = Math.min(delta, 60) / 1000;
    const still = this.reducedMotion;
    const activity = 1-this.night*0.55;
    this.t += dt;
    const g = this.anim; g.clear();

    // River shimmer.
    g.fillStyle(0xcfeaf1, 0.20);
    for (let i = 0; i < 26; i++) {
      const t = (i / 26 + this.t * 0.02) % 1, q = this._riverAt(t);
      const k = 0.5 + 0.5 * Math.sin(this.t * 1.2 + i);
      g.fillRoundedRect(q.x - this.s(16), q.y + (i % 5 - 2) * this.s(7), this.s(14 + k * 16), Math.max(1, this.s(2)), 1);
    }

    // Boats.
    this.boats.forEach(b => {
      if (!still) b.p = (b.p + b.sp * dt * activity) % 1;
      const q = this._riverAt(b.p), L = this.s(30), h = this.s(8);
      g.fillStyle(0x16302c, 0.18); g.fillEllipse(q.x, q.y + this.s(4), L, h);
      g.fillStyle(0xf4f2e8, 0.97); g.fillRoundedRect(q.x - L / 2, q.y - h / 2, L, h, h * 0.4);
      g.fillStyle(0x9fc3cc, 0.9); g.fillRect(q.x - L * 0.12, q.y - h * 1.3, L * 0.3, h * 0.8);
      if (this.night > 0.15) {
        g.fillStyle(0xffe9a8, 0.20 * this.night); g.fillCircle(q.x + L * 0.42, q.y - h * 0.6, this.s(10));
        g.fillStyle(0xfff3c6, this.night); g.fillCircle(q.x + L * 0.42, q.y - h * 0.6, this.s(2.6));
        g.fillStyle(0xffd2a0, 0.9 * this.night); g.fillCircle(q.x - L * 0.42, q.y - h * 0.6, this.s(2.0));
      }
    });

    // Turning blades on the hills.
    this.hillTurbines.forEach(t => {
      if (!still) t.a += dt * t.sp;
      g.lineStyle(Math.max(2, this.s(3)), 0xfbfaf4, 0.96);
      for (let b = 0; b < 3; b++) {
        const a = t.a + (b * Math.PI * 2) / 3;
        g.lineBetween(t.x, t.y, t.x + Math.cos(a) * t.r, t.y + Math.sin(a) * t.r);
      }
      g.fillStyle(0xe6e2d6, 1); g.fillCircle(t.x, t.y, this.s(3.4));
    });

    // Lit windows across the whole city in the evening.
    if (this.night > 0.03) {
      this.blockWindows.forEach(w => {
        if (!w.on) return;
        const flick = 0.8 + 0.2 * Math.sin(this.t * 1.6 + w.ph);
        g.fillStyle(0xffd980, 0.16 * this.night * flick);
        g.fillCircle(w.x, w.y, this.s(7));
        g.fillStyle(0xfff0bc, Math.min(1, 1.15 * this.night) * flick);
        g.fillRect(w.x - this.s(3), w.y - this.s(3), this.s(6), this.s(5));
      });
    }

    // Traffic — strictly on its own road, in its own lane.
    this.movers.forEach(m => {
      if (!still) m.p = (m.p + m.sp * m.dir * dt * (0.72+this.night*0.28) + 1) % 1;
      const q = this._at(m.route, m.p, m.lane * m.dir);
      if (m.type === 'train') this._drawTrain(g, q, m);
      else this._drawCar(g, q, m);
    });

    // People on the pavements.
    this.walkers.forEach((w,index) => {
      if(this.night>0.35 && index%3!==0)return;
      if (!still) { w.p = (w.p + w.sp * dt * activity + 1) % 1; w.bob += dt * 8 * activity; }
      const q = this._at(w.route, w.p, w.lane);
      const y = q.y - Math.abs(Math.sin(w.bob)) * this.s(1.4);
      g.fillStyle(0x15302c, 0.22); g.fillEllipse(q.x, y + this.s(3), this.s(8), this.s(3));
      g.fillStyle(w.shirt, 0.98); g.fillRoundedRect(q.x - this.s(2.6), y - this.s(9), this.s(5.2), this.s(8), 1);
      g.fillStyle(w.skin, 1); g.fillCircle(q.x, y - this.s(11.6), this.s(2.7));
    });
    if(this.night>0.05){for(let i=0;i<9;i++){const q=this._at('boulevard',.08+i*.105,this.s(22));g.fillStyle(0xffdda0,.22*this.night);g.fillCircle(q.x,q.y-this.s(10),this.s(26));g.fillStyle(0xffe6a8,.30*this.night);g.fillCircle(q.x,q.y-this.s(10),this.s(13));g.fillStyle(0xfff4cf,Math.min(1,1.1*this.night));g.fillCircle(q.x,q.y-this.s(10),this.s(3.4));g.fillStyle(0x394b49,.9);g.fillRect(q.x-this.s(1),q.y-this.s(9),this.s(2),this.s(12));}}
  }

  _drawCar(g, q, m) {
    const L = this.s(19), Wd = this.s(9), cos = Math.cos(q.ang), sin = Math.sin(q.ang), d = m.dir;
    const put = (ox, oy) => ({ x: q.x + ox * d * cos - oy * sin, y: q.y + ox * d * sin + oy * cos });
    g.fillStyle(0x16302c, 0.26); g.fillEllipse(q.x, q.y + this.s(3), L, Wd * 0.8);
    const b = [put(-L / 2, -Wd / 2), put(L / 2, -Wd / 2), put(L / 2, Wd / 2), put(-L / 2, Wd / 2)];
    g.fillStyle(m.color, 0.98);
    g.beginPath(); g.moveTo(b[0].x, b[0].y); b.forEach(pt => g.lineTo(pt.x, pt.y)); g.closePath(); g.fillPath();
    const roof = put(-L * 0.05, 0);
    g.fillStyle(0xcfe8ea, 0.85); g.fillCircle(roof.x, roof.y, this.s(2.6));
    if (this.night > 0.12) {
      const hl = put(L / 2, 0), beam = put(L * 1.5, 0), tl = put(-L / 2, 0);
      g.fillStyle(0xfff3c0, 0.16 * this.night);
      g.fillTriangle(hl.x, hl.y, beam.x, beam.y + this.s(9), beam.x, beam.y - this.s(9));
      g.fillStyle(0xfff6d0, Math.min(1, 1.1 * this.night)); g.fillCircle(hl.x, hl.y, this.s(3.0));
      g.fillStyle(0xff7d63, 0.95 * this.night); g.fillCircle(tl.x, tl.y, this.s(2.2));
    }
  }

  _drawTrain(g, q, m) {
    const cos = Math.cos(q.ang), sin = Math.sin(q.ang), d = m.dir;
    const len = this.s(30), h = this.s(11);
    for (let c = 0; c < m.cars; c++) {
      const off = -c * (len + this.s(4));
      const x = q.x + off * d * cos, y = q.y + off * d * sin;
      g.fillStyle(0x16302c, 0.24); g.fillRoundedRect(x - len / 2, y + h * 0.4, len, h * 0.5, h * 0.2);
      g.fillStyle(m.color, 0.98); g.fillRoundedRect(x - len / 2, y - h / 2, len, h, Math.max(2, h * 0.3));
      const lit = this.night > 0.12;
      g.fillStyle(lit ? 0xfff0bc : 0x2a4a52, lit ? Math.min(1, 1.1 * this.night) : 0.6);
      for (let k = 0.12; k < 0.9; k += 0.22) g.fillRect(x - len / 2 + len * k, y - h * 0.2, Math.max(2, len * 0.11), Math.max(2, h * 0.36));
      if (lit && c === 0) {
        const hx = x + (len / 2) * d * cos, hy = y + (len / 2) * d * sin;
        g.fillStyle(0xfff3c0, 0.18 * this.night); g.fillCircle(hx, hy, this.s(14));
        g.fillStyle(0xfff8da, Math.min(1, 1.1 * this.night)); g.fillCircle(hx, hy, this.s(3.4));
      }
    }
  }
}
