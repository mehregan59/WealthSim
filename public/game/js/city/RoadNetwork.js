// Roads run off both screen edges. The neighbour-city signpost only appears
// during the delegation event (Level 6).
class RoadNetwork {
  constructor(scene, districts) {
    this.scene = scene;
    this.S = scene.S || 1;
    this.districts = districts;
    this.cars = [];
    this.visitor = null;
    this.gfx     = scene.add.graphics().setDepth(3);
    this.carGfx  = scene.add.graphics().setDepth(6);
    this.signGfx = scene.add.graphics().setDepth(11).setAlpha(0);
    this.lanes   = this._lanes();
    // The metropolis draws and runs every street itself, so this older
    // stand-alone highway stays silent; only the Level 6 visitor uses it.
    this.quiet   = !!(scene.hasMetro || scene.hasPanorama);
    if(!this.quiet){ this._draw(); this._seed(); }

    this._buildSign();
  }

  s(v){ return Math.round(v*this.S); }
  get W(){ return this.scene.scale.width; }
  get H(){ return this.scene.scale.height; }

  _lanes() {
    const d=this.districts, off=this.s(78);
    const n=d.map(x=>({x:x.cx, y:x.cy+off}));
    const east=[
      {x:-this.s(180), y:n[0].y-this.s(8)},
      {x:n[0].x,       y:n[0].y},
      {x:(n[0].x+n[1].x)/2, y:(n[0].y+n[1].y)/2-this.s(5)},
      {x:n[1].x,       y:n[1].y},
      {x:(n[1].x+n[2].x)/2, y:(n[1].y+n[2].y)/2},
      {x:n[2].x,       y:n[2].y},
      {x:(n[2].x+n[3].x)/2, y:(n[2].y+n[3].y)/2+this.s(5)},
      {x:n[3].x,       y:n[3].y},
      {x:this.W+this.s(200), y:n[3].y+this.s(6)}
    ];
    const west=east.slice().reverse().map(p=>({x:p.x,y:p.y+this.s(15)}));

    // Branch leaves from between Transport and Technology, dropping well below
    // the districts so it never overlaps them, and exits bottom-right.
    const b={x:(n[1].x+n[2].x)/2, y:(n[1].y+n[2].y)/2+this.s(16)};
    const branch=[
      b,
      {x:b.x+this.s(120), y:b.y+this.s(58)},
      {x:b.x+this.s(250), y:b.y+this.s(140)},
      {x:b.x+this.s(390), y:b.y+this.s(240)},
      {x:this.W+this.s(220), y:this.H+this.s(150)}
    ];
    return [{pts:east},{pts:west},{pts:branch}];
  }

  _band(pts,halfW,col,alpha) {
    const g=this.gfx;
    for(let i=0;i<pts.length-1;i++){
      const p1=pts[i],p2=pts[i+1];
      const dx=p2.x-p1.x,dy=p2.y-p1.y,len=Math.hypot(dx,dy)||1;
      const nx=-dy/len*halfW, ny=dx/len*halfW;
      g.fillStyle(col,alpha);
      g.beginPath();
      g.moveTo(p1.x+nx,p1.y+ny); g.lineTo(p2.x+nx,p2.y+ny);
      g.lineTo(p2.x-nx,p2.y-ny); g.lineTo(p1.x-nx,p1.y-ny);
      g.closePath(); g.fillPath();
    }
  }

  _dashes(pts,col,alpha,spacing) {
    const g=this.gfx;
    g.lineStyle(this.s(1.8),col,alpha);
    for(let i=0;i<pts.length-1;i++){
      const p1=pts[i],p2=pts[i+1];
      const steps=Math.max(2,Math.floor(Math.hypot(p2.x-p1.x,p2.y-p1.y)/spacing));
      for(let k=0;k<steps;k+=2){
        const t1=k/steps,t2=(k+0.75)/steps;
        g.beginPath();
        g.moveTo(p1.x+(p2.x-p1.x)*t1,p1.y+(p2.y-p1.y)*t1);
        g.lineTo(p1.x+(p2.x-p1.x)*t2,p1.y+(p2.y-p1.y)*t2);
        g.strokePath();
      }
    }
  }

  _draw() {
    const main=this.lanes[0].pts, branch=this.lanes[2].pts;
    this._band(branch,this.s(12),0x485b5b,0.94);
    this._dashes(branch,0xf2d77d,0.68,this.s(26));
    this._band(main,this.s(17),0x485b5b,0.98);
    this._dashes(main,0xf2d77d,0.78,this.s(24));
    const g=this.gfx;
    g.lineStyle(this.s(4),0xc9c9b7,0.95);
    g.beginPath(); g.moveTo(main[0].x,main[0].y-this.s(15));
    main.forEach(p=>g.lineTo(p.x,p.y-this.s(15))); g.strokePath();
    g.beginPath(); g.moveTo(main[0].x,main[0].y+this.s(15));
    main.forEach(p=>g.lineTo(p.x,p.y+this.s(15))); g.strokePath();
  }

  // Signpost sits right at the start of the fork — where the branch road
  // splits from the main road — rather than further down the branch.
  // Sized 10% smaller than the original. Hidden by default, shown only
  // during the Level 6 delegation.
  _buildSign() {
    const b=this.lanes[2].pts[0];
    const K=0.9; // 10% smaller than the original sign
    const sg=this.signGfx;
    sg.fillStyle(0x6b7a8d,1); sg.fillRect(b.x-this.s(1.5*K), b.y-this.s(38*K), this.s(3*K), this.s(38*K));
    sg.fillStyle(0x1e3350,0.96); sg.fillRoundedRect(b.x-this.s(6*K), b.y-this.s(56*K), this.s(84*K), this.s(21*K), this.s(4*K));
    sg.lineStyle(1,0x5c8ab0,0.9);  sg.strokeRoundedRect(b.x-this.s(6*K), b.y-this.s(56*K), this.s(84*K), this.s(21*K), this.s(4*K));
    this.signText=this.scene.add.text(b.x+this.s(36*K), b.y-this.s(45*K),
      (typeof currentLang!=='undefined'&&currentLang==='de')?'Nachbarstadt \u203A':'Neighbour city \u203A',{
      fontFamily:CityTheme.body, fontSize:this.s(11*K), color:'#173b40'
    }).setOrigin(0.5).setDepth(12).setAlpha(0);
  }

  showSign(on) {
    this.scene.tweens.add({targets:[this.signGfx,this.signText],alpha:on?1:0,duration:600});
  }

  _seed() {
    [0,1,2,3,4,5,6].forEach((n,i)=>{
      this.scene.time.delayedCall(i*420,      ()=>this._spawn(0,n));
      this.scene.time.delayedCall(i*420+1300, ()=>this._spawn(1,n));
    });
    this.scene.time.addEvent({delay:4200, loop:true, callback:()=>{
       if(this.cars.length<12) this._spawn(Math.random()>0.5?0:1,0);
    }});
  }

  _spawn(lane,node) {
    const pal=[0x7fb3e0,0xe08a6a,0x86cf92,0xe0cf72,0xc48ada,0x9aa8c8,0xe0e0e6];
    // Slower base speed, with occasional slow/fast outliers for realism
    let sp = 0.0044 + Math.random()*0.0030;
    const roll = Math.random();
    if (roll < 0.15) sp *= 0.55;
    else if (roll > 0.88) sp *= 1.7;
    this.cars.push({lane:lane, i:Math.min(node,this.lanes[lane].pts.length-2),
      t:Math.random(), sp:sp, col:pal[Phaser.Math.Between(0,pal.length-1)],
      alive:true, stop:0});
  }

  // Delegation (Level 6)
  sendVisitor(onArrive) {
    const riv=this.scene.metro&&this.scene.metro.river;
    if(riv){
      // In the connected city the offer arrives by ship up the river.
      const pts=[riv[4],riv[3],riv[2]].map(q=>({x:q.x,y:q.y}));
      this._shipLabel();
      this.visitor={ ship:true, path:pts, i:0, t:0, sp:0.006, arrived:false, exiting:false,
                     x:pts[0].x, y:pts[0].y, onArrive:onArrive };
      return;
    }
    this.showSign(true);
    const pts=this.lanes[2].pts.slice().reverse();
    this.visitor={ path:pts, i:0, t:0, sp:0.010, arrived:false, exiting:false,
                   x:pts[0].x, y:pts[0].y, onArrive:onArrive };
  }
  visitorAccept(target, onDone) {
    if(!this.visitor) return;
    const v=this.visitor;
    if(v.ship){
      v.arrived=true;v.exiting=false;v.accepted=true;v.parked=true;v.onArrive=null;
      this.scene.time.delayedCall(1900,()=>{if(onDone)onDone();});
      return;
    }
    v.driveTo={ from:{x:v.x,y:v.y}, to:{x:target.cx,y:target.cy+this.s(46)}, t:0, sp:0.011,
      onDone:()=>{ this.visitor=null; this.showSign(false); if(onDone) onDone(); } };
  }
  visitorDecline() {
    if(!this.visitor) return;
    const v=this.visitor;
    if(v.ship){
      const riv=this.scene.metro.river;
      v.path=[{x:v.x,y:v.y},{x:riv[3].x,y:riv[3].y},{x:riv[4].x,y:riv[4].y}]; v.i=0; v.t=0; v.arrived=false; v.exiting=true;
      v.onExit=()=>this._dropShipLabel();
      return;
    }
    v.path=this.lanes[2].pts.slice(); v.i=0; v.t=0; v.exiting=true; v.arrived=false;
    this.showSign(false);
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
        while(c.t>=1){ c.t-=1; c.i++; if(Math.random()<0.18) c.stop=600+Math.random()*900; }
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
        if(v.exiting){ this.visitor=null; if(v.onExit) v.onExit(); return; }
        v.arrived=true; v.i=pts.length-2; v.t=1;
        if(v.onArrive){ const cb=v.onArrive; v.onArrive=null; cb(); }
      }
    }
    const p1=pts[Math.min(v.i,pts.length-2)], p2=pts[Math.min(v.i+1,pts.length-1)];
    v.x=p1.x+(p2.x-p1.x)*v.t; v.y=p1.y+(p2.y-p1.y)*v.t;
    if(v.ship){this._ship(v.x,v.y,Math.atan2(p2.y-p1.y,p2.x-p1.x),isNight);return;}
    this._car(v.x,v.y,Math.atan2(p2.y-p1.y,p2.x-p1.x),{col:0xffd54a,stop:0},isNight,true);
  }

  _shipLabel() {
    this._dropShipLabel();
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this.shipText=this.scene.add.text(0,0,de?'\u2691 Investitionsangebot':'\u2691 Investment offer',{
      fontFamily:CityTheme.heading,fontSize:this.s(13),color:'#fffbf1',fontStyle:'700',
      backgroundColor:'#296b72',padding:{x:this.s(8),y:this.s(4)}
    }).setOrigin(0,1).setDepth(40);
  }
  _dropShipLabel(){ if(this.shipText){ this.shipText.destroy(); this.shipText=null; } }
  _ship(x,y,ang,isNight) {
    const g=this.carGfx,L=this.s(54),H=this.s(18),cs=Math.cos(ang),sn=Math.sin(ang),p=(a,b)=>({x:x+a*cs-b*sn,y:y+a*sn+b*cs});
    const poly=(pts,col)=>{g.fillStyle(col,1);g.beginPath();g.moveTo(pts[0].x,pts[0].y);pts.slice(1).forEach(q=>g.lineTo(q.x,q.y));g.closePath();g.fillPath();};
    poly([p(-L*.48,-H*.38),p(L*.28,-H*.48),p(L*.55,0),p(L*.28,H*.48),p(-L*.48,H*.38),p(-L*.58,0)],0x6f3e31);
    poly([p(-L*.36,-H*.26),p(L*.25,-H*.32),p(L*.43,0),p(L*.25,H*.32),p(-L*.36,H*.26)],0xd9c596);
    const cabin=[p(-L*.22,-H*.24),p(L*.02,-H*.24),p(L*.02,H*.24),p(-L*.22,H*.24)];poly(cabin,0xfffbf1);
    const win=p(-L*.08,0);g.fillStyle(0x5f8790,1);g.fillCircle(win.x,win.y,this.s(3));
    const mast=p(L*.08,0),top=p(L*.08,-H*1.8);g.lineStyle(this.s(2),0x3c3c3c,1);g.lineBetween(mast.x,mast.y,top.x,top.y);poly([top,p(L*.40,-H*1.55),p(L*.08,-H*.95)],0xe0a82e);
    if(isNight){const bow=p(L*.48,0);g.fillStyle(0xffe9a0,.9);g.fillCircle(bow.x,bow.y,this.s(2.6));}if(this.shipText)this.shipText.setPosition(x+this.s(28),y-this.s(34));
  }

  _car(x,y,ang,c,isNight,big) {
    const g=this.carGfx;
    const cos=Math.cos(ang),sin=Math.sin(ang);
    const L=big?this.s(38):this.s(22), W=big?this.s(16):this.s(11);
    const put=(ox,oy)=>({x:x+ox*cos-oy*sin, y:y+ox*sin+oy*cos});
    g.fillStyle(0x173b40,0.22); g.fillEllipse(x,y+this.s(4),L,W*0.6);
    g.fillStyle(c.col,0.97);
    const b=[put(-L/2,-W/2),put(L/2,-W/2),put(L/2,W/2),put(-L/2,W/2)];
    g.beginPath(); g.moveTo(b[0].x,b[0].y); b.forEach(p=>g.lineTo(p.x,p.y)); g.closePath(); g.fillPath();
    g.fillStyle(0xbfe4e6,0.85);
    const r=[put(-L*0.12,-W/2+1),put(L*0.3,-W/2+1),put(L*0.3,W/2-1),put(-L*0.12,W/2-1)];
    g.beginPath(); g.moveTo(r[0].x,r[0].y); r.forEach(p=>g.lineTo(p.x,p.y)); g.closePath(); g.fillPath();
    g.fillStyle(0x14161a,0.9);
    [put(-L*0.28,-W/2),put(L*0.28,-W/2),put(-L*0.28,W/2),put(L*0.28,W/2)].forEach(p=>g.fillCircle(p.x,p.y,this.s(2)));
    if(big){
      const fp=put(-L*0.32,0);
      g.fillStyle(0xd8e4f0,1); g.fillRect(fp.x-this.s(1),fp.y-this.s(30),this.s(2),this.s(30));
      g.fillStyle(0x4ecdc4,0.96);
      g.beginPath(); g.moveTo(fp.x+this.s(1),fp.y-this.s(30));
      g.lineTo(fp.x+this.s(22),fp.y-this.s(24)); g.lineTo(fp.x+this.s(1),fp.y-this.s(18));
      g.closePath(); g.fillPath();
      // Investment crates on the roof
      const c1=put(-L*0.05,0), c2=put(L*0.16,0);
      [c1,c2].forEach(p=>{
        g.fillStyle(0x2f8a42,1); g.fillRoundedRect(p.x-this.s(6),p.y-this.s(13),this.s(12),this.s(9),this.s(2));
        g.fillStyle(0xf0d878,1); g.fillCircle(p.x,p.y-this.s(8.5),this.s(2.6));
      });
    }
    if(isNight){
      const hl=put(L/2+1,0); g.fillStyle(0xfff2b0,0.95); g.fillCircle(hl.x,hl.y,this.s(3.2));
      g.fillStyle(0xfff2b0,0.16); g.fillCircle(hl.x+cos*this.s(7),hl.y+sin*this.s(7),this.s(8));
      const tl=put(-L/2-1,0); g.fillStyle(0xff4444,0.9); g.fillCircle(tl.x,tl.y,this.s(2.2));
    }
    if(c.stop>0){ const tl=put(-L/2-1,0); g.fillStyle(0xff3300,0.95); g.fillCircle(tl.x,tl.y,this.s(2.6)); }
  }
}
