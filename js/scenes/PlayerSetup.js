class PlayerSetup extends Phaser.Scene {
  constructor() { super({ key: 'PlayerSetup' }); }

  create() {
    this.W = this.scale.width; this.H = this.scale.height;
    this.selections = { age:null, employment:null, experience:null };
    this._sectionCards = {};
    this._continueBtnY = 560;
    this._btnBound = false;
    this.continueBtnReady = false;
    this._drawBackground();
    this._buildUI();
    this._fadeIn();
  }

  _drawBackground() {
    const bg = this.add.graphics();
    bg.fillStyle(0x060e1c,1); bg.fillRect(0,0,this.W,this.H);
    bg.fillStyle(0xe2a840,0.04); bg.fillRect(0,this.H-200,this.W,200);
    const sil = this.add.graphics();
    sil.fillStyle(0x0d1a2a,1);
    [[0,120,80],[60,160,60],[100,80,100],[180,140,70],[230,100,90],[300,60,80],[360,130,60],[400,90,110],[490,150,80],[550,70,70],[600,110,90],[670,50,100],[750,120,80],[810,80,90],[880,140,70],[930,60,110],[1020,100,80],[1080,130,90],[1150,70,80],[1210,110,70]].forEach(([x,h,w])=>sil.fillRect(x,this.H-h,w,h));
    const lights = this.add.graphics();
    for (let i=0;i<80;i++){const lx=Phaser.Math.Between(10,this.W-10),ly=Phaser.Math.Between(this.H-140,this.H-20);lights.fillStyle(0xffe4a0,Math.random()*0.4+0.1);lights.fillRect(lx,ly,3,3);}
    this.stars=[];
    for (let i=0;i<40;i++){const s=this.add.graphics();s.fillStyle(0xffffff,Math.random()*0.5+0.2);s.fillCircle(0,0,Math.random()+0.5);s.setPosition(Phaser.Math.Between(0,this.W),Phaser.Math.Between(0,this.H-200));this.stars.push({gfx:s,phase:Math.random()*Math.PI*2});}
  }

  _buildUI() {
    const cx = this.W/2;
    this._drawStepDots(1);
    this.add.text(cx,55,'Tell us about your city',{fontFamily:'Georgia,serif',fontSize:24,color:'#e2a840'}).setOrigin(0.5);
    this.add.text(cx,88,'This helps personalize your experience. It never changes the game.',{fontFamily:'Arial,sans-serif',fontSize:13,color:'#6b8aaa'}).setOrigin(0.5);
    this._buildSection(130,'Your age group','age',[{label:'18\u201327',value:'18-27'},{label:'28\u201337',value:'28-37'},{label:'38\u201347',value:'38-47'},{label:'48\u201357',value:'48-57'},{label:'58\u201365',value:'58-65'}],5);
    this._buildSection(270,'Your employment situation','employment',[{label:'Employed',value:'employed'},{label:'Self-employed',value:'self-employed'},{label:'Student',value:'student'},{label:'Retired',value:'retired'},{label:'Other',value:'other'}],5);
    this._buildSection(410,'Previous investment experience','experience',[{label:'None',value:'none'},{label:'Some basics',value:'basic'},{label:'Experienced',value:'experienced'}],3);
    this._buildContinueBtn(560);
  }

  _drawStepDots(active) {
    const cx=this.W/2,steps=3,spacing=28;
    const g=this.add.graphics();
    for(let i=0;i<steps;i++){const x=cx-((steps-1)*spacing/2)+i*spacing;if(i+1===active){g.fillStyle(0xe2a840,1);g.fillCircle(x,18,5);}else if(i+1<active){g.fillStyle(0x4ecdc4,1);g.fillCircle(x,18,4);}else{g.fillStyle(0x1a2744,1);g.fillCircle(x,18,4);g.lineStyle(1,0x3a4a6a,1);g.strokeCircle(x,18,4);}}
  }

  _buildSection(y, label, key, options, cols) {
    const cx=this.W/2,sectionW=Math.min(720,this.W-60),cardW=Math.floor((sectionW-(cols-1)*10)/cols),cardH=44,startX=cx-sectionW/2;
    this.add.text(startX,y,label,{fontFamily:'Arial,sans-serif',fontSize:11,color:'#6b8aaa',fontStyle:'bold',letterSpacing:1});
    options.forEach((opt,i)=>{
      const col=i%cols,row=Math.floor(i/cols),bx=startX+col*(cardW+10),by=y+20+row*(cardH+8);
      const card=this.add.graphics();
      const txt=this.add.text(bx+cardW/2,by+cardH/2,opt.label,{fontFamily:'Arial,sans-serif',fontSize:13,color:'#a8b8cc'}).setOrigin(0.5);
      const draw=(sel,hover)=>{card.clear();if(sel){card.fillStyle(0xe2a840,0.15);card.fillRoundedRect(bx,by,cardW,cardH,8);card.lineStyle(2,0xe2a840,0.9);card.strokeRoundedRect(bx,by,cardW,cardH,8);txt.setColor('#f0c060');}else if(hover){card.fillStyle(0x1a2744,1);card.fillRoundedRect(bx,by,cardW,cardH,8);card.lineStyle(1,0x4a6080,1);card.strokeRoundedRect(bx,by,cardW,cardH,8);txt.setColor('#c8d4e8');}else{card.fillStyle(0x0d1a2a,0.9);card.fillRoundedRect(bx,by,cardW,cardH,8);card.lineStyle(1,0x1a2744,1);card.strokeRoundedRect(bx,by,cardW,cardH,8);txt.setColor('#a8b8cc');}};
      draw(false,false);
      const hit=this.add.rectangle(bx+cardW/2,by+cardH/2,cardW,cardH,0xffffff,0).setInteractive({useHandCursor:true});
      hit.on('pointerover',()=>{if(this.selections[key]!==opt.value)draw(false,true);});
      hit.on('pointerout',()=>draw(this.selections[key]===opt.value,false));
      hit.on('pointerdown',()=>{if(this._sectionCards[key])this._sectionCards[key].forEach(c=>c.fn(false,false));this.selections[key]=opt.value;draw(true,false);this.cameras.main.shake(60,0.002);this._checkAll();});
      if(!this._sectionCards[key])this._sectionCards[key]=[];
      this._sectionCards[key].push({fn:draw,value:opt.value});
    });
  }

  _buildContinueBtn(y) {
    const cx=this.W/2,bw=220,bh=48;
    this.continueBtnGfx=this.add.graphics();
    this.continueBtnTxt=this.add.text(cx,y+bh/2,'Continue \u2192',{fontFamily:'Georgia,serif',fontSize:16,color:'#4a5a6a'}).setOrigin(0.5);
    this._continueBtnY=y;
    this._drawBtn(false);
    this.continueBtnHit=this.add.rectangle(cx,y+bh/2,bw,bh,0xffffff,0);
  }

  _drawBtn(ready) {
    const cx=this.W/2,bw=220,bh=48,y=this._continueBtnY,bx=cx-bw/2;
    this.continueBtnGfx.clear();
    if(ready){this.continueBtnGfx.fillStyle(0xe2a840,1);this.continueBtnGfx.fillRoundedRect(bx,y,bw,bh,10);this.continueBtnTxt.setColor('#0d1a2a').setStyle({fontStyle:'bold'});}
    else{this.continueBtnGfx.fillStyle(0x1a2744,1);this.continueBtnGfx.fillRoundedRect(bx,y,bw,bh,10);this.continueBtnGfx.lineStyle(1,0x2a3a4a,1);this.continueBtnGfx.strokeRoundedRect(bx,y,bw,bh,10);this.continueBtnTxt.setColor('#4a5a6a').setStyle({fontStyle:'normal'});}
  }

  _checkAll() {
    const {age,employment,experience}=this.selections;
    if(age&&employment&&experience){
      this.continueBtnReady=true; this._drawBtn(true);
      if(!this._btnBound){
        this._btnBound=true;
        this.continueBtnHit.setInteractive({useHandCursor:true});
        this.continueBtnHit.on('pointerdown',()=>{if(this.continueBtnReady)this._goNext();});
        this.tweens.add({targets:this.continueBtnGfx,alpha:{from:1,to:0.75},duration:700,yoyo:true,repeat:-1});
      }
    }
  }

  _goNext() {
    this.tweens.killAll();
    window.playerInfo=this.selections;
    const fo=this.add.graphics().setDepth(100);fo.fillStyle(0x000000,0);fo.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fo,alpha:1,duration:500,onComplete:()=>this.scene.start('RetirementContext')});
  }

  _fadeIn() {
    const fi=this.add.graphics().setDepth(100);fi.fillStyle(0x000000,1);fi.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fi,alpha:0,duration:600,onComplete:()=>fi.destroy()});
  }

  update() {
    if(this.stars)this.stars.forEach(s=>{s.phase+=0.02;s.gfx.setAlpha(0.2+0.3*Math.sin(s.phase));});
  }
}
