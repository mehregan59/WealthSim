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
    bg.fillStyle(0xfffbf1, 0.92); bg.fillRect(0,0,W,H);
    bg.lineStyle(1, 0x7ca5a1, 1); bg.lineBetween(0,H,W,H);
    this.container.add(bg);

    this.levelText = this.scene.add.text(this.s(20), H/2, 'LEVEL 1', {
      fontFamily:CityTheme.heading, fontSize:this.s(15),
      color:'#296b72', letterSpacing:2
    }).setOrigin(0,0.5);
    this.container.add(this.levelText);

    this.titleText = this.scene.add.text(this.s(130), H/2, '', {
      fontFamily:CityTheme.body, fontSize:this.s(13), color:'#55777a'
    }).setOrigin(0,0.5);
    this.container.add(this.titleText);
    if (W < 700) this.titleText.setVisible(false);

    this.yearText = this.scene.add.text(W - this.s(20), H/2, 'Year 2024', {
      fontFamily:CityTheme.body, fontSize:this.s(13), color:'#55777a'
    }).setOrigin(1,0.5);
    this.container.add(this.yearText);
    if (W < 700) this.yearText.setText(String(this.year));

    // City name, sitting right next to the year rather than as a separate
    // element elsewhere on screen.
    const cityName = this.scene.cityName || '';
    if (cityName) {
      this.cityText = this.scene.add.text(this.yearText.x - this.yearText.width - this.s(16), H/2, cityName, {
        fontFamily:CityTheme.heading, fontSize:this.s(14),
        color:'#296b72', fontStyle:'600'
      }).setOrigin(1,0.5);
      this.container.add(this.cityText);
      if (W < 700) this.cityText.setVisible(false);
      const sep = this.scene.add.graphics();
      sep.fillStyle(0x7ca5a1,1);
      sep.fillCircle(this.cityText.x - this.cityText.width - this.s(8), H/2, this.s(1.6));
      this.container.add(sep);
    }
  }

  updateStats(){ /* stats live in StatsPanel only */ }

  setLevel(n, name) {
    this.levelText.setText('LEVEL ' + n);
    this.titleText.setText(name || '');
  }

  advanceYear(y) {
    this.year += (y || 1);
    this.yearText.setText(this.scene.scale.width < 700 ? String(this.year) : 'Year ' + this.year);
  }

  showMessage(text, dur) {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    const m = this.scene.add.text(W/2, H - this.s(140), text, {
      fontFamily:CityTheme.heading, fontSize:this.s(16),
      color:'#296b72', align:'center', backgroundColor:'#fffbf1',
      padding:{x:this.s(18),y:this.s(10)}
    }).setOrigin(0.5).setDepth(66).setAlpha(0);
    this.scene.tweens.add({targets:m,alpha:1,duration:720,hold:dur?dur*.8:3200,yoyo:true,onComplete:()=>m.destroy()});
  }

  showLevelTitle(n, title) {
    const W = this.scene.scale.width, H = this.scene.scale.height;
    const ov = this.scene.add.graphics().setDepth(80);
    ov.fillStyle(0xfffbf1, 0.72); ov.fillRect(0, H/2-this.s(64), W, this.s(128));
    const lbl = this.scene.add.text(W/2, H/2-this.s(26), 'LEVEL ' + n, {
      fontFamily:CityTheme.body, fontSize:this.s(13),
      color:'#296b72', letterSpacing:6
    }).setOrigin(0.5).setDepth(81).setAlpha(0);
    const ttl = this.scene.add.text(W/2, H/2+this.s(14), title, {
      fontFamily:CityTheme.heading, fontSize:this.s(34), color:'#173b40'
    }).setOrigin(0.5).setDepth(81).setAlpha(0);
    ov.setAlpha(0);
    this.scene.tweens.add({
      targets:[ov,lbl,ttl], alpha:1, duration:224, hold:496, yoyo:true,
      onComplete:()=>{ ov.destroy(); lbl.destroy(); ttl.destroy(); }
    });
  }
}
