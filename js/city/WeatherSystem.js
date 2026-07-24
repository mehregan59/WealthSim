class WeatherSystem {
  constructor(scene) {
    this.scene = scene; this.isStorming = false; this.rainDrops = [];
    this.rainGfx = scene.add.graphics().setDepth(30);
    this.overlayGfx = scene.add.graphics().setDepth(28);
  }

  startStorm(onPeakCallback) {
    this.isStorming = true;
    this.scene.tweens.add({
      targets: this.overlayGfx, alpha: {from:0,to:1}, duration: 2000,
      onUpdate: (tween) => { this.overlayGfx.clear(); const a=tween.getValue()*0.5; this.overlayGfx.fillStyle(0x001022,a); this.overlayGfx.fillRect(0,0,1280,720); }
    });
    this.scene.time.delayedCall(1000, () => this._startRain());
    this.scene.time.delayedCall(1500, () => this._flashLightning());
    this.scene.time.delayedCall(3000, () => { this._heavyRain(); this._flashLightning(); if(onPeakCallback) onPeakCallback(); });
    this.scene.time.delayedCall(4000, () => this._flashLightning());
  }

  _startRain() {
    for (let i = 0; i < 80; i++) this.rainDrops.push({ x:Phaser.Math.Between(0,1280), y:Phaser.Math.Between(-200,720), speed:8+Math.random()*6, length:10+Math.random()*8, alpha:0.3+Math.random()*0.4 });
  }

  _heavyRain() {
    for (let i = 0; i < 120; i++) this.rainDrops.push({ x:Phaser.Math.Between(0,1280), y:Phaser.Math.Between(-200,720), speed:12+Math.random()*8, length:14+Math.random()*10, alpha:0.4+Math.random()*0.5 });
  }

  _flashLightning() {
    const flash = this.scene.add.graphics().setDepth(50);
    const lx = Phaser.Math.Between(200,1000);
    flash.lineStyle(3,0xffffff,1); flash.beginPath(); flash.moveTo(lx,0); flash.lineTo(lx-20,80); flash.lineTo(lx+10,80); flash.lineTo(lx-15,180); flash.strokePath();
    flash.fillStyle(0xffffff,0.6); flash.fillRect(0,0,1280,720);
    this.scene.tweens.add({ targets:flash, alpha:0, duration:200, onComplete:()=>flash.destroy() });
    this.scene.time.delayedCall(80, () => { const f2=this.scene.add.graphics().setDepth(50); f2.fillStyle(0xffffff,0.3); f2.fillRect(0,0,1280,720); this.scene.tweens.add({targets:f2,alpha:0,duration:100,onComplete:()=>f2.destroy()}); });
  }

  stopStorm(duration) {
    this.isStorming = false;
    this.scene.time.delayedCall(duration||2000, () => {
      this.scene.tweens.add({ targets:this.overlayGfx, alpha:0, duration:3000, onComplete:()=>{ this.overlayGfx.clear(); this.rainDrops=[]; this.rainGfx.clear(); } });
    });
  }

  startRecovery(onComplete) {
    this.stopStorm(0);
    this.scene.time.delayedCall(500, () => {
      const bright = this.scene.add.graphics().setDepth(15);
      bright.fillStyle(0xffeedd,0); bright.fillRect(0,0,1280,720);
      this.scene.tweens.add({ targets:bright, alpha:{from:0,to:0.3}, duration:2000, yoyo:true, onComplete:()=>{ bright.destroy(); if(onComplete) onComplete(); } });
    });
  }

  update(delta) {
    if (!this.isStorming || this.rainDrops.length===0) { if(!this.isStorming) this.rainGfx.clear(); return; }
    this.rainGfx.clear();
    this.rainGfx.lineStyle(1,0x88bbdd,0.5);
    this.rainDrops.forEach(drop => {
      drop.y+=drop.speed*(delta/16); drop.x-=2*(delta/16);
      if(drop.y>720){drop.y=Phaser.Math.Between(-50,-10);drop.x=Phaser.Math.Between(0,1280);}
      this.rainGfx.beginPath(); this.rainGfx.moveTo(drop.x,drop.y); this.rainGfx.lineTo(drop.x-3,drop.y+drop.length); this.rainGfx.strokePath();
    });
  }
}
