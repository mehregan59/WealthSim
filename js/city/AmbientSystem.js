class AmbientSystem {
  constructor(scene) {
    this.scene=scene;this.time=0;this.dayDuration=90000;
    this.birds=[];this.stars=[];
    this.clouds=[{x:180,y:75,speed:0.25,scale:1.0},{x:520,y:55,speed:0.18,scale:0.75},{x:820,y:90,speed:0.22,scale:1.15},{x:1050,y:65,speed:0.14,scale:0.85}];
    this.skyGfx=scene.add.graphics().setDepth(-10);
    this.cloudGfx=scene.add.graphics().setDepth(-8);
    this.sunMoon=scene.add.graphics().setDepth(-9);
    for(let i=0;i<65;i++)this.stars.push({x:Phaser.Math.Between(0,1280),y:Phaser.Math.Between(0,220),r:Math.random()*1.4+0.4,twinkle:Math.random()*Math.PI*2});
    for(let i=0;i<5;i++)scene.time.delayedCall(i*1800+Math.random()*1200,()=>this._spawnBird());
  }
  _spawnBird(){
    if(!this.scene?.sys.isActive())return;
    if(this.birds.length>=5)return;
    const angle=Math.random()*Math.PI*2,speed=0.8+Math.random()*0.9;
    let sx,sy;
    if(Math.abs(Math.cos(angle))>Math.abs(Math.sin(angle))){sx=Math.cos(angle)>0?-20:1300;sy=Phaser.Math.Between(50,220);}
    else{sx=Phaser.Math.Between(50,1230);sy=Math.sin(angle)>0?-20:240;}
    const bird={x:sx,y:sy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,wingPhase:Math.random()*Math.PI*2,wobble:Math.random()*Math.PI*2,wobbleAmp:(Math.random()-0.5)*0.3,gfx:this.scene.add.graphics().setDepth(5)};
    this.birds.push(bird);
  }
  getDayProgress(){return(this.time%this.dayDuration)/this.dayDuration;}
  isNightTime(){const t=this.getDayProgress();return t<0.18||t>0.82;}
  getSkyColor(){
    const t=this.getDayProgress();
    if(t<0.18)return Phaser.Display.Color.Interpolate.RGBWithRGB(8,12,35,22,38,75,100,(t/0.18)*100);
    if(t<0.32)return Phaser.Display.Color.Interpolate.RGBWithRGB(22,38,75,12,52,105,100,((t-0.18)/0.14)*100);
    if(t<0.68)return{r:12,g:52,b:105};
    if(t<0.82)return Phaser.Display.Color.Interpolate.RGBWithRGB(12,52,105,38,18,58,100,((t-0.68)/0.14)*100);
    return Phaser.Display.Color.Interpolate.RGBWithRGB(38,18,58,8,12,35,100,((t-0.82)/0.18)*100);
  }
  update(time,delta){
    this.time+=delta;
    const t=this.getDayProgress(),isNight=this.isNightTime();
    const sky=this.getSkyColor();
    this.skyGfx.clear();
    this.skyGfx.fillStyle(Phaser.Display.Color.GetColor(sky.r,sky.g,sky.b),1);
    this.skyGfx.fillRect(0,0,1280,390);
    const isDawn=t>=0.18&&t<0.32,isDusk=t>=0.68&&t<0.82;
    if(isDawn||isDusk){const p=isDawn?(t-0.18)/0.14:(t-0.68)/0.14;const alpha=Math.sin(p*Math.PI)*0.5;this.skyGfx.fillStyle(0xff7733,alpha);this.skyGfx.fillRect(0,280,1280,110);}
    if(isNight||t<0.28||t>0.75){
      const sa=t<0.28?(0.28-t)/0.28:(t-0.75)/0.25;
      this.stars.forEach(s=>{s.twinkle+=0.025;const a=Math.max(0,Math.min(1,sa))*(0.4+0.6*Math.sin(s.twinkle));this.skyGfx.fillStyle(0xffffff,a);this.skyGfx.fillCircle(s.x,s.y,s.r);});
    }
    this.sunMoon.clear();
    const sunX=80+t*1120,sunY=210-Math.sin(t*Math.PI)*165;
    if(!isNight){this.sunMoon.fillStyle(0xffe080,0.95);this.sunMoon.fillCircle(sunX,sunY,20);this.sunMoon.fillStyle(0xffee99,0.2);this.sunMoon.fillCircle(sunX,sunY,32);}
    else{const mt=t<0.18?t/0.18:(t-0.82)/0.18;const mx=t<0.18?80+mt*320:640+mt*500;this.sunMoon.fillStyle(0xcce0ff,0.88);this.sunMoon.fillCircle(mx,115,15);this.sunMoon.fillStyle(0x08101e,0.85);this.sunMoon.fillCircle(mx+5,112,12);}
    this.cloudGfx.clear();
    this.clouds.forEach(c=>{c.x+=c.speed*(delta/16);if(c.x>1380)c.x=-120;const ca=isNight?0.12:0.45,col=isNight?0x2a3a55:0xe8f0ff;this.cloudGfx.fillStyle(col,ca);const cw=62*c.scale,ch=23*c.scale;this.cloudGfx.fillEllipse(c.x,c.y,cw,ch);this.cloudGfx.fillEllipse(c.x+cw*0.22,c.y-ch*0.28,cw*0.65,ch*0.75);this.cloudGfx.fillEllipse(c.x-cw*0.22,c.y-ch*0.12,cw*0.5,ch*0.6);});
    const toRemove=[];
    this.birds.forEach((bird,i)=>{
      bird.x+=bird.vx*(delta/16);bird.y+=bird.vy*(delta/16);
      bird.wingPhase+=0.14;bird.wobble+=0.03;
      bird.vx+=Math.sin(bird.wobble)*bird.wobbleAmp*0.02;
      bird.vy+=Math.cos(bird.wobble)*bird.wobbleAmp*0.02;
      if(bird.x<-40||bird.x>1320||bird.y<-40||bird.y>260){bird.gfx.destroy();toRemove.push(i);this.scene.time.delayedCall(3000+Math.random()*4000,()=>this._spawnBird());return;}
      bird.gfx.clear();
      if(!isNight){const wf=Math.sin(bird.wingPhase)*4;bird.gfx.lineStyle(1.5,0x2a3a4a,0.65);bird.gfx.beginPath();bird.gfx.moveTo(bird.x-6,bird.y+wf);bird.gfx.lineTo(bird.x,bird.y);bird.gfx.lineTo(bird.x+6,bird.y+wf);bird.gfx.strokePath();}
    });
    for(let i=toRemove.length-1;i>=0;i--)this.birds.splice(toRemove[i],1);
  }
}
