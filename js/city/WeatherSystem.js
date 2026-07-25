class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.isStorming = false;
    this.rain = [];
    this.rainGfx = scene.add.graphics().setDepth(70);
    this.overlay = scene.add.graphics().setDepth(68);
  }

  get W(){ return this.scene.scale.width; }
  get H(){ return this.scene.scale.height; }

  startStorm(onPeak) {
    this.isStorming = true;
    const o = { a: 0 };
    this.scene.tweens.add({
      targets: o, a: 1, duration: 2200,
      onUpdate: () => {
        this.overlay.clear();
        this.overlay.fillStyle(0x00121f, o.a * 0.55);
        this.overlay.fillRect(0, 0, this.W, this.H);
      }
    });
    this.scene.time.delayedCall(900,  () => this._rain(90));
    this.scene.time.delayedCall(1500, () => this._flash());
    this.scene.time.delayedCall(3000, () => { this._rain(120); this._flash(); if (onPeak) onPeak(); });
    this.scene.time.delayedCall(4200, () => this._flash());
  }

  _rain(n) {
    for (let i = 0; i < n; i++) {
      this.rain.push({
        x: Phaser.Math.Between(-60, this.W + 60),
        y: Phaser.Math.Between(-this.H, this.H),
        sp: 9 + Math.random() * 9,
        len: 12 + Math.random() * 12,
        a: 0.25 + Math.random() * 0.4
      });
    }
  }

  _flash() {
    const f = this.scene.add.graphics().setDepth(90);
    const lx = Phaser.Math.Between(this.W * 0.2, this.W * 0.8);
    f.lineStyle(3, 0xffffff, 1);
    f.beginPath();
    f.moveTo(lx, 0); f.lineTo(lx - 22, 90); f.lineTo(lx + 12, 90); f.lineTo(lx - 16, 200);
    f.strokePath();
    f.fillStyle(0xffffff, 0.5);
    f.fillRect(0, 0, this.W, this.H);
    this.scene.tweens.add({ targets: f, alpha: 0, duration: 260, onComplete: () => f.destroy() });
    this.scene.time.delayedCall(90, () => {
      const f2 = this.scene.add.graphics().setDepth(90);
      f2.fillStyle(0xffffff, 0.26); f2.fillRect(0, 0, this.W, this.H);
      this.scene.tweens.add({ targets: f2, alpha: 0, duration: 140, onComplete: () => f2.destroy() });
    });
  }

  stopStorm(delay) {
    this.isStorming = false;
    this.scene.time.delayedCall(delay || 1200, () => {
      const o = { a: 1 };
      this.scene.tweens.add({
        targets: o, a: 0, duration: 3200,
        onUpdate: () => {
          this.overlay.clear();
          this.overlay.fillStyle(0x00121f, o.a * 0.55);
          this.overlay.fillRect(0, 0, this.W, this.H);
        },
        onComplete: () => { this.overlay.clear(); this.rain = []; this.rainGfx.clear(); }
      });
    });
  }

  startRecovery(onDone) {
    this.stopStorm(0);
    this.scene.time.delayedCall(600, () => {
      const b = this.scene.add.graphics().setDepth(60);
      const o = { a: 0 };
      this.scene.tweens.add({
        targets: o, a: 0.3, duration: 2200, yoyo: true,
        onUpdate: () => { b.clear(); b.fillStyle(0xffeedd, o.a); b.fillRect(0, 0, this.W, this.H); },
        onComplete: () => { b.destroy(); if (onDone) onDone(); }
      });
    });
  }

  update(delta) {
    if (!this.isStorming || !this.rain.length) { if (!this.isStorming) this.rainGfx.clear(); return; }
    this.rainGfx.clear();
    this.rainGfx.lineStyle(1.2, 0x9fd0ee, 0.5);
    const W = this.W, H = this.H;
    this.rain.forEach(d => {
      d.y += d.sp * (delta / 16);
      d.x -= 2.2 * (delta / 16);
      if (d.y > H) { d.y = Phaser.Math.Between(-80, -10); d.x = Phaser.Math.Between(-60, W + 60); }
      this.rainGfx.beginPath();
      this.rainGfx.moveTo(d.x, d.y);
      this.rainGfx.lineTo(d.x - 3.4, d.y + d.len);
      this.rainGfx.strokePath();
    });
  }
}
