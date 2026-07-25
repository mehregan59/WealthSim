class RoadNetwork {
  constructor(scene, districts) {
    this.scene = scene;
    this.districts = districts;
    this.cars = [];
    this.gfx = scene.add.graphics().setDepth(3);
    this.carGfx = scene.add.graphics().setDepth(10);
    this.lanes = this._buildLanes();
    this._drawRoad();
    this._seedCars();
  }

  _buildLanes() {
    const d = this.districts;
    const n = d.map(x => ({ x: x.cx, y: x.cy + 30 }));
    const east = [
      {x:40,  y:n[0].y-6},
      {x:n[0].x, y:n[0].y},
      {x:(n[0].x+n[1].x)/2, y:(n[0].y+n[1].y)/2 - 4},
      {x:n[1].x, y:n[1].y},
      {x:(n[1].x+n[2].x)/2, y:(n[1].y+n[2].y)/2},
      {x:n[2].x, y:n[2].y},
      {x:(n[2].x+n[3].x)/2, y:(n[2].y+n[3].y)/2 + 4},
      {x:n[3].x, y:n[3].y},
      {x:1250, y:n[3].y+4}
    ];
    const west = east.slice().reverse().map(p => ({ x:p.x, y:p.y + 13 }));
    return [ {pts: east}, {pts: west} ];
  }

  _drawRoad() {
    const g = this.gfx;
    const pts = this.lanes[0].pts;
    for (let i = 0; i < pts.length-1; i++) {
      const p1=pts[i], p2=pts[i+1];
      const dx=p2.x-p1.x, dy=p2.y-p1.y, len=Math.hypot(dx,dy);
      const nx=-dy/len*11, ny=dx/len*11;
      g.fillStyle(0x23252b, 0.9);
      g.beginPath();
      g.moveTo(p1.x+nx, p1.y+ny+6); g.lineTo(p2.x+nx, p2.y+ny+6);
      g.lineTo(p2.x-nx, p2.y-ny+6); g.lineTo(p1.x-nx, p1.y-ny+6);
      g.closePath(); g.fillPath();
    }
    g.lineStyle(1, 0x3d4048, 0.7);
    g.beginPath(); g.moveTo(pts[0].x, pts[0].y-5);
    pts.forEach(p=>g.lineTo(p.x, p.y-5)); g.strokePath();
    g.beginPath(); g.moveTo(pts[0].x, pts[0].y+17);
    pts.forEach(p=>g.lineTo(p.x, p.y+17)); g.strokePath();
    g.lineStyle(1.6, 0xf5dd88, 0.3);
    for (let i=0;i<pts.length-1;i++){
      const p1=pts[i],p2=pts[i+1];
      const steps=Math.max(2,Math.floor(Math.hypot(p2.x-p1.x,p2.y-p1.y)/24));
      for(let s=0;s<steps;s+=2){
        const t1=s/steps, t2=(s+0.75)/steps;
        g.beginPath();
        g.moveTo(p1.x+(p2.x-p1.x)*t1, p1.y+(p2.y-p1.y)*t1+6);
        g.lineTo(p1.x+(p2.x-p1.x)*t2, p1.y+(p2.y-p1.y)*t2+6);
        g.strokePath();
      }
    }
  }

  _seedCars() {
    const starts = [0, 2, 4, 6];
    starts.forEach((s, i) => {
      this.scene.time.delayedCall(i*260, () => this._spawn(0, s));
      this.scene.time.delayedCall(i*260+900, () => this._spawn(1, s));
    });
    this.scene.time.addEvent({
      delay: 2600, loop: true,
      callback: () => { if (this.cars.length < 8) this._spawn(Math.random()>0.5?0:1, 0); }
    });
  }

  _spawn(laneIdx, node) {
    const pts = this.lanes[laneIdx].pts;
    const palette = [0x7fb3e0, 0xe08a6a, 0x86cf92, 0xe0cf72, 0xc48ada, 0x9aa8c8, 0xe0e0e6];
    this.cars.push({
      lane: laneIdx,
      i: Math.min(node, pts.length-2),
      t: Math.random(),
      sp: 0.010 + Math.random()*0.008,
      col: palette[Phaser.Math.Between(0,palette.length-1)],
      alive: true,
      stop: 0
    });
  }

  update(delta, isNight) {
    this.carGfx.clear();
    const dead = [];
    this.cars.forEach((c, idx) => {
      if (!c.alive) { dead.push(idx); return; }
      const pts = this.lanes[c.lane].pts;
      if (c.stop > 0) { c.stop -= delta; }
      else {
        c.t += c.sp * (delta/16);
        while (c.t >= 1) {
          c.t -= 1; c.i++;
          if (Math.random() < 0.25) c.stop = 500 + Math.random()*700;
        }
        if (c.i >= pts.length-1) { c.alive=false; return; }
      }
      const p1 = pts[c.i], p2 = pts[c.i+1];
      if (!p1 || !p2) { c.alive=false; return; }
      const x = p1.x + (p2.x-p1.x)*c.t;
      const y = p1.y + (p2.y-p1.y)*c.t + 6;
      this._car(x, y, Math.atan2(p2.y-p1.y, p2.x-p1.x), c, isNight);
    });
    for (let i=dead.length-1;i>=0;i--) this.cars.splice(dead[i],1);
  }

  _car(x, y, ang, c, isNight) {
    const g = this.carGfx;
    const cos=Math.cos(ang), sin=Math.sin(ang);
    const L=16, W=8;
    const put=(ox,oy)=>({x: x+ox*cos-oy*sin, y: y+ox*sin+oy*cos});
    g.fillStyle(0x000000, 0.28); g.fillEllipse(x, y+4, L, W*0.6);
    g.fillStyle(c.col, 0.96);
    const b=[put(-L/2,-W/2),put(L/2,-W/2),put(L/2,W/2),put(-L/2,W/2)];
    g.beginPath(); g.moveTo(b[0].x,b[0].y); b.forEach(p=>g.lineTo(p.x,p.y)); g.closePath(); g.fillPath();
    g.fillStyle(0x101820, 0.55);
    const r=[put(-L*0.12,-W/2+1),put(L*0.3,-W/2+1),put(L*0.3,W/2-1),put(-L*0.12,W/2-1)];
    g.beginPath(); g.moveTo(r[0].x,r[0].y); r.forEach(p=>g.lineTo(p.x,p.y)); g.closePath(); g.fillPath();
    g.fillStyle(0x14161a, 0.9);
    [put(-L*0.28,-W/2),put(L*0.28,-W/2),put(-L*0.28,W/2),put(L*0.28,W/2)].forEach(p=>g.fillCircle(p.x,p.y,1.8));
    if (isNight) {
      const hl=put(L/2+1,0); g.fillStyle(0xfff2b0,0.95); g.fillCircle(hl.x,hl.y,3.2);
      g.fillStyle(0xfff2b0,0.18); g.fillCircle(hl.x+cos*6, hl.y+sin*6, 7);
      const tl=put(-L/2-1,0); g.fillStyle(0xff4444,0.9); g.fillCircle(tl.x,tl.y,2.2);
    }
    if (c.stop > 0) {
      const tl=put(-L/2-1,0); g.fillStyle(0xff3300,0.95); g.fillCircle(tl.x,tl.y,2.6);
    }
  }
}
