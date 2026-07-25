class District {
  constructor(scene, config) {
    this.scene = scene;
    this.S = config.scale || scene.S || 1;
    this.id = config.id;
    this.name = config.name;      this.nameDE = config.nameDE;
    this.color = config.color;    this.darkColor = config.darkColor;
    this.accentColor = config.accentColor;
    this.cx = config.cx;          this.cy = config.cy;
    this.health = config.health || 45;
    this.resources = 0;
    this.tooltip = config.tooltip; this.tooltipDE = config.tooltipDE;
    this.label = config.label || config.name;
    this.labelDE = config.labelDE || config.nameDE;
    this.isHovered = false;
    this.animTime = Math.random()*1000;
    this.turbineAngle = Math.random()*Math.PI*2;
    this.selectable = false; this.onSelect = null;

    this.gfx     = scene.add.graphics().setDepth(8);
    this.animGfx = scene.add.graphics().setDepth(9);
    this.citizens = [];

    this._buildLabel();
    this.draw();
    this._addInteraction();
    this._initCitizens();
  }

  s(v){ return Math.round(v * this.S); }
  ix(gx,gy){ return this.cx + (gx-gy)*this.s(34); }
  iy(gx,gy,gz){ return this.cy + (gx+gy)*this.s(19) - (gz||0)*this.s(26); }

  _buildLabel() {
    const txt=(typeof currentLang!=='undefined'&&currentLang==='de')?this.labelDE:this.label;
    this.labelBaseY = this.cy - this.s(112);
    this.labelContainer = this.scene.add.container(this.cx, this.labelBaseY).setDepth(13);
    const t=this.scene.add.text(0,0,this._icon()+'  '+txt,{
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(13), color:'#e2eeff', fontStyle:'600'
    }).setOrigin(0.5);
    const w=t.width+this.s(22), h=this.s(25);
    const bg=this.scene.add.graphics();
    bg.fillStyle(0x040a14,0.9); bg.fillRoundedRect(-w/2,-h/2,w,h,this.s(7));
    bg.lineStyle(1,this.accentColor,0.6); bg.strokeRoundedRect(-w/2,-h/2,w,h,this.s(7));
    this.labelContainer.add([bg,t]);
    this.labelH = h;
  }

  // Safe Y for a second label — always sits clear below the district name
  subLabelY(){ return this.labelContainer.y + this.labelH/2 + this.s(19); }

  _icon(){ return {housing:'\uD83C\uDFD8',transport:'\uD83D\uDE8F',technology:'\uD83D\uDDA5',energy:'\u26A1'}[this.id]||'\uD83C\uDFD7'; }

  draw() {
    const g=this.gfx; g.clear();
    this._ground();
    if(this.id==='housing') this._housing();
    else if(this.id==='transport') this._transport();
    else if(this.id==='technology') this._technology();
    else if(this.id==='energy') this._energy();
  }

  _ground() {
    const g=this.gfx;
    const p=[{x:this.ix(0,2.2),y:this.iy(0,2.2,0)},{x:this.ix(2.2,2.2),y:this.iy(2.2,2.2,0)},
             {x:this.ix(2.2,0),y:this.iy(2.2,0,0)},{x:this.ix(0,0),y:this.iy(0,0,0)}];
    g.fillStyle(this.darkColor,0.58);
    g.beginPath(); g.moveTo(p[0].x,p[0].y); p.forEach(q=>g.lineTo(q.x,q.y)); g.closePath(); g.fillPath();
    g.lineStyle(1,this.color,0.38); g.strokePath();
  }

  _box(gx,gy,w,d,h,cT,cL,cR,a) {
    const g=this.gfx; a=(a===undefined)?1:a;
    g.fillStyle(cL,0.95*a);
    g.beginPath();
    g.moveTo(this.ix(gx,gy+d),this.iy(gx,gy+d,0));   g.lineTo(this.ix(gx,gy+d),this.iy(gx,gy+d,h));
    g.lineTo(this.ix(gx+w,gy+d),this.iy(gx+w,gy+d,h)); g.lineTo(this.ix(gx+w,gy+d),this.iy(gx+w,gy+d,0));
    g.closePath(); g.fillPath();
    g.fillStyle(cR,0.9*a);
    g.beginPath();
    g.moveTo(this.ix(gx+w,gy),this.iy(gx+w,gy,0));   g.lineTo(this.ix(gx+w,gy),this.iy(gx+w,gy,h));
    g.lineTo(this.ix(gx+w,gy+d),this.iy(gx+w,gy+d,h)); g.lineTo(this.ix(gx+w,gy+d),this.iy(gx+w,gy+d,0));
    g.closePath(); g.fillPath();
    g.fillStyle(cT,0.95*a);
    g.beginPath();
    g.moveTo(this.ix(gx,gy),this.iy(gx,gy,h));       g.lineTo(this.ix(gx+w,gy),this.iy(gx+w,gy,h));
    g.lineTo(this.ix(gx+w,gy+d),this.iy(gx+w,gy+d,h)); g.lineTo(this.ix(gx,gy+d),this.iy(gx,gy+d,h));
    g.closePath(); g.fillPath();
  }

  _housing() {
    const g=this.gfx;
    const n=Math.max(1,Math.round(this.health/22));
    const sp=[[0.25,0.28],[1.1,0.32],[0.35,1.05],[1.2,1.1],[0.75,0.7]];
    for(let i=0;i<Math.min(n,sp.length);i++){
      const gx=sp[i][0], gy=sp[i][1];
      const h=0.28+(this.health/100)*0.35;
      this._box(gx,gy,0.42,0.42,h,0x6fbf7f,0x1d5a2a,0x2f8a42);
      const rz=h+0.22;
      g.fillStyle(0x9c4a3a,0.95);
      g.beginPath(); g.moveTo(this.ix(gx,gy),this.iy(gx,gy,h));
      g.lineTo(this.ix(gx+0.21,gy+0.21),this.iy(gx+0.21,gy+0.21,rz));
      g.lineTo(this.ix(gx+0.42,gy),this.iy(gx+0.42,gy,h)); g.closePath(); g.fillPath();
      g.fillStyle(0x7a3628,0.95);
      g.beginPath(); g.moveTo(this.ix(gx,gy+0.42),this.iy(gx,gy+0.42,h));
      g.lineTo(this.ix(gx+0.21,gy+0.21),this.iy(gx+0.21,gy+0.21,rz));
      g.lineTo(this.ix(gx,gy),this.iy(gx,gy,h)); g.closePath(); g.fillPath();
      if(this.health>25){ g.fillStyle(0xffe9b0,0.9);
        g.fillRect(this.ix(gx+0.1,gy+0.42)-this.s(2),this.iy(gx+0.1,gy+0.42,h*0.5)-this.s(2),this.s(4),this.s(4)); }
    }
    if(this.health>20){
      for(let i=0;i<3;i++){
        const tx=this.ix(0.1+i*0.8,1.72), ty=this.iy(0.1+i*0.8,1.72,0);
        g.fillStyle(0x17431f,0.9); g.fillRect(tx-this.s(1.2),ty-this.s(6),this.s(2.4),this.s(7));
        g.fillStyle(0x2f8a42,0.95); g.fillCircle(tx,ty-this.s(10),this.s(6.5));
        g.fillStyle(0x46b45c,0.5);  g.fillCircle(tx-this.s(2),ty-this.s(12),this.s(3.5));
      }
    }
  }

  _transport() {
    const g=this.gfx;
    g.fillStyle(0x2b2b30,0.85);
    g.beginPath();
    g.moveTo(this.ix(0,0.8),this.iy(0,0.8,0.02));   g.lineTo(this.ix(2.2,0.8),this.iy(2.2,0.8,0.02));
    g.lineTo(this.ix(2.2,1.15),this.iy(2.2,1.15,0.02)); g.lineTo(this.ix(0,1.15),this.iy(0,1.15,0.02));
    g.closePath(); g.fillPath();
    g.lineStyle(this.s(1.4),0xf2d97a,0.45);
    for(let d=0;d<4;d++){ const dx=0.2+d*0.5;
      g.beginPath(); g.moveTo(this.ix(dx,0.98),this.iy(dx,0.98,0.03));
      g.lineTo(this.ix(dx+0.22,0.98),this.iy(dx+0.22,0.98,0.03)); g.strokePath(); }
    const n=Math.max(1,Math.round(this.health/30));
    const h=0.35+(this.health/100)*0.4;
    this._box(0.15,0.08,1.0,0.5,h,0x7ea8d0,0x1a3350,0x33608f);
    g.fillStyle(0x9dc0e0,0.8);
    for(let v=0;v<3;v++) g.fillRect(this.ix(0.3+v*0.28,0.3)-this.s(3),this.iy(0.3+v*0.28,0.3,h)-this.s(2),this.s(6),this.s(3));
    for(let b=0;b<Math.min(n+1,3);b++){
      const bx=0.25+b*0.55, by=1.42;
      this._box(bx,by,0.36,0.2,0.2,0xd4a13c,0x7a5410,0xa9761f);
      g.fillStyle(0xbfe0ff,0.8);
      g.fillRect(this.ix(bx+0.06,by+0.2)-this.s(1),this.iy(bx+0.06,by+0.2,0.14)-this.s(1),this.s(8),this.s(3));
    }
    const sx=this.ix(1.75,0.45), sy=this.iy(1.75,0.45,0);
    g.fillStyle(0x8fb4d8,0.95); g.fillRect(sx-this.s(1),sy-this.s(20),this.s(2),this.s(20));
    g.fillStyle(0x33608f,0.95); g.fillRoundedRect(sx-this.s(9),sy-this.s(30),this.s(18),this.s(11),this.s(2));
    g.fillStyle(0xd8e8f8,0.9);  g.fillRect(sx-this.s(6),sy-this.s(26),this.s(12),this.s(2));
  }

  _technology() {
    const g=this.gfx;
    const n=Math.max(1,Math.round(this.health/20));
    const sp=[[0.2,0.22],[0.95,0.18],[0.3,1.0],[1.05,0.95],[1.5,0.55]];
    for(let i=0;i<Math.min(n,sp.length);i++){
      const gx=sp[i][0], gy=sp[i][1];
      const h=0.55+(this.health/100)*1.5+(i%3)*0.28;
      this._box(gx,gy,0.3,0.3,h,0xc9a6f5,0x2f1657,0x6b3fae);
      if(this.health>20){
        g.fillStyle(0x9ee8ff,0.75);
        for(let w=0;w<Math.floor(h*3);w++){
          const wz=0.18+w*0.28;
          if(wz<h-0.08) g.fillRect(this.ix(gx+0.04,gy+0.3)-this.s(1),this.iy(gx+0.04,gy+0.3,wz)-this.s(1),this.s(8),this.s(2));
        }
      }
      g.fillStyle(0xff5c7a,0.9);
      g.fillCircle(this.ix(gx+0.15,gy+0.15),this.iy(gx+0.15,gy+0.15,h)-this.s(2),this.s(1.8));
    }
    if(this.health>30){
      const ax=this.ix(1.85,1.55), ay=this.iy(1.85,1.55,0);
      g.fillStyle(0xb08fe0,0.85); g.fillRect(ax-this.s(1),ay-this.s(34),this.s(2),this.s(34));
      g.fillStyle(0xe0c0ff,0.95); g.fillCircle(ax,ay-this.s(36),this.s(3));
      g.lineStyle(1,0xb08fe0,0.3); g.strokeCircle(ax,ay-this.s(36),this.s(9));
    }
  }

  _energy() {
    const g=this.gfx;
    const rows=Math.max(1,Math.round(this.health/28));
    for(let r=0;r<Math.min(rows,3);r++){
      for(let c=0;c<3;c++){
        const gx=0.15+c*0.42, gy=0.12+r*0.38;
        g.fillStyle(0x2a4a8a,0.95);
        g.beginPath();
        g.moveTo(this.ix(gx,gy),this.iy(gx,gy,0.16));            g.lineTo(this.ix(gx+0.3,gy),this.iy(gx+0.3,gy,0.16));
        g.lineTo(this.ix(gx+0.3,gy+0.26),this.iy(gx+0.3,gy+0.26,0.05)); g.lineTo(this.ix(gx,gy+0.26),this.iy(gx,gy+0.26,0.05));
        g.closePath(); g.fillPath();
        g.lineStyle(0.8,0x6fa0e8,0.5); g.strokePath();
      }
    }
    this._box(1.5,1.45,0.4,0.4,0.3,0xf0cc66,0x6b5410,0xa8850f);
    this.turbinePos=[];
    if(this.health>25){
      for(let i=0;i<2;i++){
        const tx=this.ix(0.25+i*0.95,1.72), ty=this.iy(0.25+i*0.95,1.72,0);
        g.fillStyle(0xdfe6ee,0.95); g.fillRect(tx-this.s(1.4),ty-this.s(30),this.s(2.8),this.s(30));
        this.turbinePos.push({x:tx,y:ty-this.s(32)});
      }
    }
  }

  _addInteraction() {
    this.hitZone=this.scene.add.rectangle(this.cx,this.cy+this.s(6),this.s(190),this.s(126),0xffffff,0)
      .setDepth(11).setInteractive({useHandCursor:true});
    this.hitZone.on('pointerover',()=>{ this.isHovered=true; this._glowOn();
      if(this.scene.tooltipManager) this.scene.tooltipManager.show(this,this.cx,this.cy-this.s(60)); });
    this.hitZone.on('pointerout',()=>{ this.isHovered=false; this._glowOff();
      if(this.scene.tooltipManager) this.scene.tooltipManager.hide(); });
    this.hitZone.on('pointerdown',()=>{ if(this.selectable&&this.onSelect){this.onSelect(this);} });
  }

  setSelectable(on,cb){ this.selectable=on; this.onSelect=cb||null; if(on)this._pulseOn(); else this._pulseOff(); }

  _ringPts(){
    return [{x:this.ix(0,2.2),y:this.iy(0,2.2,0)},{x:this.ix(2.2,2.2),y:this.iy(2.2,2.2,0)},
            {x:this.ix(2.2,0),y:this.iy(2.2,0,0)},{x:this.ix(0,0),y:this.iy(0,0,0)}];
  }

  _pulseOn(){
    if(this._selGfx) this._pulseOff();
    this._selGfx=this.scene.add.graphics().setDepth(7);
    const p=this._ringPts();
    this._selGfx.lineStyle(this.s(3),this.accentColor,0.9);
    this._selGfx.beginPath(); this._selGfx.moveTo(p[0].x,p[0].y);
    p.forEach(q=>this._selGfx.lineTo(q.x,q.y)); this._selGfx.closePath(); this._selGfx.strokePath();
    this.scene.tweens.add({targets:this._selGfx,alpha:{from:1,to:0.25},duration:800,yoyo:true,repeat:-1});
  }
  _pulseOff(){ if(this._selGfx){this.scene.tweens.killTweensOf(this._selGfx);this._selGfx.destroy();this._selGfx=null;} }

  _glowOn(){
    if(this.glowGfx) this.glowGfx.destroy();
    this.glowGfx=this.scene.add.graphics().setDepth(7);
    const p=this._ringPts();
    this.glowGfx.fillStyle(this.accentColor,0.1);
    this.glowGfx.beginPath(); this.glowGfx.moveTo(p[0].x,p[0].y);
    p.forEach(q=>this.glowGfx.lineTo(q.x,q.y)); this.glowGfx.closePath(); this.glowGfx.fillPath();
    this.glowGfx.lineStyle(this.s(2),this.accentColor,0.85); this.glowGfx.strokePath();
  }
  _glowOff(){ if(this.glowGfx){this.glowGfx.destroy();this.glowGfx=null;} }

  // Citizens stay inside the tile and off the road band
  _initCitizens(){ for(let i=0;i<3;i++) this.citizens.push(this._newCitizen()); }
  _newCitizen(){
    return { gx:0.25+Math.random()*1.6, gy:0.2+Math.random()*1.3,
             tgx:0.25+Math.random()*1.6, tgy:0.2+Math.random()*1.3,
             speed:0.00016+Math.random()*0.0002, bob:Math.random()*Math.PI*2,
             hue:[0xffd9a0,0xffc4c4,0xc4dcff,0xd8ffc4][Math.floor(Math.random()*4)], pause:0 };
  }
  _updateCitizens(delta){
    const g=this.animGfx;
    const active=Math.max(1,Math.round(this.health/25));
    this.citizens.forEach((c,idx)=>{
      if(idx>=active) return;
      if(c.pause>0){ c.pause-=delta; }
      else{
        const dx=c.tgx-c.gx, dy=c.tgy-c.gy, dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<0.05){
          c.tgx=0.25+Math.random()*1.6;
          c.tgy=0.2+Math.random()*1.3;
          c.pause=400+Math.random()*1200;
        } else { c.gx+=(dx/dist)*c.speed*delta; c.gy+=(dy/dist)*c.speed*delta; }
      }
      c.bob+=delta*0.012;
      const px=this.ix(c.gx,c.gy);
      const py=this.iy(c.gx,c.gy,0)+(c.pause>0?0:Math.abs(Math.sin(c.bob))*this.s(1.6));
      g.fillStyle(0x000000,0.22); g.fillEllipse(px,py+this.s(1),this.s(5),this.s(2.2));
      g.fillStyle(c.hue,0.95); g.fillRect(px-this.s(1.3),py-this.s(6),this.s(2.6),this.s(5));
      g.fillStyle(c.hue,1);    g.fillCircle(px,py-this.s(7.6),this.s(1.7));
    });
  }

  receiveResource(a){
    this.resources+=a;
    this._animHealth(this.health, Math.min(100,this.health+a*9), 850,'Back.easeOut');
    this._sparkle();
    this.scene.tweens.add({targets:this.labelContainer,scaleX:1.1,scaleY:1.1,duration:180,yoyo:true});
  }
  takeDamage(a){ this._animHealth(this.health, Math.max(6,this.health-a), 950,'Power2.easeIn'); this._cracks(); }

  _animHealth(from,to,dur,ease){
    const o={h:from};
    this.scene.tweens.add({targets:o,h:to,duration:dur,ease:ease,
      onUpdate:()=>{ this.health=o.h; this.draw(); this.labelContainer.y=this.labelBaseY-(o.h/100)*this.s(24); },
      onComplete:()=>{ this.health=to; this.draw(); }});
  }

  _sparkle(){
    for(let i=0;i<10;i++){
      const px=this.cx+Phaser.Math.Between(-this.s(58),this.s(58));
      const py=this.cy+Phaser.Math.Between(-this.s(16),this.s(22));
      const s=this.scene.add.graphics().setDepth(20);
      s.fillStyle(this.accentColor,1); s.fillCircle(0,0,this.s(3)); s.setPosition(px,py);
      this.scene.tweens.add({targets:s,y:py-this.s(65),alpha:0,duration:700+Math.random()*500,delay:i*55,onComplete:()=>s.destroy()});
    }
  }
  _cracks(){
    for(let i=0;i<4;i++){
      this.scene.time.delayedCall(i*190,()=>{
        const c=this.scene.add.graphics().setDepth(20);
        c.lineStyle(this.s(1.6),0xff5555,0.9);
        const sx=this.cx+Phaser.Math.Between(-this.s(42),this.s(42));
        const sy=this.cy+Phaser.Math.Between(-this.s(24),this.s(26));
        c.beginPath(); c.moveTo(sx,sy); c.lineTo(sx+Phaser.Math.Between(-14,14),sy+Phaser.Math.Between(8,20)); c.strokePath();
        this.scene.tweens.add({targets:c,alpha:0,duration:2200,delay:700,onComplete:()=>c.destroy()});
      });
    }
  }

  celebrate(){
    const cols=[0xffd54a,0x4ecdc4,0xff6b9d,0x9966cc,0x6fbf7f];
    for(let i=0;i<26;i++){
      this.scene.time.delayedCall(i*40,()=>{
        const p=this.scene.add.graphics().setDepth(40);
        p.fillStyle(cols[i%cols.length],1);
        p.fillRect(0,0,this.s(4),this.s(7));
        p.setPosition(this.cx+Phaser.Math.Between(-this.s(60),this.s(60)), this.cy-this.s(70));
        this.scene.tweens.add({targets:p,y:this.cy+this.s(30),angle:Phaser.Math.Between(-220,220),
          alpha:{from:1,to:0},duration:1500+Math.random()*700,onComplete:()=>p.destroy()});
      });
    }
  }

  setStorm(a){
    this.scene.tweens.add({targets:[this.gfx,this.animGfx],alpha:a?0.32:1,duration:1600});
    this.scene.tweens.add({targets:this.labelContainer,alpha:a?0.35:1,duration:1600});
  }

  update(time,delta){
    this.animTime+=delta;
    this.animGfx.clear();
    this._updateCitizens(delta);
    if(this.id==='energy') this._blades(delta);
  }

  _blades(delta){
    if(!this.turbinePos||this.health<=25) return;
    this.turbineAngle+=delta*0.0035;
    const g=this.animGfx;
    this.turbinePos.forEach((t,i)=>{
      const a0=this.turbineAngle+i*0.7;
      g.fillStyle(0xf0f4f8,0.95);
      for(let b=0;b<3;b++){
        const a=a0+b*(Math.PI*2/3);
        g.beginPath(); g.moveTo(t.x,t.y);
        g.lineTo(t.x+Math.cos(a)*this.s(11),t.y+Math.sin(a)*this.s(11));
        g.lineTo(t.x+Math.cos(a+0.3)*this.s(9),t.y+Math.sin(a+0.3)*this.s(9));
        g.closePath(); g.fillPath();
      }
      g.fillStyle(0xaab4c0,1); g.fillCircle(t.x,t.y,this.s(2));
    });
  }

  getName(){ return (typeof currentLang!=='undefined'&&currentLang==='de')?this.nameDE:this.name; }
  getTooltip(){ return (typeof currentLang!=='undefined'&&currentLang==='de')?this.tooltipDE:this.tooltip; }
}
