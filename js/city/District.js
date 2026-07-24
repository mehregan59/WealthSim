class District {
  constructor(scene, config) {
    this.scene = scene;
    this.id = config.id;
    this.name = config.name;
    this.nameDE = config.nameDE;
    this.color = config.color;
    this.darkColor = config.darkColor;
    this.accentColor = config.accentColor;
    this.cx = config.cx;
    this.cy = config.cy;
    this.health = config.health || 50;
    this.resources = 0;
    this.buildings = [];
    this.particles = [];
    this.container = scene.add.container(0, 0);
    this.tooltip = config.tooltip;
    this.tooltipDE = config.tooltipDE;
    this.isHovered = false;
    this.animTime = Math.random() * 1000;
    this.specialElements = [];
    this._draw();
    this._addInteraction();
  }

  _isoX(gx, gy) { return this.cx + (gx - gy) * 38; }
  _isoY(gx, gy, gz) { return this.cy + (gx + gy) * 22 - gz * 28; }

  _draw() {
    this.gfx = this.scene.add.graphics();
    this.container.add(this.gfx);
    this._drawGround();
    this._drawBuildings();
    this._drawSpecial();
  }

  _drawGround() {
    const g = this.gfx;
    const pts = [
      { x: this._isoX(0,2), y: this._isoY(0,2,0) },
      { x: this._isoX(2,2), y: this._isoY(2,2,0) },
      { x: this._isoX(2,0), y: this._isoY(2,0,0) },
      { x: this._isoX(0,0), y: this._isoY(0,0,0) }
    ];
    g.fillStyle(this.darkColor, 0.6);
    g.beginPath();
    g.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => g.lineTo(p.x, p.y));
    g.closePath();
    g.fillPath();
    g.lineStyle(1, this.color, 0.4);
    g.strokePath();
  }

  _drawBuildings() {
    if (this.health < 10) return;
    const count = Math.floor(this.health / 20) + 1;
    const positions = [[0.4,0.4],[0.8,0.8],[1.2,0.6],[0.6,1.2],[1.0,1.0]];
    for (let i = 0; i < Math.min(count, positions.length); i++) {
      const [gx, gy] = positions[i];
      const h = 0.3 + (this.health / 100) * 0.9 + (i * 0.15);
      this._drawBuilding(gx, gy, h, i);
    }
  }

  _drawBuilding(gx, gy, h, idx) {
    const g = this.gfx;
    const w = 0.35, d = 0.35;
    g.fillStyle(this.darkColor, 0.95);
    g.beginPath();
    g.moveTo(this._isoX(gx,gy+d), this._isoY(gx,gy+d,0));
    g.lineTo(this._isoX(gx,gy+d), this._isoY(gx,gy+d,h));
    g.lineTo(this._isoX(gx+w,gy+d), this._isoY(gx+w,gy+d,h));
    g.lineTo(this._isoX(gx+w,gy+d), this._isoY(gx+w,gy+d,0));
    g.closePath(); g.fillPath();
    g.fillStyle(this.color, 0.85);
    g.beginPath();
    g.moveTo(this._isoX(gx+w,gy), this._isoY(gx+w,gy,0));
    g.lineTo(this._isoX(gx+w,gy), this._isoY(gx+w,gy,h));
    g.lineTo(this._isoX(gx+w,gy+d), this._isoY(gx+w,gy+d,h));
    g.lineTo(this._isoX(gx+w,gy+d), this._isoY(gx+w,gy+d,0));
    g.closePath(); g.fillPath();
    g.fillStyle(this.accentColor, 0.9);
    g.beginPath();
    g.moveTo(this._isoX(gx,gy), this._isoY(gx,gy,h));
    g.lineTo(this._isoX(gx+w,gy), this._isoY(gx+w,gy,h));
    g.lineTo(this._isoX(gx+w,gy+d), this._isoY(gx+w,gy+d,h));
    g.lineTo(this._isoX(gx,gy+d), this._isoY(gx,gy+d,h));
    g.closePath(); g.fillPath();
    if (this.health > 30) {
      g.fillStyle(0xffe4a0, 0.8);
      for (let wy = 0; wy < Math.floor(h * 1.5); wy++) {
        const wz = 0.2 + wy * 0.25;
        if (wz < h - 0.1) g.fillRect(this._isoX(gx+0.05, gy+d) - 2, this._isoY(gx+0.05, gy+d, wz) - 2, 3, 3);
      }
    }
    this.buildings.push({ gx, gy, h, idx, targetH: h });
  }

  _drawSpecial() {
    const g = this.gfx;
    if (this.id === 'energy' && this.health > 40) {
      for (let i = 0; i < 2; i++) {
        const tx = this._isoX(0.2 + i*0.9, 1.5);
        const ty = this._isoY(0.2 + i*0.9, 1.5, 0.8);
        g.fillStyle(0xdddddd, 0.9);
        g.fillRect(tx-1, ty, 2, 18);
        this.specialElements.push({ type: 'turbine', x: tx, y: ty, angle: Math.random()*Math.PI*2, idx: i });
      }
    }
    if (this.id === 'transport' && this.health > 30) {
      g.lineStyle(2, 0x888888, 0.5);
      g.beginPath();
      g.moveTo(this._isoX(0,1), this._isoY(0,1,0.01));
      g.lineTo(this._isoX(2,1), this._isoY(2,1,0.01));
      g.strokePath();
    }
    if (this.id === 'housing' && this.health > 40) {
      for (let i = 0; i < 3; i++) {
        const tx = this._isoX(0.15 + i*0.7, 1.7);
        const ty = this._isoY(0.15 + i*0.7, 1.7, 0);
        g.fillStyle(0x2d7a3a, 0.9);
        g.fillCircle(tx, ty-8, 7);
        g.fillStyle(0x1a5c28, 0.8);
        g.fillRect(tx-1, ty-4, 2, 8);
      }
    }
  }

  _addInteraction() {
    this.hitZone = this.scene.add.rectangle(this.cx, this.cy, 160, 100, 0xffffff, 0);
    this.hitZone.setInteractive({ useHandCursor: true });
    this.hitZone.on('pointerover', () => {
      this.isHovered = true;
      this._showGlow();
      this.scene.tooltipManager?.show(this, this.hitZone.x, this.hitZone.y - 60);
    });
    this.hitZone.on('pointerout', () => {
      this.isHovered = false;
      this._hideGlow();
      this.scene.tooltipManager?.hide();
    });
    this.hitZone.on('pointerdown', () => {
      this._holdTimer = this.scene.time.delayedCall(500, () => {
        this.scene.tooltipManager?.show(this, this.hitZone.x, this.hitZone.y - 60);
      });
    });
    this.hitZone.on('pointerup', () => { if (this._holdTimer) this._holdTimer.remove(); });
  }

  _showGlow() {
    if (this.glowGfx) this.glowGfx.destroy();
    this.glowGfx = this.scene.add.graphics();
    const pts = [
      { x: this._isoX(0,2), y: this._isoY(0,2,0) },
      { x: this._isoX(2,2), y: this._isoY(2,2,0) },
      { x: this._isoX(2,0), y: this._isoY(2,0,0) },
      { x: this._isoX(0,0), y: this._isoY(0,0,0) }
    ];
    this.glowGfx.lineStyle(3, this.accentColor, 0.9);
    this.glowGfx.beginPath();
    this.glowGfx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(p => this.glowGfx.lineTo(p.x, p.y));
    this.glowGfx.closePath();
    this.glowGfx.strokePath();
    this.scene.tweens.add({ targets: this.glowGfx, alpha: { from: 1, to: 0.4 }, duration: 600, yoyo: true, repeat: -1 });
  }

  _hideGlow() {
    if (this.glowGfx) {
      this.scene.tweens.killTweensOf(this.glowGfx);
      this.glowGfx.destroy();
      this.glowGfx = null;
    }
  }

  receiveResource(amount) {
    this.resources += amount;
    this.health = Math.min(100, this.health + amount * 8);
    this._redraw();
    this._celebrateResource();
  }

  _celebrateResource() {
    for (let i = 0; i < 6; i++) {
      const px = this.cx + Phaser.Math.Between(-50, 50);
      const py = this.cy + Phaser.Math.Between(-20, 20);
      const spark = this.scene.add.graphics();
      spark.fillStyle(this.accentColor, 1);
      spark.fillCircle(0, 0, 3);
      spark.setPosition(px, py);
      this.scene.tweens.add({ targets: spark, y: py - 60, alpha: 0, duration: 800 + Math.random()*400, delay: i*80, onComplete: () => spark.destroy() });
    }
    const pulse = this.scene.add.graphics();
    const pts = [
      { x: this._isoX(0,2), y: this._isoY(0,2,0) }, { x: this._isoX(2,2), y: this._isoY(2,2,0) },
      { x: this._isoX(2,0), y: this._isoY(2,0,0) }, { x: this._isoX(0,0), y: this._isoY(0,0,0) }
    ];
    pulse.fillStyle(this.accentColor, 0.3);
    pulse.beginPath(); pulse.moveTo(pts[0].x, pts[0].y); pts.forEach(p => pulse.lineTo(p.x, p.y)); pulse.closePath(); pulse.fillPath();
    this.scene.tweens.add({ targets: pulse, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 600, onComplete: () => pulse.destroy() });
  }

  takeDamage(amount) {
    this.health = Math.max(5, this.health - amount);
    this._redraw();
    this._showDamage();
  }

  _showDamage() {
    const crack = this.scene.add.graphics();
    crack.lineStyle(2, 0xff4444, 0.8);
    const sx = this.cx + Phaser.Math.Between(-30,30), sy = this.cy + Phaser.Math.Between(-30,30);
    crack.beginPath();
    crack.moveTo(sx, sy);
    crack.lineTo(sx + Phaser.Math.Between(-20,20), sy + Phaser.Math.Between(10,25));
    crack.strokePath();
    this.scene.tweens.add({ targets: crack, alpha: 0, duration: 2000, delay: 1000, onComplete: () => crack.destroy() });
  }

  _redraw() {
    this.gfx.clear();
    this.buildings = [];
    this.specialElements = [];
    this._drawGround();
    this._drawBuildings();
    this._drawSpecial();
  }

  setStorm(active) {
    this.scene.tweens.add({ targets: this.gfx, alpha: active ? 0.4 : 1, duration: 1500 });
  }

  update(time, delta) {
    this.animTime += delta;
    if (this.id === 'energy' && this.health > 40) this._redrawTurbines();
    if (Math.random() < 0.002 && this.health > 30) this._spawnCitizen();
  }

  _redrawTurbines() {
    if (Math.floor(this.animTime / 100) % 3 !== 0) return;
    const g = this.gfx;
    this.specialElements.forEach(el => {
      if (el.type !== 'turbine') return;
      el.angle += 0.08;
      g.fillStyle(this.darkColor, 0.6); g.fillCircle(el.x, el.y - 10, 14);
      g.fillStyle(0xdddddd, 0.9);
      for (let b = 0; b < 3; b++) {
        const a = el.angle + (b * Math.PI * 2/3);
        g.fillRect(el.x + Math.cos(a)*2 - 1, el.y - 10 + Math.sin(a)*2 - 8, 2, 10);
      }
    });
  }

  _spawnCitizen() {
    if (!this.scene || !this.scene.sys.isActive()) return;
    const startX = this.cx + Phaser.Math.Between(-50, 50);
    const startY = this.cy + Phaser.Math.Between(-20, 20);
    const citizen = this.scene.add.graphics();
    citizen.fillStyle(0xffcc88, 1); citizen.fillCircle(0, 0, 2);
    citizen.setPosition(startX, startY);
    this.scene.tweens.add({
      targets: citizen,
      x: startX + Phaser.Math.Between(-40, 40), y: startY + Phaser.Math.Between(-20, 20),
      duration: 2000 + Math.random()*2000, alpha: { from: 0.8, to: 0 },
      onComplete: () => citizen.destroy()
    });
  }

  getName() { return currentLang === 'de' ? this.nameDE : this.name; }
  getTooltip() { return currentLang === 'de' ? this.tooltipDE : this.tooltip; }
}
