// Level tutorials plus a longer welcome briefing shown before the questions.
class Tutorial {
  constructor(scene){ this.scene=scene; this.S=scene.S||1; this.card=null; }
  s(v){ return Math.round(v*this.S); }

  static copy(level, de) {
    const EN = {
      1:{t:'How to play',        b:'Four districts sit in front of you. Tap the one you want to build first.\nThere is no wrong answer \u2014 pick what feels right.'},
      2:{t:'Something changed',  b:'A district lost value. Read what happened, then choose how the city reacts.\nHover any district to see what it represents.'},
      3:{t:'Spread or focus',    b:'Drag every glowing cube onto a district. All six must be placed.\nWatch the DISTRICT PERFORMANCE panel on the left \u2014 it shows how each one is doing.'},
      4:{t:'Now or later',       b:'One choice pays off immediately. The other pays off much later.\nWhichever you pick will matter again before the game ends.'},
      5:{t:'Everyone is excited',b:'One district is booming and the news is loud.\nDecide whether to follow the crowd or hold your position.'},
      6:{t:'A visitor arrives',  b:'A delegation is driving in from a neighbouring city carrying investment.\nYou can research first \u2014 that is free, and you still decide afterwards.'},
      7:{t:'Loud headlines',     b:'Reading the full report is free and costs you nothing.\nAfter reading you still choose what the city actually does.'},
      8:{t:'The storm',          b:'Every city is hit \u2014 you cannot prevent it.\nDecide what matters most to protect while it passes.'}
    };
    const DE = {
      1:{t:'So wird gespielt',   b:'Vier Stadtteile liegen vor dir. Tippe den an, den du zuerst bauen willst.\nEs gibt keine falsche Antwort.'},
      2:{t:'Etwas hat sich ge\u00e4ndert',b:'Ein Stadtteil hat an Wert verloren. Entscheide, wie die Stadt reagiert.'},
      3:{t:'Streuen oder b\u00fcndeln',b:'Ziehe jeden W\u00fcrfel auf einen Stadtteil. Alle sechs m\u00fcssen platziert werden.\nDie Leiste links zeigt, wie jeder Stadtteil sich entwickelt.'},
      4:{t:'Jetzt oder sp\u00e4ter',b:'Eine Wahl zahlt sich sofort aus, die andere viel sp\u00e4ter.'},
      5:{t:'Alle sind begeistert',b:'Ein Stadtteil boomt und die Nachrichten sind laut.\nFolgst du der Menge oder h\u00e4ltst du deine Position?'},
      6:{t:'Besuch kommt an',    b:'Eine Delegation bringt Investitionen aus einer Nachbarstadt.\nNachfragen ist kostenlos \u2014 du entscheidest danach trotzdem.'},
      7:{t:'Laute Schlagzeilen', b:'Den Bericht zu lesen ist kostenlos.\nDanach entscheidest du trotzdem, was die Stadt tut.'},
      8:{t:'Der Sturm',          b:'Jede Stadt wird getroffen \u2014 du kannst es nicht verhindern.\nEntscheide, was du am dringendsten sch\u00fctzt.'}
    };
    return (de?DE:EN)[level] || null;
  }

  // Multi-page welcome briefing (used before the onboarding questions)
  static briefing(de) {
    if (de) return [
      {t:'Willkommen bei WealthSim',
       b:'Das ist kein Anlagespiel. Es ist eine Simulation deines Verhaltens.\n\nDu baust eine Stadt. Jede Entscheidung, die du triffst, zeigt still, wie du mit Unsicherheit, Warten, Verlusten und Chancen umgehst \u2014 genau die Instinkte, die auch beim Sparen f\u00fcr die Rente z\u00e4hlen.'},
      {t:'Warum wir zuerst fragen',
       b:'Gleich stellen wir dir ein paar kurze Fragen zu deinem Alter, deiner Arbeit und deiner Rentensituation.\n\nSie \u00e4ndern das Spiel nicht. Sie erlauben uns nur, dein Ergebnis am Ende auf deine echte Lage zu beziehen \u2014 GRV, bAV oder private Vorsorge.'},
      {t:'Deine Seitenleiste',
       b:'Links siehst du immer den Zustand deiner Stadt: Zufriedenheit, Wachstum und Mittel.\n\nDarunter zeigt ein Diagramm, wie sich diese Werte \u00fcber die Level entwickeln, und eine Leiste, wie gut jeder einzelne Stadtteil l\u00e4uft. Nutze sie \u2014 aber entscheide selbst.'},
      {t:'Ein Hinweis zur Zeit',
       b:'In einigen Leveln beginnen Ereignisse zu laufen, sobald sie erscheinen \u2014 Nachrichten scrollen, ein Sturm zieht auf.\n\nEs gibt keinen Countdown und du wirst nie bestraft. Aber wie schnell oder langsam du reagierst, ist Teil dessen, was gemessen wird.'}
    ];
    return [
      {t:'Welcome to WealthSim',
       b:'This is not an investment game. It is a simulation of your behaviour.\n\nYou will build a city. Every decision you make quietly reveals how you handle uncertainty, waiting, losses and opportunity \u2014 the same instincts that shape how people save for retirement.'},
      {t:'Why we ask questions first',
       b:'In a moment we will ask a few short questions about your age, your work and your pension situation.\n\nThey do not change the game at all. They only let us connect your result at the end to your real situation \u2014 GRV, bAV or private provision.'},
      {t:'Your side panel',
       b:'The panel on the left always shows the state of your city: happiness, growth and funds.\n\nBelow that, a chart tracks how those move across levels, and a performance list shows how each individual district is doing. Use it \u2014 but make your own call.'},
      {t:'A note about timing',
       b:'In some levels events start running the moment they appear \u2014 headlines scroll, a storm rolls in.\n\nThere is no countdown and you are never punished for taking your time. But how quickly or slowly you react is part of what is being measured.'}
    ];
  }

  showBriefing(onDone) {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const pages=Tutorial.briefing(de);
    let idx=0;
    const step=()=>{
      if(idx>=pages.length){ this.hide(); if(onDone) onDone(); return; }
      const p=pages[idx];
      idx++;
      this._render(p.t, p.b, idx, pages.length,
        de?(idx>=pages.length?'Los geht\u2019s':'Weiter'):(idx>=pages.length?'Start':'Next'),
        step, true);
    };
    step();
  }

  show(level, onClose) {
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const c=Tutorial.copy(level,de);
    if(!c){ if(onClose) onClose(); return; }
    // The button now reads "Continue" (matching every other Continue button
    // in the game) instead of "Got it" — some players didn't realize a
    // guide card was a modal they had to close to proceed. The body copy
    // also gets an explicit closing hint saying so.
    const hint = de ? '\n\nTippe auf Weiter, um diese Anleitung zu schlie\u00dfen und zu beginnen.'
                     : '\n\nTap Continue to close this guide and begin.';
    this._render(c.t, c.b + hint, 0, 0, de?'Weiter \u2192':'Continue \u2192', onClose, false);
  }

  _render(titleTxt, bodyTxt, page, pages, btnLabel, onClose, centred) {
    this.hide();
    const W=this.scene.scale.width, H=this.scene.scale.height;
    const panelL=this.scene.PANEL||0;
    const cx = centred ? W/2 : panelL+(W-panelL)/2;
    const bw = Math.min(this.s(centred?680:620), W-(centred?this.s(80):panelL+this.s(70)));

    const title=this.scene.add.text(0,0,titleTxt,{
      fontFamily:'Playfair Display, Georgia, serif', fontSize:this.s(centred?23:19), color:'#e2a840'
    }).setOrigin(0.5,0).setDepth(131);
    const body=this.scene.add.text(0,0,bodyTxt,{
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(centred?16:15), color:'#c8dcee',
      align:'center', lineSpacing:this.s(8), wordWrap:{width:bw-this.s(60)}
    }).setOrigin(0.5,0).setDepth(131);

    const pad=this.s(24);
    const bh=pad*2+title.height+this.s(12)+body.height+this.s(52);
    const bx=cx-bw/2, by=centred ? (H-bh)/2 : this.s(96);

    const bg=this.scene.add.graphics().setDepth(130);
    if(centred){ bg.fillStyle(0x040a14,0.72); bg.fillRect(0,0,W,H); }
    bg.fillStyle(0x08131f,0.98); bg.fillRoundedRect(bx,by,bw,bh,this.s(14));
    bg.lineStyle(1,0xe2a840,0.6);  bg.strokeRoundedRect(bx,by,bw,bh,this.s(14));
    bg.fillStyle(0xe2a840,0.9);    bg.fillRect(bx,by,bw,this.s(3));

    title.setPosition(cx,by+pad);
    body.setPosition(cx,by+pad+title.height+this.s(12));

    const extras=[];
    if(pages>1){
      for(let i=0;i<pages;i++){
        const dx=cx-((pages-1)*this.s(14))/2+i*this.s(14);
        const d=this.scene.add.graphics().setDepth(132);
        const on=(i===page-1);
        d.fillStyle(on?0xe2a840:0x2c4767,1); d.fillCircle(dx,by+bh-this.s(58),this.s(on?4:3));
        extras.push(d);
      }
    }

    const btnW=this.s(160), btnH=this.s(36);
    const btnY=by+bh-btnH-this.s(14), btnX=cx-btnW/2;
    const btn=this.scene.add.graphics().setDepth(131);
    const drawBtn=(hv)=>{ btn.clear(); btn.fillStyle(0xe2a840,hv?1:0.9); btn.fillRoundedRect(btnX,btnY,btnW,btnH,this.s(8)); };
    drawBtn(false);
    const btnTxt=this.scene.add.text(cx,btnY+btnH/2,btnLabel,{
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(15), color:'#0b1725', fontStyle:'700'
    }).setOrigin(0.5).setDepth(132);
    const hit=this.scene.add.rectangle(cx,btnY+btnH/2,btnW,btnH,0xffffff,0)
      .setDepth(133).setInteractive({useHandCursor:true});
    hit.on('pointerover',()=>drawBtn(true));
    hit.on('pointerout', ()=>drawBtn(false));
    hit.on('pointerdown',()=>{ this.hide(); if(onClose) onClose(); });

    this.card=this.scene.add.container(0,0).setDepth(130);
    this.card.add([bg,title,body,btn,btnTxt,hit].concat(extras));
    this.card.setAlpha(0);
    this.scene.tweens.add({targets:this.card,alpha:1,duration:420});
  }

  hide(){ if(this.card){ this.scene.tweens.killTweensOf(this.card); this.card.destroy(); this.card=null; } }
}
