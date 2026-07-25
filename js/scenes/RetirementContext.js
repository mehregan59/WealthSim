class RetirementContext extends Phaser.Scene {
  constructor() { super({ key: 'RetirementContext' }); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this._yearsFromAge = this._deriveYears();
    // saule is now multi-select: a person can genuinely have GRV + bAV +
    // private provision at the same time, so this is an array, not a
    // single value. "Not sure" is exclusive with everything else.
    this.selections = { saule: [], buildexp: null, years: this._yearsFromAge.value };
    this._sectionCards = {};
    this._activeTooltip = null;
    this._btnBound = false;
    this._drawBackground();
    this._buildUI();
    this._fadeIn();
  }

  _deriveYears() {
    const age = window.playerInfo?.age || '28-37';
    const midpoints = {'18-27':22,'28-37':32,'38-47':42,'48-57':52,'58-65':61};
    const mid = midpoints[age] || 32;
    const years = 67 - mid;
    if(years > 30) return { value:'30plus',  label:`~${years} years until retirement` };
    if(years > 15) return { value:'15-30',   label:`~${years} years until retirement` };
    return              { value:'under15', label:`~${years} years until retirement` };
  }

  _drawBackground() {
    const bg = this.add.graphics();
    bg.fillStyle(0x060e1c,1); bg.fillRect(0,0,this.W,this.H);
    bg.fillStyle(0xe2a840,0.03); bg.fillRect(0,this.H-180,this.W,180);
    const sil = this.add.graphics(); sil.fillStyle(0x0d1a2a,1);
    [[50,100,60],[200,60,80],[400,80,100],[650,50,70],[900,90,80],[1100,60,90],[1220,100,60]].forEach(([x,h,w])=>sil.fillRect(x,this.H-h,w,h));
    this.stars=[];
    for(let i=0;i<35;i++){const s=this.add.graphics();s.fillStyle(0xffffff,Math.random()*0.4+0.15);s.fillCircle(0,0,Math.random()+0.4);s.setPosition(Phaser.Math.Between(0,this.W),Phaser.Math.Between(0,this.H-200));this.stars.push({gfx:s,phase:Math.random()*Math.PI*2});}
  }

  _buildUI() {
    const cx=this.W/2;
    const lang=typeof currentLang!=='undefined'?currentLang:'en';
    this._drawStepDots(2);
    this.add.text(cx,52,lang==='de'?'Dein Rentensystem':'Your retirement system',{fontFamily:'Georgia,serif',fontSize:22,color:'#e2a840'}).setOrigin(0.5);
    this.add.text(cx,82,lang==='de'?'Diese Antworten personalisieren dein abschließendes Feedback.':'These answers personalize your closing feedback. They never change gameplay.',{fontFamily:'Arial,sans-serif',fontSize:13,color:'#6b8aaa'}).setOrigin(0.5);

    // Auto-derived retirement notice
    const noticeBox=this.add.graphics();
    noticeBox.fillStyle(0x1a2744,0.8);noticeBox.fillRoundedRect(cx-310,112,620,36,8);
    noticeBox.lineStyle(1,0x4ecdc4,0.4);noticeBox.strokeRoundedRect(cx-310,112,620,36,8);
    const ageLabel=window.playerInfo?.age||'28-37';
    this.add.text(cx,130,(lang==='de'?`Altersgruppe: ${ageLabel}  \xB7  Gesch\xE4tzte Zeit bis zur Rente: `:`Age group: ${ageLabel}  \xB7  Estimated time until retirement: `)+this._yearsFromAge.label,{fontFamily:'Arial,sans-serif',fontSize:12,color:'#4ecdc4'}).setOrigin(0.5);

    // Q1 Saule — multi-select, with an ℹ tooltip on each card
    const q1Label=lang==='de'?'Welche Rentenbausteine hast du bereits? (Mehrfachauswahl m\xF6glich)':'Which retirement pillars do you already have? (Select all that apply)';
    const sauleOpts=[
      {value:'grv',label:lang==='de'?'\uD83C\uDFDB GRV':'\uD83C\uDFDB GRV',sub:lang==='de'?'Gesetzliche Rente':'State pension',tooltipTitle:lang==='de'?'GRV \u2014 Gesetzliche Rentenversicherung':'GRV \u2014 Statutory Pension Insurance',tooltipBody:lang==='de'?'Pflicht f\xFCr fast alle Arbeitnehmer in Deutschland. Beitr\xE4ge werden automatisch vom Gehalt abgezogen. Die Rente h\xE4ngt von Einzahlungsjahren und Verdienst ab. F\xFCr die meisten Menschen allein nicht ausreichend.':'Mandatory for almost all employees in Germany. Contributions are deducted automatically from salary. Pension depends on years of contributions and earnings. For most people alone not sufficient.',link:'https://www.deutsche-rentenversicherung.de',linkLabel:'deutsche-rentenversicherung.de'},
      {value:'bav',label:lang==='de'?'\uD83C\uDFE2 bAV':'\uD83C\uDFE2 bAV',sub:lang==='de'?'Betriebliche Altersversorgung':'Occupational pension',tooltipTitle:lang==='de'?'bAV \u2014 Betriebliche Altersversorgung':'bAV \u2014 Occupational Pension',tooltipBody:lang==='de'?'Der Arbeitgeber zahlt mit in die Rente ein. Seit 2019 ist ein Arbeitgeberzuschuss von 15% bei Neuvertr\xE4gen Pflicht. Steuer- und sozialabgabenfrei bis zu bestimmten Grenzen.':'Your employer contributes to your pension. Since 2019, a 15% employer contribution is mandatory for new contracts. Tax and social security free up to certain limits.',link:'https://www.bmas.de/DE/Arbeit/Betriebliche-Altersversorgung/betriebliche-altersversorgung.html',linkLabel:'bmas.de'},
      {value:'s3',label:lang==='de'?'\uD83C\uDFD7 S\xE4ule 3':'\uD83C\uDFD7 Pillar 3',sub:lang==='de'?'Riester / R\xFCrup / Privat':'Riester / R\xFCrup / Private',tooltipTitle:lang==='de'?'S\xE4ule 3 \u2014 Private Vorsorge':'Pillar 3 \u2014 Private Provision',tooltipBody:lang==='de'?'Freiwillige private Altersvorsorge. Riester: staatlich gef\xF6rdert, f\xFCr Arbeitnehmer. R\xFCrup: steuerlich absetzbar, besonders f\xFCr Selbstst\xE4ndige. Beide haben F\xF6rdergrenzen und Bedingungen.':'Voluntary private retirement savings. Riester: state-subsidized, for employees. R\xFCrup: tax-deductible, especially for self-employed. Both have subsidy limits and conditions.',link:'https://www.verbraucherzentrale.de/wissen/geld-versicherungen/altersvorsorge-und-rente',linkLabel:'verbraucherzentrale.de'},
      {value:'unsure',label:lang==='de'?'\u2753 Unsicher':'\u2753 Not sure',sub:lang==='de'?'Noch nicht sicher':'I am not sure yet',tooltipTitle:lang==='de'?'Das deutsche Rentensystem':'The German pension system',tooltipBody:lang==='de'?'Deutschland hat ein Drei-S\xE4ulen-System: GRV (gesetzlich), bAV (betrieblich) und private Vorsorge. Die meisten Arbeitnehmer haben mindestens die GRV. bAV und S\xE4ule 3 sind optional aber empfohlen.':'Germany has a three-pillar system: GRV (statutory), bAV (occupational), and private provision. Most employees have at least the GRV. bAV and Pillar 3 are optional but recommended.',link:'https://www.bpb.de/themen/soziale-lage/rentenpolitik/',linkLabel:'bpb.de \u2014 Rentenpolitik'}
    ];
    this._buildSauleSection(160,q1Label,sauleOpts);

    // Q2 — Investment familiarity (replaces confusing "build experience")
    const q2Label=lang==='de'?'Wie vertraut bist du mit Sparen und Investieren?':'How familiar are you with saving and investing?';
    const expOpts=lang==='de'?[
      {label:'\uD83D\uDD30 Noch nicht gestartet',sub:'Ich spare noch nicht f\xFCr die Rente',value:'none'},
      {label:'\uD83D\uDCD6 Grundlagen lerne ich',sub:'Ich kenne die Basics, spare etwas',value:'basic'},
      {label:'\uD83D\uDCC8 Bereits investiert',sub:'Ich investiere aktiv und regelm\xE4\xDFig',value:'experienced'}
    ]:[
      {label:'\uD83D\uDD30 Not yet started',sub:'I am not yet saving for retirement',value:'none'},
      {label:'\uD83D\uDCD6 Learning the basics',sub:'I know the basics and save something',value:'basic'},
      {label:'\uD83D\uDCC8 Already investing',sub:'I invest actively and regularly',value:'experienced'}
    ];
    this._buildSimpleSection(430,q2Label,'buildexp',expOpts,3);
    this._buildContinueBtn(570);
  }

  _drawStepDots(active) {
    const cx=this.W/2,steps=3,spacing=28,g=this.add.graphics();
    for(let i=0;i<steps;i++){const x=cx-((steps-1)*spacing/2)+i*spacing;if(i+1===active){g.fillStyle(0xe2a840,1);g.fillCircle(x,18,5);}else if(i+1<active){g.fillStyle(0x4ecdc4,1);g.fillCircle(x,18,4);}else{g.fillStyle(0x1a2744,1);g.fillCircle(x,18,4);g.lineStyle(1,0x3a4a6a,1);g.strokeCircle(x,18,4);}}
  }

  _buildSauleSection(y,label,options) {
    const cx=this.W/2,sW=Math.min(720,this.W-60),startX=cx-sW/2;
    const cols=2,cW=Math.floor((sW-10)/cols),cH=68;
    this.add.text(startX,y,label,{fontFamily:'Arial,sans-serif',fontSize:11,color:'#6b8aaa',fontStyle:'bold'});
    options.forEach((opt,i)=>{
      const col=i%cols,row=Math.floor(i/cols);
      const bx=startX+col*(cW+10),by=y+20+row*(cH+10);
      const card=this.add.graphics();
      const mainTxt=this.add.text(bx+14,by+16,opt.label,{fontFamily:'Arial,sans-serif',fontSize:13,color:'#c8d4e8',fontStyle:'bold'});
      const subTxt=this.add.text(bx+14,by+38,opt.sub,{fontFamily:'Arial,sans-serif',fontSize:11,color:'#4a6080'});
      // Info icon — tap to see tooltip + link
      const infoIcon=this.add.text(bx+cW-22,by+10,'\u24D8',{fontFamily:'Arial,sans-serif',fontSize:14,color:'#3a5a7a'}).setInteractive({useHandCursor:true});
      const draw=(sel,hover)=>{card.clear();if(sel){card.fillStyle(0xe2a840,0.15);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(2,0xe2a840,0.9);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#f0c060');subTxt.setColor('#a08040');infoIcon.setColor('#e2a840');}else if(hover){card.fillStyle(0x1a2744,1);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(1,0x4a6080,1);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#e0eaff');subTxt.setColor('#6b8aaa');infoIcon.setColor('#5c8ab0');}else{card.fillStyle(0x0d1a2a,0.9);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(1,0x1a2744,1);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#c8d4e8');subTxt.setColor('#4a6080');infoIcon.setColor('#3a5a7a');}};
      draw(false,false);
      const isSelected=()=>this.selections.saule.includes(opt.value);
      const redrawAll=()=>{ if(this._sectionCards.saule) this._sectionCards.saule.forEach(c=>c.fn(this.selections.saule.includes(c.value),false)); };
      const hit=this.add.rectangle(bx+cW/2-14,by+cH/2,cW-30,cH,0xffffff,0).setInteractive({useHandCursor:true});
      hit.on('pointerover',()=>{if(!isSelected())draw(false,true);});
      hit.on('pointerout',()=>draw(isSelected(),false));
      hit.on('pointerdown',()=>{
        // "Not sure" is exclusive — picking it clears any other pillar
        // selections, and picking any real pillar clears "Not sure".
        // Otherwise, toggle this option in/out of the selection freely,
        // since someone can genuinely have more than one pillar at once.
        if(opt.value==='unsure'){
          this.selections.saule = this.selections.saule.includes('unsure') ? [] : ['unsure'];
        } else {
          this.selections.saule = this.selections.saule.filter(v=>v!=='unsure');
          const idx=this.selections.saule.indexOf(opt.value);
          if(idx>=0) this.selections.saule.splice(idx,1);
          else this.selections.saule.push(opt.value);
        }
        redrawAll();
        this.cameras.main.shake(60,0.002);
        this._checkAll();
      });
      infoIcon.on('pointerover',()=>infoIcon.setColor('#f0c060'));
      infoIcon.on('pointerout',()=>infoIcon.setColor(isSelected()?'#e2a840':'#3a5a7a'));
      infoIcon.on('pointerdown',(ptr)=>{try{ptr.event.stopPropagation();}catch(e){}this._showTooltip(opt,bx+cW/2,by);});
      if(!this._sectionCards.saule)this._sectionCards.saule=[];
      this._sectionCards.saule.push({fn:draw,value:opt.value});
    });
  }

  _buildSimpleSection(y,label,key,options,cols) {
    const cx=this.W/2,sW=Math.min(720,this.W-60),startX=cx-sW/2;
    const cW=Math.floor((sW-(cols-1)*10)/cols),cH=58;
    this.add.text(startX,y,label,{fontFamily:'Arial,sans-serif',fontSize:11,color:'#6b8aaa',fontStyle:'bold'});
    options.forEach((opt,i)=>{
      const col=i%cols,row=Math.floor(i/cols);
      const bx=startX+col*(cW+10),by=y+20+row*(cH+8);
      const card=this.add.graphics();
      const mainTxt=this.add.text(bx+cW/2,by+20,opt.label,{fontFamily:'Arial,sans-serif',fontSize:12,color:'#c8d4e8',align:'center',wordWrap:{width:cW-16}}).setOrigin(0.5);
      const subTxt=this.add.text(bx+cW/2,by+40,opt.sub,{fontFamily:'Arial,sans-serif',fontSize:10,color:'#4a6080',align:'center',wordWrap:{width:cW-16}}).setOrigin(0.5);
      const draw=(sel,hover)=>{card.clear();if(sel){card.fillStyle(0xe2a840,0.15);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(2,0xe2a840,0.9);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#f0c060');subTxt.setColor('#a08040');}else if(hover){card.fillStyle(0x1a2744,1);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(1,0x4a6080,1);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#e0eaff');subTxt.setColor('#6b8aaa');}else{card.fillStyle(0x0d1a2a,0.9);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(1,0x1a2744,1);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#c8d4e8');subTxt.setColor('#4a6080');}};
      draw(false,false);
      const hit=this.add.rectangle(bx+cW/2,by+cH/2,cW,cH,0xffffff,0).setInteractive({useHandCursor:true});
      hit.on('pointerover',()=>{if(this.selections[key]!==opt.value)draw(false,true);});
      hit.on('pointerout',()=>draw(this.selections[key]===opt.value,false));
      hit.on('pointerdown',()=>{if(this._sectionCards[key])this._sectionCards[key].forEach(c=>c.fn(false,false));this.selections[key]=opt.value;draw(true,false);this.cameras.main.shake(60,0.002);this._checkAll();});
      if(!this._sectionCards[key])this._sectionCards[key]=[];
      this._sectionCards[key].push({fn:draw,value:opt.value});
    });
  }

  _showTooltip(opt,cx,cardY) {
    this._clearTooltip();
    const W=this.W,tw=360,th=185;
    let tx=cx-tw/2; if(tx<10)tx=10; if(tx+tw>W-10)tx=W-tw-10;
    let ty=cardY-th-12; if(ty<10)ty=cardY+78;
    const container=this.add.container(0,0).setDepth(200);
    const bg=this.add.graphics();
    bg.fillStyle(0x060e1c,0.98);bg.fillRoundedRect(tx,ty,tw,th,10);
    bg.lineStyle(1.5,0xe2a840,0.7);bg.strokeRoundedRect(tx,ty,tw,th,10);
    bg.lineStyle(3,0xe2a840,0.6);bg.lineBetween(tx,ty,tx,ty+th);
    container.add(bg);
    const title=this.add.text(tx+16,ty+14,opt.tooltipTitle,{fontFamily:'Georgia,serif',fontSize:13,color:'#f0c060',fontStyle:'bold'});
    container.add(title);
    const body=this.add.text(tx+16,ty+36,opt.tooltipBody,{fontFamily:'Arial,sans-serif',fontSize:11,color:'#a8b8cc',wordWrap:{width:tw-32},lineSpacing:3});
    container.add(body);
    const linkY=ty+th-26;
    const linkBg=this.add.graphics();
    linkBg.fillStyle(0x1a2744,1);linkBg.fillRoundedRect(tx+12,linkY-4,tw-24,24,5);
    container.add(linkBg);
    const linkTxt=this.add.text(tx+18,linkY+8,'\u2192 '+opt.linkLabel,{fontFamily:'Arial,sans-serif',fontSize:11,color:'#4ecdc4',fontStyle:'bold'}).setOrigin(0,0.5).setInteractive({useHandCursor:true});
    container.add(linkTxt);
    linkTxt.on('pointerover',()=>linkTxt.setColor('#f0c060'));
    linkTxt.on('pointerout', ()=>linkTxt.setColor('#4ecdc4'));
    linkTxt.on('pointerdown',()=>{try{window.open(opt.link,'_blank','noopener');}catch(e){}});
    const closeZone=this.add.rectangle(W/2,this.H/2,W,this.H,0x000000,0).setInteractive();
    closeZone.on('pointerdown',()=>this._clearTooltip());
    container.addAt(closeZone,0);
    container.setAlpha(0);
    this.tweens.add({targets:container,alpha:1,duration:180});
    this._activeTooltip=container;
  }

  _clearTooltip() {
    if(this._activeTooltip){this.tweens.killTweensOf(this._activeTooltip);this._activeTooltip.destroy();this._activeTooltip=null;}
  }

  _buildContinueBtn(y) {
    const cx=this.W/2,bw=220,bh=48;
    this.continueBtnGfx=this.add.graphics();
    this.continueBtnTxt=this.add.text(cx,y+bh/2,'Continue \u2192',{fontFamily:'Georgia,serif',fontSize:16,color:'#4a5a6a'}).setOrigin(0.5);
    this._continueBtnY=y;this._drawBtn(false);
    this.continueBtnHit=this.add.rectangle(cx,y+bh/2,bw,bh,0xffffff,0);
  }

  _drawBtn(ready) {
    const cx=this.W/2,bw=220,bh=48,y=this._continueBtnY,bx=cx-bw/2;this.continueBtnGfx.clear();
    if(ready){this.continueBtnGfx.fillStyle(0xe2a840,1);this.continueBtnGfx.fillRoundedRect(bx,y,bw,bh,10);this.continueBtnTxt.setColor('#0d1a2a').setStyle({fontStyle:'bold'});}
    else{this.continueBtnGfx.fillStyle(0x1a2744,1);this.continueBtnGfx.fillRoundedRect(bx,y,bw,bh,10);this.continueBtnGfx.lineStyle(1,0x2a3a4a,1);this.continueBtnGfx.strokeRoundedRect(bx,y,bw,bh,10);this.continueBtnTxt.setColor('#4a5a6a').setStyle({fontStyle:'normal'});}
  }

  _checkAll() {
    const {saule,buildexp}=this.selections;
    if(saule.length>0 && buildexp){this._drawBtn(true);if(!this._btnBound){this._btnBound=true;this.continueBtnHit.setInteractive({useHandCursor:true});this.continueBtnHit.on('pointerdown',()=>this._goNext());this.tweens.add({targets:this.continueBtnGfx,alpha:{from:1,to:0.75},duration:700,yoyo:true,repeat:-1});}}
  }

  _goNext() {
    this._clearTooltip();this.tweens.killAll();
    window.retirementContext=this.selections;
    const fo=this.add.graphics().setDepth(100);fo.fillStyle(0x000000,0);fo.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fo,alpha:1,duration:500,onComplete:()=>this.scene.start('StartingQuestions')});
  }

  _fadeIn() {
    const fi=this.add.graphics().setDepth(100);fi.fillStyle(0x000000,1);fi.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fi,alpha:0,duration:600,onComplete:()=>fi.destroy()});
  }

  update() {
    if(this.stars)this.stars.forEach(s=>{s.phase+=0.02;s.gfx.setAlpha(0.15+0.3*Math.sin(s.phase));});
  }
}
