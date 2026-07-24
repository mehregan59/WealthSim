class AmbientSystem {
  constructor(scene) {
    this.scene = scene; this.time = 0; this.dayDuration = 60000;
    this.cars = []; this.birds = []; this.stars = [];
    this.skyGfx = scene.add.graphics().setDepth(-10);
    this.cloudGfx = scene.add.graphics().setDepth(-8);
    this.sunMoon = scene.add.graphics().setDepth(-9);
    this.clouds = [{x:200,y:80,speed:0.3,scale:1.0},{x:600,y:60,speed:0.2,scale:0.7},{x:900,y:100,speed:0.25,scale:1.2},{x:1100,y:70,speed:0.15,scale:0.8}];
    for (let i = 0; i < 60; i++) this.stars.push({ x: Phaser.Math.Between(0,1280), y: Phaser.Math.Between(0,200), r: Math.random()*1.5+0.5, twinkle: Math.random()*Math.PI*2 });
    this._spawnBirds();
  }

  _spawnBirds() {
    for (let i = 0; i < 4; i++) this.scene.time.delayedCall(i*2000+Math.random()*3000, () => this._createBird());
  }

  _createBird() {
    if (!this.scene?.sys.isActive()) return;
    const bird = { x: -20, y: Phaser.Math.Between(60,180), speed: 1.2+Math.random()*0.8, wingPhase: Math.random()*Math.PI*2, gfx: this.scene.add.graphics().setDepth(5) };
    this.birds.push(bird);
    this.scene.time.delayedCall(8000+Math.random()*4000, () => this._createBird());
  }

  _spawnCar(districts) {
    const td = districts?.find(d => d.id === 'transport');
    if (!td || td.health < 30) return;
    const car = { x: Phaser.Math.Between(300,900), y: Phaser.Math.Between(380,520), speed: (0.6+Math.random()*0.6)*(Math.random()>0.5?1:-1), gfx: this.scene.add.graphics().setDepth(4), life: 0 };
    this.cars.push(car);
    this.scene.time.delayedCall(5000+Math.random()*3000, () => this._spawnCar(districts));
  }

  getDayProgress() { return (this.time % this.dayDuration) / this.dayDuration; }

  getSkyColor() {
    const t = this.getDayProgress();
    if (t < 0.2) return Phaser.Display.Color.Interpolate.RGBWithRGB(10,15,40,25,40,80,100,(t/0.2)*100);
    if (t < 0.35) return Phaser.Display.Color.Interpolate.RGBWithRGB(25,40,80,15,55,110,100,((t-0.2)/0.15)*100);
    if (t < 0.65) return {r:15,g:55,b:110};
    if (t < 0.8) return Phaser.Display.Color.Interpolate.RGBWithRGB(15,55,110,40,20,60,100,((t-0.65)/0.15)*100);
    return Phaser.Display.Color.Interpolate.RGBWithRGB(40,20,60,10,15,40,100,((t-0.8)/0.2)*100);
  }

  update(time, delta, districts) {
    this.time += delta;
    const t = this.getDayProgress();
    const isNight = t < 0.2 || t > 0.8;
    const sky = this.getSkyColor();
    this.skyGfx.clear();
    this.skyGfx.fillStyle(Phaser.Display.Color.GetColor(sky.r,sky.g,sky.b),1);
    this.skyGfx.fillRect(0,0,1280,380);
    const horizonAlpha = (t>=0.2&&t<0.35)?0.6:(isNight?0:0.15);
    if (horizonAlpha>0) { this.skyGfx.fillStyle(0xff8833,horizonAlpha); this.skyGfx.fillRect(0,280,1280,100); }
    if (isNight||t<0.25||t>0.75) {
      const starAlpha = t<0.3?(0.3-t)/0.3:(t-0.7)/0.3;
      this.stars.forEach(s => { s.twinkle+=0.02; const a=Math.max(0,Math.min(1,starAlpha))*(0.5+0.5*Math.sin(s.twinkle)); this.skyGfx.fillStyle(0xffffff,a); this.skyGfx.fillCircle(s.x,s.y,s.r); });
    }
    this.sunMoon.clear();
    const sunX = 100+t*1080, sunY = 200-Math.sin(t*Math.PI)*160;
    if (!isNight) { this.sunMoon.fillStyle(0xffe080,0.95); this.sunMoon.fillCircle(sunX,sunY,22); this.sunMoon.fillStyle(0xffee99,0.3); this.sunMoon.fillCircle(sunX,sunY,32); }
    else { const mT=t<0.2?t/0.2:(t-0.8)/0.2; const mX=t<0.2?100+mT*400:700+mT*400; this.sunMoon.fillStyle(0xdde8ff,0.9); this.sunMoon.fillCircle(mX,120,16); this.sunMoon.fillStyle(0x0a1628,0.85); this.sunMoon.fillCircle(mX+6,116,13); }
    this.cloudGfx.clear();
    this.clouds.forEach(c => {
      c.x+=c.speed*(delta/16); if(c.x>1350) c.x=-100;
      const ca=isNight?0.15:0.5;
      this.cloudGfx.fillStyle(isNight?0x334466:0xeef4ff,ca);
      const cw=60*c.scale,ch=22*c.scale;
      this.cloudGfx.fillEllipse(c.x,c.y,cw,ch); this.cloudGfx.fillEllipse(c.x+cw*0.2,c.y-ch*0.3,cw*0.7,ch*0.8); this.cloudGfx.fillEllipse(c.x-cw*0.25,c.y-ch*0.15,cw*0.5,ch*0.6);
    });
    this.birds.forEach(bird => {
      bird.x+=bird.speed*(delta/16); bird.wingPhase+=0.15; bird.gfx.clear();
      if(bird.x<1320&&!isNight) { const wf=Math.sin(bird.wingPhase)*4; bird.gfx.lineStyle(1.5,0x334455,0.7); bird.gfx.beginPath(); bird.gfx.moveTo(bird.x-6,bird.y+wf); bird.gfx.lineTo(bird.x,bird.y); bird.gfx.lineTo(bird.x+6,bird.y+wf); bird.gfx.strokePath(); }
      else if(bird.x>=1320) { bird.x=-20; bird.y=Phaser.Math.Between(60,180); }
    });
    this.cars.forEach((car,i) => {
      car.x+=car.speed*(delta/16); car.life+=delta; car.gfx.clear();
      if(car.life<6000) { car.gfx.fillStyle(0x88aacc,0.8); car.gfx.fillRect(car.x-8,car.y-4,16,8); car.gfx.fillStyle(0xaabbdd,0.6); car.gfx.fillRect(car.x-5,car.y-7,10,5); if(isNight){car.gfx.fillStyle(0xffffaa,0.9);car.gfx.fillCircle(car.x+(car.speed>0?9:-9),car.y,3);} }
      else { car.gfx.destroy(); this.cars.splice(i,1); }
    });
  }

  spawnCarsOnce(districts) {
    this._spawnCar(districts);
    this.scene.time.delayedCall(2000,()=>this._spawnCar(districts));
    this.scene.time.delayedCall(4000,()=>this._spawnCar(districts));
  }
}
