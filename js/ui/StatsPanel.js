class StatsPanel {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0,0).setDepth(56);
    this.bars = {};
    this.history = { happiness:[], development:[], resources:[] };
    this.px = 10; this.py = 62; this.pw = 104; this.ph = 400;
    this._build();
  }

  _build() {
    const px=this.px, py=this.py, pw=this.pw, ph=this.ph;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x040a14, 0.9); bg.fillRoundedRect(px,py,pw,ph,12);
    bg.lineStyle(1, 0x1a2744, 1); bg.strokeRoundedRect(px,py,pw,ph,12);
    bg.lineStyle(2, 0xe2a840, 0.35); bg.lineBetween(px+pw, py+10, px+pw, py+ph-10);
    this.container.add(bg);

    const title = this.scene.add.text(px+pw/2, py+16, 'CITY', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:9, color:'#e2a840', letterSpacing:5
    }).setOrigin(0.5);
    this.container.add(title);

    const stats = [
      {id:'happiness',   icon:'\u2764',  label:'Happy',  color:0xe74c7c, y:py+38},
      {id:'development', icon:'\uD83C\uDFD7',  label:'Growth', color:0x4ecdc4, y:py+96},
      {id:'resources',   icon:'\uD83D\uDCB0',  label:'Funds',  color:0xe2a840, y:py+154}
    ];

    stats.forEach(s => {
      const icon = this.scene.add.text(px+pw/2, s.y, s.icon, {fontSize:17}).setOrigin(0.5);
      const lbl  = this.scene.add.text(px+pw/2, s.y+20, s.label, {
        fontFamily:'Inter, Arial, sans-serif', fontSize:9, color:'#6b8aaa'
      }).setOrigin(0.5);
      const barBg = this.scene.add.graphics();
      barBg.fillStyle(0x16223a,1); barBg.fillRoundedRect(px+12, s.y+32, pw-24, 8, 4);
      const barFill = this.scene.add.graphics();
      const val = this.scene.add.text(px+pw/2, s.y+46, '50', {
        fontFamily:'Inter, Arial, sans-serif', fontSize:10, color:'#4a6080', fontStyle:'600'
      }).setOrigin(0.5);
      this.bars[s.id] = { fill:barFill, color:s.color, x:px+12, y:s.y+32, maxW:pw-24, disp:50, text:val };
      this.container.add([icon,lbl,barBg,barFill,val]);
    });

    // Trend chart fills the lower space
    const chartY = py+212;
    const chartH = 150;
    const chartTitle = this.scene.add.text(px+pw/2, chartY-10, 'TREND', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:8, color:'#3a5a7a', letterSpacing:4
    }).setOrigin(0.5);
    this.container.add(chartTitle);

    const chartBg = this.scene.add.graphics();
    chartBg.fillStyle(0x08121f, 0.85); chartBg.fillRoundedRect(px+10, chartY, pw-20, chartH, 8);
    chartBg.lineStyle(1, 0x16223a, 1); chartBg.strokeRoundedRect(px+10, chartY, pw-20, chartH, 8);
    chartBg.lineStyle(1, 0x14203a, 0.8);
    for (let i=1;i<4;i++){
      const gy = chartY + (chartH/4)*i;
      chartBg.lineBetween(px+14, gy, px+pw-14, gy);
    }
    this.container.add(chartBg);

    this.chart = { x:px+14, y:chartY+6, w:pw-28, h:chartH-12 };
    this.chartGfx = this.scene.add.graphics().setDepth(57);
    this.container.add(this.chartGfx);

    const legY = chartY + chartH + 10;
    const legend = [
      {c:0xe74c7c, t:'Happy'},
      {c:0x4ecdc4, t:'Growth'},
      {c:0xe2a840, t:'Funds'}
    ];
    legend.forEach((l,i) => {
      const ly = legY + i*13;
      const dot = this.scene.add.graphics();
      dot.fillStyle(l.c, 0.9); dot.fillRect(px+14, ly, 8, 2.5);
      const t = this.scene.add.text(px+27, ly-4, l.t, {
        fontFamily:'Inter, Arial, sans-serif', fontSize:8, color:'#4a6080'
      });
      this.container.add([dot,t]);
    });

    this._redrawAll();
  }

  updateStats(h, d, r) {
    const vals = {happiness:h, development:d, resources:r};
    Object.entries(this.bars).forEach(([id,bar]) => {
      const target = Math.max(0, Math.min(100, vals[id]));
      this.scene.tweens.add({
        targets:bar, disp:target, duration:650, ease:'Power2.easeOut',
        onUpdate:()=>this._redrawBar(id)
      });
    });
  }

  recordSnapshot(h, d, r) {
    this.history.happiness.push(Math.max(0,Math.min(100,h)));
    this.history.development.push(Math.max(0,Math.min(100,d)));
    this.history.resources.push(Math.max(0,Math.min(100,r)));
    if (this.history.happiness.length > 12) {
      this.history.happiness.shift();
      this.history.development.shift();
      this.history.resources.shift();
    }
    this._drawChart();
  }

  _drawChart() {
    const g = this.chartGfx;
    const x=this.chart.x, y=this.chart.y, w=this.chart.w, h=this.chart.h;
    g.clear();
    const series = [
      {data:this.history.happiness,   c:0xe74c7c},
      {data:this.history.development, c:0x4ecdc4},
      {data:this.history.resources,   c:0xe2a840}
    ];
    series.forEach(s => {
      if (s.data.length < 2) {
        if (s.data.length === 1) {
          g.fillStyle(s.c, 0.9);
          g.fillCircle(x, y + h - (s.data[0]/100)*h, 2);
        }
        return;
      }
      const step = w / Math.max(1, s.data.length - 1);
      g.lineStyle(1.8, s.c, 0.85);
      g.beginPath();
      s.data.forEach((v,i) => {
        const px = x + i*step, py = y + h - (v/100)*h;
        if (i===0) g.moveTo(px,py); else g.lineTo(px,py);
      });
      g.strokePath();
      const last = s.data[s.data.length-1];
      g.fillStyle(s.c, 1);
      g.fillCircle(x + (s.data.length-1)*step, y + h - (last/100)*h, 2.4);
    });
  }

  _redrawAll(){ Object.keys(this.bars).forEach(id=>this._redrawBar(id)); }

  _redrawBar(id) {
    const b = this.bars[id];
    const pct = b.disp/100;
    b.fill.clear();
    b.fill.fillStyle(b.color, 0.10); b.fill.fillRoundedRect(b.x,b.y,b.maxW,8,4);
    b.fill.fillStyle(b.color, 0.92); b.fill.fillRoundedRect(b.x,b.y,Math.max(3,b.maxW*pct),8,4);
    if (b.text) {
      b.text.setText(Math.round(b.disp));
      b.text.setColor(pct<0.3?'#e74c3c':pct>0.7?'#4ecdc4':'#6b8aaa');
    }
  }
}
