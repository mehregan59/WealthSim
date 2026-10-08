class District {
  constructor(scene,config){
    Object.assign(this,config); this.scene=scene; this.S=config.scale||scene.S||1;
    this.health=config.health||45; this.resources=0; this.visualCapacity=0; this.selectable=false; this.onSelect=null;
    this.isHovered=false; this.animTime=Math.random()*1000; this.turbineAngle=Math.random()*Math.PI*2;
    this.gfx=scene.add.graphics().setDepth(8); this.animGfx=scene.add.graphics().setDepth(10);
    this.citizens=[]; this._buildLabel(); this.draw(); this._addInteraction(); this._initCitizens();
  }
  s(v){return Math.round(v*this.S);}
  ix(gx,gy){return this.cx+(gx-gy)*this.s(34);}
  iy(gx,gy,gz){return this.cy+(gx+gy)*this.s(19)-(gz||0)*this.s(26);}
  _icon(){return {housing:'⌂',transport:'▤',technology:'◇',energy:'☀'}[this.id]||'•';}
  _buildLabel(){
    const txt=(typeof currentLang!=='undefined'&&currentLang==='de')?this.labelDE:this.label;
    // labelLift lets neighbouring districts stagger their names so two
    // labels can never sit on top of each other.
    const metroLabelY=this.id==='transport'
      ? this.cy+this.s(86)
      : this.cy-this.s(this.id==='energy'?30:44);
    this.labelBaseY=this.scene.hasMetro?metroLabelY:this.cy-this.s(132)-this.s(this.labelLift||0); this.labelContainer=this.scene.add.container(this.cx,this.labelBaseY).setDepth(this.scene.hasMetro?45:13);
    // High-contrast card: a busy drawn city behind it must never make the
    // district name hard to read.
    const t=this.scene.add.text(0,0,this._icon()+'  '+txt,{fontFamily:CityTheme.body,fontSize:this.s(15),color:'#ffffff',fontStyle:'700'}).setOrigin(0.5);
    const w=t.width+this.s(30),h=this.s(32),bg=this.scene.add.graphics();
    bg.fillStyle(0x0e2b2c,0.92); bg.fillRoundedRect(-w/2,-h/2,w,h,this.s(7));
    bg.lineStyle(this.s(2),this.accentColor,0.95); bg.strokeRoundedRect(-w/2,-h/2,w,h,this.s(7));
    this.labelContainer.add([bg,t]); this.labelH=h;
    // Two-word reminder of the quarter's character (e.g. "Safe & Steady").
    const tagTxt=(typeof currentLang!=='undefined'&&currentLang==='de')?this.tagDE:this.tag;
    if(tagTxt){
      const tt=this.scene.add.text(0,-h/2-this.s(13),tagTxt,{fontFamily:CityTheme.body,fontSize:this.s(12),color:'#173b40',fontStyle:'700'}).setOrigin(0.5);
      const tw=tt.width+this.s(16),th=this.s(20),tb=this.scene.add.graphics();
      tb.fillStyle(0xfffbf1,0.96);tb.fillRoundedRect(-tw/2,-h/2-this.s(13)-th/2,tw,th,th/2);
      tb.lineStyle(this.s(1.5),this.accentColor,1);tb.strokeRoundedRect(-tw/2,-h/2-this.s(13)-th/2,tw,th,th/2);
      this.labelContainer.add([tb,tt]);
    }
    // Keep the name fully on screen: never tucked behind the side panel or
    // cut off at the right edge.
    const minX=(this.scene.PANEL||0)+w/2+this.s(10), maxX=this.scene.W-w/2-this.s(10);
    this.labelContainer.x=Math.max(minX,Math.min(maxX,this.cx));
    this.labelBaseY=Math.max(this.s(58),this.labelBaseY);
    this.labelContainer.y=this.labelBaseY;
    // In the connected city the name is a sign mounted on the landmark
    // itself (station facade, farm gate, campus, housing gate), on posts.
    if(this.scene.hasMetro){
      const posts=this.scene.add.graphics(),ph=this.s(18);
      posts.fillStyle(0x3a3f3c,1); posts.fillRect(-w*0.32,h/2,this.s(3),ph); posts.fillRect(w*0.32-this.s(3),h/2,this.s(3),ph);
      this.labelContainer.addAt(posts,0);
    }
    this.labelHit=this.scene.add.rectangle(this.labelContainer.x,this.labelContainer.y,w,h,0xffffff,0).setDepth(46).setInteractive({useHandCursor:true});
    this.labelHit.on('pointerdown',(pointer,localX,localY,event)=>{if(event&&event.stopPropagation)event.stopPropagation();if(this.selectable&&this.onSelect)this.onSelect(this);else if(this._touchPointer(pointer)&&this.scene.tooltipManager)this.scene.tooltipManager.toggle(this,this.labelContainer.x,this.labelBaseY-this.s(8));});

  }

  subLabelY(){return this.labelContainer.y+this.labelH/2+this.s(this.scene.hasMetro?36:19);}
  _grow(){return Math.min(10,Math.max(0,Math.round(this.visualCapacity||0)));}
  _stage(){return this.health>=78?4:this.health>=58?3:this.health>=34?2:1;}
  draw(){
    this.gfx.clear();
    // In the connected metropolis a district is a quarter of the city, not a
    // separate plot: a paved block that sits flush in the surrounding streets.
    if(this.scene.hasMetro){ this._metroLandmark(); return; }
    if(this.scene.hasPanorama) this._plaza(); else { this._parcel(); this._streets(); }
    if(this.id==='housing')this._housing(); else if(this.id==='transport')this._transport();
    else if(this.id==='technology')this._technology(); else this._energy();
  }
  _poly(g,pts,color,alpha){g.fillStyle(color,alpha===undefined?1:alpha);g.beginPath();g.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)g.lineTo(pts[i].x,pts[i].y);g.closePath();g.fillPath();}
  _plaza(){
    const g=this.gfx,p=this._ringPts();
    // A paved block flush with the surrounding streets — no raised tile, no
    // drop shadow, so the quarter is simply part of the city ground.
    this._poly(g,p,0xc4c2b1,.96);
    this._poly(g,p.map(q=>({x:this.cx+(q.x-this.cx)*.92,y:this.cy+(q.y-this.cy)*.92})),0xd9d6c3,.95);
  }


  _parcel(){
    const g=this.gfx,p=[{x:this.ix(-.25,2.5),y:this.iy(-.25,2.5,0)},{x:this.ix(2.5,2.5),y:this.iy(2.5,2.5,0)},{x:this.ix(2.5,-.25),y:this.iy(2.5,-.25,0)},{x:this.ix(-.25,-.25),y:this.iy(-.25,-.25,0)}];
    this._poly(g,p,0x83ad73,.82); g.lineStyle(1,0xe7eed9,.5);g.strokePath();
    // pavement ring integrates each neighborhood with the shared streets
    g.lineStyle(this.s(8),0xc9c9b7,.9);g.beginPath();g.moveTo(p[0].x,p[0].y);p.forEach(q=>g.lineTo(q.x,q.y));g.closePath();g.strokePath();
  }
  _streets(){
    const g=this.gfx;g.lineStyle(this.s(8),0x52615e,.9);
    g.beginPath();g.moveTo(this.ix(0,1.2),this.iy(0,1.2,.01));g.lineTo(this.ix(2.25,1.2),this.iy(2.25,1.2,.01));g.strokePath();
    g.lineStyle(1,0xf3d67b,.65);g.beginPath();g.moveTo(this.ix(.15,1.2),this.iy(.15,1.2,.02));g.lineTo(this.ix(2.1,1.2),this.iy(2.1,1.2,.02));g.strokePath();
  }

  _box(gx,gy,w,d,h,top,left,right){
    const g=this.gfx,shadow=[{x:this.ix(gx+.08,gy+d+.12),y:this.iy(gx+.08,gy+d+.12,0)},{x:this.ix(gx+w+.18,gy+d+.12),y:this.iy(gx+w+.18,gy+d+.12,0)},{x:this.ix(gx+w+.18,gy+.12),y:this.iy(gx+w+.18,gy+.12,0)}];
    this._poly(g,shadow,0x244840,.2);
    this._poly(g,[{x:this.ix(gx,gy+d),y:this.iy(gx,gy+d,0)},{x:this.ix(gx,gy+d),y:this.iy(gx,gy+d,h)},{x:this.ix(gx+w,gy+d),y:this.iy(gx+w,gy+d,h)},{x:this.ix(gx+w,gy+d),y:this.iy(gx+w,gy+d,0)}],left,.98);
    this._poly(g,[{x:this.ix(gx+w,gy),y:this.iy(gx+w,gy,0)},{x:this.ix(gx+w,gy),y:this.iy(gx+w,gy,h)},{x:this.ix(gx+w,gy+d),y:this.iy(gx+w,gy+d,h)},{x:this.ix(gx+w,gy+d),y:this.iy(gx+w,gy+d,0)}],right,.98);
    this._poly(g,[{x:this.ix(gx,gy),y:this.iy(gx,gy,h)},{x:this.ix(gx+w,gy),y:this.iy(gx+w,gy,h)},{x:this.ix(gx+w,gy+d),y:this.iy(gx+w,gy+d,h)},{x:this.ix(gx,gy+d),y:this.iy(gx,gy+d,h)}],top,1);
    return {gx,gy,w,d,h};
  }
  _windows(b,cols,rows,color){
    const g=this.gfx;g.fillStyle(color||0xbfe8e8,.9);
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const x=this.ix(b.gx+b.w*(.18+c/(cols+1)),b.gy+b.d),y=this.iy(b.gx+b.w*(.18+c/(cols+1)),b.gy+b.d,b.h*(.22+r/(rows+1)));
      g.fillRect(x-this.s(2.5),y-this.s(1.5),this.s(5),this.s(3));
    }
  }
  _tree(gx,gy,scale){const g=this.gfx,x=this.ix(gx,gy),y=this.iy(gx,gy,0),s=scale||1;g.fillStyle(0x66533c,1);g.fillRect(x-this.s(1.4*s),y-this.s(8*s),this.s(2.8*s),this.s(9*s));g.fillStyle(0x39784e,1);g.fillCircle(x,y-this.s(12*s),this.s(7*s));g.fillStyle(0x77b66f,.9);g.fillCircle(x-this.s(3*s),y-this.s(15*s),this.s(4*s));}
  _solar(gx,gy,n){const g=this.gfx;for(let i=0;i<n;i++){const a=gx+i*.24,x=this.ix(a,gy),y=this.iy(a,gy,.12),P=(u,v,z)=>({x:this.ix(u,v),y:this.iy(u,v,z)});const p=[P(a-.1,gy-.05,.04),P(a+.13,gy-.05,.04),P(a+.13,gy+.12,.22),P(a-.1,gy+.12,.22)];g.fillStyle(0x4d5a58,1);g.fillRect(x-this.s(1),y,this.s(2),this.s(6));this._poly(g,p,0x285d73,1);g.lineStyle(1,0x8ed6df,.8);g.lineBetween(p[0].x,p[0].y,p[2].x,p[2].y);}}
  _housing(){
    const st=this._stage(),lots=[[.1,.12],[.7,.15],[1.45,.2],[.22,1.38],[1.18,1.4],[1.72,.86]];
    for(let i=0;i<Math.min(2+st,lots.length);i++){const [x,y]=lots[i],tall=st>=4&&i<2,b=this._box(x,y,tall?.48:.38,tall?.5:.38,tall?1.05:.46,0xf3e8cf,0xc69572,0xddb891);this._windows(b,tall?2:1,tall?3:1,0xb7dce0);if(st>=3&&i%2===0)this._solar(x+.08,y+.1,1);}
    for(let i=0;i<3+st;i++)this._tree(.12+i*.42,2.05,.72);
    if(st>=3){const g=this.gfx,x=this.ix(1.65,1.83),y=this.iy(1.65,1.83,0);g.fillStyle(0xe0a82e,1);g.fillRoundedRect(x-this.s(12),y-this.s(4),this.s(24),this.s(8),3);g.fillStyle(0x296b72,1);g.fillCircle(x-this.s(6),y-this.s(8),this.s(3));g.fillCircle(x+this.s(4),y-this.s(8),this.s(3));}
  }
  _transport(){
    const st=this._stage(),g=this.gfx,b=this._box(.12,.08,1.05,.48,.46+.1*st,0xdbe7e5,0x6d9597,0x93b6b4);this._windows(b,3,Math.min(2,st),0xe9f6f3);
    // platform, shelter, rails, bus fleet and cycle lane
    this._poly(g,[{x:this.ix(.05,1.35),y:this.iy(.05,1.35,.02)},{x:this.ix(2.2,1.35),y:this.iy(2.2,1.35,.02)},{x:this.ix(2.2,1.62),y:this.iy(2.2,1.62,.02)},{x:this.ix(.05,1.62),y:this.iy(.05,1.62,.02)}],0x7c8784,1);
    g.lineStyle(1,0xe7e0ca,.9);for(let k=0;k<2;k++){g.beginPath();g.moveTo(this.ix(.05,1.43+k*.1),this.iy(.05,1.43+k*.1,.03));g.lineTo(this.ix(2.2,1.43+k*.1),this.iy(2.2,1.43+k*.1,.03));g.strokePath();}
    for(let i=0;i<st;i++){const x=.2+i*.43;this._box(x,1.78,.32,.17,.17,i%2?0xe0a82e:0x4f9aa4,0x436b6e,0x618e91);}
    const sx=this.ix(1.72,.5),sy=this.iy(1.72,.5,0);g.fillStyle(0x296b72,1);g.fillRect(sx-this.s(1.5),sy-this.s(26),this.s(3),this.s(26));g.fillStyle(0xa7d8de,1);g.fillRoundedRect(sx-this.s(13),sy-this.s(33),this.s(26),this.s(9),3);
    if(st>=3){g.lineStyle(this.s(2),0x2c8c6b,.9);g.beginPath();g.moveTo(this.ix(.1,.78),this.iy(.1,.78,.03));g.lineTo(this.ix(2.1,.78),this.iy(2.1,.78,.03));g.strokePath();}
  }
  _technology(){
    const st=this._stage(),spots=[[.08,.12],[.63,.08],[1.24,.12],[.2,1.35],[1.05,1.28],[1.58,.78]];
    for(let i=0;i<Math.min(2+st,spots.length);i++){const [x,y]=spots[i],h=.62+st*.18+(i%2)*.18,b=this._box(x,y,.4,.4,h,0xd5e6e5,0x315e66,0x4b7b83);this._windows(b,2,Math.max(1,st),0xa7d8de);if(st>=3&&i<3)this._solar(x+.08,y+.12,1);}
    const g=this.gfx;if(st>=2){const x=this.ix(1.74,1.67),y=this.iy(1.74,1.67,0);g.fillStyle(0xf2e7c9,1);g.fillRoundedRect(x-this.s(18),y-this.s(7),this.s(36),this.s(14),4);g.fillStyle(0x5d9b62,1);g.fillCircle(x,y-this.s(2),this.s(4));}
    this._tree(1.85,1.86,.65);this._tree(.1,1.95,.65);
  }
  _energy(){
    const st=this._stage(),g=this.gfx;this._solar(.08,.2,Math.min(3+st,7));this._solar(.18,.62,Math.min(2+st,6));if(st>=3)this._solar(.3,1.02,5);
    this._box(1.48,1.36,.45,.42,.34,0xe3bd55,0x77602b,0xa88732);
    if(st>=4)this._box(1.75,.22,.32,.34,.58,0xf2e7c9,0x67847e,0x87a39b);
    this.turbinePos=[];for(let i=0;i<Math.min(1+st,4);i++){const gx=.25+i*.52,gy=1.68+(i%2)*.18,tx=this.ix(gx,gy),ty=this.iy(gx,gy,0);g.fillStyle(0xeef1e9,1);g.fillRect(tx-this.s(1.4),ty-this.s(34),this.s(2.8),this.s(34));this.turbinePos.push({x:tx,y:ty-this.s(35)});}
  }
  // ---- Connected-city landmarks: each district is a recognisable quarter
  // built straight onto the shared city ground (no plot, no plaza tile).
  _gable(gx,gy,w,d,h,wall,wallR,roof,rh){
    rh=rh===undefined?.32:rh;const g=this.gfx,P=(a,b,z)=>({x:this.ix(a,b),y:this.iy(a,b,z)});
    this._poly(g,[P(gx+.06,gy+d+.1,0),P(gx+w+.16,gy+d+.1,0),P(gx+w+.16,gy+.1,0)],0x244840,.18);
    this._poly(g,[P(gx,gy+d,0),P(gx,gy+d,h),P(gx+w,gy+d,h),P(gx+w,gy+d,0)],wall,1);
    this._poly(g,[P(gx+w,gy,0),P(gx+w,gy,h),P(gx+w,gy+d/2,h+rh),P(gx+w,gy+d,h),P(gx+w,gy+d,0)],wallR,1);
    this._poly(g,[P(gx,gy,h),P(gx+w,gy,h),P(gx+w,gy+d/2,h+rh),P(gx,gy+d/2,h+rh)],this._shade(roof,.82),1);
    this._poly(g,[P(gx,gy+d,h),P(gx+w,gy+d,h),P(gx+w,gy+d/2,h+rh),P(gx,gy+d/2,h+rh)],roof,1);
    // door + windows on the street facade
    g.fillStyle(0x4a3a2c,1);const dx=this.ix(gx+w*.5,gy+d),dy=this.iy(gx+w*.5,gy+d,0);g.fillRect(dx-this.s(2),dy-this.s(7),this.s(4),this.s(7));
    g.fillStyle(0xcfe6e8,.95);[.22,.78].forEach(f=>{const x=this.ix(gx+w*f,gy+d),y=this.iy(gx+w*f,gy+d,h*.62);g.fillRect(x-this.s(2),y-this.s(2),this.s(4),this.s(4));});
  }
  _shade(c,k){const r=((c>>16)&255)*k,gg=((c>>8)&255)*k,b=(c&255)*k;return (Math.round(r)<<16)|(Math.round(gg)<<8)|Math.round(b);}
  _path(a,b,wd,color){const g=this.gfx;g.lineStyle(this.s(wd),color,1);g.beginPath();g.moveTo(this.ix(a[0],a[1]),this.iy(a[0],a[1],0));g.lineTo(this.ix(b[0],b[1]),this.iy(b[0],b[1],0));g.strokePath();}
  _metroLandmark(){
    if(this.id==='housing')this._mHousing(); else if(this.id==='transport')this._mStation();
    else if(this.id==='technology')this._mTech(); else this._mEnergy();
  }
  _mHousing(){
    const st=this._stage(),walls=[[0xf1e2c4,0xd7c3a0],[0xe9c9a4,0xcfae88],[0xf4efe2,0xd9d2bf],[0xd9b7a0,0xbf9d86],[0xe8dcb5,0xcdc099]],roofs=[0xb1543f,0x9a4a38,0x6f5a52,0xc0664a];
    this._path([-.2,1.15],[2.45,1.15],7,0xcfc8b4);this._path([1.1,-.2],[1.1,2.45],6,0xcfc8b4);
    const lots=[];for(let r=0;r<4;r++)for(let c=0;c<4;c++){const gx=-.15+c*.62,gy=-.15+r*.62;if(Math.abs(gx+.1-1.1)<.2||Math.abs(gy+.1-1.15)<.2)continue;lots.push([gx,gy,r*4+c]);}
    const n=Math.min(lots.length,4+st*2+this._grow()*2);lots.slice(0,n).sort((a,b)=>(a[0]+a[1])-(b[0]+b[1])).forEach(([gx,gy,k])=>{
      const wl=walls[k%walls.length],tall=(st>=3&&k%3===0),h=tall?.78:.5;
      this._gable(gx,gy,.44,.4,h,wl[0],wl[1],roofs[k%roofs.length]);
      if(st>=3&&k%2===0)this._solar(gx+.1,gy+.12,1);
    });
    for(let i=0;i<2+st;i++)this._tree(-.1+i*.55,2.35,.7);
  }
  _mStation(){
    const st=this._stage(),g=this.gfx,P=(a,b,z)=>({x:this.ix(a,b),y:this.iy(a,b,z)});
    // tracks + platform in front of the hall
    this._poly(g,[P(-.2,1.55,0),P(2.45,1.55,0),P(2.45,2.4,0),P(-.2,2.4,0)],0x8f8a7c,1);
    g.lineStyle(this.s(1.5),0x5a4a3c,1);for(let t=0;t<3;t++){const y0=1.72+t*.24;[0,.08].forEach(o=>{g.beginPath();g.moveTo(this.ix(-.2,y0+o),this.iy(-.2,y0+o,.01));g.lineTo(this.ix(2.45,y0+o),this.iy(2.45,y0+o,.01));g.strokePath();});}
    // historic sandstone hall with arched glass roof (stepped vault)
    const gx=.28,gy=-.12,w=2.2,d=1.2,h=.62;
    this._box(gx,gy,w,d,h,0xe6d2a8,0xc9a878,0xdcc095);
    const steps=6;for(let i=0;i<steps;i++){const a0=Math.PI*i/steps,a1=Math.PI*(i+1)/steps,y0=gy+d/2-Math.cos(a0)*d/2,y1=gy+d/2-Math.cos(a1)*d/2,z0=h+Math.sin(a0)*.55,z1=h+Math.sin(a1)*.55;
      this._poly(g,[P(gx,y0,z0),P(gx+w,y0,z0),P(gx+w,y1,z1),P(gx,y1,z1)],i<3?0x7fa7ad:0xa9cdd2,.97);g.lineStyle(1,0x3f5f63,.6);g.strokePath();}
    // arched front gable on the east end
    const ex=gx+w;g.fillStyle(0xdcc095,1);g.beginPath();g.moveTo(this.ix(ex,gy),this.iy(ex,gy,h));for(let i=0;i<=12;i++){const a=Math.PI*i/12;g.lineTo(this.ix(ex,gy+d/2-Math.cos(a)*d/2),this.iy(ex,gy+d/2-Math.cos(a)*d/2,h+Math.sin(a)*.62));}g.closePath();g.fillPath();
    g.fillStyle(0x9cc6cc,1);g.beginPath();for(let i=0;i<=12;i++){const a=Math.PI*i/12,yy=gy+d/2-Math.cos(a)*d*.34,zz=h*.25+Math.sin(a)*.72;i?g.lineTo(this.ix(ex,yy),this.iy(ex,yy,zz)):g.moveTo(this.ix(ex,yy),this.iy(ex,yy,zz));}g.closePath();g.fillPath();
    // arched windows along the facade
    g.fillStyle(0x6d8d93,1);for(let i=0;i<6;i++){const x=this.ix(gx+.2+i*.34,gy+d),y=this.iy(gx+.2+i*.34,gy+d,h*.45);g.fillRoundedRect(x-this.s(3),y-this.s(6),this.s(6),this.s(11),{tl:this.s(3),tr:this.s(3),bl:0,br:0});}
    // clock tower
    const tgx=-.8,tgy=.3,tw=.38,td=.38;
    const tb=this._box(tgx,tgy,tw,td,1.55+.12*st,0xe2cb9c,0xbf9c6c,0xd4b585);
    const cx=this.ix(tgx+tw/2,tgy+td),cy=this.iy(tgx+tw/2,tgy+td,1.25+.12*st);g.fillStyle(0xf7f1e1,1);g.fillCircle(cx,cy,this.s(6));g.lineStyle(this.s(1.2),0x2e2e2e,1);g.strokeCircle(cx,cy,this.s(6));g.lineBetween(cx,cy,cx,cy-this.s(4));g.lineBetween(cx,cy,cx+this.s(3),cy);
    const top=tb.h,tp=P(tgx+tw/2,tgy+td/2,top+.55);g.fillStyle(0x3f6a6c,1);[[P(tgx,tgy+td,top),P(tgx+tw,tgy+td,top)],[P(tgx+tw,tgy+td,top),P(tgx+tw,tgy,top)]].forEach(([a,b])=>{g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(tp.x,tp.y);g.closePath();g.fillPath();});
    if(st>=2)this._box(1.9,1.6,.5,.2,.18,0xe0a82e,0x9a7a2a,0xc29530);
    if(st>=3)this._box(.4,2.05,.9,.18,.16,0xc9423a,0x8e2e28,0xa9362f);
    // every allocation adds a train on the platforms
    for(let i=0;i<this._grow();i++){const tr=i%3,x=-.1+Math.floor(i/3)*.85;this._box(x,1.66+tr*.24,.7,.14,.16,[0xc9423a,0xe0a82e,0x296b72][i%3],0x5a3a30,0x8e5a48);}
  }
  _mTech(){
    const st=this._stage(),g=this.gfx;
    this._path([-.2,1.2],[2.45,1.2],6,0xd6d3c6);
    // university: classical hall with columns, pediment and a green court
    const u=this._box(-.1,-.1,1.05,.7,.62,0xefe8d6,0xcfc4a8,0xe0d6bc);
    const P=(a,b,z)=>({x:this.ix(a,b),y:this.iy(a,b,z)});
    g.fillStyle(0xfaf6ea,1);for(let i=0;i<6;i++){const x=this.ix(-.02+i*.17,.6),y=this.iy(-.02+i*.17,.6,0);g.fillRect(x-this.s(1.5),y-this.s(15),this.s(3),this.s(15));}
    this._poly(g,[P(-.1,.6,.62),P(.95,.6,.62),P(.425,.6,.95)],0xe6dcc2,1);
    this._poly(g,[P(-.1,.6,.62),P(.95,.6,.62),P(.425,.6,.95)].map(q=>q),0xe6dcc2,1);
    const dm=P(.425,.25,.62);g.fillStyle(0x5f8f86,1);g.fillEllipse(dm.x,dm.y-this.s(6),this.s(26),this.s(18));g.fillStyle(0xeee6d0,1);g.fillRect(dm.x-this.s(13),dm.y-this.s(4),this.s(26),this.s(5));
    this._tree(.1,.95,.6);this._tree(.7,.95,.6);
    // modern glass offices, taller as the quarter grows
    // Offices spread through separate street lots. Each additional credit
    // reveals another building instead of only stretching existing towers.
    const spots=[[1.35,-.28],[2.25,.18],[1.55,1.72],[-.38,1.58],[2.35,1.55],[.72,1.92],[2.82,.72],[-.65,.55],[1.18,2.35],[3.05,1.82]];
    spots.slice(0,Math.min(1+st+this._grow(),spots.length)).sort((a,b)=>(a[0]+a[1])-(b[0]+b[1])).forEach(([x,y],i)=>{
      const h=.8+st*.22+(i%2)*.3,b=this._box(x,y,.45,.45,h,0xcfe3e4,0x3d6e79,0x5c8e98);
      g.lineStyle(1,0xbfe6ea,.55);for(let k=1;k<5;k++){const z=h*k/5;g.beginPath();g.moveTo(this.ix(x,y+.45),this.iy(x,y+.45,z));g.lineTo(this.ix(x+.45,y+.45),this.iy(x+.45,y+.45,z));g.lineTo(this.ix(x+.45,y),this.iy(x+.45,y,z));g.strokePath();}
      if(st>=3){const r=P(x+.22,y+.22,h);g.fillStyle(0x6fae62,1);g.fillEllipse(r.x,r.y,this.s(18),this.s(9));}
    });
  }
  _mEnergy(){
    const st=this._stage(),g=this.gfx,P=(a,b,z)=>({x:this.ix(a,b),y:this.iy(a,b,z)});
    // ground-mounted solar farm: fenced rows of panels on the grass
    const gr=this._grow(),rows=Math.min(2+st+gr,8);
    // Four panels per row keep the farm together; the former fifth panel
    // sat by itself across the diagonal road.
    for(let r=0;r<rows;r++){const gy=-.47+r*.24;for(let c=0;c<4;c++){const gx=-.05+c*.3;if(gx>1.1&&gy>.58)continue;
      // tilted panel on two legs, sitting on grass inside the quarter
      g.fillStyle(0x4d5a58,1);const l1=P(gx+.04,gy+.14,0),l2=P(gx+.24,gy+.14,0);g.fillRect(l1.x-this.s(.8),l1.y-this.s(5),this.s(1.6),this.s(5));g.fillRect(l2.x-this.s(.8),l2.y-this.s(5),this.s(1.6),this.s(5));
      this._poly(g,[P(gx,gy,.05),P(gx+.28,gy,.05),P(gx+.28,gy+.14,.2),P(gx,gy+.14,.2)],0x24506a,1);
      g.lineStyle(1,0x7fc6d6,.7);g.beginPath();g.moveTo(this.ix(gx+.14,gy),this.iy(gx+.14,gy,.05));g.lineTo(this.ix(gx+.14,gy+.14),this.iy(gx+.14,gy+.14,.2));g.strokePath();}}
    this._box(1.45,.15,.35,.3,.3,0xe3bd55,0x77602b,0xa88732);
    // Keep the conventional (gas) station in the lower-right field, away
    // from the solar rows and the district's diagonal road.
    this._box(2.25,1.72,.7,.55,.5,0xb9b3a6,0x7d776c,0x9a9486);
    [[2.4,1.82],[2.7,1.82]].forEach(([cx,cy])=>{const b=P(cx,cy,.5),t=P(cx,cy,1.25);g.fillStyle(0x8c8579,1);g.fillRect(b.x-this.s(3),t.y,this.s(6),b.y-t.y);g.fillStyle(0xc85848,1);g.fillRect(b.x-this.s(3),t.y+this.s(3),this.s(6),this.s(2));});
    this.chimneyPos=[P(2.4,1.82,1.3),P(2.7,1.82,1.3)];
    this.turbinePos=[];for(let i=0;i<Math.min(2+st+gr,8);i++){const gx=-.2+(i%4)*.6+(i>=4?.3:0),gy=i>=4?-.9:-.45,tx=this.ix(gx,gy),ty=this.iy(gx,gy,0);g.fillStyle(0xeef1e9,1);g.fillRect(tx-this.s(1.6),ty-this.s(48),this.s(3.2),this.s(48));this.turbinePos.push({x:tx,y:ty-this.s(49)});}
  }
  _touchPointer(pointer){const e=pointer&&pointer.event;return !!(pointer&&pointer.wasTouch)||(e&&e.pointerType==='touch');}
  _addInteraction(){this.hitZone=this.scene.add.rectangle(this.cx,this.cy+this.s(4),this.s(205),this.s(145),0xffffff,0).setDepth(11).setInteractive({useHandCursor:true});this.hitZone.on('pointerover',()=>{this.isHovered=true;this._glowOn();if(this.scene.tooltipManager)this.scene.tooltipManager.show(this,this.labelContainer.x,this.labelBaseY-this.s(8));});this.hitZone.on('pointerout',()=>{this.isHovered=false;this._glowOff();if(this.scene.tooltipManager)this.scene.tooltipManager.hide(this,true);});this.hitZone.on('pointerdown',(pointer)=>{if(this.selectable&&this.onSelect)this.onSelect(this);else if(this._touchPointer(pointer)&&this.scene.tooltipManager)this.scene.tooltipManager.toggle(this,this.labelContainer.x,this.labelBaseY-this.s(8));});}
  setSelectable(on,cb){this.selectable=on;this.onSelect=cb||null;if(on)this._pulseOn();else this._pulseOff();}
  _ringPts(){return [{x:this.ix(-.25,2.5),y:this.iy(-.25,2.5,0)},{x:this.ix(2.5,2.5),y:this.iy(2.5,2.5,0)},{x:this.ix(2.5,-.25),y:this.iy(2.5,-.25,0)},{x:this.ix(-.25,-.25),y:this.iy(-.25,-.25,0)}];}
  _showGlow(){this._glowOn();} _hideGlow(){this._glowOff();}
  _pulseOn(){if(this._selGfx)this._pulseOff();if(this.scene.hasMetro){this._selGfx=this.scene.add.graphics().setDepth(7);if(this.labelContainer)this.scene.tweens.add({targets:this.labelContainer,scaleX:1.1,scaleY:1.1,duration:700,yoyo:true,repeat:-1});return;}this._selGfx=this.scene.add.graphics().setDepth(7);const p=this._ringPts();this._selGfx.lineStyle(this.s(3),CityTheme.colors.gold,.95);this._selGfx.beginPath();this._selGfx.moveTo(p[0].x,p[0].y);p.forEach(q=>this._selGfx.lineTo(q.x,q.y));this._selGfx.closePath();this._selGfx.strokePath();this.scene.tweens.add({targets:this._selGfx,alpha:{from:1,to:.3},duration:800,yoyo:true,repeat:-1});}
  _pulseOff(){if(this.labelContainer){this.scene.tweens.killTweensOf(this.labelContainer);this.labelContainer.setScale(1);}if(this._selGfx){this.scene.tweens.killTweensOf(this._selGfx);this._selGfx.destroy();this._selGfx=null;}}
  _glowOn(){if(this.scene.hasMetro){if(this.labelContainer)this.labelContainer.setScale(1.06);return;}if(this.glowGfx)this.glowGfx.destroy();this.glowGfx=this.scene.add.graphics().setDepth(7);const p=this._ringPts();this._poly(this.glowGfx,p,CityTheme.colors.gold,.16);this.glowGfx.lineStyle(this.s(2),CityTheme.colors.gold,.9);this.glowGfx.strokePath();}
  _glowOff(){if(this.scene.hasMetro&&this.labelContainer&&!this._selGfx)this.labelContainer.setScale(1);if(this.glowGfx){this.glowGfx.destroy();this.glowGfx=null;}}
  _initCitizens(){for(let i=0;i<12;i++)this.citizens.push(this._newCitizen());}
  _newCitizen(){return {gx:.15+Math.random()*1.95,gy:.08+Math.random()*1.95,tgx:.15+Math.random()*1.95,tgy:.08+Math.random()*1.95,speed:.00012+Math.random()*.00016,bob:Math.random()*6.2,pause:0,skin:[0xe7b98f,0x9d6847,0x6f4938,0xf0c9a4][Phaser.Math.Between(0,3)],shirt:[0x296b72,0xe0a82e,0xc96b4b,0xf2e7c9][Phaser.Math.Between(0,3)]};}
  _updateCitizens(delta){const g=this.animGfx,active=Math.max(5,Math.min(12,this._stage()*2+3));this.citizens.forEach((c,i)=>{if(i>=active)return;if(c.pause>0)c.pause-=delta;else{const dx=c.tgx-c.gx,dy=c.tgy-c.gy,dist=Math.hypot(dx,dy);if(dist<.06){c.tgx=.15+Math.random()*1.95;c.tgy=.08+Math.random()*1.95;c.pause=180+Math.random()*600;}else{c.gx+=dx/dist*c.speed*delta;c.gy+=dy/dist*c.speed*delta;}}c.bob+=delta*.01;const x=this.ix(c.gx,c.gy),y=this.iy(c.gx,c.gy,0)-Math.abs(Math.sin(c.bob))*this.s(1.5);g.fillStyle(0x173b40,.2);g.fillEllipse(x,y+this.s(3),this.s(8),this.s(3));g.fillStyle(c.shirt,1);g.fillRoundedRect(x-this.s(2.7),y-this.s(9),this.s(5.4),this.s(8),1);g.fillStyle(c.skin,1);g.fillCircle(x,y-this.s(12),this.s(2.8));g.lineStyle(this.s(1.2),0x334f4d,.9);g.lineBetween(x-this.s(1),y-this.s(1),x-this.s(3),y+this.s(5));g.lineBetween(x+this.s(1),y-this.s(1),x+this.s(3),y+this.s(5));});}
  receiveResource(a){this.resources+=a;this.visualCapacity+=a;this.lastEffect='Investment added capacity and improved district condition by '+Math.round(a*9)+' points.';this._animHealth(this.health,Math.min(100,this.health+a*9),680,'Back.easeOut');this._construction();this.scene.tweens.add({targets:this.labelContainer,scaleX:1.08,scaleY:1.08,duration:150,yoyo:true});}
  takeDamage(a){const lost=Math.min(this.visualCapacity,Math.max(1,Math.round(a/9)));this.visualCapacity=Math.max(0,this.visualCapacity-lost);this.lastEffect='A recent event reduced district condition by '+Math.round(a)+' points and removed '+lost+' capacity.';this._animHealth(this.health,Math.max(6,this.health-a),760,'Power2.easeIn');this._deconstruction(lost);this._cracks();}
  _animHealth(from,to,dur,ease){const o={h:from};this.scene.tweens.add({targets:o,h:to,duration:dur,ease,onUpdate:()=>{this.health=o.h;this.draw();},onComplete:()=>{this.health=to;this.draw();if(this.scene.statsPanel)this.scene.statsPanel.refreshPerformance();}});}
  _construction(){if(this.scene.reducedMotion)return;const crane=this.scene.add.graphics().setDepth(20),x=this.cx+this.s(18),y=this.cy-this.s(20);crane.lineStyle(this.s(2),0xe0a82e,.9);crane.lineBetween(x,y,x,y-this.s(55));crane.lineBetween(x-this.s(24),y-this.s(48),x+this.s(30),y-this.s(48));crane.lineBetween(x+this.s(20),y-this.s(48),x+this.s(20),y-this.s(24));this.scene.tweens.add({targets:crane,alpha:0,duration:850,delay:450,onComplete:()=>crane.destroy()});}
  _deconstruction(count){if(this.scene.reducedMotion||!count)return;for(let i=0;i<Math.min(5,count);i++){const p=this.scene.add.graphics().setDepth(21),x=this.cx+Phaser.Math.Between(-55,55),y=this.cy+Phaser.Math.Between(-35,25);p.fillStyle(0xd8d0bf,.75);p.fillCircle(x,y,this.s(7+i));this.scene.tweens.add({targets:p,y:y-this.s(24),scaleX:1.8,scaleY:1.8,alpha:0,duration:620,delay:i*90,onComplete:()=>p.destroy()});}}
  _cracks(){for(let i=0;i<3;i++){const c=this.scene.add.graphics().setDepth(20),x=this.cx+Phaser.Math.Between(-50,50),y=this.cy+Phaser.Math.Between(-12,30);c.lineStyle(this.s(2),0xc85848,.9);c.beginPath();c.moveTo(x,y);c.lineTo(x+Phaser.Math.Between(-12,12),y+this.s(15));c.strokePath();this.scene.tweens.add({targets:c,alpha:0,duration:2400,delay:500,onComplete:()=>c.destroy()});}}
  celebrate(){this._construction();}
  setStorm(on){this.scene.tweens.add({targets:[this.gfx,this.animGfx],alpha:on?.48:1,duration:1200});this.scene.tweens.add({targets:this.labelContainer,alpha:on?.65:1,duration:1200});}
  // Night for a district: one soft dark layer between its buildings (depth 8)
  // and its animation layer (depth 10), then warm windows drawn on top. The
  // quarter goes properly dark but stays readable and alive.
  _nightLayer(k){
    if(!this._nightGfx)this._nightGfx=this.scene.add.graphics().setDepth(9);
    const g=this._nightGfx;g.clear();
    // Whole-city night is drawn once by the city layer; no per-district patches.
    if(!this.scene.hasMetro&&k>0.02){g.fillStyle(0x061426,0.35*k);g.fillEllipse(this.cx,this.cy+this.s(6),this.s(340),this.s(250));}
  }
  _nightWindows(k){
    if(k<=0.05)return;
    if(!this._winSeed){this._winSeed=[];for(let i=0;i<26;i++)this._winSeed.push({dx:(Math.random()-0.5)*2.9,dy:(Math.random()-0.5)*2.4,ph:Math.random()*6.28});}
    const g=this.animGfx,lit=Math.min(26,10+this._stage()*4);
    this._winSeed.forEach((w,i)=>{
      if(i>=lit)return;
      const x=this.ix(0.95+w.dx,0.95+w.dy),y=this.iy(0.95+w.dx,0.95+w.dy,0.55);
      const fl=0.82+0.18*Math.sin(this.animTime*0.0016+w.ph);
      g.fillStyle(0xffd980,0.17*k*fl);g.fillCircle(x,y,this.s(9));
      g.fillStyle(0xfff1c2,Math.min(1,1.1*k)*fl);g.fillRect(x-this.s(2.6),y-this.s(2.6),this.s(5.2),this.s(4.4));
    });
  }
  update(time,delta){this.animTime+=delta;this.animGfx.clear();this._nightLayer(this.scene.nightStrength||0);this._nightWindows(this.scene.nightStrength||0);if(!(this.scene.hasMetro&&this.id==='energy')&&(this.scene.nightStrength||0)<.6)this._updateCitizens(delta);if(this.id==='energy')this._blades(delta);}
  _blades(delta){if(!this.turbinePos)return;this.turbineAngle+=delta*.0026;const g=this.animGfx;this.turbinePos.forEach((t,i)=>{const a0=this.turbineAngle+i*.6;g.fillStyle(0xf4f5ef,1);for(let b=0;b<3;b++){const a=a0+b*Math.PI*2/3;g.beginPath();g.moveTo(t.x,t.y);g.lineTo(t.x+Math.cos(a)*this.s(13),t.y+Math.sin(a)*this.s(13));g.lineTo(t.x+Math.cos(a+.27)*this.s(10),t.y+Math.sin(a+.27)*this.s(10));g.closePath();g.fillPath();}g.fillStyle(0x6f8786,1);g.fillCircle(t.x,t.y,this.s(2.2));});}
  getName(){return (typeof currentLang!=='undefined'&&currentLang==='de')?this.nameDE:this.name;}
  getTooltip(){return (typeof currentLang!=='undefined'&&currentLang==='de')?this.tooltipDE:this.tooltip;}
  getPanelText(){const de=(typeof currentLang!=='undefined'&&currentLang==='de'),condition=Math.round(this.health),credits=Math.round(this.resources*100),effect=this.lastEffect||(de?'Noch keine direkte Auswirkung in diesem Stadtteil.':'No direct choice effect in this district yet.');return de?`${this.getTooltip()}\n\nZUSTAND  ${condition}/100\nINVESTITIONEN  ${credits} Credits\n\nLETZTE AUSWIRKUNG\n${effect}`:`${this.getTooltip()}\n\nCONDITION  ${condition}/100\nINVESTMENTS  ${credits} credits\n\nLATEST CHOICE EFFECT\n${effect}`;}
}
