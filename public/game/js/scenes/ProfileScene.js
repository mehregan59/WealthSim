class ProfileScene extends Phaser.Scene {
  constructor(){ super({ key:'ProfileScene' }); }

  create(data) {
    this.W = this.scale.width; this.H = this.scale.height;
    this.S = Math.max(0.9, Math.min(1.9, this.H / 720));
    this.stats = (data && data.stats) || { happiness:50, development:50, resources:50 };
    this.scores  = this._computeScores();
    this.persona = this._assignPersona(this.scores);
    this.tip = null;
    this._bg();
    this._curtainDrop();
  }
  s(v){ return Math.round(v * this.S); }

  _bg() {
    const g = this.add.graphics().setDepth(-5);
    g.fillStyle(0x061019,1); g.fillRect(0,0,this.W,this.H);
    const sil = this.add.graphics().setDepth(-4);
    sil.fillStyle(0x0b1725,1);
    for (let x=0; x<this.W; x+=Phaser.Math.Between(70,120)) {
      const h = Phaser.Math.Between(40,130);
      sil.fillRect(x, this.H-h, Phaser.Math.Between(55,100), h);
    }
    this.starGfx = this.add.graphics().setDepth(-4);
    this.stars = [];
    for (let i=0;i<50;i++) this.stars.push({x:Phaser.Math.Between(0,this.W),y:Phaser.Math.Between(0,this.H-240),r:Math.random()+0.4,p:Math.random()*Math.PI*2});
  }

  _curtainDrop() {
    const W=this.W, H=this.H, de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const lines = de ? [
      'Sieh dir die Stadt an, die du gebaut hast.',
      'Du hast den Boom navigiert, den Sturm überstanden und Entscheidungen\ngetroffen, die deine Bürger vorangebracht haben.',
      'Jede Entscheidung hat deine natürlichen Instinkte\nfür Planung und Anpassung offenbart.'
    ] : [
      'Take a look at the city you\u2019ve built.',
      'You navigated the boom, weathered the storm, and made choices\nto keep your citizens moving forward.',
      'Every decision you made revealed your natural instincts\nfor planning and adapting.'
    ];

    const objs=[];
    lines.forEach((txt,i)=>{
      const t=this.add.text(W/2, H/2 - this.s(76) + i*this.s(70), txt, {
        fontFamily:'Playfair Display, Georgia, serif',
        fontSize: i===0 ? this.s(30) : this.s(20),
        color: i===0 ? '#e2a840' : '#dbe8f4',
        align:'center', lineSpacing:this.s(9), wordWrap:{width:Math.min(this.s(900),W-this.s(120))}
      }).setOrigin(0.5).setDepth(100).setAlpha(0);
      objs.push(t);
      this.tweens.add({targets:t,alpha:1,y:t.y-this.s(9),duration:1400,delay:600+i*2600,ease:'Sine.easeOut'});
    });
    const totalIn = 600 + (lines.length-1)*2600 + 1400;

    const trans=this.add.text(W/2, H/2+this.s(150), de
      ? 'So wie beim Bauen einer Stadt geht es bei der Planung deiner Zukunft darum,\ndie richtige Balance für dich zu finden.'
      : 'Just like building a city, planning for your future is about\nfinding the right balance for you.', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(16), color:'#96b0c8',
      align:'center', lineSpacing:this.s(7), fontStyle:'italic'
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
    this.tweens.add({targets:trans,alpha:1,duration:1300,delay:totalIn+700});

    this.time.delayedCall(totalIn+4200,()=>{
      this.tweens.add({targets:objs.concat([trans]),alpha:0,duration:1500,
        onComplete:()=>{objs.forEach(o=>o.destroy());trans.destroy();this._dashboard();}});
    });

    const skip=this.add.text(W-this.s(30),H-this.s(26),de?'Überspringen \u203A':'Skip \u203A',{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(13),color:'#456a8c'
    }).setOrigin(1,0.5).setDepth(120).setInteractive({useHandCursor:true});
    skip.on('pointerover',()=>skip.setColor('#a8c0d8'));
    skip.on('pointerout',()=>skip.setColor('#456a8c'));
    skip.on('pointerdown',()=>{
      this.tweens.killAll();
      objs.forEach(o=>{try{o.destroy();}catch(e){}});
      try{trans.destroy();}catch(e){} skip.destroy();
      this._dashboard();
    });
  }

  _dashboard() {
    const W=this.W,H=this.H,cx=W/2;
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');

    const head=this.add.text(cx,this.s(46),de?'Dein Entscheidungsstil':'Your Decision Style',{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(30),color:'#e2a840'
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
    this.tweens.add({targets:head,alpha:1,duration:900});

    const cardW=Math.min(this.s(620),W-this.s(90)), cardX=cx-cardW/2;
    const cardY=this.s(80), cardH=this.s(116);
    const card=this.add.graphics().setDepth(99).setAlpha(0);
    card.fillStyle(0x0b1725,0.96); card.fillRoundedRect(cardX,cardY,cardW,cardH,this.s(14));
    card.lineStyle(1,0x2c4767,1); card.strokeRoundedRect(cardX,cardY,cardW,cardH,this.s(14));
    card.fillStyle(0xe2a840,0.9); card.fillRect(cardX,cardY,cardW,this.s(4));
    this.tweens.add({targets:card,alpha:1,duration:900,delay:250});

    const pIcon=this.add.text(cardX+this.s(42),cardY+this.s(58),this.persona.icon,{fontSize:this.s(36)}).setOrigin(0.5).setDepth(100).setAlpha(0);
    const pName=this.add.text(cardX+this.s(78),cardY+this.s(34),this.persona.name,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(23),color:'#f0c060'}).setDepth(100).setAlpha(0);
    const pDesc=this.add.text(cardX+this.s(78),cardY+this.s(64),this.persona.desc,{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(14),color:'#b0c6da',
      wordWrap:{width:cardW-this.s(110)},lineSpacing:this.s(5)}).setDepth(100).setAlpha(0);
    this.tweens.add({targets:[pIcon,pName,pDesc],alpha:1,duration:900,delay:500});

    // Trait rows with hover explanations
    const T = this._traitInfo(de);
    const keys=['riskPreference','lossAversion','patience','diversification','greedFomo','reactionToNoise','learning','resilience'];
    const colW=Math.min(this.s(340),(W-this.s(150))/2);
    const startX=cx-colW-this.s(14);
    const startY=cardY+cardH+this.s(34);
    const rowH=this.s(44);

    keys.forEach((key,i)=>{
      const col=i%2, row=Math.floor(i/2);
      const bx=startX+col*(colW+this.s(28)), by=startY+row*rowH;
      const val=this.scores[key];
      const info=T[key];

      const lb=this.add.text(bx,by,info.label,{
        fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(14),color:'#a8c0d8'
      }).setDepth(100).setAlpha(0);
      const q=this.add.text(bx+lb.width+this.s(7),by+this.s(1),'\u24D8',{
        fontFamily:'Arial, sans-serif',fontSize:this.s(13),color:'#3f6288'
      }).setDepth(100).setAlpha(0);
      const vt=this.add.text(bx+colW,by,this._label(val),{
        fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(13),color:'#e2a840',fontStyle:'700'
      }).setOrigin(1,0).setDepth(100).setAlpha(0);
      const bg=this.add.graphics().setDepth(99).setAlpha(0);
      bg.fillStyle(0x152744,1); bg.fillRoundedRect(bx,by+this.s(22),colW,this.s(8),this.s(4));
      const fl=this.add.graphics().setDepth(100).setAlpha(0);

      this.tweens.add({targets:[lb,q,vt,bg,fl],alpha:1,duration:550,delay:800+i*95});
      const o={v:0};
      this.tweens.add({targets:o,v:val,duration:950,delay:900+i*95,ease:'Power2.easeOut',
        onUpdate:()=>{
          fl.clear();
          const c=val>66?0x4ecdc4:val>33?0xe2a840:0xe74c7c;
          fl.fillStyle(c,0.95);
          fl.fillRoundedRect(bx,by+this.s(22),Math.max(this.s(8),colW*(o.v/100)),this.s(8),this.s(4));
        }});

      // Hover zone across the whole row
      const hit=this.add.rectangle(bx+colW/2,by+this.s(14),colW,this.s(38),0xffffff,0)
        .setInteractive({useHandCursor:true}).setDepth(102);
      hit.on('pointerover',()=>{ q.setColor('#e2a840'); this._showTip(info.label, info.text, bx+colW/2, by); });
      hit.on('pointerout', ()=>{ q.setColor('#3f6288'); this._hideTip(); });
    });

    // Retirement note
    const noteY=startY+4*rowH+this.s(18);
    const nW=Math.min(this.s(760),W-this.s(110));
    const nBg=this.add.graphics().setDepth(99).setAlpha(0);
    nBg.fillStyle(0x0b1725,0.92); nBg.fillRoundedRect(cx-nW/2,noteY,nW,this.s(78),this.s(12));
    nBg.lineStyle(1,0x2c4767,1); nBg.strokeRoundedRect(cx-nW/2,noteY,nW,this.s(78),this.s(12));
    nBg.lineStyle(this.s(4),0x4ecdc4,0.75); nBg.lineBetween(cx-nW/2,noteY+this.s(12),cx-nW/2,noteY+this.s(66));
    const nTx=this.add.text(cx,noteY+this.s(39),this._contextNote(window.retirementContext||{},de),{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(14),color:'#c0d4e6',
      align:'center',wordWrap:{width:nW-this.s(54)},lineSpacing:this.s(6)
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
    this.tweens.add({targets:[nBg,nTx],alpha:1,duration:900,delay:1700});

    const disc=this.add.text(cx,noteY+this.s(98),de
      ? 'Dieses Profil spiegelt nur diese Sitzung wider. Es ist keine Finanzberatung.'
      : 'This profile reflects this session only. It is not financial advice.',{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(12),color:'#456a8c',align:'center'
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
    this.tweens.add({targets:disc,alpha:1,duration:800,delay:2100});

    const bY=noteY+this.s(126), bW=this.s(220), bH=this.s(48);
    const btnBg=this.add.graphics().setDepth(99).setAlpha(0);
    btnBg.fillStyle(0xe2a840,1); btnBg.fillRoundedRect(cx-bW/2,bY,bW,bH,this.s(11));
    const btnTx=this.add.text(cx,bY+bH/2,de?'Nochmal spielen':'Play Again',{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(18),color:'#0b1725',fontStyle:'700'
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
    this.tweens.add({targets:[btnBg,btnTx],alpha:1,duration:800,delay:2300});
    const hit=this.add.rectangle(cx,bY+bH/2,bW,bH,0xffffff,0).setDepth(101).setInteractive({useHandCursor:true});
    hit.on('pointerdown',()=>{ if(typeof ScoringEngine!=='undefined') ScoringEngine.reset(); this.scene.start('PlayerSetup'); });

    console.log('[WealthSim] Scores:',this.scores,'Persona:',this.persona.key);
  }

  // ── Hover explanation popup ───────────────────────────────────────
  _showTip(title, body, x, y) {
    this._hideTip();
    const tw=Math.min(this.s(340),this.W-this.s(60));
    const pad=this.s(14);
    const tTitle=this.add.text(0,0,title,{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(14),color:'#f0c060',fontStyle:'700'});
    const tBody=this.add.text(0,0,body,{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(13),color:'#b8cde0',
      wordWrap:{width:tw-pad*2},lineSpacing:this.s(5)});
    const th = pad*2 + tTitle.height + this.s(6) + tBody.height;
    let tx = x - tw/2;
    tx = Math.max(this.s(10), Math.min(tx, this.W - tw - this.s(10)));
    let ty = y - th - this.s(14);
    if (ty < this.s(10)) ty = y + this.s(48);

    const bg=this.add.graphics();
    bg.fillStyle(0x040c16,0.98); bg.fillRoundedRect(tx,ty,tw,th,this.s(10));
    bg.lineStyle(1,0xe2a840,0.65); bg.strokeRoundedRect(tx,ty,tw,th,this.s(10));
    bg.lineStyle(this.s(3),0xe2a840,0.7); bg.lineBetween(tx,ty+this.s(10),tx,ty+th-this.s(10));
    tTitle.setPosition(tx+pad, ty+pad);
    tBody.setPosition(tx+pad, ty+pad+tTitle.height+this.s(6));

    this.tip=this.add.container(0,0).setDepth(160);
    this.tip.add([bg,tTitle,tBody]);
    this.tip.setAlpha(0);
    this.tweens.add({targets:this.tip,alpha:1,duration:160});
  }
  _hideTip(){ if(this.tip){this.tweens.killTweensOf(this.tip);this.tip.destroy();this.tip=null;} }

  _traitInfo(de) {
    if (de) return {
      riskPreference:{label:'Risikobereitschaft',text:'Wie viel Unsicherheit du für höhere mögliche Erträge akzeptierst. Hoch heißt nicht besser — es geht um deine Zeit und deinen Komfort.'},
      lossAversion:{label:'Verlustaversion',text:'Wie stark Verluste sich für dich schlimmer anfühlen als gleich große Gewinne. Hohe Werte führen oft zu Verkäufen im ungünstigsten Moment.'},
      patience:{label:'Geduld',text:'Deine Bereitschaft, auf spätere, größere Ergebnisse zu warten statt sofortige Belohnung zu nehmen — die Basis des Zinseszinses.'},
      diversification:{label:'Diversifikation',text:'Wie breit du Ressourcen verteilst. Streuung senkt die Wirkung eines einzelnen schlechten Ergebnisses.'},
      greedFomo:{label:'FOMO-Reaktion',text:'FOMO = "Fear Of Missing Out", die Angst etwas zu verpassen. Misst, wie stark steigende Kurse dich zum Nachkaufen verleiten.'},
      reactionToNoise:{label:'Reaktion auf Nachrichten',text:'Wie stark Schlagzeilen deine Entscheidungen verändern. Niedrige Werte bedeuten, du hältst an deinem Plan fest.'},
      learning:{label:'Lernfähigkeit',text:'Ob du dein Verhalten anpasst, nachdem du Ergebnisse gesehen hast — ohne zu über- oder unterreagieren.'},
      resilience:{label:'Resilienz',text:'Wie ruhig du in einem Abschwung bleibst und ob du deine Struktur intakt hältst, bis sich die Lage erholt.'}
    };
    return {
      riskPreference:{label:'Risk preference',text:'How much uncertainty you accept in exchange for higher possible returns. Higher is not better — it depends on your time horizon and comfort.'},
      lossAversion:{label:'Loss aversion',text:'How much worse a loss feels than an equal gain feels good. High loss aversion often leads to selling at the worst moment.'},
      patience:{label:'Patience',text:'Your willingness to wait for larger later results instead of taking an immediate reward. This is the foundation of compound growth.'},
      diversification:{label:'Diversification',text:'How widely you spread resources. Spreading reduces the impact of any single bad outcome on the whole.'},
      greedFomo:{label:'FOMO response',text:'FOMO means "Fear Of Missing Out". This measures how strongly rising prices tempt you to pile in after the gains have already happened.'},
      reactionToNoise:{label:'Reaction to news',text:'How much headlines change your decisions. Low scores mean you stick to your plan when the news gets loud.'},
      learning:{label:'Adaptability',text:'Whether you adjust your approach after seeing results — without overreacting to a single setback or success.'},
      resilience:{label:'Resilience',text:'How steadily you behave during a downturn, and whether you keep your structure intact until conditions recover.'}
    };
  }

  _label(v) {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    if (de) return v>=80?'Sehr hoch':v>=64?'Hoch':v>=42?'Moderat':v>=26?'Niedrig':'Sehr niedrig';
    return v>=80?'Very high':v>=64?'High':v>=42?'Moderate':v>=26?'Low':'Very low';
  }

  _computeScores() {
    const D=(typeof ScoringEngine!=='undefined'&&ScoringEngine.decisions)?ScoringEngine.decisions:[];
    const A=(typeof ScoringEngine!=='undefined'&&ScoringEngine.startingAnswers)?ScoringEngine.startingAnswers:[];
    const get=n=>(D.find(d=>d.level===n)||{}).value;
    const m=(map,k,def)=>(map[k]!==undefined?map[k]:def);

    const risk =Math.round(m({safe:20,balanced:52,aggressive:88},get(1),50)*0.8+m({safe:20,balanced:52,aggressive:88},A[0],50)*0.2);
    const loss =Math.round(m({cancel:90,wait:70,continue:30,invest_more:12},get(2),50)*0.8+m({stop:90,wait:60,research:28},A[2],50)*0.2);
    const pat  =Math.round(m({festival:20,university:88},get(4),50)*0.8+m({impatient:20,moderate:55,patient:88},A[1],50)*0.2);
    const greed=m({all_in:95,increase:66,hold:26,reduce:12},get(5),50);
    const learn=m({research:88,accept:66,independent:56,decline:38},get(6),50);
    // Level 7: reading the report then acting shows information-seeking
    const l7 = D.filter(d=>d.level===7);
    const readFirst = l7.some(d=>d.value==='research');
    const finalAct = (l7.filter(d=>d.value!=='research').pop()||{}).value;
    let noise = m({sell:90,reduce:56,hold:26},finalAct,50);
    if (readFirst) noise = Math.max(6, noise - 26);
    const resil=m({hold:90,rebalance:86,opportunistic:76,safe_haven:44,sell_all:14},get(8),50);

    let divers=50;
    const l3=D.filter(d=>d.level===3);
    if (l3.length) {
      const counts={};
      l3.forEach(d=>{const k=d.districtId||d.value;counts[k]=(counts[k]||0)+1;});
      const vals=Object.values(counts), total=vals.reduce((a,b)=>a+b,0);
      if(total>0){
        const hhi=vals.reduce((s,v)=>s+Math.pow(v/total,2),0);
        divers=Math.round(Math.max(0,Math.min(100,(1-hhi)/0.75*100)));
      }
    }
    return {riskPreference:risk,lossAversion:loss,patience:pat,diversification:divers,
            greedFomo:greed,reactionToNoise:noise,learning:readFirst?Math.min(100,learn+10):learn,resilience:resil};
  }

  _assignPersona(s) {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const P={
      strategist:{icon:'\u265F',name:de?'Der Stratege':'The Strategist',desc:de?'Geduldig, diversifiziert und informationssuchend. Du passt dich an, ohne auf Gewinne oder Verluste überzureagieren.':'Patient, diversified and information-seeking. You adapt without overreacting to gains or losses.'},
      guardian:{icon:'\uD83D\uDEE1',name:de?'Der Hüter':'The Guardian',desc:de?'Du schützt sorgfältig, was du aufgebaut hast. Vorsichtig und geduldig — achte darauf, produktives Risiko nicht zu vermeiden.':'You carefully protect what you have built. Cautious and patient — watch that you do not avoid productive risk.'},
      challenger:{icon:'\uD83D\uDE80',name:de?'Der Herausforderer':'The Challenger',desc:de?'Selbstbewusst und wachstumsorientiert. Komfortabel mit Unsicherheit — achte auf Überkonzentration.':'Confident and growth-oriented. Comfortable with uncertainty — watch for overconcentration.'},
      explorer:{icon:'\uD83D\uDD2D',name:de?'Der Entdecker':'The Explorer',desc:de?'Neugierig und ausgewogen. Du suchst Informationen, bevor du handelst, und lernst aus Ergebnissen.':'Curious and balanced. You seek information before acting and learn from outcomes.'},
      sprinter:{icon:'\u26A1',name:de?'Der Sprinter':'The Sprinter',desc:de?'Du reagierst stark auf sofortige Chancen. Ein längerer Zeithorizont wäre dein wertvollster nächster Schritt.':'You respond strongly to immediate opportunities. A longer time horizon would be your most valuable next step.'},
      reactor:{icon:'\uD83C\uDF0A',name:de?'Der Reaktor':'The Reactor',desc:de?'Deine Entscheidungen verschieben sich mit den Ereignissen. Ein schriftlicher Plan würde dir in Druckmomenten sehr helfen.':'Your decisions shift with events. A written plan would help you greatly in moments of pressure.'}
    };
    let key;
    if (s.reactionToNoise>70 && s.greedFomo>60) key='reactor';
    else if (s.patience<36 && s.greedFomo>62) key='sprinter';
    else if (s.riskPreference<36 && s.lossAversion>64) key='guardian';
    else if (s.riskPreference>68 && s.greedFomo>58) key='challenger';
    else if (s.patience>62 && s.reactionToNoise<42 && s.resilience>62) key='strategist';
    else key='explorer';
    return Object.assign({key:key},P[key]);
  }

  _contextNote(ctx,de) {
    // saule is now a multi-select array (a person can have GRV + bAV + Pillar 3
    // at once). For this single note, pick the most information-rich pillar
    // present rather than failing to match on an array key.
    const arr = Array.isArray(ctx.saule) ? ctx.saule : (ctx.saule ? [ctx.saule] : []);
    let s = 'unsure';
    if (arr.includes('s3')) s='s3';
    else if (arr.includes('bav')) s='bav';
    else if (arr.includes('grv')) s='grv';
    const y=ctx.years||'30plus';
    const EN={
      grv:{under15:'Your retirement rests mainly on the state pension with limited time remaining. Your instinct to protect makes sense here — the question is whether current reserves are enough.',
           '15-30':'You rely mainly on the state pension with a moderate horizon. Your profile can guide how much growth to pursue in the years ahead.',
           '30plus':'With the state pension and a long horizon, there is time for growth-oriented decisions to recover from setbacks.'},
      bav:{under15:'Employer programs give you a base of stability with limited time left. Consider whether private reserves should supplement them.',
           '15-30':'Employer programs plus a moderate horizon give you flexibility. Your profile shows how to use it well.',
           '30plus':'Employer support and a long horizon position you well. Your natural style has room to work.'},
      s3:{under15:'Private reserves give you flexibility many lack. With limited time, protecting what is built matters most.',
          '15-30':'Private reserves and a moderate horizon. Your profile shows how you respond under pressure — use that insight.',
          '30plus':'Private reserves and a long horizon. Your behavioural profile is especially useful — you have time to adjust.'},
      unsure:{under15:'Your pension structure is still unclear. With limited time, understanding what you already have is the important next step.',
              '15-30':'Understanding your pension structure will help you use the remaining years well.',
              '30plus':'With many years ahead, there is time to understand and strengthen your pension structure.'}
    };
    const DE={
      grv:{under15:'Deine Rente stützt sich hauptsächlich auf die GRV bei begrenzter Zeit. Dein Schutzinstinkt ist verständlich — die Frage ist, ob die Reserven reichen.',
           '15-30':'Du stützt dich auf die GRV mit einem moderaten Horizont. Dein Profil kann leiten, wie viel Wachstum du anstrebst.',
           '30plus':'Mit GRV und langem Horizont ist Zeit, dass wachstumsorientierte Entscheidungen sich erholen.'},
      bav:{under15:'Arbeitgeberprogramme geben Stabilität bei begrenzter Zeit. Überlege, ob private Reserven ergänzen sollten.',
           '15-30':'Arbeitgeberprogramme plus moderater Horizont geben Flexibilität. Dein Profil zeigt, wie du sie nutzt.',
           '30plus':'Arbeitgeberunterstützung und langer Horizont positionieren dich gut.'},
      s3:{under15:'Private Reserven geben dir Flexibilität. Bei begrenzter Zeit zählt der Schutz des Aufgebauten.',
          '15-30':'Private Reserven und moderater Horizont. Dein Profil zeigt, wie du unter Druck reagierst.',
          '30plus':'Private Reserven und langer Horizont. Dein Profil ist besonders wertvoll — du hast Zeit anzupassen.'},
      unsure:{under15:'Deine Rentenstruktur ist unklar. Bei begrenzter Zeit ist Verstehen der wichtigste nächste Schritt.',
              '15-30':'Deine Rentenstruktur zu verstehen hilft, die verbleibenden Jahre gut zu nutzen.',
              '30plus':'Mit vielen Jahren voraus ist Zeit, deine Rentenstruktur zu verstehen und zu stärken.'}
    };
    const T=de?DE:EN;
    return (T[s]&&T[s][y])||T.unsure['30plus'];
  }

  update() {
    if(!this.stars||!this.starGfx) return;
    this.starGfx.clear();
    this.stars.forEach(s=>{
      s.p+=0.02;
      this.starGfx.fillStyle(0xffffff,0.12+0.22*Math.sin(s.p));
      this.starGfx.fillCircle(s.x,s.y,s.r);
    });
  }
}
