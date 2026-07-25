// Storm = rain + thunder. No screen darkening, so text stays readable.
class WeatherSystem {
  constructor(scene) {
    this.scene = scene;
    this.S = scene.S || 1;
    this.isStorming = false;
    this.rain = [];
    this.rainGfx = scene.add.graphics().setDepth(70);
    this.tint    = scene.add.graphics().setDepth(6);
  }
  s(v){ return Math.round(v*this.S); }
  get W(){ return this.scene.scale.width; }
  get H(){ return this.scene.scale.height; }

  startStorm(onPeak) {
    this.isStorming = true;
    const o={a:0};
    this.scene.tweens.add({targets:o,a:1,duration:2000,
      onUpdate:()=>{ this.tint.clear();
        this.tint.fillStyle(0x2a4a6a, o.a*0.18);
        this.tint.fillRect(0,0,this.W,this.H); }});
    this.scene.time.delayedCall(700,  ()=>this._rain(110));
    this.scene.time.delayedCall(1400, ()=>this._thunder());
    this.scene.time.delayedCall(2900, ()=>{ this._rain(150); this._thunder(); if(onPeak) onPeak(); });
    this.scene.time.delayedCall(4300, ()=>this._thunder());
    this._loop = this.scene.time.addEvent({delay:5200, loop:true, callback:()=>{ if(this.isStorming) this._thunder(); }});
  }

  _rain(n){
    for(let i=0;i<n;i++){
      this.rain.push({ x:Phaser.Math.Between(-80,this.W+80), y:Phaser.Math.Between(-this.H,this.H),
        sp:8+Math.random()*9, len:this.s(13)+Math.random()*this.s(12), a:0.3+Math.random()*0.35 });
    }
  }

  _thunder(){
    const f=this.scene.add.graphics().setDepth(72);
    const lx=Phaser.Math.Between(this.W*0.15,this.W*0.85);
    f.lineStyle(this.s(3),0xffffff,1);
    f.beginPath();
    f.moveTo(lx,0);
    f.lineTo(lx-this.s(24),this.s(80));
    f.lineTo(lx+this.s(14),this.s(80));
    f.lineTo(lx-this.s(18),this.s(190));
    f.lineTo(lx+this.s(6), this.s(190));
    f.lineTo(lx-this.s(10),this.s(300));
    f.strokePath();
    f.lineStyle(this.s(8),0xbfe4ff,0.35);
    f.beginPath(); f.moveTo(lx,0); f.lineTo(lx-this.s(24),this.s(80)); f.lineTo(lx-this.s(18),this.s(190)); f.strokePath();
    const bloom=this.scene.add.graphics().setDepth(71);
    bloom.fillStyle(0xdff0ff,0.26); bloom.fillRect(0,0,this.W,this.H);
    this.scene.tweens.add({targets:[f,bloom],alpha:0,duration:280,onComplete:()=>{f.destroy();bloom.destroy();}});
    this.scene.cameras.main.shake(180,0.003);
  }

  stopStorm(delay){
    this.isStorming=false;
    if(this._loop){ this._loop.remove(); this._loop=null; }
    this.scene.time.delayedCall(delay||1000,()=>{
      const o={a:1};
      this.scene.tweens.add({targets:o,a:0,duration:2600,
        onUpdate:()=>{ this.tint.clear(); this.tint.fillStyle(0x2a4a6a,o.a*0.18); this.tint.fillRect(0,0,this.W,this.H); },
        onComplete:()=>{ this.tint.clear(); this.rain=[]; this.rainGfx.clear(); }});
    });
  }

  startRecovery(onDone){
    this.stopStorm(0);
    this.scene.time.delayedCall(500,()=>{
      const b=this.scene.add.graphics().setDepth(6);
      const o={a:0};
      this.scene.tweens.add({targets:o,a:0.22,duration:1800,yoyo:true,
        onUpdate:()=>{ b.clear(); b.fillStyle(0xfff0d8,o.a); b.fillRect(0,0,this.W,this.H); },
        onComplete:()=>{ b.destroy(); if(onDone) onDone(); }});
    });
  }

  update(delta){
    if(!this.isStorming || !this.rain.length){ if(!this.isStorming) this.rainGfx.clear(); return; }
    this.rainGfx.clear();
    this.rainGfx.lineStyle(this.s(1.3),0xa8d8f5,0.55);
    const W=this.W,H=this.H;
    this.rain.forEach(d=>{
      d.y+=d.sp*(delta/16); d.x-=2*(delta/16);
      if(d.y>H){ d.y=Phaser.Math.Between(-90,-10); d.x=Phaser.Math.Between(-80,W+80); }
      this.rainGfx.beginPath();
      this.rainGfx.moveTo(d.x,d.y);
      this.rainGfx.lineTo(d.x-this.s(3.4), d.y+d.len);
      this.rainGfx.strokePath();
    });
  }
}
