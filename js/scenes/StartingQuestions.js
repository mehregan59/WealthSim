class StartingQuestions extends Phaser.Scene {
  constructor() { super({ key: 'StartingQuestions' }); }

  create() {
    this.W=this.scale.width; this.H=this.scale.height;
    this.currentQ=0; this.answers=[]; this.questionElements=[];
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
    this._drawBackground(); this._showWelcomeBriefing(); this._fadeIn();
  }

  _drawBackground() {
    const bg=this.add.graphics().setDepth(-1);bg.fillStyle(0x060e1c,1);bg.fillRect(0,0,this.W,this.H);bg.fillStyle(0xe2a840,0.03);bg.fillRect(0,this.H-160,this.W,160);
    const sil=this.add.graphics().setDepth(-1);sil.fillStyle(0x0d1a2a,1);
    [[0,80,90],[120,50,70],[260,90,100],[430,60,80],[600,70,90],[760,50,70],[900,80,100],[1050,60,80],[1160,90,80],[1240,70,40]].forEach(([x,h,w])=>sil.fillRect(x,this.H-h,w,h));
    this.stars=[];
    for(let i=0;i<30;i++){const s=this.add.graphics().setDepth(-1);s.fillStyle(0xffffff,Math.random()*0.4+0.1);s.fillCircle(0,0,Math.random()+0.4);s.setPosition(Phaser.Math.Between(0,this.W),Phaser.Math.Between(0,this.H-180));this.stars.push({gfx:s,phase:Math.random()*Math.PI*2});}
  }

  // A short welcome card shown once, before the first question.
  // Explains why the questions exist, what the side panel does during play,
  // and warns that pace/timing matters in some levels — all before anything
  // is asked of the player.
  _showWelcomeBriefing() {
    const lang=typeof currentLang!=='undefined'?currentLang:'en';
    const cx=this.W/2, cy=this.H/2;
    const copy = lang==='de' ? {
      title:'Bevor wir beginnen',
      body:'Du wirst gleich drei kurze Fragen beantworten. Es gibt keine richtigen oder falschen Antworten — sie helfen nur dabei, deinen Ausgangspunkt festzulegen.\n\nDanach baust du eine Stadt auf. Ein Seitenpanel zeigt dir jederzeit, wie die Stadt auf deine Entscheidungen reagiert — Stimmung, Wachstum, Mittel und die Leistung jedes Stadtteils. Beobachte es, wann immer du willst.\n\nEine Sache noch: In manchen Levels zählt auch, wie du dich verhältst, wenn du dir Zeit lässt — nicht nur, was du wählst.',
      btn:'Verstanden →'
    } : {
      title:'Before we begin',
      body:'You are about to answer three quick questions. There are no right or wrong answers — they simply set your starting point.\n\nAfter that, you will build a city. A side panel is always visible and shows how the city reacts to your choices — happiness, growth, funds, and how each district is performing. Check it whenever you like.\n\nOne more thing: in some levels, how you behave when you take your time matters too — not only what you choose.',
      btn:'Got it →'
    };

    const ov=this.add.graphics().setDepth(150); ov.fillStyle(0x000000,0.55); ov.fillRect(0,0,this.W,this.H);
    const bw=Math.min(620,this.W-64), bh=340, bx=cx-bw/2, by=cy-bh/2;
    const box=this.add.graphics().setDepth(151);
    box.fillStyle(0x0a1626,0.98); box.fillRoundedRect(bx,by,bw,bh,14);
    box.lineStyle(1,0xe2a840,0.55); box.strokeRoundedRect(bx,by,bw,bh,14);
    const t=this.add.text(cx,by+40,copy.title,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:24,color:'#e2a840'}).setOrigin(0.5).setDepth(152);
    const b=this.add.text(cx,by+bh/2+4,copy.body,{
      fontFamily:'Inter, Arial, sans-serif',fontSize:14,color:'#c3d4e6',
      align:'center',wordWrap:{width:bw-84},lineSpacing:6}).setOrigin(0.5).setDepth(152);
    const btn=this.add.text(cx,by+bh-38,copy.btn,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:16,color:'#f0c060'})
      .setOrigin(0.5).setDepth(152).setInteractive({useHandCursor:true});
    btn.on('pointerover',()=>btn.setColor('#ffe090')); btn.on('pointerout',()=>btn.setColor('#f0c060'));
    btn.on('pointerdown',()=>{
      this.cameras.main.shake(60,0.002);
      [ov,box,t,b,btn].forEach(e=>{try{ this.tweens.add({targets:e,alpha:0,duration:300,onComplete:()=>e.destroy()}); }catch(err){} });
      this.time.delayedCall(320,()=>this._renderQuestion());
    });
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
