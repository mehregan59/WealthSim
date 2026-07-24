class RetirementContext extends Phaser.Scene {
  constructor() { super({ key: 'RetirementContext' }); }

  create() {
    this.W=this.scale.width; this.H=this.scale.height;
    this.selections={saule:null,years:null,buildexp:null};
    this._sectionCards={}; this._continueBtnY=610; this._btnBound=false; this.continueBtnReady=false;
    this._drawBackground(); this._buildUI(); this._fadeIn();
  }

  _drawBackground() {
    const bg=this.add.graphics(); bg.fillStyle(0x060e1c,1); bg.fillRect(0,0,this.W,this.H);
    bg.fillStyle(0xe2a840,0.03); bg.fillRect(0,this.H-180,this.W,180);
    const sil=this.add.graphics(); sil.fillStyle(0x0d1a2a,1);
    [[50,100,60],[200,60,80],[400,80,100],[650,50,70],[900,90,80],[1100,60,90],[1220,100,60]].forEach(([x,h,w])=>sil.fillRect(x,this.H-h,w,h));
    this.stars=[];
    for(let i=0;i<35;i++){const s=this.add.graphics();s.fillStyle(0xffffff,Math.random()*0.4+0.15);s.fillCircle(0,0,Math.random()+0.4);s.setPosition(Phaser.Math.Between(0,this.W),Phaser.Math.Between(0,this.H-200));this.stars.push({gfx:s,phase:Math.random()*Math.PI*2});}
  }

  _buildUI() {
    const cx=this.W/2, lang=typeof currentLang!=='undefined'?currentLang:'en';
    this._drawStepDots(2);
    this.add.text(cx,55,lang==='de'?'Das Unterstützungssystem deiner Stadt':"Your city's support system",{fontFamily:'Georgia,serif',fontSize:22,color:'#e2a840'}).setOrigin(0.5);
    this.add.text(cx,86,lang==='de'?'Diese Antworten personalisieren dein abschließendes Feedback.':'These answers personalize your closing feedback. They never change gameplay.',{fontFamily:'Arial,sans-serif',fontSize:13,color:'#6b8aaa'}).setOrigin(0.5);
    const q1Label=lang==='de'?'Welches beschreibt das Hauptunterstützungssystem am besten?':"Which best describes your city's main support system?";
    const q1Opts=lang==='de'?[
      {label:'🏛 GRV — Nationales Netz',desc:'Gesetzliche Rente',value:'grv'},
      {label:'🏢 bAV — Arbeitgeber',desc:'Betriebliche Altersversorgung',value:'bav'},
      {label:'🏗 Säule 3 — Privat',desc:'Riester, Rürup, privat',value:'s3'},
      {label:'❓ Noch nicht sicher',desc:'',value:'unsure'}
    ]:[
      {label:'🏛 GRV — National network',desc:'State pension',value:'grv'},
      {label:'🏢 bAV — Employer programs',desc:'Occupational pension',value:'bav'},
      {label:'🏗 Säule 3 — Private reserves',desc:'Riester, Rürup, private',value:'s3'},
      {label:'❓ Not sure yet',desc:'',value:'unsure'}
    ];
    this._buildSection(128,q1Label,'saule',q1Opts,2,true);
    const q2Label=lang==='de'?'Wie viele Baujahre verbleiben?':'How many building years does your city have remaining?';
    const q2Opts=lang==='de'?[
      {label:'🕐 Mehr als 30 Jahre',value:'30plus'},
      {label:'🕐 15 bis 30 Jahre',value:'15-30'},
      {label:'🕐 Weniger als 15 Jahre',value:'under15'}
    ]:[
      {label:'🕐 More than 30 years',value:'30plus'},
      {label:'🕐 15 to 30 years',value:'15-30'},
      {label:'🕐 Fewer than 15 years',value:'under15'}
    ];
    this._buildSection(360,q2Label,'years',q2Opts,3,false);
    const q3Label=lang==='de'?'Hat deine Stadt bereits unabhängige Projekte abgeschlossen?':'Has your city completed any independent building before?';
    const q3Opts=lang==='de'?[
      {label:'🔰 Keine Erfahrung',value:'none'},
      {label:'🔧 Grundlegende Projekte',value:'basic'},
      {label:'🏆 Erfahrener Baumeister',value:'experienced'}
    ]:[
      {label:'🔰 No experience',value:'none'},
      {label:'🔧 Some basics',value:'basic'},
      {label:'🏆 Experienced builder',value:'experienced'}
    ];
    this._buildSection(490,q3Label,'buildexp',q3Opts,3,false);
    this._buildContinueBtn(610);
  }

  _drawStepDots(active) {
    const cx=this.W/2,steps=3,spacing=28,g=this.add.graphics();
    for(let i=0;i<steps;i++){const x=cx-((steps-1)*spacing/2)+i*spacing;if(i+1===active){g.fillStyle(0xe2a840,1);g.fillCircle(x,18,5);}else if(i+1<active){g.fillStyle(0x4ecdc4,1);g.fillCircle(x,18,4);}else{g.fillStyle(0x1a2744,1);g.fillCircle(x,18,4);g.lineStyle(1,0x3a4a6a,1);g.strokeCircle(x,18,4);}}
  }

  _buildSection(y,label,key,options,cols,tall) {
    const cx=this.W/2,sW=Math.min(720,this.W-60),cH=tall?62:44,cW=Math.floor((sW-(cols-1)*10)/cols),sx=cx-sW/2;
    this.add.text(sx,y,label,{fontFamily:'Arial,sans-serif',fontSize:11,color:'#6b8aaa',fontStyle:'bold',wordWrap:{width:sW}});
    options.forEach((opt,i)=>{
      const col=i%cols,row=Math.floor(i/cols),bx=sx+col*(cW+10),by=y+22+row*(cH+8);
      const card=this.add.graphics();
      const mainTxt=this.add.text(bx+cW/2,tall?by+20:by+cH/2,opt.label,{fontFamily:'Arial,sans-serif',fontSize:12,color:'#a8b8cc',align:'center',wordWrap:{width:cW-16}}).setOrigin(0.5);
      let descTxt=null;
      if(tall&&opt.desc)descTxt=this.add.text(bx+cW/2,by+40,opt.desc,{fontFamily:'Arial,sans-serif',fontSize:10,color:'#4a6080',align:'center'}).setOrigin(0.5);
      const draw=(sel,hover)=>{card.clear();if(sel){card.fillStyle(0xe2a840,0.15);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(2,0xe2a840,0.9);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#f0c060');if(descTxt)descTxt.setColor('#c8a040');}else if(hover){card.fillStyle(0x1a2744,1);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(1,0x4a6080,1);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#c8d4e8');if(descTxt)descTxt.setColor('#6b8aaa');}else{card.fillStyle(0x0d1a2a,0.9);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(1,0x1a2744,1);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#a8b8cc');if(descTxt)descTxt.setColor('#4a6080');}};
      draw(false,false);
      const hit=this.add.rectangle(bx+cW/2,by+cH/2,cW,cH,0xffffff,0).setInteractive({useHandCursor:true});
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
    this.continueBtnTxt=this.add.text(cx,y+bh/2,'Continue →',{fontFamily:'Georgia,serif',fontSize:16,color:'#4a5a6a'}).setOrigin(0.5);
    this._continueBtnY=y; this._drawBtn(false);
    this.continueBtnHit=this.add.rectangle(cx,y+bh/2,bw,bh,0xffffff,0);
  }

  _drawBtn(ready) {
    const cx=this.W/2,bw=220,bh=48,y=this._continueBtnY,bx=cx-bw/2; this.continueBtnGfx.clear();
    if(ready){this.continueBtnGfx.fillStyle(0xe2a840,1);this.continueBtnGfx.fillRoundedRect(bx,y,bw,bh,10);this.continueBtnTxt.setColor('#0d1a2a').setStyle({fontStyle:'bold'});}
    else{this.continueBtnGfx.fillStyle(0x1a2744,1);this.continueBtnGfx.fillRoundedRect(bx,y,bw,bh,10);this.continueBtnGfx.lineStyle(1,0x2a3a4a,1);this.continueBtnGfx.strokeRoundedRect(bx,y,bw,bh,10);this.continueBtnTxt.setColor('#4a5a6a').setStyle({fontStyle:'normal'});}
  }

  _checkAll() {
    const {saule,years,buildexp}=this.selections;
    if(saule&&years&&buildexp){this.continueBtnReady=true;this._drawBtn(true);if(!this._btnBound){this._btnBound=true;this.continueBtnHit.setInteractive({useHandCursor:true});this.continueBtnHit.on('pointerdown',()=>{if(this.continueBtnReady)this._goNext();});this.tweens.add({targets:this.continueBtnGfx,alpha:{from:1,to:0.75},duration:700,yoyo:true,repeat:-1});}}
  }

  _goNext() {
    this.tweens.killAll(); window.retirementContext=this.selections;
    const fo=this.add.graphics().setDepth(100);fo.fillStyle(0x000000,0);fo.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fo,alpha:1,duration:500,onComplete:()=>this.scene.start('StartingQuestions')});
  }

  _fadeIn() {
    const fi=this.add.graphics().setDepth(100);fi.fillStyle(0x000000,1);fi.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fi,alpha:0,duration:600,onComplete:()=>fi.destroy()});
  }

  update() { if(this.stars)this.stars.forEach(s=>{s.phase+=0.02;s.gfx.setAlpha(0.15+0.3*Math.sin(s.phase));});}
}
