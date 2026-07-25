// Slim top bar — stats live only in the side panel (no duplication)
class HUD {
  constructor(scene) {
    this.scene = scene;
    this.S = scene.S || 1;
    this.year = 2024;
    this.container = scene.add.container(0,0).setDepth(52);
    this._build();
  }
  s(v){ return Math.round(v * this.S); }

  _build() {
    const W = this.scene.scale.width, H = this.s(44);
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x040a14, 0.92); bg.fillRect(0,0,W,H);
    bg.lineStyle(1, 0x1e3350, 1); bg.lineBetween(0,H,W,H);
    this.container.add(bg);

    this.levelText = this.scene.add.text(this.s(20), H/2, 'LEVEL 1', {
      fontFamily:'Playfair Display, Georgia, serif', fontSize:this.s(15),
      color:'#e2a840', letterSpacing:2
    }).setOrigin(0,0.5);
    this.container.add(this.levelText);

    this.titleText = this.scene.add.text(this.s(130), H/2, '', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(13), color:'#8aa4c0'
    }).setOrigin(0,0.5);
    this.container.add(this.titleText);

    this.yearText = this.scene.add.text(W - this.s(20), H/2, 'Year 2024', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(13), color:'#5a7d9e'
    }).setOrigin(1,0.5);
    this.container.add(this.yearText);
  }

  updateStats(){ /* stats live in StatsPanel only */ }

  setLevel(n, name) {
    this.levelText.setText('LEVEL ' + n);
    this.titleText.setText(name || '');
  }

  advanceYear(y) {
    this.year += (y || 1);
    this.yearText.setText('Year ' + this.year);
  }

  showMessage(text, dur) {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    const m = this.scene.add.text(W/2, H - this.s(140), text, {
      fontFamily:'Playfair Display, Georgia, serif', fontSize:this.s(16),
      color:'#e2a840', align:'center', backgroundColor:'#040a14',
      padding:{x:this.s(18),y:this.s(10)}
    }).setOrigin(0.5).setDepth(66).setAlpha(0);
    this.scene.tweens.add({targets:m,alpha:1,duration:900,hold:dur||4000,yoyo:true,onComplete:()=>m.destroy()});
  }

  showLevelTitle(n, title) {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    const ov = this.scene.add.graphics().setDepth(80);
    ov.fillStyle(0x040a14, 0.72); ov.fillRect(0, H/2-this.s(64), W, this.s(128));
    const lbl = this.scene.add.text(W/2, H/2-this.s(26), 'LEVEL ' + n, {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(13),
      color:'#e2a840', letterSpacing:6
    }).setOrigin(0.5).setDepth(81).setAlpha(0);
    const ttl = this.scene.add.text(W/2, H/2+this.s(14), title, {
      fontFamily:'Playfair Display, Georgia, serif', fontSize:this.s(34), color:'#f0f4ff'
    }).setOrigin(0.5).setDepth(81).setAlpha(0);
    ov.setAlpha(0);
    this.scene.tweens.add({
      targets:[ov,lbl,ttl], alpha:1, duration:800, hold:1800, yoyo:true,
      onComplete:()=>{ ov.destroy(); lbl.destroy(); ttl.destroy(); }
    });
  }
}
