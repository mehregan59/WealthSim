// Full-height side panel: city stats, trend chart, per-district performance,
// and a text-size control.
class StatsPanel {
  constructor(scene) {
    this.scene = scene;
    this.S = scene.S || 1;
    this.container = scene.add.container(0,0).setDepth(56);
    this.bars = {};
    this.perf = {};
    this.history = { happiness:[], development:[], resources:[] };
    this.levels = [];
    this.xLabels = [];
    this.px = 0;
    this.py = this.s(44);
    this.pw = scene.PANEL;
    this.ph = scene.scale.height - this.py;
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
    let y = py + this.s(24);

    const title = this.scene.add.text(px+pad, y, 'CITY STATUS', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(11),
      color:'#e2a840', letterSpacing:3, fontStyle:'700'
    }).setOrigin(0,0.5);
    this.container.add(title);
    y += this.s(26);

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
      bBg.fillRoundedRect(px+pad, y+this.s(12), pw-pad*2, this.s(8), this.s(4));
      const bFill = this.scene.add.graphics();
      this.bars[st.id] = { fill:bFill, color:st.color, x:px+pad, y:y+this.s(12),
                           maxW:pw-pad*2, h:this.s(8), disp:50, text:vt };
      this.container.add([ic,lb,vt,bBg,bFill]);
      y += this.s(40);
    });

    // ── Per-district performance ──
    y += this.s(4);
    const pTitle = this.scene.add.text(px+pad, y, 'DISTRICT PERFORMANCE', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(10),
      color:'#5a7d9e', letterSpacing:2, fontStyle:'600'
    }).setOrigin(0,0.5);
    this.container.add(pTitle);
    y += this.s(18);

    const ds = this.scene.districts || [];
    ds.forEach(d => {
      const nm = this.scene.add.text(px+pad, y, d.name, {
        fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(12), color:'#8aa4c0'
      }).setOrigin(0,0.5);
      const vt = this.scene.add.text(px+pw-pad, y, '45', {
        fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(12), color:'#c8d8ea', fontStyle:'600'
      }).setOrigin(1,0.5);
      const bBg = this.scene.add.graphics();
      bBg.fillStyle(0x152744,1);
      bBg.fillRoundedRect(px+pad, y+this.s(10), pw-pad*2, this.s(6), this.s(3));
      const bFill = this.scene.add.graphics();
      this.perf[d.id] = { fill:bFill, color:d.accentColor, x:px+pad, y:y+this.s(10),
                          maxW:pw-pad*2, h:this.s(6), text:vt, district:d, disp:d.health };
      this.container.add([nm,vt,bBg,bFill]);
      y += this.s(30);
    });

    // ── Trend chart ──
    y += this.s(6);
    const cTitle = this.scene.add.text(px+pad, y, 'CITY TREND', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(10),
      color:'#5a7d9e', letterSpacing:2, fontStyle:'600'
    }).setOrigin(0,0.5);
    this.container.add(cTitle);
    y += this.s(16);

    const plotX = px + pad + this.s(24);
    const plotY = y;
    const plotW = pw - pad*2 - this.s(24);
    const plotH = Math.max(this.s(110), Math.min(this.s(170), py+ph-y-this.s(140)));
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

    const xCap = this.scene.add.text(plotX+plotW/2, plotY+plotH+this.s(24), 'LEVEL', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(9), color:'#456a8c', letterSpacing:2
    }).setOrigin(0.5);
    this.container.add(xCap);

    this.chartGfx = this.scene.add.graphics().setDepth(58);
    this.container.add(this.chartGfx);

    y = plotY + plotH + this.s(38);
    [{c:0xe74c7c,t:'Happy'},{c:0x4ecdc4,t:'Growth'},{c:0xe2a840,t:'Funds'}].forEach((l,i)=>{
      const lx = px+pad + i*this.s(52);
      const d = this.scene.add.graphics();
      d.fillStyle(l.c,0.95); d.fillRect(lx, y, this.s(12), this.s(3));
      const tx = this.scene.add.text(lx+this.s(16), y-this.s(5), l.t, {
        fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(10), color:'#6b8fb0'
      });
      this.container.add([d,tx]);
    });

    // ── Text size control ──
    const cy = py + ph - this.s(54);
    const cLbl = this.scene.add.text(px+pad, cy, 'TEXT SIZE', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(9),
      color:'#456a8c', letterSpacing:2, fontStyle:'600'
    }).setOrigin(0,0.5);
    this.container.add(cLbl);

    [{l:'A',v:2},{l:'A+',v:3},{l:'A++',v:4}].forEach((o,i)=>{
      const bw=this.s(36), bh=this.s(26);
      const bx = px+pad + i*(bw+this.s(6)), by = cy + this.s(14);
      const g = this.scene.add.graphics();
      const txt = this.scene.add.text(bx+bw/2, by+bh/2, o.l, {
        fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(12), fontStyle:'700', color:'#6b8fb0'
      }).setOrigin(0.5);
      const draw=(hov)=>{
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
    this.refreshPerformance();
  }

  // One-time callout shown at the very start of the game: dims the rest of
  // the screen, pulses a border around this panel, and explains what it
  // shows before the player is asked to do anything.
  introHighlight(onDone) {
    const px=this.px, py=this.py, pw=this.pw, ph=this.ph;
    const W=this.scene.scale.width, H=this.scene.scale.height;
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');

    const dim=this.scene.add.graphics().setDepth(149);
    dim.fillStyle(0x000000,0.55); dim.fillRect(pw,0,W-pw,H);

    const ring=this.scene.add.graphics().setDepth(151);
    const pulse={a:0.5};
    const pulseTween=this.scene.tweens.add({targets:pulse,a:1,duration:700,yoyo:true,repeat:-1,onUpdate:()=>{
      ring.clear();
      ring.lineStyle(this.s(3),0xe2a840,pulse.a);
      ring.strokeRoundedRect(px+this.s(2),py+this.s(2),pw-this.s(4),ph-this.s(4),this.s(10));
    }});

    const calloutW=Math.min(this.s(360), W-pw-this.s(40));
    const calloutX=pw+this.s(20), calloutY=py+this.s(40);
    const text = de
      ? 'Dieses Panel zeigt dir, wie deine Stadt reagiert \u2014 Zufriedenheit, Wachstum, Mittel \u2014 und wie jeder einzelne Stadtteil sich entwickelt. Schau jederzeit hinein, um deine Ressourcen und Leute zu beobachten.'
      : 'This panel shows how your city is reacting \u2014 happiness, growth, funds \u2014 and how each individual district is performing. Check it any time to observe your resources and people.';
    const box=this.scene.add.graphics().setDepth(151);
    const txt=this.scene.add.text(0,0,text,{
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(15), color:'#dbe8f4',
      wordWrap:{width:calloutW-this.s(32)}, lineSpacing:this.s(5)
    }).setDepth(152);
    const th = txt.height + this.s(64);
    box.fillStyle(0x08131f,0.98); box.fillRoundedRect(calloutX,calloutY,calloutW,th,this.s(12));
    box.lineStyle(1,0xe2a840,0.6); box.strokeRoundedRect(calloutX,calloutY,calloutW,th,this.s(12));
    txt.setPosition(calloutX+this.s(16), calloutY+this.s(16));

    const btnW=this.s(130), btnH=this.s(32);
    const btnX=calloutX+calloutW-btnW-this.s(16), btnY=calloutY+th-btnH-this.s(14);
    const btnBg=this.scene.add.graphics().setDepth(152);
    const drawBtn=(hv)=>{ btnBg.clear(); btnBg.fillStyle(0xe2a840,hv?1:0.9); btnBg.fillRoundedRect(btnX,btnY,btnW,btnH,this.s(7)); };
    drawBtn(false);
    const btnTxt=this.scene.add.text(btnX+btnW/2,btnY+btnH/2, de?'Verstanden \u2192':'Continue \u2192', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(13), color:'#0b1725', fontStyle:'700'
    }).setOrigin(0.5).setDepth(153);
    const hit=this.scene.add.rectangle(btnX+btnW/2,btnY+btnH/2,btnW,btnH,0xffffff,0)
      .setDepth(154).setInteractive({useHandCursor:true});
    hit.on('pointerover',()=>drawBtn(true));
    hit.on('pointerout',()=>drawBtn(false));

    const group=[dim,ring,box,txt,btnBg,btnTxt,hit];
    hit.on('pointerdown',()=>{
      pulseTween.remove();
      group.forEach(e=>{try{e.destroy();}catch(err){}});
      if(onDone) onDone();
    });
  }

  updateStats(h,d,r) {
    const vals = {happiness:h, development:d, resources:r};
    Object.entries(this.bars).forEach(([id,bar]) => {
      const target = Math.max(0, Math.min(100, vals[id]));
      this.scene.tweens.add({ targets:bar, disp:target, duration:750, ease:'Power2.easeOut', onUpdate:()=>this._redrawBar(id) });
    });
    this.refreshPerformance();
  }

  // Live per-district performance — the player reads this and decides for themselves
  refreshPerformance() {
    Object.keys(this.perf).forEach(id=>{
      const p=this.perf[id];
      const target=Math.max(0,Math.min(100,p.district.health));
      this.scene.tweens.add({targets:p,disp:target,duration:600,ease:'Power2.easeOut',
        onUpdate:()=>this._redrawPerf(id)});
    });
  }

  _redrawPerf(id) {
    const p=this.perf[id], pct=p.disp/100, r=p.h/2;
    p.fill.clear();
    p.fill.fillStyle(p.color,0.14); p.fill.fillRoundedRect(p.x,p.y,p.maxW,p.h,r);
    p.fill.fillStyle(p.color,0.95); p.fill.fillRoundedRect(p.x,p.y,Math.max(p.h,p.maxW*pct),p.h,r);
    if(p.text){
      p.text.setText(Math.round(p.disp));
      p.text.setColor(pct<0.3?'#e74c3c':pct>0.7?'#4ecdc4':'#c8d8ea');
    }
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
    const g=this.chartGfx;
    const x=this.chart.x, y=this.chart.y, w=this.chart.w, h=this.chart.h;
    g.clear();
    this.xLabels.forEach(t=>{try{t.destroy();}catch(e){}});
    this.xLabels=[];
    const n=this.levels.length;
    if (n>0) {
      const step = n>1 ? w/(n-1) : 0;
      this.levels.forEach((lv,i)=>{
        if (n>6 && i%2!==0 && i!==n-1) return;
        const t=this.scene.add.text(x+i*step, y+h+this.s(8), String(lv), {
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
