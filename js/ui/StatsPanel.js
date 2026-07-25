// Full-height side panel: stats, trend chart with axes, text-size control
class StatsPanel {
  constructor(scene) {
    this.scene = scene;
    this.S = scene.S || 1;
    this.container = scene.add.container(0,0).setDepth(56);
    this.bars = {};
    this.history = { happiness:[], development:[], resources:[] };
    this.levels = [];
    this.xLabels = [];
    this.px = 0;
    this.py = this.s(44);                    // flush under the top bar
    this.pw = scene.PANEL;
    this.ph = scene.scale.height - this.py;  // flush to the bottom
    this._build();
  }
  s(v){ return Math.round(v * this.S); }

  _build() {
    const px=this.px, py=this.py, pw=this.pw, ph=this.ph;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x061019, 0.95); bg.fillRect(px, py, pw, ph);
    bg.lineStyle(this.s(2), 0xe2a840, 0.45); bg.lineBetween(px+pw, py, px+pw, py+ph);
    this.container.add(bg);

    const pad = this.s(18);
    let y = py + this.s(26);

    const title = this.scene.add.text(px+pad, y, 'CITY STATUS', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(11),
      color:'#e2a840', letterSpacing:3, fontStyle:'700'
    }).setOrigin(0,0.5);
    this.container.add(title);
    y += this.s(28);

    const stats = [
      {id:'happiness',   icon:'\u2764', label:'Happy',  color:0xe74c7c, hex:'#e74c7c'},
      {id:'development', icon:'\u25B2', label:'Growth', color:0x4ecdc4, hex:'#4ecdc4'},
      {id:'resources',   icon:'\u25C6', label:'Funds',  color:0xe2a840, hex:'#e2a840'}
    ];
    stats.forEach(st => {
      const ic = this.scene.add.text(px+pad, y, st.icon, {
        fontFamily:'Arial, sans-serif', fontSize:this.s(13), color:st.hex
      }).setOrigin(0,0.5);
      const lb = this.scene.add.text(px+pad+this.s(20), y, st.label, {
        fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(14), color:'#a8c0d8'
      }).setOrigin(0,0.5);
      const vt = this.scene.add.text(px+pw-pad, y, '50', {
        fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(16),
        color:'#e8f2ff', fontStyle:'700'
      }).setOrigin(1,0.5);
      const bBg = this.scene.add.graphics();
      bBg.fillStyle(0x152744,1);
      bBg.fillRoundedRect(px+pad, y+this.s(13), pw-pad*2, this.s(8), this.s(4));
      const bFill = this.scene.add.graphics();
      this.bars[st.id] = { fill:bFill, color:st.color, x:px+pad, y:y+this.s(13),
                           maxW:pw-pad*2, h:this.s(8), disp:50, text:vt };
      this.container.add([ic,lb,vt,bBg,bFill]);
      y += this.s(44);
    });

    // Trend chart
    y += this.s(6);
    const cTitle = this.scene.add.text(px+pad, y, 'CITY TREND', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(10),
      color:'#5a7d9e', letterSpacing:3, fontStyle:'600'
    }).setOrigin(0,0.5);
    this.container.add(cTitle);
    y += this.s(16);

    const plotX = px + pad + this.s(24);
    const plotY = y;
    const plotW = pw - pad*2 - this.s(24);
    const plotH = this.s(190);
    this.chart = { x:plotX, y:plotY, w:plotW, h:plotH };

    const ax = this.scene.add.graphics();
    ax.fillStyle(0x040c16, 0.92); ax.fillRect(plotX, plotY, plotW, plotH);
    [0,25,50,75,100].forEach(v => {
      const gy = plotY + plotH - (v/100)*plotH;
      ax.lineStyle(1, v===50?0x24405f:0x162942, v===50?0.95:0.6);
      ax.lineBetween(plotX, gy, plotX+plotW, gy);
      if (v%50===0) {
        const t = this.scene.add.text(plotX-this.s(6), gy, String(v), {
          fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(10), color:'#5a7d9e'
        }).setOrigin(1,0.5);
        this.container.add(t);
      }
    });
    ax.lineStyle(this.s(1.6), 0x33557a, 1);
    ax.lineBetween(plotX, plotY, plotX, plotY+plotH);
    ax.lineBetween(plotX, plotY+plotH, plotX+plotW, plotY+plotH);
    this.container.add(ax);

    const yCap = this.scene.add.text(px+pad+this.s(2), plotY+plotH/2, 'SCORE', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(9), color:'#456a8c', letterSpacing:1
    }).setOrigin(0.5).setAngle(-90);
    this.container.add(yCap);

    const xCap = this.scene.add.text(plotX+plotW/2, plotY+plotH+this.s(26), 'LEVEL', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(9), color:'#456a8c', letterSpacing:2
    }).setOrigin(0.5);
    this.container.add(xCap);

    this.chartGfx = this.scene.add.graphics().setDepth(58);
    this.container.add(this.chartGfx);

    y = plotY + plotH + this.s(42);
    [{c:0xe74c7c,t:'Happy'},{c:0x4ecdc4,t:'Growth'},{c:0xe2a840,t:'Funds'}].forEach((l,i)=>{
      const lx = px+pad + i*this.s(52);
      const d = this.scene.add.graphics();
      d.fillStyle(l.c,0.95); d.fillRect(lx, y, this.s(12), this.s(3));
      const tx = this.scene.add.text(lx+this.s(16), y-this.s(5), l.t, {
        fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(10), color:'#6b8fb0'
      });
      this.container.add([d,tx]);
    });

    // Text size control
    const cy = py + ph - this.s(56);
    const cLbl = this.scene.add.text(px+pad, cy, 'TEXT SIZE', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(9),
      color:'#456a8c', letterSpacing:2, fontStyle:'600'
    }).setOrigin(0,0.5);
    this.container.add(cLbl);

    const opts = [{l:'A',v:2},{l:'A+',v:3},{l:'A++',v:4}];
    opts.forEach((o,i)=>{
      const bw=this.s(36), bh=this.s(26);
      const bx = px+pad + i*(bw+this.s(6)), by = cy + this.s(14);
      const g = this.scene.add.graphics();
      const txt = this.scene.add.text(bx+bw/2, by+bh/2, o.l, {
        fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(12), fontStyle:'700', color:'#6b8fb0'
      }).setOrigin(0.5);
      const draw = (hov) => {
        g.clear();
        const on = Math.round(window.WS_TEXT_RES) === o.v;
        g.fillStyle(on?0xe2a840:0x152744, on?0.92:1);
        g.fillRoundedRect(bx,by,bw,bh,this.s(5));
        g.lineStyle(1, on?0xe2a840:0x2c4767, 1);
        g.strokeRoundedRect(bx,by,bw,bh,this.s(5));
        txt.setColor(on?'#0b1725':(hov?'#c8d8ea':'#6b8fb0'));
      };
      draw(false);
      const hit = this.scene.add.rectangle(bx+bw/2,by+bh/2,bw,bh,0xffffff,0)
        .setInteractive({useHandCursor:true}).setDepth(59);
      hit.on('pointerover',()=>draw(true));
      hit.on('pointerout', ()=>draw(false));
      hit.on('pointerdown',()=>{ if (window.WS_setTextRes) window.WS_setTextRes(o.v); });
      this.container.add([g,txt,hit]);
    });

    this._redrawAll();
  }

  updateStats(h,d,r) {
    const vals={happiness:h,development:d,resources:r};
    Object.entries(this.bars).forEach(([id,b])=>{
      const target=Math.max(0,Math.min(100,vals[id]));
      this.scene.tweens.add({targets:b,disp:target,duration:750,ease:'Power2.easeOut',onUpdate:()=>this._redrawBar(id)});
    });
  }

  recordSnapshot(h,d,r,level) {
    this.history.happiness.push(Math.max(0,Math.min(100,h)));
    this.history.development.push(Math.max(0,Math.min(100,d)));
    this.history.resources.push(Math.max(0,Math.min(100,r)));
    this.levels.push(level===undefined?this.levels.length:level);
    while (this.history.happiness.length > 9) {
      this.history.happiness.shift(); this.history.development.shift();
      this.history.resources.shift(); this.levels.shift();
    }
    this._drawChart();
  }

  _drawChart() {
    const g=this.chartGfx, x=this.chart.x, y=this.chart.y, w=this.chart.w, h=this.chart.h;
    g.clear();
    this.xLabels.forEach(t=>{try{t.destroy();}catch(e){}});
    this.xLabels=[];
    const n=this.levels.length;
    if (n>0) {
      const step = n>1 ? w/(n-1) : 0;
      this.levels.forEach((lv,i)=>{
        if (n>6 && i%2!==0 && i!==n-1) return;
        const t=this.scene.add.text(x+i*step, y+h+this.s(9), String(lv), {
          fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(10), color:'#5a7d9e'
        }).setOrigin(0.5,0).setDepth(58);
        this.xLabels.push(t); this.container.add(t);
      });
    }
    const series=[
      {d:this.history.happiness,   c:0xe74c7c},
      {d:this.history.development, c:0x4ecdc4},
      {d:this.history.resources,   c:0xe2a840}
    ];
    series.forEach(s=>{
      if(!s.d.length) return;
      const step = s.d.length>1 ? w/(s.d.length-1) : 0;
      if (s.d.length===1){ g.fillStyle(s.c,0.95); g.fillCircle(x,y+h-(s.d[0]/100)*h,this.s(3)); return; }
      g.lineStyle(this.s(2.4), s.c, 0.92);
      g.beginPath();
      s.d.forEach((v,i)=>{ const pxp=x+i*step, pyp=y+h-(v/100)*h; if(i===0){g.moveTo(pxp,pyp);}else{g.lineTo(pxp,pyp);} });
      g.strokePath();
      g.fillStyle(s.c,0.95);
      s.d.forEach((v,i)=>g.fillCircle(x+i*step, y+h-(v/100)*h, this.s(2.2)));
      const last=s.d[s.d.length-1];
      g.fillStyle(0x061019,1); g.fillCircle(x+(s.d.length-1)*step, y+h-(last/100)*h, this.s(4.2));
      g.fillStyle(s.c,1);      g.fillCircle(x+(s.d.length-1)*step, y+h-(last/100)*h, this.s(3));
    });
  }

  _redrawAll(){ Object.keys(this.bars).forEach(id=>this._redrawBar(id)); }

  _redrawBar(id) {
    const b=this.bars[id], pct=b.disp/100, r=b.h/2;
    b.fill.clear();
    b.fill.fillStyle(b.color,0.14); b.fill.fillRoundedRect(b.x,b.y,b.maxW,b.h,r);
    b.fill.fillStyle(b.color,0.95); b.fill.fillRoundedRect(b.x,b.y,Math.max(b.h,b.maxW*pct),b.h,r);
    if (b.text) {
      b.text.setText(Math.round(b.disp));
      b.text.setColor(pct<0.3?'#e74c3c':pct>0.7?'#4ecdc4':'#e8f2ff');
    }
  }
}
