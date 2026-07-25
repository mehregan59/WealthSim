// Roads run off both screen edges; a branch curves away toward a neighbouring city.
class RoadNetwork {
  constructor(scene, districts) {
    this.scene = scene;
    this.S = scene.S || 1;
    this.districts = districts;
    this.cars = [];
    this.visitor = null;
    this.gfx    = scene.add.graphics().setDepth(3);
    this.carGfx = scene.add.graphics().setDepth(10);
    this.signGfx= scene.add.graphics().setDepth(11);
    this.lanes  = this._lanes();
    this._draw();
    this._seed();
  }
  s(v){ return Math.round(v * this.S); }
  get W(){ return this.scene.scale.width; }
  get H(){ return this.scene.scale.height; }

  _lanes() {
    const d=this.districts, off=this.s(46);
    const n=d.map(x=>({x:x.cx, y:x.cy+off}));
    const east=[
      {x:-this.s(160), y:n[0].y-this.s(8)},
      {x:n[0].x,       y:n[0].y},
      {x:(n[0].x+n[1].x)/2, y:(n[0].y+n[1].y)/2-this.s(5)},
      {x:n[1].x,       y:n[1].y},
      {x:(n[1].x+n[2].x)/2, y:(n[1].y+n[2].y)/2},
      {x:n[2].x,       y:n[2].y},
      {x:(n[2].x+n[3].x)/2, y:(n[2].y+n[3].y)/2+this.s(5)},
      {x:n[3].x,       y:n[3].y},
      {x:this.W+this.s(180), y:n[3].y+this.s(6)}
    ];
    const west=east.slice().reverse().map(p=>({x:p.x,y:p.y+this.s(15)}));

    const b={x:(n[1].x+n[2].x)/2, y:(n[1].y+n[2].y)/2+this.s(15)};
    const branch=[
      b,
      {x:b.x+this.s(150), y:b.y+this.s(34)},
      {x:b.x+this.s(300), y:b.y+this.s(92)},
      {x:b.x+this.s(430), y:b.y+this.s(178)},
      {x:this.W+this.s(200), y:this.H+this.s(120)}
    ];
    return [{pts:east},{pts:west},{pts:branch}];
  }

  _band(pts, halfW, col, alpha) {
    const g=this.gfx;
    for(let i=0;i<pts.length-1;i++){
      const p1=pts[i],p2=pts[i+1];
      const dx=p2.x-p1.x, dy=p2.y-p1.y, len=Math.hypot(dx,dy)||1;
      const nx=-dy/len*halfW, ny=dx/len*halfW;
      g.fillStyle(col,alpha);
      g.beginPath();
      g.moveTo(p1.x+nx,p1.y+ny); g.lineTo(p2.x+nx,p2.y+ny);
      g.lineTo(p2.x-nx,p2.y-ny); g.lineTo(p1.x-nx,p1.y-ny);
      g.closePath(); g.fillPath();
    }
  }

  _dashes(pts, col, alpha, spacing) {
    const g=this.gfx;
    g.lineStyle(this.s(1.8), col, alpha);
    for(let i=0;i<pts.length-1;i++){
      const p1=pts[i],p2=pts[i+1];
      const steps=Math.max(2,Math.floor(Math.hypot(p2.x-p1.x,p2.y-p1.y)/spacing));
      for(let k=0;k<steps;k+=2){
        const t1=k/steps, t2=(k+0.75)/steps;
        g.beginPath();
        g.moveTo(p1.x+(p2.x-p1.x)*t1, p1.y+(p2.y-p1.y)*t1);
        g.lineTo(p1.x+(p2.x-p1.x)*t2, p1.y+(p2.y-p1.y)*t2);
        g.strokePath();
      }
    }
  }

  _draw() {
    const main=this.lanes[0].pts, branch=this.lanes[2].pts;
    this._band(branch, this.s(11), 0x1e2026, 0.88);
    this._dashes(branch, 0xf5dd88, 0.22, this.s(26));
    this._band(main, this.s(15), 0x23252b, 0.92);
    this._dashes(main, 0xf5dd88, 0.28, this.s(24));
    const g=this.gfx;
    g.lineStyle(1,0x3d4048,0.65);
    g.beginPath(); g.moveTo(main[0].x,main[0].y-this.s(15));
    main.forEach(p=>g.lineTo(p.x,p.y-this.s(15))); g.strokePath();
    g.beginPath(); g.moveTo(main[0].x,main[0].y+this.s(15));
    main.forEach(p=>g.lineTo(p.x,p.y+this.s(15))); g.strokePath();

    const b0=branch[1];
    const sg=this.signGfx;
    sg.fillStyle(0x6b7a8d,1); sg.fillRect(b0.x-this.s(1.5), b0.y-this.s(34), this.s(3), this.s(34));
    sg.fillStyle(0x1e3350,0.95); sg.fillRoundedRect(b0.x-this.s(6), b0.y-this.s(50), this.s(78), this.s(19), this.s(4));
    sg.lineStyle(1,0x5c8ab0,0.9);  sg.strokeRoundedRect(b0.x-this.s(6), b0.y-this.s(50), this.s(78), this.s(19), this.s(4));
    this.signText = this.scene.add.text(b0.x+this.s(33), b0.y-this.s(40),
      (typeof currentLang!=='undefined'&&currentLang==='de')?'Nachbarstadt \u203A':'Neighbour city \u203A', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(10), color:'#a8c8e8'
    }).setOrigin(0.5).setDepth(12);
  }

  _seed() {
    [0,2,4,6].forEach((n,i)=>{
      this.scene.time.delayedCall(i*300,     ()=>this._spawn(0,n));
      this.scene.time.delayedCall(i*300+950, ()=>this._spawn(1,n));
    });
    this.scene.time.delayedCall(2200, ()=>this._spawn(2,0));
    this.scene.time.addEvent({delay:3000, loop:true, callback:()=>{
      if(this.cars.length<9) this._spawn(Math.random()<0.22?2:(Math.random()>0.5?0:1),0);
    }});
  }

  _spawn(lane,node) {
    const pal=[0x7fb3e0,0xe08a6a,0x86cf92,0xe0cf72,0xc48ada,0x9aa8c8,0xe0e0e6];
    this.cars.push({lane:lane, i:Math.min(node,this.lanes[lane].pts.length-2), t:Math.random(),
      sp:0.010+Math.random()*0.008, col:pal[Phaser.Math.Between(0,pal.length-1)],
      alive:true, stop:0});
  }

  // Neighbour delegation (Level 6)
  sendVisitor(onArrive) {
    const pts=this.lanes[2].pts.slice().reverse();
    this.visitor={ path:pts, i:0, t:0, sp:0.011, arrived:false, exiting:false,
                   x:pts[0].x, y:pts[0].y, onArrive:onArrive };
  }
  visitorAccept(target) {
    if(!this.visitor) return;
    const v=this.visitor;
    v.driveTo={ from:{x:v.x,y:v.y}, to:{x:target.cx,y:target.cy+this.s(46)}, t:0, sp:0.012,
                onDone:()=>{ target.celebrate(); this.visitor=null; } };
  }
  visitorDecline() {
    if(!this.visitor) return;
    const v=this.visitor;
    v.path=this.lanes[2].pts.slice();
    v.i=0; v.t=0; v.exiting=true; v.arrived=false;
  }

  update(delta,isNight) {
    this.carGfx.clear();
    const dead=[];
    this.cars.forEach((c,idx)=>{
      if(!c.alive){dead.push(idx);return;}
      const pts=this.lanes[c.lane].pts;
      if(c.stop>0){ c.stop-=delta; }
      else{
        c.t+=c.sp*(delta/16);
        while(c.t>=1){ c.t-=1; c.i++; if(c.lane!==2 && Math.random()<0.22) c.stop=500+Math.random()*700; }
        if(c.i>=pts.length-1){ c.alive=false; return; }
      }
      const p1=pts[c.i],p2=pts[c.i+1];
      if(!p1||!p2){c.alive=false;return;}
      const x=p1.x+(p2.x-p1.x)*c.t, y=p1.y+(p2.y-p1.y)*c.t;
      this._car(x,y,Math.atan2(p2.y-p1.y,p2.x-p1.x),c,isNight,false);
    });
    for(let i=dead.length-1;i>=0;i--) this.cars.splice(dead[i],1);
    this._updateVisitor(delta,isNight);
  }

  _updateVisitor(delta,isNight) {
    const v=this.visitor; if(!v) return;
    if(v.driveTo){
      const d=v.driveTo;
      d.t+=d.sp*(delta/16);
      const k=Math.min(1,d.t);
      v.x=d.from.x+(d.to.x-d.from.x)*k;
      v.y=d.from.y+(d.to.y-d.from.y)*k;
      this._car(v.x,v.y,Math.atan2(d.to.y-d.from.y,d.to.x-d.from.x),{col:0xffd54a,stop:0},isNight,true);
      if(d.t>=1){ const cb=d.onDone; v.driveTo=null; if(cb)cb(); }
      return;
    }
    const pts=v.path;
    if(!v.arrived || v.exiting){
      v.t+=v.sp*(delta/16);
      while(v.t>=1){ v.t-=1; v.i++; }
      if(v.i>=pts.length-1){
        if(v.exiting){ this.visitor=null; return; }
        v.arrived=true; v.i=pts.length-2; v.t=1;
        if(v.onArrive){ const cb=v.onArrive; v.onArrive=null; cb(); }
      }
    }
    const p1=pts[Math.min(v.i,pts.length-2)], p2=pts[Math.min(v.i+1,pts.length-1)];
    v.x=p1.x+(p2.x-p1.x)*v.t; v.y=p1.y+(p2.y-p1.y)*v.t;
    this._car(v.x,v.y,Math.atan2(p2.y-p1.y,p2.x-p1.x),{col:0xffd54a,stop:0},isNight,true);
  }

  _car(x,y,ang,c,isNight,big) {
    const g=this.carGfx;
    const cos=Math.cos(ang), sin=Math.sin(ang);
    const L=big?this.s(30):this.s(17), W=big?this.s(13):this.s(9);
    const put=(ox,oy)=>({x:x+ox*cos-oy*sin, y:y+ox*sin+oy*cos});
    g.fillStyle(0x000000,0.3); g.fillEllipse(x,y+this.s(4),L,W*0.6);
    g.fillStyle(c.col,0.97);
    const b=[put(-L/2,-W/2),put(L/2,-W/2),put(L/2,W/2),put(-L/2,W/2)];
    g.beginPath(); g.moveTo(b[0].x,b[0].y); b.forEach(p=>g.lineTo(p.x,p.y)); g.closePath(); g.fillPath();
    g.fillStyle(0x101820,0.5);
    const r=[put(-L*0.12,-W/2+1),put(L*0.3,-W/2+1),put(L*0.3,W/2-1),put(-L*0.12,W/2-1)];
    g.beginPath(); g.moveTo(r[0].x,r[0].y); r.forEach(p=>g.lineTo(p.x,p.y)); g.closePath(); g.fillPath();
    g.fillStyle(0x14161a,0.9);
    [put(-L*0.28,-W/2),put(L*0.28,-W/2),put(-L*0.28,W/2),put(L*0.28,W/2)].forEach(p=>g.fillCircle(p.x,p.y,this.s(2)));
    if(big){
      const fp=put(-L*0.3,0);
      g.fillStyle(0xd8e4f0,1); g.fillRect(fp.x-this.s(1),fp.y-this.s(26),this.s(2),this.s(26));
      g.fillStyle(0x4ecdc4,0.95);
      g.beginPath(); g.moveTo(fp.x+this.s(1),fp.y-this.s(26));
      g.lineTo(fp.x+this.s(20),fp.y-this.s(21)); g.lineTo(fp.x+this.s(1),fp.y-this.s(16));
      g.closePath(); g.fillPath();
    }
    if(isNight){
      const hl=put(L/2+1,0); g.fillStyle(0xfff2b0,0.95); g.fillCircle(hl.x,hl.y,this.s(3.2));
      g.fillStyle(0xfff2b0,0.16); g.fillCircle(hl.x+cos*this.s(7),hl.y+sin*this.s(7),this.s(8));
      const tl=put(-L/2-1,0); g.fillStyle(0xff4444,0.9); g.fillCircle(tl.x,tl.y,this.s(2.2));
    }
    if(c.stop>0){ const tl=put(-L/2-1,0); g.fillStyle(0xff3300,0.95); g.fillCircle(tl.x,tl.y,this.s(2.6)); }
  }
}
