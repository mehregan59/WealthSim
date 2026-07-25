// Short "how to play this level" card. One or two lines, dismissible.
class Tutorial {
  constructor(scene){ this.scene=scene; this.S=scene.S||1; this.card=null; }
  s(v){ return Math.round(v*this.S); }

  static copy(level, de) {
    const EN = {
      1:{t:'How to play',      b:'Four districts sit in front of you. Tap the one you want to build first.\nThere is no wrong answer \u2014 pick what feels right.'},
      2:{t:'Something changed',b:'A district lost value. Read what happened, then choose how the city reacts.\nHover any district to see what it represents.'},
      3:{t:'Spread or focus',  b:'Drag every glowing cube onto a district. You can put them all in one place\nor spread them out. All six must be placed before the year advances.'},
      4:{t:'Now or later',     b:'One choice pays off immediately. The other pays off much later.\nWhichever you pick will matter again before the game ends.'},
      5:{t:'Everyone is excited',b:'One district is booming and the news is loud.\nDecide whether to follow the crowd or hold your position.'},
      6:{t:'A visitor arrives', b:'A delegation is driving in from a neighbouring city with an offer.\nAccept it, build your own, decline, or ask for more information first.'},
      7:{t:'Loud headlines',   b:'Reading the full report is free and costs you nothing.\nAfter reading you still choose what the city actually does.'},
      8:{t:'The storm',        b:'Every city is hit \u2014 you cannot prevent it.\nDecide what matters most to protect while it passes.'}
    };
    const DE = {
      1:{t:'So wird gespielt', b:'Vier Stadtteile liegen vor dir. Tippe den an, den du zuerst bauen willst.\nEs gibt keine falsche Antwort.'},
      2:{t:'Etwas hat sich ge\u00e4ndert',b:'Ein Stadtteil hat an Wert verloren. Lies, was passiert ist,\nund entscheide, wie die Stadt reagiert.'},
      3:{t:'Streuen oder b\u00fcndeln',b:'Ziehe jeden leuchtenden W\u00fcrfel auf einen Stadtteil.\nAlle sechs m\u00fcssen platziert werden.'},
      4:{t:'Jetzt oder sp\u00e4ter', b:'Eine Wahl zahlt sich sofort aus, die andere viel sp\u00e4ter.\nBeides wird sp\u00e4ter noch einmal wichtig.'},
      5:{t:'Alle sind begeistert',b:'Ein Stadtteil boomt und die Nachrichten sind laut.\nFolgst du der Menge oder h\u00e4ltst du deine Position?'},
      6:{t:'Besuch kommt an',   b:'Eine Delegation aus einer Nachbarstadt kommt mit einem Angebot.\nAnnehmen, selbst bauen, ablehnen oder erst nachfragen.'},
      7:{t:'Laute Schlagzeilen',b:'Den Bericht zu lesen ist kostenlos.\nDanach entscheidest du trotzdem, was die Stadt tut.'},
      8:{t:'Der Sturm',         b:'Jede Stadt wird getroffen \u2014 du kannst es nicht verhindern.\nEntscheide, was du am dringendsten sch\u00fctzt.'}
    };
    return (de?DE:EN)[level] || null;
  }

  show(level, onClose) {
    this.hide();
    const de = (typeof currentLang!=='undefined' && currentLang==='de');
    const c = Tutorial.copy(level, de);
    if (!c) { if(onClose) onClose(); return; }

    const W=this.scene.scale.width;
    const panelL = this.scene.PANEL || 0;
    const cx = panelL + (W-panelL)/2;

    const bw = Math.min(this.s(620), W-panelL-this.s(70));
    const title = this.scene.add.text(0,0,c.t,{
      fontFamily:'Playfair Display, Georgia, serif', fontSize:this.s(19), color:'#e2a840'
    }).setOrigin(0.5,0).setDepth(131);
    const body = this.scene.add.text(0,0,c.b,{
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(15), color:'#c8dcee',
      align:'center', lineSpacing:this.s(7), wordWrap:{width:bw-this.s(56)}
    }).setOrigin(0.5,0).setDepth(131);

    const pad=this.s(20);
    const bh = pad*2 + title.height + this.s(10) + body.height + this.s(46);
    const bx = cx-bw/2, by = this.s(96);

    const bg=this.scene.add.graphics().setDepth(130);
    bg.fillStyle(0x08131f,0.97); bg.fillRoundedRect(bx,by,bw,bh,this.s(14));
    bg.lineStyle(1,0xe2a840,0.6);  bg.strokeRoundedRect(bx,by,bw,bh,this.s(14));
    bg.fillStyle(0xe2a840,0.9);    bg.fillRect(bx,by,bw,this.s(3));

    title.setPosition(cx, by+pad);
    body.setPosition(cx, by+pad+title.height+this.s(10));

    const btnW=this.s(150), btnH=this.s(34);
    const btnY=by+bh-btnH-this.s(14), btnX=cx-btnW/2;
    const btn=this.scene.add.graphics().setDepth(131);
    const drawBtn=(hv)=>{ btn.clear();
      btn.fillStyle(0xe2a840, hv?1:0.88); btn.fillRoundedRect(btnX,btnY,btnW,btnH,this.s(8)); };
    drawBtn(false);
    const btnTxt=this.scene.add.text(cx,btnY+btnH/2, de?'Verstanden':'Got it', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(14), color:'#0b1725', fontStyle:'700'
    }).setOrigin(0.5).setDepth(132);

    const hit=this.scene.add.rectangle(cx,btnY+btnH/2,btnW,btnH,0xffffff,0)
      .setDepth(133).setInteractive({useHandCursor:true});
    hit.on('pointerover',()=>drawBtn(true));
    hit.on('pointerout', ()=>drawBtn(false));
    hit.on('pointerdown',()=>{ this.hide(); if(onClose) onClose(); });

    this.card=this.scene.add.container(0,0).setDepth(130);
    this.card.add([bg,title,body,btn,btnTxt,hit]);
    this.card.setAlpha(0); this.card.y=-this.s(18);
    this.scene.tweens.add({targets:this.card,alpha:1,y:0,duration:450,ease:'Back.easeOut'});
  }

  hide(){
    if(this.card){ this.scene.tweens.killTweensOf(this.card); this.card.destroy(); this.card=null; }
  }
}
