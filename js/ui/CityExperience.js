/* Presentation only: native controls call existing chapter callbacks. */
class CityExperience {
  constructor(scene) {
    this.scene=scene; this.de=scene.de(); this.paused=false;
    this.root=this.el('div',null,'ws-experience');
    this.root.setAttribute('lang',this.de?'de':'en');
    document.body.append(this.root);
    this.toolbar=this.el('nav',null,'ws-toolbar',this.root);
    this.toolbar.setAttribute('aria-label',this.text('Game controls','Spielsteuerung'));
    this.status=this.el('div',null,'ws-status',this.root);
    this.panel=this.el('section',null,'ws-panel',this.root);
    this.panel.setAttribute('aria-label',this.text('Your next decision','Deine nächste Entscheidung'));
    this.help=this.el('aside',null,'ws-help',this.root); this.help.hidden=true;
    this.button(this.text('Help','Hilfe'),()=>this.showHelp(),this.toolbar);
    this.motion=this.button('',()=>{ scene.reducedMotion=!scene.reducedMotion; this.motionLabel(); },this.toolbar);
    this.motionLabel();
    this.button('A+',()=>{this.root.classList.toggle('ws-large');},this.toolbar);
    this.pause=this.button(this.text('Pause','Pause'),()=>this.setPaused(!this.paused),this.toolbar);
    scene.events.once('shutdown',()=>this.destroy());
  }
  text(en,de){return this.de?de:en;}
  el(tag,text,cls,parent){const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;if(parent)parent.append(n);return n;}
  button(text,fn,parent,cls){const b=this.el('button',text,cls,parent);b.type='button';b.addEventListener('click',fn);return b;}
  clear(){this.panel.replaceChildren();}
  motionLabel(){this.motion.textContent=this.text('Motion: ','Bewegung: ')+(this.scene.reducedMotion?this.text('off','aus'):this.text('on','an'));this.motion.setAttribute('aria-pressed',String(this.scene.reducedMotion));}
  setPaused(value){this.paused=value;this.scene.time.paused=value;this.scene.tweens.timeScale=value?0:1;this.scene.input.enabled=!value;this.panel.inert=value;this.pause.textContent=value?this.text('Resume','Weiter'):this.text('Pause','Pause');}
  welcome(start){
    this.clear();this.el('span',this.text('A city shaped by your choices','Eine Stadt, geprägt von deinen Entscheidungen'),'ws-kicker',this.panel);
    this.el('h1',this.text('A small city. A future to build.','Eine kleine Stadt. Eine Zukunft zum Gestalten.'),null,this.panel);
    this.el('p',this.text('Build, adapt and watch your neighbourhoods grow. Ten short chapters; no countdown.','Baue, passe dich an und sieh deine Viertel wachsen. Zehn kurze Kapitel, kein Countdown.'),null,this.panel);
    const label=this.el('label',this.text('City name (optional) ','Stadtname (optional) '),null,this.panel);const input=this.el('input',null,null,label);input.maxLength=32;input.placeholder=this.text('My Future City','Meine Zukunftsstadt');
    const actions=this.el('div',null,'ws-actions',this.panel);
    this.button(this.text('Start with background questions','Mit Hintergrundfragen starten'),()=>{window.WS_PLAY_MODE='research';this.scene.scene.start('PlayerSetup');},actions,'ws-primary');
    this.button(this.text('Start building →','Stadt gestalten →'),()=>{
      // Show a one-step confirmation before skipping questions
      const name=input.value.trim()||input.placeholder;
      this.clear();
      this.el('span',this.text('Skip the background questions?','Hintergrundfragen überspringen?'),'ws-kicker',this.panel);
      this.el('p',this.text('You can start right away — no questions needed. The result screen still reflects your in-game choices.','Du kannst sofort starten — ohne Fragen. Die Auswertung basiert weiterhin auf deinen Spielentscheidungen.'),null,this.panel);
      const ca=this.el('div',null,'ws-actions',this.panel);
      this.button(this.text('Back to questions','Zurück zu den Fragen'),()=>this.welcome(start),ca);
      this.button(this.text('Start directly →','Direkt starten →'),()=>{window.cityName=name;window.WS_PLAY_MODE='quick';this.scene.cityName=name;if(this.scene.hud&&this.scene.hud.cityText)this.scene.hud.cityText.setText(name);this.clear();start();},ca,'ws-primary');
    },actions);
    this.el('small',this.text('Quick play skips personal questions. The question-first route keeps the original pre-play sequence.','Schnellstart überspringt persönliche Fragen. Der zweite Weg behält die ursprünglichen Fragen vor dem Spiel bei.'),null,this.panel);
    this.button(this.de?'English':'Deutsch',()=>{setLang(this.de?'en':'de');this.scene.scene.restart();},actions);
  }
  update(){
    const s=this.scene;const vals=[s.cityName, `${this.text('Chapter','Kapitel')} ${s.currentLevel || '—'} / 10`,`${this.text('Happiness','Zufriedenheit')} ${Math.round(s.cityStats.happiness)}`,`${this.text('Growth','Entwicklung')} ${Math.round(s.cityStats.development)}`,`${this.text('Funds','Mittel')} ${Math.round(s.sim?s.sim.total():s.cityStats.resources)}`];
    const key=vals.join('|');if(key===this.lastStatus)return;this.lastStatus=key;this.status.replaceChildren();vals.forEach(v=>this.el('span',v,null,this.status));
  }
  choices(options,callback){
    this.clear();this.el('span',this.text('Your decision','Deine Entscheidung'),'ws-kicker',this.panel);
    this.el('h2',this.scene._levelName ? this.scene._levelName(this.scene.currentLevel) : '',null,this.panel);
    if(this.hint)this.el('p',this.hint,null,this.panel);
    const row=this.el('div',null,'ws-options',this.panel);let chosen=false;
    options.forEach(o=>{const b=this.button('',()=>{if(chosen||this.paused)return;chosen=true;this.clear();callback(o.value);},row,'ws-option');this.el('strong',(o.icon?o.icon+' ':'')+o.label,null,b);if(o.desc)this.el('span',o.desc,null,b);});
    row.querySelector('button')?.focus({preventScroll:true});
  }
  consequence(text,callback){
    this.clear();this.el('span',this.text('What changed','Was sich verändert hat'),'ws-kicker',this.panel);this.el('p',text,null,this.panel);
    let used=false;const b=this.button(this.text('Continue →','Weiter →'),()=>{if(used)return;used=true;this.clear();if(callback)callback();},this.panel,'ws-primary');b.focus({preventScroll:true});
  }
  allocation(){
    const s=this.scene;this.clear();this.el('h2',this.text('Give your neighbourhoods room to grow','Gib deinen Vierteln Raum zum Wachsen'),null,this.panel);
    const count=this.el('p','',null,this.panel);const row=this.el('div',null,'ws-options',this.panel);const buttons=[];
    const refresh=()=>{count.textContent=this.text('Funding placed: ','Mittel verteilt: ')+s.cubeDropped+' / 6';buttons.forEach(b=>b.disabled=s.cubeDropped>=6);};
    s.districts.forEach(d=>buttons.push(this.button(d.getName(),()=>{if(s.cubeDropped>=6)return;s._onResourceDropped(d);refresh();},row)));
    let finished=false;
    this.button(this.text('Continue →','Weiter →'),()=>{if(s.cubeDropped<6||finished)return;finished=true;s.districts.forEach(d=>d.setSelectable(false));s._clearPersistentMessage();this.clear();s._finishLevel3();},this.panel,'ws-primary').disabled=true;
    const next=this.panel.lastChild;
    const oldRefresh=refresh;
    const update=()=>{oldRefresh();next.disabled=s.cubeDropped<6;};
    row.querySelectorAll('button').forEach(b=>b.addEventListener('click',update));
    s.districts.forEach(d=>d.setSelectable(true,()=>{if(s.cubeDropped>=6||this.paused)return;s._onResourceDropped(d);update();}));update();
  }
  showHelp(){
    if(!this.help.hidden){this.help.hidden=true;return;}this.help.replaceChildren();this.help.hidden=false;
    this.el('h2',this.text('Your city, at your pace','Deine Stadt, dein Tempo'),null,this.help);
    this.el('p',this.text('Choose a card below the city. Each choice changes what happens next. In Expansion, tap a district to place one funding unit. Tab and Enter work on all decision buttons. The ending describes this session, not your personality.','Wähle eine Karte unter der Stadt. Jede Entscheidung verändert den Verlauf. Bei Expansion verteilt ein Tippen auf einen Stadtteil eine Einheit. Tab und Enter bedienen alle Entscheidungstasten. Der Abschluss beschreibt diese Sitzung, nicht deine Persönlichkeit.'),null,this.help);
    this.button(this.text('Close','Schließen'),()=>{this.help.hidden=true;},this.help);
  }
  destroy(){if(this.paused)this.setPaused(false);this.root.remove();}
  static summary(scene){
    const de=scene.de, sm=scene.summary, ui=Object.create(CityExperience.prototype);ui.de=de;
    const root=ui.el('main',null,'ws-experience ws-summary');root.lang=de?'de':'en';document.body.append(root);
    ui.el('span',ui.text('Your city story','Deine Stadtgeschichte'),'ws-kicker',root);
    ui.el('h1',ui.text('Look at what you built.','Sieh, was du aufgebaut hast.'),null,root);
    ui.el('p',ui.text('Your decisions first. Interpretations second.','Zuerst deine Entscheidungen. Dann mögliche Deutungen.'),null,root);
    const tour=ui.el('div',null,'ws-mini-city',root);
    const names=de?['Wohnen','Verkehr','Technik','Energie']:['Housing','Transport','Technology','Energy'];
    ['housing','transport','technology','energy'].forEach((id,i)=>{const tile=ui.el('div',names[i],null,tour);if(sm?.concentration.available)ui.el('strong',' '+Math.round((sm.concentration.shares[id]||0)*100)+'%',null,tile);});
    if(!sm){ui.el('p',ui.text('Summary unavailable.','Auswertung nicht verfügbar.'),null,root);}else{
      const section=title=>{const n=ui.el('section',null,null,root);ui.el('h2',title,null,n);return n;};
      if(scene.stats){const n=section(ui.text('The city at the end','Die Stadt am Ende'));ui.el('p',`${ui.text('Happiness','Zufriedenheit')}: ${Math.round(scene.stats.happiness)} · ${ui.text('Growth','Entwicklung')}: ${Math.round(scene.stats.development)}`,null,n);ui.el('small',ui.text('City indicators, not a grade of your decisions.','Stadtindikatoren, keine Bewertung deiner Entscheidungen.'),null,n);}
      const facts=section(ui.text('What you chose','Was du gewählt hast'));const list=ui.el('ol',null,null,facts);sm.did.forEach(d=>{const li=ui.el('li',d.text,null,list);if(d.constraint)ui.el('small',d.constraint,null,li);});
      const patterns=section(ui.text('What this session may suggest','Was diese Sitzung nahelegen könnte'));ui.el('small',ui.text('Observation counts are not confidence scores.','Beobachtungszahlen sind keine Konfidenzwerte.'),null,patterns);
      sm.patterns.forEach(p=>{const n=ui.el('details',null,null,patterns);ui.el('summary',p.label+' · '+scene._chipText(p.coverage,p.n,de),null,n);ui.el('p',p.text,null,n);sm.readings.filter(r=>r.dimension===p.dimension).forEach(r=>{ui.el('p',r.claim,null,n);ui.el('small',r.alternative,null,n);});});
      if(sm.comparison.length){const n=section(ui.text('Said and observed','Gesagt und beobachtet'));sm.comparison.forEach(c=>{ui.el('p',c.label+': '+c.stated+' → '+c.observed.join(', '),null,n);ui.el('small',c.note,null,n);});}
      if(scene.label?.available){const n=section(ui.text('Optional summary','Optionale Zusammenfassung'));ui.el('p',scene.label.traits.join(' · '),null,n);ui.el('small',scene.label.note,null,n);}
      const next=section(ui.text('Try another path','Probiere einen anderen Weg'));sm.nextSteps.forEach(n=>ui.el('p',n,null,next));
      ui.el('p',sm.disclaimer,null,next);
      const pension=ui.el('details',null,null,next);ui.el('summary',ui.text('Retirement context','Rentenkontext'),null,pension);ui.el('p',scene._pensionNote(de),null,pension);
    }
    ui.button(ui.text('Build another city →','Eine neue Stadt bauen →'),()=>{root.remove();ScoringEngine.reset();Tutorial.skipAll=false;window.WS_PLAY_MODE=null;window.cityName='';window.playerInfo={};window.retirementContext={};scene.scene.start('GameScene');},root,'ws-primary');
    root.tabIndex=-1;root.focus({preventScroll:true});
  }
}
