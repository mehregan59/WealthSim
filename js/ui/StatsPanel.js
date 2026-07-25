class StatsPanel {
  constructor(scene) {
    this.scene = scene;
    this.container = scene.add.container(0,0).setDepth(56);
    this.bars = {};
    this.history = { happiness:[], development:[], resources:[] };
    this.levels  = [];
    this.xLabels = [];
    this.px = 12; this.py = 60; this.pw = 148; this.ph = 448;
    this._build();
  }

  _build() {
    const px=this.px, py=this.py, pw=this.pw, ph=this.ph;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x061019, 0.93); bg.fillRoundedRect(px,py,pw,ph,12);
    bg.lineStyle(1, 0x1e3350, 1);  bg.strokeRoundedRect(px,py,pw,ph,12);
    bg.lineStyle(2, 0xe2a840, 0.4); bg.lineBetween(px+pw, py+12, px+pw, py+ph-12);
    this.container.add(bg);

    const title = this.scene.add.text(px+pw/2, py+16, 'CITY STATUS', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:9, color:'#e2a840', letterSpacing:3
    }).setOrigin(0.5);
    this.container.add(title);

    // Compact horizontal stat rows
    const stats = [
      {id:'happiness',   icon:'\u2764', label:'Happy',  color:0xe74c7c, hex:'#e74c7c', y:py+40},
      {id:'development', icon:'\u25B2', label:'Growth', color:0x4ecdc4, hex:'#4ecdc4', y:py+72},
      {id:'resources',   icon:'\u25C6', label:'Funds',  color:0xe2a840, hex:'#e2a840', y:py+104}
    ];
    stats.forEach(s => {
      const ic = this.scene.add.text(px+14, s.y, s.icon, {
        fontFamily:'Arial, sans-serif', fontSize:11, color:s.hex
      }).setOrigin(0,0.5);
      const lb = this.scene.add.text(px+30, s.y, s.label, {
        fontFamily:'Inter, Arial, sans-serif', fontSize:10, color:'#8aa4c0'
      }).setOrigin(0,0.5);
      const vt = this.scene.add.text(px+pw-14, s.y, '50', {
        fontFamily:'Inter, Arial, sans-serif', fontSize:11, color:'#c8d8ea', fontStyle:'700'
      }).setOrigin(1,0.5);
      const barBg = this.scene.add.graphics();
      barBg.fillStyle(0x152744,1); barBg.fillRoundedRect(px+14, s.y+10, pw-28, 6, 3);
      const barFill = this.scene.add.graphics();
      this.bars[s.id] = { fill:barFill, color:s.color, x:px+14, y:s.y+10, maxW:pw-28, disp:50, text:vt };
      this.container.add([ic,lb,vt,barBg,barFill]);
    });

    // Trend chart with X and Y axes
    const cTop = py+142, cH = 190;
    const chartTitle = this.scene.add.text(px+14, cTop-14, 'CITY TREND', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:8, color:'#4a6d92', letterSpacing:3
    });
    this.container.add(chartTitle);

    const plotX = px+30, plotY = cTop+6, plotW = pw-44, plotH = cH-30;
    this.chart = { x:plotX, y:plotY, w:plotW, h:plotH };

    const axes = this.scene.add.graphics();
    axes.fillStyle(0x040c16, 0.9);
    axes.fillRect(plotX, plotY, plotW, plotH);
    [0,25,50,75,100].forEach(v => {
      const gy = plotY + plotH - (v/100)*plotH;
      axes.lineStyle(1, v===50 ? 0x1e3350 : 0x152744, v===50 ? 0.9 : 0.55);
      axes.lineBetween(plotX, gy, plotX+plotW, gy);
      if (v % 50 === 0) {
        const t = this.scene.add.text(plotX-5, gy, String(v), {
          fontFamily:'Inter, Arial, sans-serif', fontSize:8, color:'#4a6d92'
        }).setOrigin(1,0.5);
        this.container.add(t);
      }
    });
    axes.lineStyle(1.4, 0x2c4767, 1);
    axes.lineBetween(plotX, plotY, plotX, plotY+plotH);
    axes.lineBetween(plotX, plotY+plotH, plotX+plotW, plotY+plotH);
    this.container.add(axes);

    const yCap = this.scene.add.text(px+8, plotY+plotH/2, 'SCORE', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:7, color:'#3f5f80', letterSpacing:1
    }).setOrigin(0.5).setAngle(-90);
    this.container.add(yCap);

    const xCap = this.scene.add.text(plotX+plotW/2, plotY+plotH+20, 'LEVEL', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:7, color:'#3f5f80', letterSpacing:2
    }).setOrigin(0.5);
    this.container.add(xCap);

    this.chartGfx = this.scene.add.graphics().setDepth(58);
    this.container.add(this.chartGfx);

    const legY = plotY+plotH+34;
    [{c:0xe74c7c,t:'Happy'},{c:0x4ecdc4,t:'Growth'},{c:0xe2a840,t:'Funds'}].forEach((l,i)=>{
      const lx = px+14 + i*45;
      const dot = this.scene.add.graphics();
      dot.fillStyle(l.c,0.95); dot.fillRect(lx, legY, 10, 2.5);
      const tx = this.scene.add.text(lx+13, legY-4, l.t, {
        fontFamily:'Inter, Arial, sans-serif', fontSize:7.5, color:'#5a7d9e'
      });
      this.container.add([dot,tx]);
    });

    this._redrawAll();
  }

  updateStats(h,d,r) {
    const vals = {happiness:h, development:d, resources:r};
    Object.entries(this.bars).forEach(([id,bar]) => {
      const target = Math.max(0, Math.min(100, vals[id]));
      this.scene.tweens.add({ targets:bar, disp:target, duration:700, ease:'Power2.easeOut', onUpdate:()=>this._redrawBar(id) });
    });
  }

  recordSnapshot(h,d,r,level) {
    this.history.happiness.push(Math.max(0,Math.min(100,h)));
    this.history.development.push(Math.max(0,Math.min(100,d)));
    this.history.resources.push(Math.max(0,Math.min(100,r)));
    this.levels.push(level === undefined ? this.levels.length : level);
    const MAX = 9;
    while (this.history.happiness.length > MAX) {
      this.history.happiness.shift(); this.history.development.shift();
      this.history.resources.shift(); this.levels.shift();
    }
    this._drawChart();
  }

  _drawChart() {
    const g = this.chartGfx;
    const x=this.chart.x, y=this.chart.y, w=this.chart.w, h=this.chart.h;
    g.clear();

    this.xLabels.forEach(t=>{ try{t.destroy();}catch(e){} });
    this.xLabels = [];
    const n = this.levels.length;
    if (n > 0) {
      const step = n>1 ? w/(n-1) : 0;
      this.levels.forEach((lv,i) => {
        if (n > 5 && i % 2 !== 0 && i !== n-1) return;
        const t = this.scene.add.text(x + i*step, y+h+8, String(lv), {
          fontFamily:'Inter, Arial, sans-serif', fontSize:8, color:'#4a6d92'
        }).setOrigin(0.5,0).setDepth(58);
        this.xLabels.push(t);
        this.container.add(t);
      });
    }

    const series = [
      {data:this.history.happiness,   c:0xe74c7c},
      {data:this.history.development, c:0x4ecdc4},
      {data:this.history.resources,   c:0xe2a840}
    ];
    series.forEach(s => {
      if (!s.data.length) return;
      const step = s.data.length>1 ? w/(s.data.length-1) : 0;
      if (s.data.length === 1) {
        g.fillStyle(s.c,0.95); g.fillCircle(x, y+h-(s.data[0]/100)*h, 2.6);
        return;
      }
      g.lineStyle(2, s.c, 0.9);
      g.beginPath();
      s.data.forEach((v,i)=>{
        const pxp = x+i*step, pyp = y+h-(v/100)*h;
        if(i===0) g.moveTo(pxp,pyp); else g.lineTo(pxp,pyp);
      });
      g.strokePath();
      g.fillStyle(s.c, 0.95);
      s.data.forEach((v,i)=>{ g.fillCircle(x+i*step, y+h-(v/100)*h, 1.8); });
      const last=s.data[s.data.length-1];
      g.fillStyle(0x061019,1); g.fillCircle(x+(s.data.length-1)*step, y+h-(last/100)*h, 3.4);
      g.fillStyle(s.c,1);      g.fillCircle(x+(s.data.length-1)*step, y+h-(last/100)*h, 2.4);
    });
  }

  _redrawAll(){ Object.keys(this.bars).forEach(id=>this._redrawBar(id)); }

  _redrawBar(id) {
    const b=this.bars[id], pct=b.disp/100;
    b.fill.clear();
    b.fill.fillStyle(b.color,0.12); b.fill.fillRoundedRect(b.x,b.y,b.maxW,6,3);
    b.fill.fillStyle(b.color,0.95); b.fill.fillRoundedRect(b.x,b.y,Math.max(3,b.maxW*pct),6,3);
    if (b.text) {
      b.text.setText(Math.round(b.disp));
      b.text.setColor(pct<0.3?'#e74c3c':pct>0.7?'#4ecdc4':'#c8d8ea');
    }
  }
}
