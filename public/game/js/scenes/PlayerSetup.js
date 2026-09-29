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
    this.backdrop = CityTheme.drawBackdrop(this, { depth:-2 });
  }

  _buildUI() {
    const cx = this.W/2;
    const compact=this.W<700;
    this._drawStepDots(1);
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    this.add.text(cx,compact?55:62,de?'Erzähl uns von deiner Stadt':'Tell us about your city',{fontFamily:CityTheme.heading,fontSize:compact?28:40,color:'#296b72'}).setOrigin(0.5);
    this.add.text(cx,compact?92:112,de?'Dies hilft, dein Erlebnis zu personalisieren. Es ändert nie das Spiel.':'This helps personalize your experience. It never changes the game.',{fontFamily:CityTheme.body,fontSize:compact?14:19,color:'#55777a',align:'center',wordWrap:{width:this.W-36}}).setOrigin(0.5);
    // Intake disclosure: the session observes decision patterns and explains
    // them at the end — without revealing which level measures which trait.
    this.add.text(cx,compact?118:142,de?'Hinweis: Das Spiel beobachtet deine Entscheidungsmuster und erklärt sie dir am Ende in den Ergebnissen.':'Note: this session observes your decision patterns and explains them to you in the final results.',{fontFamily:CityTheme.body,fontSize:compact?11:15,color:'#55777a',fontStyle:'italic',align:'center',wordWrap:{width:this.W-36}}).setOrigin(0.5);
    this._buildSection(compact?150:180,'Your age group','age',[{label:'18\u201327',value:'18-27'},{label:'28\u201337',value:'28-37'},{label:'38\u201347',value:'38-47'},{label:'48\u201357',value:'48-57'},{label:'58\u201365',value:'58-65'}],compact?3:5);
    this._buildSection(compact?300:345,'Your employment situation','employment',[{label:'Employed',value:'employed'},{label:'Self-employed',value:'self-employed'},{label:'Student',value:'student'},{label:'Retired',value:'retired'},{label:'Other',value:'other'}],compact?3:5);
    this._buildSection(compact?450:510,'Previous investment experience','experience',[{label:'None',value:'none'},{label:'Some basics',value:'basic'},{label:'Experienced',value:'experienced'}],3);
    this._buildContinueBtn(compact?560:640);
    this._buildSkipLink(compact?630:710, de);
  }

  // These answers only personalise the closing text, so a player who wants
  // to start playing immediately can skip them without losing anything
  // that affects the game or the behavioural result.
  _buildSkipLink(y, de) {
    const t=this.add.text(this.W/2,y,de?'Überspringen und direkt bauen \u2192':'Skip and start building \u2192',
      {fontFamily:CityTheme.body,fontSize:15,color:'#55777a'}).setOrigin(0.5).setInteractive({useHandCursor:true});
    t.on('pointerover',()=>t.setColor('#365d60'));
    t.on('pointerout',()=>t.setColor('#55777a'));
    t.on('pointerdown',()=>{ this._skipped=true; this._goNext(); });
  }



  _drawStepDots(active) {
    const cx=this.W/2,steps=3,spacing=28;
    const g=this.add.graphics();
    for(let i=0;i<steps;i++){const x=cx-((steps-1)*spacing/2)+i*spacing;if(i+1===active){g.fillStyle(0xe0a82e,1);g.fillCircle(x,18,5);}else if(i+1<active){g.fillStyle(0x296b72,1);g.fillCircle(x,18,4);}else{g.fillStyle(0xd7e3d5,1);g.fillCircle(x,18,4);g.lineStyle(1,0x7ca5a1,1);g.strokeCircle(x,18,4);}}
  }

  _buildSection(y, label, key, options, cols) {
    const compact=this.W<700,cx=this.W/2,sectionW=Math.min(1200,this.W-(compact?48:64)),cardW=Math.floor((sectionW-(cols-1)*(compact?10:16))/cols),cardH=compact?56:80,startX=cx-sectionW/2;
    this.add.text(startX,y,label,{fontFamily:CityTheme.body,fontSize:compact?14:21,color:'#365d60',fontStyle:'bold',letterSpacing:1});
    options.forEach((opt,i)=>{
      const col=i%cols,row=Math.floor(i/cols),bx=startX+col*(cardW+(compact?10:14)),by=y+(compact?24:32)+row*(cardH+12);
      const card=this.add.graphics();
      const txt=this.add.text(bx+cardW/2,by+cardH/2,opt.label,{fontFamily:CityTheme.body,fontSize:compact?14:22,color:'#365d60',align:'center',wordWrap:{width:cardW-16}}).setOrigin(0.5);
      const draw=(sel,hover)=>{card.clear();if(sel){card.fillStyle(0xe0a82e,0.15);card.fillRoundedRect(bx,by,cardW,cardH,8);card.lineStyle(2,0xe0a82e,0.9);card.strokeRoundedRect(bx,by,cardW,cardH,8);txt.setColor('#9b6c12');}else if(hover){card.fillStyle(0xd7e3d5,1);card.fillRoundedRect(bx,by,cardW,cardH,8);card.lineStyle(1,0x4a6080,1);card.strokeRoundedRect(bx,by,cardW,cardH,8);txt.setColor('#365d60');}else{card.fillStyle(0xf2e7c9,0.9);card.fillRoundedRect(bx,by,cardW,cardH,8);card.lineStyle(1,0xd7e3d5,1);card.strokeRoundedRect(bx,by,cardW,cardH,8);txt.setColor('#55777a');}};
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
    const cx=this.W/2,bw=280,bh=58;
    this.continueBtnGfx=this.add.graphics();
    this.continueBtnTxt=this.add.text(cx,y+bh/2,'Continue \u2192',{fontFamily:CityTheme.heading,fontSize:20,color:'#688486'}).setOrigin(0.5);
    this._continueBtnY=y;
    this._drawBtn(false);
    this.continueBtnHit=this.add.rectangle(cx,y+bh/2,bw,bh,0xffffff,0);
  }

  _drawBtn(ready) {
    const cx=this.W/2,bw=280,bh=58,y=this._continueBtnY,bx=cx-bw/2;
    this.continueBtnGfx.clear();
    if(ready){this.continueBtnGfx.fillStyle(0xe0a82e,1);this.continueBtnGfx.fillRoundedRect(bx,y,bw,bh,10);this.continueBtnTxt.setColor('#0d1a2a').setStyle({fontStyle:'bold'});}
    else{this.continueBtnGfx.fillStyle(0xd7e3d5,1);this.continueBtnGfx.fillRoundedRect(bx,y,bw,bh,10);this.continueBtnGfx.lineStyle(1,0x9bb5ae,1);this.continueBtnGfx.strokeRoundedRect(bx,y,bw,bh,10);this.continueBtnTxt.setColor('#688486').setStyle({fontStyle:'normal'});}
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
    const next=this._skipped?'StartingQuestions':'RetirementContext';
    if(this._skipped && !window.retirementContext) window.retirementContext={saule:['unsure'],buildexp:null,years:null};
    this.tweens.add({targets:fo,alpha:1,duration:500,onComplete:()=>this.scene.start(next)});
  }

  _fadeIn() {
    const fi=this.add.graphics().setDepth(100);fi.fillStyle(0x000000,1);fi.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fi,alpha:0,duration:600,onComplete:()=>fi.destroy()});
  }

  update() {
    if(this.stars)this.stars.forEach(s=>{s.phase+=0.02;s.gfx.setAlpha(0.2+0.3*Math.sin(s.phase));});
  }
}
