/* CityExperience — the welcome flow and in-game UX layer for WealthSim.
 *
 * Wraps the Phaser scene with a DOM overlay for onboarding, allocation,
 * and other panels that need rich HTML layout. The game scene owns the
 * canvas; CityExperience owns the DOM layer on top of it.
 */
class CityExperience {
  constructor(scene) {
    this.scene = scene;
    this.hint  = '';
    this._root = null;
    this._buildRoot();
  }

  _buildRoot() {
    const existing = document.getElementById('city-experience-root');
    if (existing) existing.remove();
    const root = document.createElement('div');
    root.id = 'city-experience-root';
    root.style.cssText = [
      'position:fixed', 'inset:0', 'pointer-events:none',
      'z-index:200', 'font-family:Inter,Arial,sans-serif'
    ].join(';');
    document.body.appendChild(root);
    this._root = root;
  }

  _clear() {
    if (this._root) this._root.innerHTML = '';
  }

  // ── Welcome / intro ────────────────────────────────────────────────────────
  welcome(cb) {
    this._clear();
    const scene  = this.scene;
    const W = scene.W, H = scene.H;
    const de = scene.de ? scene.de() : false;
    const root = this._root;

    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:absolute', 'inset:0',
      'background:rgba(2,6,12,0.82)',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'pointer-events:all',
      'transition:opacity .55s ease',
    ].join(';');

    const cityName = scene.cityName || (de ? 'Meine Stadt' : 'My City');

    const title = document.createElement('div');
    title.textContent = cityName;
    title.style.cssText = [
      'font-family:Playfair Display,Georgia,serif',
      'font-size:clamp(22px,3.8vw,40px)',
      'color:#e2a840', 'letter-spacing:.05em',
      'margin-bottom:.35em', 'text-align:center',
    ].join(';');

    const sub = document.createElement('div');
    sub.textContent = de ? 'Deine Stadt, deine Entscheidungen.' : 'Your city. Your decisions.';
    sub.style.cssText = [
      'font-size:clamp(12px,1.6vw,17px)',
      'color:#8aaac4', 'margin-bottom:2.2em',
      'text-align:center',
    ].join(';');

    const btn = document.createElement('button');
    btn.textContent = de ? 'Starten' : 'Begin';
    btn.className   = 'ws-primary';
    btn.style.cssText = [
      'padding:.7em 2.2em',
      'font-size:clamp(13px,1.5vw,16px)',
      'background:#1a3a5a', 'color:#e2a840',
      'border:1px solid #e2a840', 'border-radius:6px',
      'cursor:pointer', 'pointer-events:all',
      'transition:background .2s',
    ].join(';');
    btn.onmouseenter = () => btn.style.background = '#2a5070';
    btn.onmouseleave = () => btn.style.background = '#1a3a5a';
    btn.onclick = () => {
      overlay.style.opacity = '0';
      setTimeout(() => { this._clear(); if (cb) cb(); }, 560);
    };

    overlay.appendChild(title);
    overlay.appendChild(sub);
    overlay.appendChild(btn);
    root.appendChild(overlay);

    requestAnimationFrame(() => { overlay.style.opacity = '0'; requestAnimationFrame(() => { overlay.style.opacity = '1'; }); });
  }

  // ── Allocation panel (Chapter 3) ───────────────────────────────────────────
  allocation() {
    this._clear();
    const scene  = this.scene;
    const de     = scene.de ? scene.de() : false;
    const root   = this._root;
    const total  = scene.cubeTotal || 6;
    let   placed = scene.cubeDropped || 0;

    const districts = (scene.districts || []).map(d => ({
      id:    d.id,
      name:  de ? (d.nameDe || d.nameDE || d.name) : d.name,
      color: '#' + (d.color || 0x4adfc0).toString(16).padStart(6, '0'),
      count: 0,
    }));

    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:absolute', 'inset:0',
      'display:flex', 'align-items:center', 'justify-content:center',
      'pointer-events:none',
    ].join(';');

    const panel = document.createElement('div');
    panel.style.cssText = [
      'background:rgba(6,16,25,0.93)',
      'border:1px solid #1e3050',
      'border-radius:12px',
      'padding:clamp(16px,3vw,28px) clamp(18px,4vw,36px)',
      'min-width:min(320px,90vw)',
      'max-width:440px',
      'pointer-events:all',
      'box-shadow:0 4px 32px rgba(0,0,0,.6)',
    ].join(';');

    const heading = document.createElement('div');
    heading.textContent = de ? 'Mittel verteilen' : 'Distribute Resources';
    heading.style.cssText = [
      'font-family:Playfair Display,Georgia,serif',
      'font-size:clamp(17px,2.2vw,22px)',
      'color:#e2a840', 'margin-bottom:.8em',
    ].join(';');
    panel.appendChild(heading);

    const counterEl = document.createElement('div');
    counterEl.style.cssText = 'color:#8aaac4;font-size:clamp(12px,1.4vw,14px);margin-bottom:1.2em;';
    const updateCounter = () => {
      const rem = total - placed;
      counterEl.textContent = de
        ? (rem + ' von ' + total + ' Würfeln verbleibend')
        : (rem + ' of ' + total + ' cubes remaining');
    };
    updateCounter();
    panel.appendChild(counterEl);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:1.4em;';

    districts.forEach(d => {
      const cell = document.createElement('div');
      cell.style.cssText = [
        'border:1px solid #1e3050', 'border-radius:8px',
        'padding:10px 12px',
        'display:flex', 'align-items:center', 'justify-content:space-between',
        'background:rgba(255,255,255,.03)',
      ].join(';');

      const label = document.createElement('span');
      label.textContent = d.name;
      label.style.cssText = 'font-size:clamp(11px,1.3vw,13px);color:#c8d8ec;';

      const controls = document.createElement('div');
      controls.style.cssText = 'display:flex;align-items:center;gap:6px;';

      const minus = document.createElement('button');
      minus.textContent = '−';
      minus.style.cssText = 'width:26px;height:26px;border-radius:4px;border:1px solid #2a4a6a;background:#0d2035;color:#e2a840;cursor:pointer;font-size:16px;line-height:1;';

      const countEl = document.createElement('span');
      countEl.textContent = '0';
      countEl.style.cssText = 'min-width:18px;text-align:center;color:#e2d8c0;font-size:clamp(12px,1.4vw,14px);';

      const plus = document.createElement('button');
      plus.textContent = '+';
      plus.style.cssText = minus.style.cssText;

      minus.onclick = () => {
        if (d.count === 0) return;
        d.count--; placed--;
        countEl.textContent = d.count;
        updateCounter();
        // Notify scene
        if (scene._onResourceRemoved) scene._onResourceRemoved(d.id);
      };
      plus.onclick = () => {
        if (placed >= total) return;
        d.count++; placed++;
        countEl.textContent = d.count;
        updateCounter();
        const dist = (scene.districts || []).find(x => x.id === d.id);
        if (scene._onResourceDropped && dist) scene._onResourceDropped(dist);
      };

      controls.appendChild(minus);
      controls.appendChild(countEl);
      controls.appendChild(plus);
      cell.appendChild(label);
      cell.appendChild(controls);
      grid.appendChild(cell);
    });
    panel.appendChild(grid);

    const okBtn = document.createElement('button');
    okBtn.textContent = de ? 'Bestätigen' : 'Confirm';
    okBtn.style.cssText = [
      'width:100%', 'padding:.65em 0',
      'background:#1a3a5a', 'color:#e2a840',
      'border:1px solid #e2a840', 'border-radius:6px',
      'font-size:clamp(13px,1.5vw,15px)',
      'cursor:pointer', 'transition:background .2s',
    ].join(';');
    okBtn.onmouseenter = () => okBtn.style.background = '#2a5070';
    okBtn.onmouseleave = () => okBtn.style.background = '#1a3a5a';
    okBtn.onclick = () => {
      if (placed < total) return;
      this._clear();
      if (scene._finishLevel3) scene._finishLevel3();
    };
    panel.appendChild(okBtn);

    overlay.appendChild(panel);
    root.appendChild(overlay);
  }

  // ── Simple full-screen message ─────────────────────────────────────────────
  message(txt, btnLabel, cb) {
    this._clear();
    const root = this._root;
    const de   = this.scene.de ? this.scene.de() : false;

    const overlay = document.createElement('div');
    overlay.style.cssText = [
      'position:absolute', 'inset:0',
      'background:rgba(2,6,12,0.78)',
      'display:flex', 'flex-direction:column',
      'align-items:center', 'justify-content:center',
      'pointer-events:all', 'padding:24px',
    ].join(';');

    const msg = document.createElement('div');
    msg.textContent = txt;
    msg.style.cssText = [
      'font-size:clamp(14px,2vw,20px)',
      'color:#c8d8ec',
      'text-align:center',
      'max-width:560px',
      'margin-bottom:1.8em',
      'line-height:1.55',
    ].join(';');

    const btn = document.createElement('button');
    btn.textContent = btnLabel || (de ? 'Weiter' : 'Continue');
    btn.className = 'ws-primary';
    btn.style.cssText = [
      'padding:.65em 2em',
      'font-size:clamp(13px,1.5vw,15px)',
      'background:#1a3a5a', 'color:#e2a840',
      'border:1px solid #e2a840', 'border-radius:6px',
      'cursor:pointer', 'pointer-events:all',
      'transition:background .2s',
    ].join(';');
    btn.onmouseenter = () => btn.style.background = '#2a5070';
    btn.onmouseleave = () => btn.style.background = '#1a3a5a';
    btn.onclick = () => { this._clear(); if (cb) cb(); };

    overlay.appendChild(msg);
    overlay.appendChild(btn);
    root.appendChild(overlay);
  }

  // ── Game over / finish ─────────────────────────────────────────────────────
  finish(summary, cb) {
    this.message(
      summary || (this.scene.de && this.scene.de() ? 'Sitzung abgeschlossen.' : 'Session complete.'),
      this.scene.de && this.scene.de() ? 'Ergebnisse ansehen' : 'View Results',
      cb
    );
  }

  // ── Shortcut: start GameScene from this overlay's button ──────────────────
  _startGame(root, btnClass) {
    this._clear();
    this.scene.scene.start('GameScene');
  }

  // Internal: make an anchor button that starts the game
  _makeStartBtn(de, root, cls) {
    const btn = document.createElement('button');
    btn.textContent = de ? 'Starten' : 'Begin';
    btn.className = cls || 'ws-primary';
    btn.style.cssText = [
      'padding:.7em 2.2em',
      'font-size:clamp(13px,1.5vw,16px)',
      'background:#1a3a5a', 'color:#e2a840',
      'border:1px solid #e2a840', 'border-radius:6px',
      'cursor:pointer', 'pointer-events:all',
      'transition:background .2s',
    ].join(';');
    btn.onmouseenter = () => btn.style.background = '#2a5070';
    btn.onmouseleave = () => btn.style.background = '#1a3a5a';
    btn.onclick = () => { this.scene.scene.start('GameScene'); root.tabIndex=-1; root.focus({preventScroll:true}); };
    return btn;
  }
}
