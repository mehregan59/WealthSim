class AmbientSystem {
  constructor(scene) {
    this.scene = scene;
    this.W = scene.scale.width;
    this.H = scene.scale.height;
    this.time = 34000;          // start mid-morning so the first view is bright
    this.dayDuration = 120000;  // slower 2-minute cycle
    this.birds = [];
    this.stars = [];
    this.clouds = [
      { x: this.W*0.14, y: 78,  speed: 0.22, scale: 1.0 },
      { x: this.W*0.40, y: 56,  speed: 0.16, scale: 0.75 },
      { x: this.W*0.64, y: 92,  speed: 0.20, scale: 1.15 },
      { x: this.W*0.85, y: 66,  speed: 0.13, scale: 0.85 }
    ];
    this.skyGfx   = scene.add.graphics().setDepth(-10);
    this.cloudGfx = scene.add.graphics().setDepth(-8);
    this.sunMoon  = scene.add.graphics().setDepth(-9);
    for (let i = 0; i < 70; i++) {
      this.stars.push({ x: Phaser.Math.Between(0, this.W), y: Phaser.Math.Between(0, 230), r: Math.random()*1.4+0.4, tw: Math.random()*Math.PI*2 });
    }
    for (let i = 0; i < 5; i++) scene.time.delayedCall(i*1700+Math.random()*1100, () => this._spawnBird());
  }

  _spawnBird() {
    if (!this.scene || !this.scene.sys.isActive()) return;
    if (this.birds.length >= 5) return;
    const ang = Math.random()*Math.PI*2, sp = 0.7+Math.random()*0.8;
    let sx, sy;
    if (Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang))) { sx = Math.cos(ang)>0 ? -20 : this.W+20; sy = Phaser.Math.Between(50,220); }
    else { sx = Phaser.Math.Between(50,this.W-50); sy = Math.sin(ang)>0 ? -20 : 250; }
    this.birds.push({ x:sx, y:sy, vx:Math.cos(ang)*sp, vy:Math.sin(ang)*sp, wing:Math.random()*Math.PI*2, wob:Math.random()*Math.PI*2, wobA:(Math.random()-0.5)*0.28, gfx:this.scene.add.graphics().setDepth(5) });
  }

  getDayProgress(){ return (this.time % this.dayDuration) / this.dayDuration; }
  isNightTime(){ const t=this.getDayProgress(); return t < 0.16 || t > 0.84; }
  isDaytime(){ const t=this.getDayProgress(); return t>=0.30 && t<0.70; }

  // Bright sky-blue day, warm dawn/dusk, deep night
  getSkyColor() {
    const t = this.getDayProgress();
    const NIGHT={r:10,g:16,b:38}, DAWN={r:96,g:96,b:150}, DAY={r:104,g:174,b:232}, DUSK={r:150,g:96,b:120};
    const mix=(a,b,p)=>({r:a.r+(b.r-a.r)*p, g:a.g+(b.g-a.g)*p, b:a.b+(b.b-a.b)*p});
    if (t < 0.16) return mix(NIGHT,DAWN,t/0.16);
    if (t < 0.30) return mix(DAWN,DAY,(t-0.16)/0.14);
    if (t < 0.70) return DAY;
    if (t < 0.84) return mix(DAY,DUSK,(t-0.70)/0.14);
    return mix(DUSK,NIGHT,(t-0.84)/0.16);
  }

  update(time, delta) {
    this.time += delta;
    this.W = this.scene.scale.width;
    const t = this.getDayProgress();
    const night = this.isNightTime();
    const sky = this.getSkyColor();

    this.skyGfx.clear();
    this.skyGfx.fillStyle(Phaser.Display.Color.GetColor(sky.r|0, sky.g|0, sky.b|0), 1);
    this.skyGfx.fillRect(0, 0, this.W, 400);

    if (this.isDaytime()) {
      this.skyGfx.fillStyle(0xbadcf2, 0.45);
      this.skyGfx.fillRect(0, 250, this.W, 150);
    }
    const dawn = t>=0.16 && t<0.30, dusk = t>=0.70 && t<0.84;
    if (dawn || dusk) {
      const p = dawn ? (t-0.16)/0.14 : (t-0.70)/0.14;
      this.skyGfx.fillStyle(0xff8a3d, Math.sin(p*Math.PI)*0.42);
      this.skyGfx.fillRect(0, 270, this.W, 130);
    }
    if (night || t < 0.24 || t > 0.78) {
      const sa = t < 0.24 ? (0.24-t)/0.24 : (t-0.78)/0.22;
      this.stars.forEach(s => {
        s.tw += 0.022;
        const a = Math.max(0,Math.min(1,sa)) * (0.4+0.6*Math.sin(s.tw));
        this.skyGfx.fillStyle(0xffffff, a);
        this.skyGfx.fillCircle(s.x, s.y, s.r);
      });
    }

    this.sunMoon.clear();
    if (!night) {
      const sunX = this.W*0.06 + t*this.W*0.9;
      const sunY = 215 - Math.sin(t*Math.PI)*170;
      this.sunMoon.fillStyle(0xfff4c4, 0.28); this.sunMoon.fillCircle(sunX, sunY, 40);
      this.sunMoon.fillStyle(0xffeb99, 0.55); this.sunMoon.fillCircle(sunX, sunY, 28);
      this.sunMoon.fillStyle(0xfffbe0, 1);    this.sunMoon.fillCircle(sunX, sunY, 20);
    } else {
      const mt = t<0.16 ? t/0.16 : (t-0.84)/0.16;
      const mx = t<0.16 ? this.W*0.08+mt*this.W*0.3 : this.W*0.55+mt*this.W*0.35;
      this.sunMoon.fillStyle(0xcfe0ff, 0.9); this.sunMoon.fillCircle(mx, 122, 16);
      this.sunMoon.fillStyle(Phaser.Display.Color.GetColor(sky.r|0,sky.g|0,sky.b|0), 0.95);
      this.sunMoon.fillCircle(mx+6, 118, 13);
    }

    this.cloudGfx.clear();
    this.clouds.forEach(c => {
      c.x += c.speed*(delta/16);
      if (c.x > this.W+120) c.x = -120;
      const alpha = night ? 0.12 : 0.72;
      const col   = night ? 0x2a3a55 : 0xffffff;
      this.cloudGfx.fillStyle(col, alpha);
      const cw = 66*c.scale, ch = 24*c.scale;
      this.cloudGfx.fillEllipse(c.x, c.y, cw, ch);
      this.cloudGfx.fillEllipse(c.x+cw*0.24, c.y-ch*0.3, cw*0.66, ch*0.78);
      this.cloudGfx.fillEllipse(c.x-cw*0.24, c.y-ch*0.14, cw*0.52, ch*0.62);
    });

    const gone = [];
    this.birds.forEach((b,i) => {
      b.x += b.vx*(delta/16); b.y += b.vy*(delta/16);
      b.wing += 0.13; b.wob += 0.028;
      b.vx += Math.sin(b.wob)*b.wobA*0.02;
      b.vy += Math.cos(b.wob)*b.wobA*0.02;
      if (b.x < -45 || b.x > this.W+45 || b.y < -45 || b.y > 265) {
        b.gfx.destroy(); gone.push(i);
        this.scene.time.delayedCall(3000+Math.random()*4000, ()=>this._spawnBird());
        return;
      }
      b.gfx.clear();
      if (!night) {
        const f = Math.sin(b.wing)*4;
        b.gfx.lineStyle(1.6, 0x33445c, 0.7);
        b.gfx.beginPath();
        b.gfx.moveTo(b.x-6,b.y+f); b.gfx.lineTo(b.x,b.y); b.gfx.lineTo(b.x+6,b.y+f);
        b.gfx.strokePath();
      }
    });
    for (let i=gone.length-1;i>=0;i--) this.birds.splice(gone[i],1);
  }
}
