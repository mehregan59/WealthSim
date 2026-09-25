// Level tutorials plus a longer welcome briefing shown before the questions.
class Tutorial {
  constructor(scene){ this.scene=scene; this.S=scene.S||1; this.card=null; }
  s(v){ return Math.round(v*this.S); }

  static copy(level, de) {
    // Copy is deliberately concrete about *how* to interact (drag, tap,
    // where things appear) rather than assuming the player already knows
    // the controls.
    const EN = {
      1:{t:'How to play',        b:'Four districts sit in front of you — together they make up your city. Tap directly on the one you want to build first to select it and start construction there.\nThere is no wrong answer — pick what feels right.'},
      2:{t:'Something changed',  b:'A district lost value. Read what happened, then tap one of the options at the bottom of the screen to decide how the city responds.\nHover any district to see what it represents.'},
      3:{t:'Spread or focus',    b:'Six glowing cubes of funding will appear near the bottom-left of the screen. Drag each one — press, hold, and move it — onto any district to invest there. You must place all six before you can continue.\nWatch the DISTRICT PERFORMANCE list on the left panel — it shows how each district is doing as you go.'},
      4:{t:'Now or later',       b:'Two buildings are shown at the bottom of the screen. Tap the one you want to build. One choice pays off immediately; the other pays off much later.\nWhichever you pick will matter again before the game ends.'},
      5:{t:'Everyone is excited',b:'One district is booming and headlines are scrolling across the top of the screen.\nTap one of the four responses at the bottom to decide whether to follow the crowd or hold your position.'},
      6:{t:'A visitor arrives',  b:'A delegation is driving in from a neighbouring city carrying an offer of investment.\nYou can tap Research first to learn more — that costs nothing, and you still choose afterwards from the same options.'},
      7:{t:'Loud headlines',     b:'Reports are scrolling across the top of the screen. Tapping Read report is free and costs you nothing.\nAfter reading, you still tap one of the other options to decide what the city actually does.'},
      8:{t:'The storm',          b:'Every district is hit — you cannot prevent it. Once it passes, tap one of the response options at the bottom of the screen to decide what mattered most to protect.'},
      9:{t:'The project review',  b:'Two investment projects are shown side by side. Both carry uncertainty — one has performed better so far, the other has not. Tap the one you want to sell.\n\nYou will see ten pairs. Your pattern across all ten matters more than any single choice.'},
     10:{t:'Forecasts and practice',b:'A short round of practice decisions. Each one shows you a scenario — tap the option that feels right.\n\nAfterwards, a chart shows how the city’s main indicators moved across all ten chapters.'}
    };
    const DE = {
      1:{t:'So wird gespielt',   b:'Vier Stadtteile liegen vor dir — zusammen bilden sie deine Stadt. Tippe direkt auf den, den du zuerst bauen willst, um ihn auszuwählen.\nEs gibt keine falsche Antwort.'},
      2:{t:'Etwas hat sich geändert',b:'Ein Stadtteil hat an Wert verloren. Tippe unten auf eine der Optionen, um zu entscheiden, wie die Stadt reagiert.'},
      3:{t:'Streuen oder bündeln',b:'Sechs leuchtende Würfel erscheinen unten links. Ziehe jeden einzeln — drücken, halten, bewegen — auf einen Stadtteil. Alle sechs müssen platziert werden, bevor es weitergeht.\nDie Leiste links zeigt, wie jeder Stadtteil sich entwickelt.'},
      4:{t:'Jetzt oder später',b:'Zwei Gebäude stehen unten zur Auswahl. Tippe auf das, das du bauen willst. Eine Wahl zahlt sich sofort aus, die andere viel später.'},
      5:{t:'Alle sind begeistert',b:'Ein Stadtteil boomt und Schlagzeilen laufen oben über den Bildschirm.\nTippe unten auf eine der vier Optionen — folgst du der Menge oder hältst du deine Position?'},
      6:{t:'Besuch kommt an',    b:'Eine Delegation bringt ein Investitionsangebot aus einer Nachbarstadt.\nTippe auf Nachfragen, um kostenlos mehr zu erfahren — du entscheidest danach trotzdem aus denselben Optionen.'},
      7:{t:'Laute Schlagzeilen', b:'Berichte laufen oben über den Bildschirm. Den Bericht zu lesen ist kostenlos.\nDanach tippst du trotzdem auf eine der anderen Optionen, um zu entscheiden, was die Stadt tut.'},
      8:{t:'Der Sturm',          b:'Jeder Stadtteil wird getroffen — du kannst es nicht verhindern. Danach tippst du unten auf eine Option, um zu entscheiden, was dir am wichtigsten war zu schützen.'},
      9:{t:'Projektüberprüfung',      b:'Zwei Investitionsprojekte werden nebeneinander gezeigt. Tippe auf das, das du verkaufen möchtest.\n\nDu siehst zehn Paare. Dein Muster über alle zehn ist wichtiger als jede einzelne Entscheidung.'},
     10:{t:'Prognosen & Übung',       b:'Eine kurze Runde Übungsentscheidungen. Jede zeigt dir ein Szenario — tippe die Option, die sich richtig anfühlt.\n\nDanach zeigt ein Diagramm, wie sich die Kennzahlen der Stadt über alle zehn Kapitel entwickelt haben.'}
    };
    return (de?DE:EN)[level] || null;
  }

  // Multi-page welcome briefing shown before the onboarding questions.
  // Deliberately: (1) makes clear the city being built is a game city, not
  // the player's real-life city or town, and (2) never states that choices
  // are being scored, assessed, or used to reveal anything about the
  // player — it invites curiosity about the ending without explaining why
  // that ending matters, since knowing you're being measured changes how
  // you play.
  static briefing(de) {
    if (de) return [
      {t:'Willkommen',
       b:'Dir wurde gerade eine wachsende Stadt übergeben — nicht die Stadt, in der du lebst, sondern eine neue, die vollständig durch deine Entscheidungen hier entsteht.\n\nJeder Stadtteil, jede Baustelle, jede Wahl gehört dir.'},
      {t:'Ein paar kurze Fragen',
       b:'Gleich stellen wir dir ein paar kurze Fragen zu dir. Sie verändern das Spiel nicht — sie helfen uns nur, das, was du am Ende siehst, etwas persönlicher zu machen.'},
      {t:'Deine Seitenleiste',
       b:'Links siehst du immer den Zustand deiner Stadt: Zufriedenheit, Wachstum und Mittel.\n\nDarunter zeigt ein Diagramm, wie sich diese Werte über die Level entwickeln, und eine Leiste, wie gut jeder einzelne Stadtteil läuft. Schau jederzeit hinein.'},
      {t:'Ein Hinweis zur Zeit',
       b:'In einigen Leveln beginnen Ereignisse zu laufen, sobald sie erscheinen — Nachrichten scrollen, ein Sturm zieht auf.\n\nEs gibt keinen Countdown. Nimm dir die Zeit, die du brauchst.'},
      {t:'Bleib dran',
       b:'Jede Entscheidung baut auf der vorherigen auf. Bleib bis zum letzten Kapitel dabei — am Ende wartet ein Blick auf die Stadt, die du gebaut hast.'}
    ];
    return [
      {t:'Welcome',
       b:'You’ve just been handed a growing city — not the city you live in, but a new one, built entirely through the choices you make here.\n\nEvery district, every building site, every decision belongs to you.'},
      {t:'A few quick questions',
       b:'In a moment we’ll ask a few short questions about you. They don’t change the game — they just help make what you see at the end a little more personal.'},
      {t:'Your side panel',
       b:'The panel on the left always shows the state of your city: happiness, growth and funds.\n\nBelow that, a chart tracks how those move across levels, and a performance list shows how each individual district is doing. Check it any time.'},
      {t:'A note about timing',
       b:'In some levels events start running the moment they appear — headlines scroll, a storm rolls in.\n\nThere is no countdown. Take whatever time you need to decide.'},
      {t:'Stick with it',
       b:'Every decision builds on the last one. Stay with it through the final chapter — there’s a look back at the city you built waiting at the end.'}
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
        de?(idx>=pages.length?'Los geht’s':'Weiter'):(idx>=pages.length?'Start':'Next'),
        step, true, false);
    };
    step();
  }

  show(level, onClose) {
    // A player who already knows the game can permanently hide these
    // per-level cards via the "Skip guides" link on any card. That choice
    // persists for the rest of this playthrough.
    if (Tutorial.skipAll) { if(onClose) onClose(); return; }
    const de=(typeof currentLang!=='undefined'&&currentLang==='de');
    const c=Tutorial.copy(level,de);
    if(!c){ if(onClose) onClose(); return; }
    const hint = de ? '\n\nTippe auf Weiter, um diese Anleitung zu schließen und zu beginnen.'
                     : '\n\nTap Continue to close this guide and begin.';
    this._render(c.t, c.b + hint, 0, 0, de?'Weiter →':'Continue →', onClose, false, true);
  }

  _render(titleTxt, bodyTxt, page, pages, btnLabel, onClose, centred, showSkipLink) {
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

    // "Skip guides" — lets a returning player hide every future per-level
    // card for the rest of this playthrough. Only shown on per-level cards,
    // never on the welcome briefing.
    if(showSkipLink){
      const de=(typeof currentLang!=='undefined'&&currentLang==='de');
      const skipTxt=this.scene.add.text(bx+bw-this.s(14), by+this.s(14),
        de?'Anleitungen ausblenden ✕':'Skip guides ✕', {
        fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(11), color:'#4a6a8c'
      }).setOrigin(1,0).setDepth(133).setInteractive({useHandCursor:true});
      skipTxt.on('pointerover',()=>skipTxt.setColor('#8aaacc'));
      skipTxt.on('pointerout', ()=>skipTxt.setColor('#4a6a8c'));
      skipTxt.on('pointerdown',()=>{ Tutorial.skipAll=true; this.hide(); if(onClose) onClose(); });
      extras.push(skipTxt);
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
Tutorial.skipAll = false;
