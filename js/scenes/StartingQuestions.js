class StartingQuestions extends Phaser.Scene {
  constructor() { super({ key: 'StartingQuestions' }); }

  create() {
    this.W=this.scale.width; this.H=this.scale.height;
    this.S=1;
    this.currentQ=0; this.answers=[]; this.questionElements=[];
    this.tutorial=new Tutorial(this);
    const lang=typeof currentLang!=='undefined'?currentLang:'en';
    this.questions=lang==='de'?[
      {text:'Deine Stadt erhält ihr erstes Baubudget.\nWas fühlt sich am angenehmsten an?',options:[{label:'🛡 Fast alles schützen',value:'safe'},{label:'⚖ Einen Teil investieren',value:'balanced'},{label:'🚀 Das meiste investieren',value:'aggressive'}]},
      {text:'Manche Projekte brauchen viele Jahre.\nWie fühlst du dich dabei?',options:[{label:'⚡ Schnelle Ergebnisse bevorzugt',value:'impatient'},{label:'⏳ Kann warten, wenn besser',value:'moderate'},{label:'🎓 Langfristig lohnt es sich',value:'patient'}]},
      {text:'Ein Projekt verliert plötzlich an Wert.\nWas würdest du instinktiv tun?',options:[{label:'🛑 Sofort stoppen',value:'stop'},{label:'👁 Abwarten und beobachten',value:'wait'},{label:'🔍 Mehr Informationen sammeln',value:'research'}]}
    ]:[
      {text:'Your city receives its first building budget.\nWhat feels most comfortable?',options:[{label:'🛡 Protect almost everything',value:'safe'},{label:'⚖ Invest part of it',value:'balanced'},{label:'🚀 Invest most of it',value:'aggressive'}]},
      {text:'Some projects need many years before producing results.\nHow do you feel?',options:[{label:'⚡ I prefer quick results',value:'impatient'},{label:'⏳ I can wait if the outcome is better',value:'moderate'},{label:'🎓 Long-term results are worth it',value:'patient'}]},
      {text:'One project suddenly loses value.\nWhat would you instinctively do?',options:[{label:'🛑 Stop immediately',value:'stop'},{label:'👁 Wait and observe',value:'wait'},{label:'🔍 Gather more information first',value:'research'}]}
    ];
    this._drawBackground();
    // The multi-page briefing now lives in Tutorial.js (shared with the
    // per-level guides) — that copy is deliberately careful not to reveal
    // that decisions are being scored. This scene used to have its own,
    // older welcome card with a line that leaked exactly that ("how you
    // behave when you take your time matters too"); routing through
    // Tutorial.showBriefing() instead removes that inconsistency.
    this.tutorial.showBriefing(()=>this._nameCity());
    this._fadeIn();
  }

  _drawBackground() {
    const bg=this.add.graphics().setDepth(-1);bg.fillStyle(0x060e1c,1);bg.fillRect(0,0,this.W,this.H);bg.fillStyle(0xe2a840,0.03);bg.fillRect(0,this.H-160,this.W,160);
    const sil=this.add.graphics().setDepth(-1);sil.fillStyle(0x0d1a2a,1);
    [[0,80,90],[120,50,70],[260,90,100],[430,60,80],[600,70,90],[760,50,70],[900,80,100],[1050,60,80],[1160,90,80],[1240,70,40]].forEach(([x,h,w])=>sil.fillRect(x,this.H-h,w,h));
    this.stars=[];
    for(let i=0;i<30;i++){const s=this.add.graphics().setDepth(-1);s.fillStyle(0xffffff,Math.random()*0.4+0.1);s.fillCircle(0,0,Math.random()+0.4);s.setPosition(Phaser.Math.Between(0,this.W),Phaser.Math.Between(0,this.H-180));this.stars.push({gfx:s,phase:Math.random()*Math.PI*2});}
  }

  // Ask the player to name their city before anything else happens. All
  // four districts will later be shown enclosed inside one boundary
  // labelled with this name, making clear they all belong to one city
  // the player is responsible for.
  //
  // NOTE for future maintenance: this uses window.prompt() rather than an
  // in-canvas text field. Phaser has no built-in text input, and this repo
  // doesn't currently wire up Phaser's DOM Element support (which would be
  // the "native-feeling" way to do it). prompt() is the reliable option
  // that works everywhere without adding that DOM layer — but it does look
  // like a plain browser dialog rather than part of the game's visual
  // style. Replacing it with a proper in-canvas input is a reasonable
  // follow-up if the mismatch bothers you.
  _nameCity() {
    const lang=typeof currentLang!=='undefined'?currentLang:'en';
    let name = null;
    try {
      name = window.prompt(lang==='de'
        ? 'Wie soll deine Stadt heißen?'
        : 'What would you like to name your city?', '');
    } catch(e) { name = null; }
    name = (name||'').trim().slice(0,28);
    window.cityName = name || (lang==='de' ? 'Meine Stadt' : 'My City');
    this._renderQuestion();
  }

  _renderQuestion() {
    if(this.questionElements){this.questionElements.forEach(e=>{try{e.destroy();}catch(err){}});}
    this.questionElements=[];
    const cx=this.W/2,q=this.questions[this.currentQ];
    const stepGfx=this.add.graphics(); this._drawStepDots(stepGfx); this.questionElements.push(stepGfx);
    const qNum=this.add.text(cx,45,`${this.currentQ+1} / ${this.questions.length}`,{fontFamily:'Arial,sans-serif',fontSize:12,color:'#4a6080'}).setOrigin(0.5).setAlpha(0);
    this.questionElements.push(qNum); this.tweens.add({targets:qNum,alpha:1,duration:300});
    const bbg=this.add.graphics();bbg.fillStyle(0x1a2744,1);bbg.fillRoundedRect(cx-160,60,320,4,2);
    const bfill=this.add.graphics();bfill.fillStyle(0xe2a840,0.8);bfill.fillRoundedRect(cx-160,60,320*((this.currentQ+1)/this.questions.length),4,2);
    this.questionElements.push(bbg,bfill);
    const qTxt=this.add.text(cx,this.H/2-120,q.text,{fontFamily:'Georgia,serif',fontSize:22,color:'#e8f0ff',align:'center',wordWrap:{width:680}}).setOrigin(0.5).setAlpha(0);
    this.questionElements.push(qTxt);
    this.tweens.add({targets:qTxt,alpha:1,y:this.H/2-110,duration:500,ease:'Power2.easeOut'});
    const optW=280,optH=58,optSp=16;
    const totalH=q.options.length*(optH+optSp)-optSp,startY=this.H/2-totalH/2+40;
    q.options.forEach((opt,i)=>{
      const by=startY+i*(optH+optSp),bx=cx-optW/2;
      const card=this.add.graphics().setAlpha(0);
      const lbl=this.add.text(cx,by+optH/2,opt.label,{fontFamily:'Arial,sans-serif',fontSize:16,color:'#a8b8cc',align:'center'}).setOrigin(0.5).setAlpha(0);
      this.questionElements.push(card,lbl);
      const draw=(hover)=>{card.clear();if(hover){card.fillStyle(0xe2a840,0.12);card.fillRoundedRect(bx,by,optW,optH,10);card.lineStyle(2,0xe2a840,0.7);card.strokeRoundedRect(bx,by,optW,optH,10);lbl.setColor('#f0c060');}else{card.fillStyle(0x0d1a2a,0.85);card.fillRoundedRect(bx,by,optW,optH,10);card.lineStyle(1,0x1a2a3a,1);card.strokeRoundedRect(bx,by,optW,optH,10);lbl.setColor('#a8b8cc');}};
      draw(false);
      this.tweens.add({targets:[card,lbl],alpha:1,duration:350,delay:200+i*100});
      const hit=this.add.rectangle(cx,by+optH/2,optW,optH,0xffffff,0).setInteractive({useHandCursor:true});
      this.questionElements.push(hit);
      hit.on('pointerover',()=>draw(true)); hit.on('pointerout',()=>draw(false));
      hit.on('pointerdown',()=>{
        this.cameras.main.shake(80,0.003);
        card.clear();card.fillStyle(0xe2a840,0.25);card.fillRoundedRect(bx,by,optW,optH,10);card.lineStyle(2,0xe2a840,1);card.strokeRoundedRect(bx,by,optW,optH,10);lbl.setColor('#f0c060');
        if(typeof ScoringEngine!=='undefined')ScoringEngine.recordStartingAnswer(this.currentQ,opt.value);
        this.answers[this.currentQ]=opt.value;
        this.time.delayedCall(300,()=>this._nextQuestion());
      });
    });
    if(this.currentQ>0){
      const back=this.add.text(cx-180,this.H-55,'← Back',{fontFamily:'Arial,sans-serif',fontSize:13,color:'#3a4a5a'}).setOrigin(0.5).setInteractive({useHandCursor:true});
      back.on('pointerover',()=>back.setColor('#6b8aaa')); back.on('pointerout',()=>back.setColor('#3a4a5a'));
      back.on('pointerdown',()=>{this.currentQ--;this._renderQuestion();});
      this.questionElements.push(back);
    }
  }

  _drawStepDots(g) {
    const cx=this.W/2,steps=3,spacing=28;
    for(let i=0;i<steps;i++){const x=cx-((steps-1)*spacing/2)+i*spacing;if(i+1<=this.currentQ){g.fillStyle(0x4ecdc4,1);g.fillCircle(x,18,4);}else if(i+1===this.currentQ+1){g.fillStyle(0xe2a840,1);g.fillCircle(x,18,5);}else{g.fillStyle(0x1a2744,1);g.fillCircle(x,18,4);g.lineStyle(1,0x3a4a6a,1);g.strokeCircle(x,18,4);}}
  }

  _nextQuestion() {
    this.currentQ++;
    if(this.currentQ>=this.questions.length)this._goToGame();
    else this._renderQuestion();
  }

  _goToGame() {
    this.tweens.killAll();
    const fo=this.add.graphics().setDepth(100);fo.fillStyle(0x000000,0);fo.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fo,alpha:1,duration:600,onComplete:()=>this.scene.start('GameScene')});
  }

  _fadeIn() {
    const fi=this.add.graphics().setDepth(100);fi.fillStyle(0x000000,1);fi.fillRect(0,0,this.W,this.H);
    this.tweens.add({targets:fi,alpha:0,duration:600,onComplete:()=>fi.destroy()});
  }

  update() { if(this.stars)this.stars.forEach(s=>{s.phase+=0.02;s.gfx.setAlpha(0.1+0.25*Math.sin(s.phase));});}
}
