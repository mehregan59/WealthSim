// The painted regional city, brought to life.
//
// The illustration carries the architecture (Altstadt and river on the left,
// glass station in the centre, office campus on the right, hills with solar
// and wind beyond) and everything that moves here is placed onto those real
// streets, rails, water and plazas — no floating props, no drawn highway.
//
// Scenery only: nothing here touches gameplay, decisions or scoring.
class CityScape {
  constructor(scene) {
    this.scene = scene;
    this.S = scene.S || 1;
    this.t = 0;
    this.night = 0;
    this.reducedMotion = !!scene.reducedMotion;
    this._buildBackdrop();
    this._buildTurbines();
    this._buildRoutes();
    this._buildWalkers();
    this._buildWater();
    this._buildWindows();
    this.anim = scene.add.graphics().setDepth(-2);
  }

  s(v) { return Math.round(v * this.S); }
  get W() { return this.scene.scale.width; }
  get H() { return this.scene.scale.height; }

  _buildBackdrop() {
    const sc = this.scene, W = this.W, H = this.H;
    const img = sc.add.image(W / 2, H / 2, 'cityPanorama').setDepth(-10);
    img.setScale(Math.max(W / img.width, H / img.height));
    this.img = img;

    const wash = sc.add.graphics().setDepth(-9);
    wash.fillStyle(0xf2e7c9, 0.10); wash.fillRect(0, 0, W, H);
    wash.fillStyle(0x0d2b30, 0.08); wash.fillRect(0, H * 0.58, W, H * 0.42);
    this.wash = wash;
  }

  // Wind turbines standing on the painted hills.
  _buildTurbines() {
    const sc = this.scene, W = this.W, H = this.H;
    this.turbines = [];
    [[0.735, 0.10, 1], [0.845, 0.065, 1.15], [0.945, 0.10, 0.95]].forEach((p, i) => {
      const k = p[2], x = W * p[0], y = H * p[1];
      const h = this.s(58 * k), r = this.s(28 * k);
      const tower = sc.add.graphics().setDepth(-3);
      tower.fillStyle(0xf9f8f2, 0.97);
      tower.fillTriangle(x - this.s(3 * k), y + h, x + this.s(3 * k), y + h, x, y);
      this.turbines.push({ x, y, r, a: Math.random() * 6.28, speed: 0.85 + i * 0.18 });
    });
  }

  // Routes traced along the streets, rails and bridges of the painting.
  _buildRoutes() {
    const W = this.W, H = this.H, n = (x, y) => ({ x: W * x, y: H * y });
    this.routes = {
      rail:      [n(0.18, 0.345), n(0.42, 0.305), n(0.70, 0.288), n(1.18, 0.272)],
      tram:      [n(-0.12, 0.470), n(0.28, 0.432), n(0.58, 0.418), n(1.12, 0.405)],
      boulevard: [n(0.20, 0.520), n(0.52, 0.505), n(0.80, 0.512), n(1.14, 0.528)],
      quay:      [n(0.40, 0.806), n(0.72, 0.790), n(1.12, 0.776)],
      river:     [n(0.21, 0.795), n(0.27, 0.700), n(0.33, 0.615), n(0.40, 0.548)],

    };

    const car = () => [0x8fb6dc, 0xd9816a, 0x8fcf9b, 0xe3d17d, 0xb18ad0, 0xeceef0, 0x4d5a68][Phaser.Math.Between(0, 6)];
    this.movers = [];
    // commuter trains on the viaduct
    for (let i = 0; i < 2; i++) this.movers.push({ route: 'rail', p: i * 0.55, sp: 0.035, type: 'train', color: 0xc4482f, cars: 4 });
    // trams along the station avenue, both directions
    for (let i = 0; i < 3; i++) this.movers.push({ route: 'tram', p: i * 0.33, sp: 0.030 * (i % 2 ? -1 : 1), type: 'tram', color: i % 2 ? 0xf2f4f3 : 0xdfe7e6, cars: 2 });
    // road traffic on the boulevard and the riverside quay past the bridge
    for (let i = 0; i < 9; i++) this.movers.push({ route: 'boulevard', p: Math.random(), sp: (0.040 + Math.random() * 0.030) * (i % 2 ? -1 : 1), type: 'car', color: car() });
    for (let i = 0; i < 8; i++) this.movers.push({ route: 'quay', p: Math.random(), sp: (0.034 + Math.random() * 0.032) * (i % 3 ? 1 : -1), type: 'car', color: car() });
    for (let i = 0; i < 2; i++) this.movers.push({ route: 'river', p: Math.random(), sp: 0.012 + Math.random() * 0.008, type: 'boat', color: 0xf4f2e8 });
  }

  // People on the promenade, the station plaza and the campus walkways.
  _buildWalkers() {
    const W = this.W, H = this.H;
    const paths = [
      [{ x: 0.03, y: 0.70 }, { x: 0.30, y: 0.665 }],   // riverside promenade
      [{ x: 0.30, y: 0.545 }, { x: 0.55, y: 0.525 }],  // station plaza
      [{ x: 0.60, y: 0.585 }, { x: 0.86, y: 0.575 }],  // campus walkway
      [{ x: 0.10, y: 0.865 }, { x: 0.46, y: 0.845 }],  // foreground pavement
    ];
    this.walkers = [];
    paths.forEach(seg => {
      for (let i = 0; i < 7; i++) {
        this.walkers.push({
          ax: W * seg[0].x, ay: H * seg[0].y, bx: W * seg[1].x, by: H * seg[1].y,
          p: Math.random(), sp: (0.018 + Math.random() * 0.022) * (Math.random() < 0.5 ? -1 : 1),
          bob: Math.random() * 6.28,
          shirt: [0x296b72, 0xe0a82e, 0xc96b4b, 0xf2e7c9, 0x44708f][Phaser.Math.Between(0, 4)],
          skin: [0xe7b98f, 0x9d6847, 0x6f4938, 0xf0c9a4][Phaser.Math.Between(0, 3)],
        });
      }
    });
  }

  _buildWater() {
    this.ripples = [];
    for (let i = 0; i < 24; i++) {
      const p = Math.random();
      const pos = this._at('river', p);
      this.ripples.push({ x: pos.x + (Math.random() - 0.5) * this.s(90), y: pos.y + (Math.random() - 0.5) * this.s(26), w: this.s(12 + Math.random() * 32), ph: Math.random() * 6.28 });
    }
  }


  // Windows that warm up when the scene turns to evening.
  _buildWindows() {
    const W = this.W, H = this.H;
    this.windows = [];
    for (let i = 0; i < 120; i++) {
      const band = Math.random();
      const x = band < 0.35 ? W * (0.02 + Math.random() * 0.24) : W * (0.42 + Math.random() * 0.56);
      const y = band < 0.35 ? H * (0.35 + Math.random() * 0.30) : H * (0.10 + Math.random() * 0.45);
      this.windows.push({ x, y, on: Math.random() < 0.6, ph: Math.random() * 6.28 });
    }
  }

  setNight(k) { this.night = Math.max(0, Math.min(1, k)); }

  _at(route, p) {
    const pts = this.routes[route];
    const seg = (pts.length - 1) * ((p % 1) + 1) % (pts.length - 1);
    const i = Math.min(Math.floor(seg), pts.length - 2), f = seg - i;
    const a = pts[i], b = pts[i + 1];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, ang: Math.atan2(b.y - a.y, b.x - a.x) };
  }

  update(_time, delta) {
    if (!this.anim) return;
    const dt = Math.min(delta, 60) / 1000;
    const still = this.reducedMotion;
    this.t += dt;
    const g = this.anim; g.clear();

    // River shimmer.
    g.fillStyle(0xdbeef2, 0.18);
    this.ripples.forEach(r => {
      const k = 0.5 + 0.5 * Math.sin(this.t * 0.9 + r.ph);
      g.fillRoundedRect(r.x, r.y, r.w * (0.6 + k * 0.4), Math.max(1, this.s(1.6)), 1);
    });

    // Evening window lights.
    if (this.night > 0.02) {
      this.windows.forEach(w => {
        if (!w.on) return;
        const flick = 0.75 + 0.25 * Math.sin(this.t * 1.7 + w.ph);
        g.fillStyle(0xffe7a8, 0.75 * this.night * flick);
        g.fillRect(w.x, w.y, this.s(2.6), this.s(2.2));
      });
    }

    // Turning blades.
    this.turbines.forEach(t => {
      if (!still) t.a += dt * t.speed;
      g.lineStyle(Math.max(2, this.s(3)), 0xfbfaf4, 0.95);
      for (let b = 0; b < 3; b++) {
        const a = t.a + (b * Math.PI * 2) / 3;
        g.lineBetween(t.x, t.y, t.x + Math.cos(a) * t.r, t.y + Math.sin(a) * t.r);
      }
      g.fillStyle(0xe6e2d6, 0.95); g.fillCircle(t.x, t.y, this.s(3.2));
    });

    // Trains, trams, cars and river boats on their painted routes.
    this.movers.forEach(m => {
      if (!still) m.p = (m.p + m.sp * dt + 1) % 1;
      const pos = this._at(m.route, m.p);
      if (m.type === 'train' || m.type === 'tram') this._drawTrain(g, pos, m);
      else if (m.type === 'boat') this._drawBoat(g, pos, m);
      else this._drawCar(g, pos, m);
    });

    // Pedestrians.
    this.walkers.forEach(w => {
      if (!still) { w.p += w.sp * dt; if (w.p > 1) w.p -= 1; if (w.p < 0) w.p += 1; w.bob += dt * 9; }
      const x = w.ax + (w.bx - w.ax) * w.p;
      const y = w.ay + (w.by - w.ay) * w.p - Math.abs(Math.sin(w.bob)) * this.s(1.2);
      g.fillStyle(0x15302c, 0.22); g.fillEllipse(x, y + this.s(3), this.s(7), this.s(2.6));
      g.fillStyle(w.shirt, 0.98); g.fillRoundedRect(x - this.s(2.3), y - this.s(8), this.s(4.6), this.s(7), 1);
      g.fillStyle(w.skin, 1); g.fillCircle(x, y - this.s(10.4), this.s(2.4));
    });
  }

  _drawCar(g, pos, m) {
    const L = this.s(17), Wd = this.s(8), cos = Math.cos(pos.ang), sin = Math.sin(pos.ang);
    const dir = m.sp < 0 ? -1 : 1;
    const put = (ox, oy) => ({ x: pos.x + ox * dir * cos - oy * sin, y: pos.y + ox * dir * sin + oy * cos });
    g.fillStyle(0x16302c, 0.25); g.fillEllipse(pos.x, pos.y + this.s(3), L, Wd * 0.7);
    const b = [put(-L / 2, -Wd / 2), put(L / 2, -Wd / 2), put(L / 2, Wd / 2), put(-L / 2, Wd / 2)];
    g.fillStyle(m.color, 0.98);
    g.beginPath(); g.moveTo(b[0].x, b[0].y); b.forEach(p => g.lineTo(p.x, p.y)); g.closePath(); g.fillPath();
    g.fillStyle(0xcfe8ea, 0.8);
    const r = put(L * 0.08, 0); g.fillCircle(r.x, r.y, this.s(2.2));
    if (this.night > 0.3) {
      const hl = put(L / 2, 0);
      g.fillStyle(0xfff0ad, 0.9 * this.night); g.fillCircle(hl.x, hl.y, this.s(2.4));
    }
  }

  _drawTrain(g, pos, m) {
    const cos = Math.cos(pos.ang), sin = Math.sin(pos.ang);
    const dir = m.sp < 0 ? -1 : 1;
    const len = m.type === 'train' ? this.s(26) : this.s(22);
    const h = m.type === 'train' ? this.s(9) : this.s(8);
    for (let c = 0; c < m.cars; c++) {
      const off = -c * (len + this.s(3));
      const x = pos.x + off * dir * cos, y = pos.y + off * dir * sin;
      g.fillStyle(0x16302c, 0.22); g.fillRoundedRect(x, y + h * 0.85, len, h * 0.45, h * 0.2);
      g.fillStyle(m.color, 0.98); g.fillRoundedRect(x, y, len, h, Math.max(2, h * 0.3));
      g.fillStyle(0x2a4a52, 0.65);
      for (let k = 0.12; k < 0.88; k += 0.22) g.fillRect(x + len * k, y + h * 0.25, Math.max(2, len * 0.1), Math.max(2, h * 0.32));
    }
  }

  _drawBoat(g, pos, m) {
    const L = this.s(34), h = this.s(7);
    g.fillStyle(0x16302c, 0.18); g.fillEllipse(pos.x, pos.y + this.s(4), L, h);
    g.fillStyle(m.color, 0.97); g.fillRoundedRect(pos.x - L / 2, pos.y - h / 2, L, h, h * 0.4);
    g.fillStyle(0x9fc3cc, 0.9); g.fillRect(pos.x - L * 0.12, pos.y - h * 1.3, L * 0.3, h * 0.8);
    g.fillStyle(0xdbeef2, 0.22); g.fillEllipse(pos.x - L * 0.7, pos.y + this.s(3), L * 0.8, this.s(3));
  }
}
