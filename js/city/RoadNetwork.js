class RoadNetwork {
  constructor(scene, districts) {
    this.scene = scene;
    this.districts = districts;
    this.cars = [];
    this.gfx = scene.add.graphics().setDepth(2);
    this.carGfx = scene.add.graphics().setDepth(6);
    this.roadPaths = this._buildPaths();
    this._drawRoads();
    this._startCars();
  }

  _buildPaths() {
    return [
      {
        points: [
          {x:60,y:418},{x:280,y:450},{x:420,y:428},{x:560,y:410},
          {x:700,y:408},{x:840,y:408},{x:960,y:430},{x:1060,y:460},{x:1240,y:458}
        ],
        reversed: false
      },
      {
        points: [
          {x:1240,y:426},{x:1060,y:468},{x:960,y:438},{x:840,y:416},
          {x:700,y:416},{x:560,y:418},{x:420,y:436},{x:280,y:458},{x:60,y:426}
        ],
        reversed: true
      }
    ];
  }

  _drawRoads() {
    const g = this.gfx;
    const path = this.roadPaths[0].points;
    for (let i = 0; i < path.length - 1; i++) {
      const p1=path[i], p2=path[i+1];
      const dx=p2.x-p1.x, dy=p2.y-p1.y;
      const len=Math.sqrt(dx*dx+dy*dy);
      const nx=-dy/len*7, ny=dx/len*7;
      g.fillStyle(0x1e1e1e, 0.7);
      g.beginPath();
      g.moveTo(p1.x+nx,p1.y+ny); g.lineTo(p2.x+nx,p2.y+ny);
      g.lineTo(p2.x-nx,p2.y-ny); g.lineTo(p1.x-nx,p1.y-ny);
      g.closePath(); g.fillPath();
    }
    // Edges
    g.lineStyle(1, 0x383838, 0.6);
    g.beginPath(); g.moveTo(path[0].x,path[0].y);
    path.forEach(p=>g.lineTo(p.x,p.y)); g.strokePath();
    // Center dashes
    g.lineStyle(1, 0xffee66, 0.22);
    for (let i=0;i<path.length-1;i++){
      const p1=path[i],p2=path[i+1];
      const steps=Math.floor(Phaser.Math.Distance.Between(p1.x,p1.y,p2.x,p2.y)/22);
      for (let s=0;s<steps;s+=2){
        const t1=s/steps,t2=(s+0.7)/steps;
        g.beginPath();
        g.moveTo(p1.x+(p2.x-p1.x)*t1, p1.y+(p2.y-p1.y)*t1);
        g.lineTo(p1.x+(p2.x-p1.x)*t2, p1.y+(p2.y-p1.y)*t2);
        g.strokePath();
      }
    }
    // District node circles
    this.districts.forEach(d=>{
      g.fillStyle(0xffffff,0.05); g.fillCircle(d.cx,d.cy+12,20);
    });
  }

  _startCars() {
    this.scene.time.delayedCall(800,  ()=>this._spawnCar(0,0));
    this.scene.time.delayedCall(3500, ()=>this._spawnCar(1,2));
    this.scene.time.delayedCall(6500, ()=>this._spawnCar(0,4));
    this.scene.time.addEvent({
      delay:7500, loop:true,
      callback:()=>{ if(this.cars.length<4){ this._spawnCar(Math.random()>0.5?0:1,0); } }
    });
  }

  _spawnCar(pathIdx, startNode) {
    const path=this.roadPaths[pathIdx].points;
    const colors=[0x88aacc,0xcc8866,0x88cc88,0xcccc66,0xcc88cc,0xaaaacc];
    const car={
      pathIdx, nodeIdx:Math.min(startNode,path.length-2),
      progress:Math.random()*0.5,
      speed:0.55+Math.random()*0.5,
      color:colors[Phaser.Math.Between(0,colors.length-1)],
      active:true, isPaused:false, pauseTimer:0,
      x:path[startNode].x, y:path[startNode].y
    };
    this.cars.push(car);
  }

  update(delta, isNight) {
    this.carGfx.clear();
    const toRemove=[];
    this.cars.forEach((car,i)=>{
      if(!car.active){toRemove.push(i);return;}
      const path=this.roadPaths[car.pathIdx].points;
      if(!car.isPaused){
        car.progress+=car.speed*(delta/16);
        if(car.progress>=1){
          car.progress=0; car.nodeIdx++;
          const node=path[car.nodeIdx];
          if(node&&this.districts.some(d=>Phaser.Math.Distance.Between(node.x,node.y,d.cx,d.cy)<65)&&Math.random()>0.5){
            car.isPaused=true; car.pauseTimer=700+Math.random()*900;
          }
        }
        if(car.nodeIdx>=path.length-1){car.active=false;return;}
      } else {
        car.pauseTimer-=delta;
        if(car.pauseTimer<=0) car.isPaused=false;
      }
      const p1=path[car.nodeIdx],p2=path[car.nodeIdx+1];
      if(!p1||!p2){car.active=false;return;}
      car.x=p1.x+(p2.x-p1.x)*car.progress;
      car.y=p1.y+(p2.y-p1.y)*car.progress;
      this._drawCar(car,Math.atan2(p2.y-p1.y,p2.x-p1.x),isNight);
    });
    for(let i=toRemove.length-1;i>=0;i--) this.cars.splice(toRemove[i],1);
  }

  _drawCar(car,angle,isNight){
    const g=this.carGfx,cos=Math.cos(angle),sin=Math.sin(angle),len=13,wid=5;
    const corners=[{x:-len/2,y:-wid/2},{x:len/2,y:-wid/2},{x:len/2,y:wid/2},{x:-len/2,y:wid/2}];
    g.fillStyle(car.color,0.9);
    g.beginPath();
    corners.forEach((c,i)=>{const rx=car.x+c.x*cos-c.y*sin,ry=car.y+c.x*sin+c.y*cos;i===0?g.moveTo(rx,ry):g.lineTo(rx,ry);});
    g.closePath(); g.fillPath();
    const roof=[{x:-len*0.15,y:-wid/2},{x:len*0.32,y:-wid/2},{x:len*0.32,y:wid/2},{x:-len*0.15,y:wid/2}];
    g.fillStyle(car.color,0.65);
    g.beginPath();
    roof.forEach((c,i)=>{const rx=car.x+c.x*cos-c.y*sin,ry=car.y+c.x*sin+c.y*cos;i===0?g.moveTo(rx,ry):g.lineTo(rx,ry);});
    g.closePath(); g.fillPath();
    if(isNight){
      g.fillStyle(0xffffaa,0.9); g.fillCircle(car.x+(len/2)*cos,car.y+(len/2)*sin,3);
      g.fillStyle(0xff4444,0.8); g.fillCircle(car.x-(len/2)*cos,car.y-(len/2)*sin,2);
    }
    if(car.isPaused){
      g.fillStyle(0xff3300,0.9);
      const bx=car.x-(len/2)*cos,by=car.y-(len/2)*sin;
      g.fillCircle(bx+sin*3,by-cos*3,2); g.fillCircle(bx-sin*3,by+cos*3,2);
    }
  }
}
