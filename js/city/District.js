class District {
  constructor(scene, config) {
    this.scene = scene;
    this.id = config.id;
    this.name = config.name;
    this.nameDE = config.nameDE;
    this.color = config.color;
    this.darkColor = config.darkColor;
    this.accentColor = config.accentColor;
    this.cx = config.cx;
    this.cy = config.cy;
    this.health = config.health || 50;
    this.resources = 0;
    this.buildings = [];
    this.specialElements = [];
    this.tooltip = config.tooltip;
    this.tooltipDE = config.tooltipDE;
    this.isHovered = false;
    this.animTime = Math.random() * 1000;
    this.label = config.label || config.name;
    this.labelDE = config.labelDE || config.nameDE;
    this.gfx = scene.add.graphics();
    this.labelContainer = scene.add.container(this.cx, this.cy - 80).setDepth(12);
    this._drawLabel();
    this._draw();
    this._addInteraction();
  }
  _isoX(gx,gy){return this.cx+(gx-gy)*38;}
  _isoY(gx,gy,gz){return this.cy+(gx+gy)*22-gz*28;}
  _drawLabel(){
    this.labelContainer.removeAll(true);
    const txt=currentLang==='de'?this.labelDE:this.label;
    const icon=this._getIcon();
    const bg=this.scene.add.graphics();
    const combined=icon+' '+txt;
    const textObj=this.scene.add.text(0,0,combined,{fontFamily:'Arial,sans-serif',fontSize:11,color:'#e0eaff',fontStyle:'bold'}).setOrigin(0.5);
    const pw=textObj.width+16,ph=20;
    bg.fillStyle(0x060e1c,0.75);bg.fillRoundedRect(-pw/2,-ph/2,pw,ph,6);
    bg.lineStyle(1,this.accentColor,0.6);bg.strokeRoundedRect(-pw/2,-ph/2,pw,ph,6);
    this.labelContainer.add([bg,textObj]);
    this.scene.tweens.add({targets:this.labelContainer,y:this.cy-83,duration:1200,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  }
  _getIcon(){return {housing:'🏠',transport:'🚌',technology:'💻',energy:'⚡'}[this.id]||'🏗';}
  _draw(){this.gfx.clear();this.buildings=[];this.specialElements=[];this._drawGround();this._drawBuildings();this._drawSpecial();}
  _drawGround(){
    const g=this.gfx;
    const pts=[{x:this._isoX(0,2),y:this._isoY(0,2,0)},{x:this._isoX(2,2),y:this._isoY(2,2,0)},{x:this._isoX(2,0),y:this._isoY(2,0,0)},{x:this._isoX(0,0),y:this._isoY(0,0,0)}];
    g.fillStyle(this.darkColor,0.6);g.beginPath();g.moveTo(pts[0].x,pts[0].y);pts.forEach(p=>g.lineTo(p.x,p.y));g.closePath();g.fillPath();
    g.lineStyle(1,this.color,0.4);g.strokePath();
  }
  _drawBuildings(){
    if(this.health<5)return;
    const count=Math.max(1,Math.floor(this.health/20)+1);
    const pos=[[0.4,0.4],[0.8,0.8],[1.2,0.6],[0.6,1.2],[1.0,1.0]];
    for(let i=0;i<Math.min(count,pos.length);i++){const[gx,gy]=pos[i];const h=0.2+(this.health/100)*1.1+(i*0.12);this._drawBuilding(gx,gy,h,i);}
  }
  _drawBuilding(gx,gy,h,idx){
    const g=this.gfx,w=0.35,d=0.35;
    g.fillStyle(this.darkColor,0.95);g.beginPath();g.moveTo(this._isoX(gx,gy+d),this._isoY(gx,gy+d,0));g.lineTo(this._isoX(gx,gy+d),this._isoY(gx,gy+d,h));g.lineTo(this._isoX(gx+w,gy+d),this._isoY(gx+w,gy+d,h));g.lineTo(this._isoX(gx+w,gy+d),this._isoY(gx+w,gy+d,0));g.closePath();g.fillPath();
    g.fillStyle(this.color,0.85);g.beginPath();g.moveTo(this._isoX(gx+w,gy),this._isoY(gx+w,gy,0));g.lineTo(this._isoX(gx+w,gy),this._isoY(gx+w,gy,h));g.lineTo(this._isoX(gx+w,gy+d),this._isoY(gx+w,gy+d,h));g.lineTo(this._isoX(gx+w,gy+d),this._isoY(gx+w,gy+d,0));g.closePath();g.fillPath();
    g.fillStyle(this.accentColor,0.9);g.beginPath();g.moveTo(this._isoX(gx,gy),this._isoY(gx,gy,h));g.lineTo(this._isoX(gx+w,gy),this._isoY(gx+w,gy,h));g.lineTo(this._isoX(gx+w,gy+d),this._isoY(gx+w,gy+d,h));g.lineTo(this._isoX(gx,gy+d),this._isoY(gx,gy+d,h));g.closePath();g.fillPath();
    if(this.health>25){g.fillStyle(0xffe4a0,0.8);for(let wy=0;wy<Math.floor(h*1.5);wy++){const wz=0.2+wy*0.25;if(wz<h-0.1)g.fillRect(this._isoX(gx+0.05,gy+d)-2,this._isoY(gx+0.05,gy+d,wz)-2,3,3);}}
    this.buildings.push({gx,gy,h});
  }
  _drawSpecial(){
    const g=this.gfx;
    if(this.id==='energy'&&this.health>30){for(let i=0;i<2;i++){const tx=this._isoX(0.2+i*0.9,1.5),ty=this._isoY(0.2+i*0.9,1.5,0.8);g.fillStyle(0xcccccc,0.9);g.fillRect(tx-1,ty,2,20);this.specialElements.push({type:'turbine',x:tx,y:ty,angle:Math.random()*Math.PI*2});}}
    if(this.id==='housing'&&this.health>30){for(let i=0;i<3;i++){const tx=this._isoX(0.15+i*0.7,1.7),ty=this._isoY(0.15+i*0.7,1.7,0);g.fillStyle(0x2d7a3a,0.9);g.fillCircle(tx,ty-8,7);g.fillStyle(0x1a5c28,0.8);g.fillRect(tx-1,ty-4,2,8);}}
    if(this.id==='transport'){
      const bx=this._isoX(1.0,0.3),by=this._isoY(1.0,0.3,0);
      g.fillStyle(0x5c8ab0,0.9);g.fillRect(bx-2,by-18,4,18);g.fillStyle(0x3a5f8a,0.9);g.fillRect(bx-10,by-20,20,4);
      if(this.health>20){
        g.lineStyle(1.5,0xaaaaaa,0.5);g.beginPath();g.moveTo(this._isoX(0,1),this._isoY(0,1,0.02));g.lineTo(this._isoX(2,1),this._isoY(2,1,0.02));g.strokePath();
        g.lineStyle(1,0xffffff,0.3);for(let d=0;d<3;d++){const dx=0.3+d*0.6;g.beginPath();g.moveTo(this._isoX(dx,1),this._isoY(dx,1,0.03));g.lineTo(this._isoX(dx+0.2,1),this._isoY(dx+0.2,1,0.03));g.strokePath();}
        const sx=this._isoX(1.5,0.5),sy=this._isoY(1.5,0.5,0);g.fillStyle(0x3a5f8a,0.9);g.fillRect(sx-1,sy-14,2,14);g.fillStyle(0x5c8ab0,0.9);g.fillRoundedRect(sx-8,sy-22,16,10,2);
      }
    }
    if(this.id==='technology'&&this.health>40){
      const ax=this._isoX(1.6,0.4),ay=this._isoY(1.6,0.4,0);
      g.fillStyle(0x9966cc,0.7);g.fillRect(ax-1,ay-25,2,25);g.fillStyle(0xcc88ff,0.9);g.fillCircle(ax,ay-26,3);
      g.lineStyle(1,0x9966cc,0.3);g.strokeCircle(ax,ay-26,8);g.lineStyle(1,0x9966cc,0.15);g.strokeCircle(ax,ay-26,14);
    }
  }
  _addInteraction(){
    this.hitZone=this.scene.add.rectangle(this.cx,this.cy,180,120,0xffffff,0);
    this.hitZone.setInteractive({useHandCursor:true});
    this.hitZone.on('pointerover',()=>{this.isHovered=true;this._showGlow();this.scene.tooltipManager?.show(this,this.hitZone.x,this.hitZone.y-70);});
    this.hitZone.on('pointerout',()=>{this.isHovered=false;this._hideGlow();this.scene.tooltipManager?.hide();});
    this.hitZone.on('pointerdown',()=>{this._holdTimer=this.scene.time.delayedCall(500,()=>{this.scene.tooltipManager?.show(this,this.hitZone.x,this.hitZone.y-70);});});
    this.hitZone.on('pointerup',()=>{if(this._holdTimer)this._holdTimer.remove();});
  }
  _showGlow(){
    if(this.glowGfx)this.glowGfx.destroy();
    this.glowGfx=this.scene.add.graphics();
    const pts=[{x:this._isoX(0,2),y:this._isoY(0,2,0)},{x:this._isoX(2,2),y:this._isoY(2,2,0)},{x:this._isoX(2,0),y:this._isoY(2,0,0)},{x:this._isoX(0,0),y:this._isoY(0,0,0)}];
    this.glowGfx.lineStyle(3,this.accentColor,0.9);this.glowGfx.beginPath();this.glowGfx.moveTo(pts[0].x,pts[0].y);pts.forEach(p=>this.glowGfx.lineTo(p.x,p.y));this.glowGfx.closePath();this.glowGfx.strokePath();
    this.scene.tweens.add({targets:this.glowGfx,alpha:{from:1,to:0.3},duration:600,yoyo:true,repeat:-1});
  }
  _hideGlow(){if(this.glowGfx){this.scene.tweens.killTweensOf(this.glowGfx);this.glowGfx.destroy();this.glowGfx=null;}}
  receiveResource(amount){
    this.resources+=amount;
    const old=this.health;
    this.health=Math.min(100,this.health+amount*8);
    this._animateGrow(old,this.health);
    this._celebrateResource();
  }
  _animateGrow(from,to){
    const obj={h:from};
    this.scene.tweens.add({targets:obj,h:to,duration:800,ease:'Back.easeOut',
      onUpdate:()=>{this.health=obj.h;this._draw();this.labelContainer.y=this.cy-80-(obj.h/100)*20;},
      onComplete:()=>{this.health=to;this._draw();}});
  }
  _celebrateResource(){
    for(let i=0;i<8;i++){const px=this.cx+Phaser.Math.Between(-60,60),py=this.cy+Phaser.Math.Between(-20,20);const s=this.scene.add.graphics();s.fillStyle(this.accentColor,1);s.fillCircle(0,0,Phaser.Math.Between(2,4));s.setPosition(px,py);this.scene.tweens.add({targets:s,y:py-Phaser.Math.Between(40,80),alpha:0,duration:700+Math.random()*500,delay:i*60,onComplete:()=>s.destroy()});}
    const pulse=this.scene.add.graphics();
    const pts=[{x:this._isoX(0,2),y:this._isoY(0,2,0)},{x:this._isoX(2,2),y:this._isoY(2,2,0)},{x:this._isoX(2,0),y:this._isoY(2,0,0)},{x:this._isoX(0,0),y:this._isoY(0,0,0)}];
    pulse.fillStyle(this.accentColor,0.25);pulse.beginPath();pulse.moveTo(pts[0].x,pts[0].y);pts.forEach(p=>pulse.lineTo(p.x,p.y));pulse.closePath();pulse.fillPath();
    this.scene.tweens.add({targets:pulse,alpha:0,scaleX:1.4,scaleY:1.4,duration:700,onComplete:()=>pulse.destroy()});
  }
  takeDamage(amount){
    const old=this.health,nw=Math.max(5,this.health-amount);
    this._animateShrink(old,nw);this._showDamage();
  }
  _animateShrink(from,to){
    const obj={h:from};
    this.scene.tweens.add({targets:obj,h:to,duration:1000,ease:'Power2.easeIn',
      onUpdate:()=>{this.health=obj.h;this._draw();this.labelContainer.y=this.cy-80-(obj.h/100)*20;},
      onComplete:()=>{this.health=to;this._draw();}});
  }
  _showDamage(){
    for(let i=0;i<4;i++){this.scene.time.delayedCall(i*200,()=>{const crack=this.scene.add.graphics();crack.lineStyle(1.5,0xff4444,0.9);const sx=this.cx+Phaser.Math.Between(-40,40),sy=this.cy+Phaser.Math.Between(-30,30);crack.beginPath();crack.moveTo(sx,sy);crack.lineTo(sx+Phaser.Math.Between(-15,15),sy+Phaser.Math.Between(8,20));crack.strokePath();this.scene.tweens.add({targets:crack,alpha:0,duration:2500,delay:800,onComplete:()=>crack.destroy()});});}
  }
  setStorm(active){
    this.scene.tweens.add({targets:this.gfx,alpha:active?0.35:1,duration:1800});
    this.scene.tweens.add({targets:this.labelContainer,alpha:active?0.4:1,duration:1800});
  }
  update(time,delta){
    this.animTime+=delta;
    if(this.id==='energy'&&this.health>30)this._rotateTurbines();
    if(Math.random()<0.0015&&this.health>25)this._spawnCitizen();
  }
  _rotateTurbines(){
    if(Math.floor(this.animTime/80)%2!==0)return;
    const g=this.gfx;
    this.specialElements.forEach(el=>{if(el.type!=='turbine')return;el.angle+=0.1;g.fillStyle(this.darkColor,0.9);g.fillCircle(el.x,el.y-12,12);g.fillStyle(0xdddddd,0.9);for(let b=0;b<3;b++){const a=el.angle+(b*Math.PI*2/3);g.fillRect(el.x+Math.cos(a)*1-1,el.y-12+Math.sin(a)*1-7,2,9);}});
  }
  _spawnCitizen(){
    if(!this.scene?.sys.isActive())return;
    const sx=this.cx+Phaser.Math.Between(-45,45),sy=this.cy+Phaser.Math.Between(-15,15);
    const c=this.scene.add.graphics();c.fillStyle(0xffcc88,1);c.fillCircle(0,0,2.5);c.setPosition(sx,sy);
    this.scene.tweens.add({targets:c,x:sx+Phaser.Math.Between(-50,50),y:sy+Phaser.Math.Between(-25,25),duration:2500+Math.random()*2000,alpha:{from:0.85,to:0},onComplete:()=>c.destroy()});
  }
  getName(){return currentLang==='de'?this.nameDE:this.name;}
  getTooltip(){return currentLang==='de'?this.tooltipDE:this.tooltip;}
}
