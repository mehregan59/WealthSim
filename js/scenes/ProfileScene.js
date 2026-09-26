/* Session summary screen.
 *
 * Renders WS.Summary output and nothing else. It never computes a score of
 * its own, so what is shown can always be traced to recorded events.
 * Nothing is hover-only — touch-friendly throughout.
 */
class ProfileScene extends Phaser.Scene {
  constructor() { super({ key: 'ProfileScene' }); }

  init(data) {
    this.decisions    = data.decisions    || [];
    this.startingAnswers = data.startingAnswers || [];
    this.seed         = data.seed         || '';
    this.sessionMode  = data.mode         || 'quick';
  }

  create() {
    this.W = this.scale.width;
    this.H = this.scale.height;
    const W = this.W, H = this.H;
    const de = typeof currentLang !== 'undefined' && currentLang === 'de';

    // ── background ───────────────────────────────────────────────────────────
    this.add.rectangle(W/2, H/2, W, H, 0x061019).setDepth(0);

    // ── summary ──────────────────────────────────────────────────────────────
    let summary = null;
    if (window.WS && WS.Summary && WS.Adapter) {
      const events  = WS.Adapter.toEvents(this.decisions);
      const stated  = WS.Adapter.toStated(this.startingAnswers);
      summary = WS.Summary.build(events, stated, this.seed, { lang: de ? 'de' : 'en' });
    }

    // ── scrollable content container ─────────────────────────────────────────
    const PAD   = Math.round(Math.min(32, W * 0.045));
    const RIGHT = 20;
    const contentW = W - PAD - RIGHT;
    this.content = this.add.container(0, 0).setDepth(10);
    let y = PAD;

    // ── title ─────────────────────────────────────────────────────────────────
    const S = Math.max(0.72, Math.min(1.35, H / 720));
    const fs = n => Math.round(n * S);

    const titleTxt = de ? 'Deine Sitzung' : 'Your Session';
    const title = this.add.text(PAD, y, titleTxt, {
      fontFamily: 'Playfair Display, Georgia, serif',
      fontSize: fs(26) + 'px', color: '#e2a840', wordWrap: { width: contentW }
    }).setDepth(11);
    this.content.add(title);
    y += title.height + fs(6);

    const subTxt = de
      ? ('Modus: ' + this.sessionMode + '  ·  Seed: ' + this.seed)
      : ('Mode: '  + this.sessionMode + '  ·  Seed: ' + this.seed);
    const sub = this.add.text(PAD, y, subTxt, {
      fontFamily: 'Inter, Arial, sans-serif',
      fontSize: fs(11) + 'px', color: '#2a3a5a'
    }).setDepth(11);
    this.content.add(sub);
    y += sub.height + fs(20);

    // ── helper: add a section heading ────────────────────────────────────────
    const addHeading = (txt) => {
      const h = this.add.text(PAD, y, txt, {
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: fs(14) + 'px', color: '#4adfc0', fontStyle: 'bold'
      }).setDepth(11);
      this.content.add(h);
      y += h.height + fs(6);
    };

    // ── helper: add a body paragraph ─────────────────────────────────────────
    const addPara = (txt, col) => {
      col = col || '#c8d8ec';
      const p = this.add.text(PAD, y, txt, {
        fontFamily: 'Inter, Arial, sans-serif',
        fontSize: fs(12) + 'px', color: col,
        wordWrap: { width: contentW }
      }).setDepth(11);
      this.content.add(p);
      y += p.height + fs(10);
    };

    // ── helper: key-value row ─────────────────────────────────────────────────
    const addKV = (k, v, vCol) => {
      vCol = vCol || '#e2d8c0';
      const row = this.add.text(PAD, y,
        k + '  ', { fontFamily:'Inter,Arial,sans-serif', fontSize:fs(12)+'px', color:'#8aa0b4' }).setDepth(11);
      const val = this.add.text(PAD + row.width, y,
        v, { fontFamily:'Inter,Arial,sans-serif', fontSize:fs(12)+'px', color:vCol }).setDepth(11);
      this.content.add(row); this.content.add(val);
      y += Math.max(row.height, val.height) + fs(6);
    };

    // ── helper: divider ───────────────────────────────────────────────────────
    const addDivider = () => {
      const g = this.add.graphics().setDepth(11);
      g.lineStyle(1, 0x1e3050, 0.7);
      g.beginPath(); g.moveTo(PAD, y); g.lineTo(W - RIGHT, y); g.strokePath();
      this.content.add(g);
      y += fs(14);
    };

    if (!summary) {
      addPara(de ? 'Keine Zusammenfassung verfügbar.' : 'No summary available.');
    } else {

      // ── 1. Starting questions ──────────────────────────────────────────────
      if (summary.stated && (summary.stated.q0 !== undefined || summary.stated.q1 !== undefined)) {
        addHeading(de ? 'Ausgangsfragen' : 'Starting Questions');
        const stated = summary.stated;
        const qLabels = de
          ? ['Selbsteinschätzung', 'Erfahrung', 'Primärziel']
          : ['Self-assessment', 'Experience', 'Primary goal'];
        [stated.q0, stated.q1, stated.q2].forEach((v, i) => {
          if (v !== undefined) addKV(qLabels[i] + ':', String(v));
        });
        addDivider();
      }

      // ── 2. Persona / style ────────────────────────────────────────────────
      if (summary.style && summary.style.available) {
        addHeading(de ? 'Entscheidungsstil' : 'Decision Style');
        const persona = de ? summary.style.personaDE : summary.style.persona;
        addKV(de ? 'Stil:' : 'Style:', persona, '#e2a840');
        if (summary.style.description) addPara(summary.style.description, '#a0b8d0');
        addDivider();
      }

      // ── 3. Risk pairs (Ch1) ───────────────────────────────────────────────
      if (summary.riskPairs && summary.riskPairs.available) {
        addHeading(de ? 'Kapitel 1: Vertragspaare' : 'Chapter 1: Contract Pairs');
        const rp = summary.riskPairs;
        addKV(de ? 'Breite Verträge:' : 'Wide contracts:', rp.wideCount + ' / ' + rp.n);
        if (rp.monotonic && rp.switchAt !== null)
          addKV(de ? 'Wechselpunkt (pHigh):' : 'Switch point (pHigh):', String(rp.switchAt));
        else if (!rp.monotonic)
          addPara(de ? 'Nicht-monotone Reihenfolge.' : 'Non-monotone sequence.', '#8aa0b4');
        addDivider();
      }

      // ── 4. Concentration (Ch3) ────────────────────────────────────────────
      if (summary.concentration && summary.concentration.available) {
        addHeading(de ? 'Kapitel 3: Mittelverteilung' : 'Chapter 3: Allocation');
        const c = summary.concentration;
        addKV(de ? 'Einheiten vergeben:' : 'Units placed:', String(c.total));
        addKV(de ? 'Größter Anteil:' : 'Largest share:', Math.round(c.largestShare * 100) + '%');
        if (c.topDistrict) addKV(de ? 'Top-Bezirk:' : 'Top district:', c.topDistrict);
        addDivider();
      }

      // ── 5. Disposition effect (Ch9) ───────────────────────────────────────
      if (summary.disposition && summary.disposition.available) {
        addHeading(de ? 'Kapitel 9: Projektbewertung' : 'Chapter 9: Project Review');
        const d = summary.disposition;
        addKV(de ? 'Gewinner verkauft:' : 'Winners sold:', d.soldGain + ' / ' + d.n);
        addKV(de ? 'Verlierer verkauft:' : 'Losers sold:', d.soldLoss + ' / ' + d.n);
        addDivider();
      }

      // ── 6. Forecast accuracy (Ch10) ───────────────────────────────────────
      if (summary.forecasts && summary.forecasts.available) {
        addHeading(de ? 'Kapitel 10: Prognosen' : 'Chapter 10: Forecasts');
        const f = summary.forecasts;
        addKV(de ? 'Prognosen abgegeben:' : 'Forecasts made:', String(f.n));
        if (typeof f.meanGap === 'number')
          addKV(de ? 'Mittl. Abweichung vom Modell:' : 'Mean gap from model:', f.meanGap.toFixed(3));
        addDivider();
      }

      // ── 7. Patterns ───────────────────────────────────────────────────────
      if (summary.patterns && summary.patterns.length) {
        addHeading(de ? 'Beobachtete Muster' : 'Observed Patterns');
        summary.patterns.forEach(p => {
          const label = de ? (p.labelDE || p.label) : p.label;
          const dir   = de ? (p.directionDE || p.direction) : p.direction;
          const cov   = p.coverage === 'strong' ? '#4adfc0' : p.coverage === 'moderate' ? '#e2a840' : '#8aa0b4';
          addKV(label + ':', dir, cov);
          if (p.note) addPara(p.note, '#4a6080');
        });
        addDivider();
      }

      // ── 8. Practice transfer (Ch10) ───────────────────────────────────────
      if (summary.transfer && summary.transfer.available) {
        addHeading(de ? 'Kapitel 10: Transfer' : 'Chapter 10: Transfer');
        const tr = summary.transfer;
        addKV(de ? 'Art:' : 'Kind:', tr.kind);
        if (tr.kind === 'allocation' && typeof tr.practiceLargestShare === 'number') {
          addKV(de ? 'Baseline-Anteil:' : 'Baseline share:', Math.round(tr.baselineLargestShare * 100) + '%');
          addKV(de ? 'Übungs-Anteil:'   : 'Practice share:', Math.round(tr.practiceLargestShare  * 100) + '%');
        } else if (tr.action) {
          addKV(de ? 'Aktion:' : 'Action:', tr.action);
        }
        if (tr.note) addPara(tr.note, '#4a6080');
        addDivider();
      }

      // ── 9. Raw event count ────────────────────────────────────────────────
      if (summary.eventCount !== undefined) {
        addKV(de ? 'Ereignisse gesamt:' : 'Total events:', String(summary.eventCount), '#4a6080');
      }
    }

    // ── play-again button ────────────────────────────────────────────────────
    y += fs(16);
    const btnW = Math.round(Math.min(220, contentW * 0.5));
    const btnH = fs(40);
    const btnX = PAD;
    const btnBg = this.add.graphics().setDepth(12);
    btnBg.fillStyle(0x1a3a5a, 1); btnBg.fillRoundedRect(btnX, y, btnW, btnH, 8);
    const btnTxt = this.add.text(btnX + btnW / 2, y + btnH / 2,
      de ? 'Neu spielen' : 'Play Again',
      { fontFamily:'Inter,Arial,sans-serif', fontSize:fs(14)+'px', color:'#e2a840' }
    ).setOrigin(0.5).setDepth(13);
    const btnZone = this.add.zone(btnX, y, btnW, btnH).setOrigin(0).setInteractive({ cursor:'pointer' }).setDepth(13);
    btnZone.on('pointerover',  () => { btnBg.clear(); btnBg.fillStyle(0x2a5070,1); btnBg.fillRoundedRect(btnX,y,btnW,btnH,8); });
    btnZone.on('pointerout',   () => { btnBg.clear(); btnBg.fillStyle(0x1a3a5a,1); btnBg.fillRoundedRect(btnX,y,btnW,btnH,8); });
    btnZone.on('pointerup',    () => {
      if (typeof ScoringEngine !== 'undefined') ScoringEngine.reset();
      this.scene.start('Boot');
    });
    this.content.add(btnBg); this.content.add(btnTxt); this.content.add(btnZone);
    y += btnH + fs(32);

    // ── scrolling ─────────────────────────────────────────────────────────────
    const totalH  = y;
    const minY    = Math.min(0, H - totalH - PAD);

    if (totalH > H) {
      this.input.on('wheel', (ptr, objs, dx, dy) => {
        this.content.y = Phaser.Math.Clamp(this.content.y - dy * 1.2, minY, 0);
      });
      let startY = 0, startCY = 0, dragging = false;
      this.input.on('pointerdown', p => { dragging = true; startY = p.y; startCY = this.content.y; });
      this.input.on('pointermove', p => {
        if (!dragging) return;
        const dy2 = p.y - startY;
        this.content.y = Phaser.Math.Clamp(startCY + dy2, minY, 0);
      });
      this.input.on('pointerup', () => { dragging = false; });

      // scroll hint
      const hint = this.add.text(W - RIGHT - 4, H - fs(18),
        de ? '↓ scrollen' : '↓ scroll',
        { fontFamily:'Inter,Arial,sans-serif', fontSize:fs(10)+'px', color:'#2a3a5a' }
      ).setOrigin(1, 1).setDepth(15);
      this.tweens.add({ targets: hint, alpha: { from:0.8, to:0.2 }, yoyo:true, repeat:-1, duration:1600 });
    }

    // keyboard nav
    const k = this.input.keyboard;
    if (k) {
      k.on('keydown-UP',   () => { this.content.y = Math.min(0, this.content.y + fs(40)); });
      k.on('keydown-DOWN', () => { this.content.y = Math.max(minY, this.content.y - fs(40)); });
      k.on('keydown-HOME', () => { this.content.y = 0; });
      k.on('keydown-END',  () => { this.content.y = minY; });
    }
  }
}
