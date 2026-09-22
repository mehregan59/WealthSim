/* Session summary screen.
 *
 * Renders WS.Summary output and nothing else. It never computes a score of
 * its own, so what is shown can always be traced to recorded events.
 * Nothing is hover-only: every explanation is printed inline, so it works on
 * touch and keyboard. Colours are neutral — no dimension is shown as
 * "good" or "bad".
 */
class ProfileScene extends Phaser.Scene {
  constructor(){ super({ key:'ProfileScene' }); }

  create(data) {
    this.W = this.scale.width; this.H = this.scale.height;
    this.S = Math.max(0.9, Math.min(1.9, this.H / 720));
    this.de = (typeof currentLang!=='undefined' && currentLang==='de');
    this.stats = (data && data.stats) || null;

    const WS = window.WS || {};
    const decisions = (typeof ScoringEngine!=='undefined') ? ScoringEngine.decisions : [];
    const answers   = (typeof ScoringEngine!=='undefined') ? ScoringEngine.startingAnswers : [];

    if (!WS.Summary || !WS.Adapter) {
      this.summary = null;
      console.error('[WealthSim] core modules not loaded — summary unavailable');
    } else {
      this.events  = WS.Adapter.toEvents(decisions);
      this.summary = WS.Summary.build(this.events, WS.Adapter.toStated(answers), { units:6, districts:4, lang:this.de?'de':'en' });
      this.label   = WS.Summary.optionalLabel(this.summary);
      if (this.summary.unsupported.length)
        console.warn('[WealthSim] Unsupported actions (not scored):', this.summary.unsupported);
      console.log('[WealthSim] Session summary:', JSON.stringify(this.summary, null, 2));
    }

    this._bg();
    this._curtainDrop();
  }
  s(v){ return Math.round(v * this.S); }

  _bg() {
    const g = this.add.graphics().setDepth(-5);
    g.fillStyle(0x061019,1); g.fillRect(0,0,this.W,this.H);
  }

  // ── Curtain drop (Natural Instincts copy) ────────────────────────
  _curtainDrop() {
    const W=this.W, H=this.H, de=this.de;
    const lines = de ? [
      'Sieh dir die Stadt an, die du gebaut hast.',
      'Du hast den Boom navigiert, den Sturm überstanden und Entscheidungen\ngetroffen, die deine Bürger vorangebracht haben.',
      'Jede Entscheidung hat gezeigt, wie du in diesen Situationen\ngeplant und reagiert hast.'
    ] : [
      'Take a look at the city you\u2019ve built.',
      'You navigated the boom, weathered the storm, and made choices\nto keep your citizens moving forward.',
      'Every decision showed how you planned and responded\nin these particular situations.'
    ];
    const objs=[];
    lines.forEach((txt,i)=>{
      const t=this.add.text(W/2, H/2-this.s(76)+i*this.s(70), txt, {
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
      ? 'Hier ist, was in dieser Sitzung tatsächlich passiert ist.'
      : 'Here is what actually happened in this session.', {
      fontFamily:'Inter, Arial, sans-serif', fontSize:this.s(16), color:'#96b0c8', fontStyle:'italic'
    }).setOrigin(0.5).setDepth(100).setAlpha(0);
    this.tweens.add({targets:trans,alpha:1,duration:1300,delay:totalIn+700});

    const go=()=>{ objs.forEach(o=>{try{o.destroy();}catch(e){}}); try{trans.destroy();}catch(e){}
                   try{skip.destroy();}catch(e){} this._dashboard(); };
    this.curtainTimer=this.time.delayedCall(totalIn+3800,()=>{
      this.tweens.add({targets:objs.concat([trans]),alpha:0,duration:1200,onComplete:go});
    });
    const skip=this.add.text(W-this.s(30),H-this.s(26),de?'Überspringen \u203A':'Skip \u203A',{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(14),color:'#6b8fb0'
    }).setOrigin(1,0.5).setDepth(120).setInteractive({useHandCursor:true});
    skip.on('pointerdown',()=>{ this.tweens.killAll(); if(this.curtainTimer)this.curtainTimer.remove(); go(); });
    this.input.keyboard.once('keydown-SPACE',()=>{ this.tweens.killAll(); if(this.curtainTimer)this.curtainTimer.remove(); go(); });
  }

  // ── Scrollable dashboard ─────────────────────────────────────────
  _dashboard() {
    const W=this.W, H=this.H, de=this.de;
    this.colW = Math.min(this.s(780), W-this.s(80));
    this.left = (W-this.colW)/2;

    const headH=this.s(64);
    const hb=this.add.graphics().setDepth(50);
    hb.fillStyle(0x061019,1); hb.fillRect(0,0,W,headH);
    hb.lineStyle(1,0x1e3350,1); hb.lineBetween(0,headH,W,headH);
    this.add.text(W/2,headH/2, de?'Deine Sitzung im Überblick':'Your session summary',{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(26),color:'#e2a840'
    }).setOrigin(0.5).setDepth(51);
    this.add.text(W-this.s(20),headH/2, de?'Scrollen ↕':'Scroll ↕',{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(11),color:'#456a8c'
    }).setOrigin(1,0.5).setDepth(51);

    this.content=this.add.container(0,0).setDepth(10);
    this.y = headH + this.s(26);

    if (!this.summary) {
      this._p(de?'Die Auswertung konnte nicht geladen werden.':'The session summary could not be loaded.');
      this._finishScroll(headH); return;
    }
    const sm=this.summary;

    // 1. City outcome — city indicators, not an investor score
    this._h(de?'Deine Stadt am Ende':'Your city at the end');
    if (this.stats) {
      this._p((de?'Zufriedenheit ':'Happiness ')+Math.round(this.stats.happiness)+
              '   ·   '+(de?'Entwicklung ':'Development ')+Math.round(this.stats.development)+
              '   ·   '+(de?'Mittel ':'Funds ')+Math.round(this.stats.resources));
    }
    this._note(de?'Das sind Stadtindikatoren aus dieser Sitzung, keine Bewertung deiner Entscheidungen.'
                 :'These are city indicators from this session, not a grade of your decisions.');

    // 2. What you actually did
    this._h(de?'Was du tatsächlich getan hast':'What you actually did');
    sm.did.forEach(d=>{
      this._bullet(d.text);
      if (d.constraint) this._note(d.constraint, this.s(22));
    });

    // 3. Patterns with coverage
    this._h(de?'Muster in dieser Sitzung':'Patterns in this session');
    this._note(de?'Die Kennzeichnung zeigt, wie viele Beobachtungen vorliegen — nicht, wie sicher eine Aussage ist.'
                 :'The tag shows how many observations exist — it is not a confidence level.');
    const EXPLAIN = this._explain(de);
    sm.patterns.forEach(p=>{
      this._patternRow(p.label, this._chipText(p.coverage,p.n,de), p.text, EXPLAIN[p.dimension]);
    });

    // 4. Interpretation — only beyond single observations, always with an alternative
    const deeper = sm.readings.filter(r=>r.kind!=='single');
    if (deeper.length) {
      this._h(de?'Was das bedeuten könnte':'What this may mean');
      deeper.forEach(r=>{
        this._bullet(r.claim);
        this._note((de?'Andere Erklärung: ':'Another explanation: ')+r.alternative, this.s(22));
      });
    }

    // 5. Stated vs observed — side by side, never blended
    if (sm.comparison.length) {
      this._h(de?'Was du gesagt hast und was du getan hast':'What you said and what you did');
      sm.comparison.forEach(c=>{
        this._bullet(c.label+':  '+(de?'gesagt ':'said ')+'"'+c.stated+'"  ·  '+
                     (de?'beobachtet ':'observed ')+c.observed.join(', ').replace(/_/g,' '));
        this._note(c.note, this.s(22));
      });
    }

    // 6. Concentration, shown as shares
    if (sm.concentration.available) {
      this._h(de?'Deine Aufteilung':'Your allocation');
      const sh=sm.concentration.shares;
      this._p(Object.keys(sh).map(k=>k.charAt(0).toUpperCase()+k.slice(1)+' '+Math.round(sh[k]*100)+'%').join('   ·   '));
      this._note((de?'Gleichmäßigste mögliche Aufteilung von 6 Einheiten: ':'Evenest possible split of 6 units: ')+
                 sm.concentration.evenestFeasible.join(' / ')+'.  '+
                 (de?'Konzentration ist kein Fehler an sich; sie verändert, wie stark ein einzelner Schock wirkt.'
                    :'Concentration is not an error in itself; it changes how much a single shock affects you.'));
    }

    // 7. Next steps — each tied to existing evidence; omitted if none
    if (sm.nextSteps.length) {
      this._h(de?'Einen Versuch wert':'Worth trying next');
      sm.nextSteps.forEach(n=>this._bullet(n));
    }

    // 8. Optional overall style — usually unavailable, and that is correct
    this._h(de?'Gesamtstil':'Overall style');
    if (this.label && this.label.available) {
      this._p(this.label.traits.join('  ·  '));
      this._note(this.label.note);
    } else {
      this._p(this.label ? this.label.reason : '—');
      this._note(de?'Die meisten einzelnen Sitzungen reichen für keinen Gesamtstil. Das ist beabsichtigt.'
                   :'Most single sessions are not enough for an overall style. That is intentional.');
    }

    // 9. Pension context — general information only, no adequacy inference
    this._h(de?'Zum deutschen Rentensystem':'About the German pension system');
    this._p(this._pensionNote(de));

    // 10. Limits
    this._h(de?'Über diese Auswertung':'About this summary');
    this._p(sm.disclaimer);
    this._note(de ? 'Die Szenarien sind von Forschung zu Risikoentscheidungen, Zeitpräferenz, Verlustrealisierung und Prognosegenauigkeit inspiriert. Keine dieser Studien validiert die Werte dieses Spiels.'
                  : 'The scenarios are inspired by research on risk choices, time preference, realising losses, and forecast accuracy. None of those studies validates this game\u2019s results.');

    this._playAgain();
    this._finishScroll(headH);
  }

  // ── Layout helpers ───────────────────────────────────────────────
  _add(o){ this.content.add(o); return o; }
  _h(text){
    this.y += this.s(18);
    const t=this._add(this.add.text(this.left,this.y,text,{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(20),color:'#e2a840'}));
    this.y += t.height + this.s(4);
    const l=this._add(this.add.graphics());
    l.lineStyle(1,0x1e3350,1); l.lineBetween(this.left,this.y,this.left+this.colW,this.y);
    this.y += this.s(10);
  }
  _p(text){
    const t=this._add(this.add.text(this.left,this.y,text,{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(15),color:'#d4e2f0',
      wordWrap:{width:this.colW},lineSpacing:this.s(5)}));
    this.y += t.height + this.s(8);
  }
  _note(text, indent){
    indent=indent||0;
    const t=this._add(this.add.text(this.left+indent,this.y,text,{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(13),color:'#7d97b3',fontStyle:'italic',
      wordWrap:{width:this.colW-indent},lineSpacing:this.s(4)}));
    this.y += t.height + this.s(8);
  }
  _bullet(text){
    const d=this._add(this.add.text(this.left,this.y,'•',{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(15),color:'#5c8ab0'}));
    const t=this._add(this.add.text(this.left+this.s(18),this.y,text,{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(15),color:'#d4e2f0',
      wordWrap:{width:this.colW-this.s(18)},lineSpacing:this.s(5)}));
    this.y += t.height + this.s(6);
  }
  _patternRow(label, chip, text, explain){
    const lab=this._add(this.add.text(this.left,this.y,label,{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(15),color:'#e8f2ff',fontStyle:'600'}));
    // Neutral chip — same colour for every coverage level
    const ct=this.add.text(0,0,chip,{fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(11),color:'#b8cde0'});
    const cw=ct.width+this.s(16), ch=ct.height+this.s(6);
    const cx=this.left+this.colW-cw, cy=this.y;
    const cg=this._add(this.add.graphics());
    cg.fillStyle(0x152744,1); cg.fillRoundedRect(cx,cy,cw,ch,ch/2);
    cg.lineStyle(1,0x33557a,1); cg.strokeRoundedRect(cx,cy,cw,ch,ch/2);
    ct.setPosition(cx+this.s(8),cy+this.s(3)); this._add(ct);
    this.y += Math.max(lab.height,ch) + this.s(4);
    if (explain) this._note(explain);
    const t=this._add(this.add.text(this.left,this.y,text,{
      fontFamily:'Inter, Arial, sans-serif',fontSize:this.s(14),color:'#a8c0d8',
      wordWrap:{width:this.colW}}));
    this.y += t.height + this.s(14);
  }
  _chipText(cov,n,de){
    const EN={insufficient:'Not enough evidence',single:'1 decision',limited:'2 decisions',repeated:n+' decisions — repeated',mixed:n+' decisions — mixed'};
    const DE={insufficient:'Zu wenig Daten',single:'1 Entscheidung',limited:'2 Entscheidungen',repeated:n+' Entscheidungen — wiederholt',mixed:n+' Entscheidungen — gemischt'};
    return (de?DE:EN)[cov]||cov;
  }
  _explain(de){
    return de ? {
      risk_choices:'Ob du Optionen mit breiterer oder engerer Spanne möglicher Ergebnisse gewählt hast.',
      response_to_setbacks:'Was du getan hast, nachdem ein Projekt an Wert verloren hatte.',
      allocation_concentration:'Wie gleichmäßig du neue Mittel auf die Stadtteile verteilt hast.',
      timing_choices:'Ob du einen Nutzen jetzt oder einen größeren später gewählt hast.',
      response_to_rising_prices:'Was du getan hast, während ein Stadtteil schnell stieg.',
      response_to_social_cues:'Was du nach lauten Schlagzeilen getan hast.',
      response_during_downturns:'Was du während eines allgemeinen Abschwungs getan hast.',
      response_to_outside_offers:'Wie du auf ein Angebot einer Nachbarstadt reagiert hast.',
      response_to_past_gains_and_losses:'Ob frühere Gewinne oder Verluste deine Verkaufsentscheidung beeinflusst haben.',
      use_of_forward_prospects:'Welche Position du verkauft hast, als sich die Zukunftsaussichten tatsächlich unterschieden.'
    } : {
      risk_choices:'Whether you picked options with a wider or narrower range of possible outcomes.',
      response_to_setbacks:'What you did after a project lost value.',
      allocation_concentration:'How evenly you spread new funding across districts.',
      timing_choices:'Whether you took a benefit now or a larger one later.',
      response_to_rising_prices:'What you did while one district was rising quickly.',
      response_to_social_cues:'What you did after loud headlines.',
      response_during_downturns:'What you did during a city-wide downturn.',
      response_to_outside_offers:'How you responded to an offer from a neighbouring city.',
      response_to_past_gains_and_losses:'Whether past gains or losses shaped which holding you sold.',
      use_of_forward_prospects:'Which holding you sold when future prospects genuinely differed.'
    };
  }

  // General information only. Never infers adequacy, protectiveness or
  // which pillar "dominates" from the player's answers.
  _pensionNote(de){
    return de
      ? 'In Deutschland beruht die Altersvorsorge meist auf drei Säulen: der gesetzlichen Rentenversicherung (GRV), der betrieblichen Altersvorsorge (bAV) und privater Vorsorge. Wie gut diese im Einzelfall zusammenpassen, lässt sich aus einem Spiel nicht ableiten — dafür sind die eigene Renteninformation und gegebenenfalls eine unabhängige Beratung die richtigen Quellen.'
      : 'Retirement provision in Germany usually rests on three pillars: the statutory pension (GRV), workplace pensions (bAV), and private provision. How well these fit together for any one person cannot be worked out from a game — your own annual pension statement and, where useful, independent advice are the right sources for that.';
  }

  _playAgain(){
    this.y += this.s(20);
    const bW=this.s(220), bH=this.s(48), bx=this.W/2-bW/2, by=this.y;
    const g=this._add(this.add.graphics());
    g.fillStyle(0xe2a840,1); g.fillRoundedRect(bx,by,bW,bH,this.s(11));
    this._add(this.add.text(this.W/2,by+bH/2,this.de?'Nochmal spielen':'Play again',{
      fontFamily:'Playfair Display, Georgia, serif',fontSize:this.s(18),color:'#0b1725',fontStyle:'700'
    }).setOrigin(0.5));
    const hit=this._add(this.add.rectangle(this.W/2,by+bH/2,bW,bH,0xffffff,0).setInteractive({useHandCursor:true}));
    hit.on('pointerup',()=>{ if(this._dragged) return;
      if(typeof ScoringEngine!=='undefined') ScoringEngine.reset();
      this.scene.start('PlayerSetup'); });
    this.y += bH + this.s(40);
  }

  // Mouse wheel, drag/touch and keyboard scrolling
  _finishScroll(top){
    const viewH=this.H-top;
    const maskG=this.make.graphics({x:0,y:0,add:false});
    maskG.fillStyle(0xffffff); maskG.fillRect(0,top,this.W,viewH);
    this.content.setMask(maskG.createGeometryMask());
    const minY=Math.min(0, this.H - this.y);
    const clamp=v=>Math.max(minY, Math.min(0,v));
    const by=d=>{ this.content.y=clamp(this.content.y-d); };

    this.input.on('wheel',(p,o,dx,dy)=>by(dy));
    let startY=null, startC=0;
    this._dragged=false;
    this.input.on('pointerdown',p=>{ startY=p.y; startC=this.content.y; this._dragged=false; });
    this.input.on('pointermove',p=>{
      if(startY===null||!p.isDown) return;
      const d=p.y-startY;
      if(Math.abs(d)>6) this._dragged=true;
      this.content.y=clamp(startC+d);
    });
    this.input.on('pointerup',()=>{ startY=null; });
    const k=this.input.keyboard;
    k.on('keydown-DOWN',()=>by(this.s(60)));  k.on('keydown-UP',()=>by(-this.s(60)));
    k.on('keydown-PAGE_DOWN',()=>by(viewH*0.85)); k.on('keydown-PAGE_UP',()=>by(-viewH*0.85));
    k.on('keydown-HOME',()=>{this.content.y=0;}); k.on('keydown-END',()=>{this.content.y=minY;});
  }
}
