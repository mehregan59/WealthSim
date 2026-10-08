class RetirementContext extends Phaser.Scene {
  constructor() { super({ key: 'RetirementContext' }); }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    this._yearsFromAge = this._deriveYears();
    this.selections = { saule: [], buildexp: null, years: this._yearsFromAge.value };
    this._sectionCards = {};
    this._activeTooltip = null;
    this._btnBound = false;
    this._drawBackground();
    this._buildUI();
    this._fadeIn();
  }

  _tr(key, fallback) {
    if (typeof t === 'function') {
      const v = t(key);
      if (v && v !== key) return v;
    }
    return fallback;
  }

  _deriveYears() {
    const age = window.playerInfo?.age || '28-37';
    const midpoints = {'18-27':22,'28-37':32,'38-47':42,'48-57':52,'58-65':61};
    const mid = midpoints[age] || 32;
    const years = 67 - mid;
    const tpl = this._tr('ui.retirement.yearsUntilRetirement', '~{years} years until retirement');
    const label = tpl.replace('{years}', years);
    if(years > 30) return { value:'30plus',  label };
    if(years > 15) return { value:'15-30',   label };
    return              { value:'under15', label };
  }

  _drawBackground() {
    this.backdrop = CityTheme.drawBackdrop(this, { depth:-2 });
  }

  _buildUI() {
    const cx=this.W/2;
    this._drawStepDots(2);
    this.add.text(cx,52,
      this._tr('ui.retirement.title','Your retirement system'),
      {fontFamily:CityTheme.heading,fontSize:30,color:'#000000'}).setOrigin(0.5);
    this.add.text(cx,88,
      this._tr('ui.retirement.subtitle','These answers personalize your closing feedback. They never change gameplay.'),
      {fontFamily:CityTheme.body,fontSize:16,color:'#55777a'}).setOrigin(0.5);

    const noticeBox=this.add.graphics();
    noticeBox.fillStyle(0xd7e3d5,0.8);noticeBox.fillRoundedRect(cx-380,116,760,44,8);
    noticeBox.lineStyle(1,0x296b72,0.4);noticeBox.strokeRoundedRect(cx-380,116,760,44,8);
    const ageLabel=window.playerInfo?.age||'28-37';
    const ageTpl = this._tr('ui.retirement.ageNotice','Age group: {age}  ·  Estimated time until retirement: {years}');
    const ageNotice = ageTpl.replace('{age}', ageLabel).replace('{years}', this._yearsFromAge.label);
    this.add.text(cx,138,ageNotice,{fontFamily:CityTheme.body,fontSize:15,color:'#296b72'}).setOrigin(0.5);

    // Q1 Saule — use i18n if available, fall back to English
    const rawSaule = this._tr('ui.retirement.sauleOptions', null);
    const q1Label = this._tr('ui.retirement.q1Label','Which retirement pillars do you already have? (Select all that apply)');
    const sauleOpts = (rawSaule && Array.isArray(rawSaule)) ? rawSaule : [
      {value:'grv',label:'🏗 GRV',sub:'State pension',
        tooltipTitle:'GRV — Statutory Pension Insurance',
        tooltipBody:'Mandatory for almost all employees in Germany. Contributions are deducted automatically from salary. Pension depends on years of contributions and earnings. For most people alone not sufficient.',
        link:'https://www.deutsche-rentenversicherung.de',linkLabel:'deutsche-rentenversicherung.de'},
      {value:'bav',label:'🏢 bAV',sub:'Occupational pension',
        tooltipTitle:'bAV — Occupational Pension',
        tooltipBody:'Your employer contributes to your pension. Since 2019, a 15% employer contribution is mandatory for new contracts. Tax and social security free up to certain limits.',
        link:'https://www.bmas.de/DE/Arbeit/Betriebliche-Altersversorgung/betriebliche-altersversorgung.html',linkLabel:'bmas.de'},
      {value:'s3',label:'🏗 Pillar 3',sub:'Riester / Rürup / Private',
        tooltipTitle:'Pillar 3 — Private Provision',
        tooltipBody:'Voluntary private retirement savings. Riester: state-subsidized, for employees. Rürup: tax-deductible, especially for self-employed. Both have subsidy limits and conditions.',
        link:'https://www.verbraucherzentrale.de/wissen/geld-versicherungen/altersvorsorge-und-rente',linkLabel:'verbraucherzentrale.de'},
      {value:'unsure',label:'❓ Not sure',sub:'I am not sure yet',
        tooltipTitle:'The German pension system',
        tooltipBody:'Germany has a three-pillar system: GRV (statutory), bAV (occupational), and private provision. Most employees have at least the GRV. bAV and Pillar 3 are optional but recommended.',
        link:'https://www.bpb.de/themen/soziale-lage/rentenpolitik/',linkLabel:'bpb.de — Rentenpolitik'}
    ];
    this._buildSauleSection(178,q1Label,sauleOpts);

    // Q2
    const q2Label = this._tr('ui.retirement.q2Label','How familiar are you with saving and investing?');
    const rawExp = this._tr('ui.retirement.experienceOptions', null);
    const expOpts = (rawExp && Array.isArray(rawExp)) ? rawExp : [
      {label:'🔰 Not yet started',sub:'I am not yet saving for retirement',value:'none'},
      {label:'📖 Learning the basics',sub:'I know the basics and save something',value:'basic'},
      {label:'📈 Already investing',sub:'I invest actively and regularly',value:'experienced'}
    ];
    this._buildSimpleSection(486,q2Label,'buildexp',expOpts,3);
    this._buildContinueBtn(632);

    const sk=this.add.text(cx,700,
      this._tr('ui.retirement.skip','Skip and start building →'),
      {fontFamily:CityTheme.body,fontSize:15,color:'#55777a'}).setOrigin(0.5).setInteractive({useHandCursor:true});
    sk.on('pointerover',()=>sk.setColor('#365d60'));
    sk.on('pointerout',()=>sk.setColor('#55777a'));
    sk.on('pointerdown',()=>{ if(!this.selections.saule.length) this.selections.saule=['unsure']; this._goNext(); });
  }

  _drawStepDots(active) {
    const cx=this.W/2,steps=3,spacing=28,g=this.add.graphics();
    for(let i=0;i<steps;i++){const x=cx-((steps-1)*spacing/2)+i*spacing;if(i+1===active){g.fillStyle(0xe0a82e,1);g.fillCircle(x,18,5);}else if(i+1<active){g.fillStyle(0x296b72,1);g.fillCircle(x,18,4);}else{g.fillStyle(0xd7e3d5,1);g.fillCircle(x,18,4);g.lineStyle(1,0x7ca5a1,1);g.strokeCircle(x,18,4);}}
  }

  _buildSauleSection(y,label,options) {
    const cx=this.W/2,sW=Math.min(920,this.W-56),startX=cx-sW/2;
    const cols=2,cW=Math.floor((sW-14)/cols),cH=88;
    this.add.text(startX,y,label,{fontFamily:CityTheme.body,fontSize:15,color:'#55777a',fontStyle:'bold'});
    options.forEach((opt,i)=>{
      const col=i%cols,row=Math.floor(i/cols);
      const bx=startX+col*(cW+14),by=y+26+row*(cH+12);
      const card=this.add.graphics();
      const mainTxt=this.add.text(bx+18,by+20,opt.label,{fontFamily:CityTheme.body,fontSize:17,color:'#365d60',fontStyle:'bold'});
      const subTxt=this.add.text(bx+18,by+50,opt.sub,{fontFamily:CityTheme.body,fontSize:14,color:'#55777a'});
      const infoIcon=this.add.text(bx+cW-26,by+12,'ℹ',{fontFamily:CityTheme.body,fontSize:18,color:'#55777a'}).setInteractive({useHandCursor:true});
      const draw=(sel,hover)=>{card.clear();if(sel){card.fillStyle(0xe0a82e,0.15);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(2,0xe0a82e,0.9);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#9b6c12');subTxt.setColor('#7a651e');infoIcon.setColor('#296b72');}else if(hover){card.fillStyle(0xd7e3d5,1);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(1,0x4a6080,1);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#173b40');subTxt.setColor('#55777a');infoIcon.setColor('#296b72');}else{card.fillStyle(0xf2e7c9,0.9);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(1,0xd7e3d5,1);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#365d60');subTxt.setColor('#55777a');infoIcon.setColor('#55777a');}};
      draw(false,false);
      const isSelected=()=>this.selections.saule.includes(opt.value);
      const redrawAll=()=>{ if(this._sectionCards.saule) this._sectionCards.saule.forEach(c=>c.fn(this.selections.saule.includes(c.value),false)); };
      const hit=this.add.rectangle(bx+cW/2-14,by+cH/2,cW-30,cH,0xffffff,0).setInteractive({useHandCursor:true});
      hit.on('pointerover',()=>{if(!isSelected())draw(false,true);});
      hit.on('pointerout',()=>draw(isSelected(),false));
      hit.on('pointerdown',()=>{
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
      infoIcon.on('pointerover',()=>infoIcon.setColor('#9b6c12'));
      infoIcon.on('pointerout',()=>infoIcon.setColor(isSelected()?'#296b72':'#55777a'));
      infoIcon.on('pointerdown',(ptr)=>{try{ptr.event.stopPropagation();}catch(e){}this._showTooltip(opt,bx+cW/2,by);});
      if(!this._sectionCards.saule)this._sectionCards.saule=[];
      this._sectionCards.saule.push({fn:draw,value:opt.value});
    });
  }

  _buildSimpleSection(y,label,key,options,cols) {
    const cx=this.W/2,sW=Math.min(920,this.W-56),startX=cx-sW/2;
    const cW=Math.floor((sW-(cols-1)*14)/cols),cH=76;
    this.add.text(startX,y,label,{fontFamily:CityTheme.body,fontSize:15,color:'#55777a',fontStyle:'bold'});
    options.forEach((opt,i)=>{
      const col=i%cols,row=Math.floor(i/cols);
      const bx=startX+col*(cW+14),by=y+26+row*(cH+10);
      const card=this.add.graphics();
      const mainTxt=this.add.text(bx+cW/2,by+26,opt.label,{fontFamily:CityTheme.body,fontSize:16,color:'#365d60',align:'center',wordWrap:{width:cW-20}}).setOrigin(0.5);
      const subTxt=this.add.text(bx+cW/2,by+54,opt.sub,{fontFamily:CityTheme.body,fontSize:13,color:'#55777a',align:'center',wordWrap:{width:cW-20}}).setOrigin(0.5);
      const draw=(sel,hover)=>{card.clear();if(sel){card.fillStyle(0xe0a82e,0.15);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(2,0xe0a82e,0.9);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#9b6c12');subTxt.setColor('#7a651e');}else if(hover){card.fillStyle(0xd7e3d5,1);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(1,0x4a6080,1);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#173b40');subTxt.setColor('#55777a');}else{card.fillStyle(0xf2e7c9,0.9);card.fillRoundedRect(bx,by,cW,cH,8);card.lineStyle(1,0xd7e3d5,1);card.strokeRoundedRect(bx,by,cW,cH,8);mainTxt.setColor('#365d60');subTxt.setColor('#55777a');}};
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
    bg.fillStyle(0xa7d8de,0.98);bg.fillRoundedRect(tx,ty,tw,th,10);
    bg.lineStyle(1.5,0xe0a82e,0.7);bg.strokeRoundedRect(tx,ty,tw,th,10);
    bg.lineStyle(3,0xe0a82e,0.6);bg.lineBetween(tx,ty,tx,ty+th);
    container.add(bg);
    const title=this.add.text(tx+16,ty+14,opt.tooltipTitle,{fontFamily:CityTheme.heading,fontSize:13,color:'#9b6c12',fontStyle:'bold'});
    container.add(title);
    const body=this.add.text(tx+16,ty+36,opt.tooltipBody,{fontFamily:CityTheme.body,fontSize:11,color:'#55777a',wordWrap:{width:tw-32},lineSpacing:3});
    container.add(body);
    const linkY=ty+th-26;
    const linkBg=this.add.graphics();
    linkBg.fillStyle(0xd7e3d5,1);linkBg.fillRoundedRect(tx+12,linkY-4,tw-24,24,5);
    container.add(linkBg);
    const linkTxt=this.add.text(tx+18,linkY+8,'→ '+opt.linkLabel,{fontFamily:CityTheme.body,fontSize:11,color:'#296b72',fontStyle:'bold'}).setOrigin(0,0.5).setInteractive({useHandCursor:true});
    container.add(linkTxt);
    linkTxt.on('pointerover',()=>linkTxt.setColor('#9b6c12'));
    linkTxt.on('pointerout', ()=>linkTxt.setColor('#296b72'));
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
    const cx=this.W/2,bw=280,bh=58;
    this.continueBtnGfx=this.add.graphics();
    this.continueBtnTxt=this.add.text(cx,y+bh/2,
      this._tr('ui.retirement.continue','Continue →'),
      {fontFamily:CityTheme.heading,fontSize:20,color:'#688486'}).setOrigin(0.5);
    this._continueBtnY=y;this._drawBtn(false);
    this.continueBtnHit=this.add.rectangle(cx,y+bh/2,bw,bh,0xffffff,0);
  }

  _drawBtn(ready) {
    const cx=this.W/2,bw=280,bh=58,y=this._continueBtnY,bx=cx-bw/2;this.continueBtnGfx.clear();
    if(ready){this.continueBtnGfx.fillStyle(0xe0a82e,1);this.continueBtnGfx.fillRoundedRect(bx,y,bw,bh,10);this.continueBtnTxt.setColor('#0d1a2a').setStyle({fontStyle:'bold'});}
    else{this.continueBtnGfx.fillStyle(0xd7e3d5,1);this.continueBtnGfx.fillRoundedRect(bx,y,bw,bh,10);this.continueBtnGfx.lineStyle(1,0x9bb5ae,1);this.continueBtnGfx.strokeRoundedRect(bx,y,bw,bh,10);this.continueBtnTxt.setColor('#688486').setStyle({fontStyle:'normal'});}
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
