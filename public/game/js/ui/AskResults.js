// "Ask about my results" — a session-only question panel on the results
// screen. Explains recorded decisions and scores; never gives advice.
const AskResults = {
  el: null, history: [], ctrl: null,

  open(context, de) {
    if (this.el) return;
    const host = document.querySelector('#game-container canvas')?.parentElement || document.body;
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;font-family:Inter,Arial,sans-serif';
    wrap.innerHTML = `
      <div style="width:min(640px,94vw);height:min(620px,90vh);background:#08121f;border:1px solid rgba(226,168,64,.55);border-radius:14px;display:flex;flex-direction:column;color:#dbe6f0">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid #1c2c3f">
          <div><div style="font-family:'Playfair Display',Georgia,serif;font-size:20px;color:#e2a840">${de ? 'Frag nach deinem Ergebnis' : 'Ask about your result'}</div>
          <div style="font-size:12px;color:#8fa9c2;margin-top:4px">${de ? 'Erklärt deine Entscheidungen — keine Anlageberatung.' : 'Explains your choices — not financial advice.'}</div></div>
          <button data-x style="background:none;border:0;color:#8fa9c2;font-size:22px;cursor:pointer" aria-label="Close">×</button>
        </div>
        <div data-log style="flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:12px;font-size:14px;line-height:1.5"></div>
        <form data-f style="display:flex;gap:8px;padding:14px 20px;border-top:1px solid #1c2c3f">
          <input data-i maxlength="500" placeholder="${de ? 'z. B. Warum ist meine Verlustaversion hoch?' : 'e.g. Why is my loss aversion high?'}" style="flex:1;background:#0f1d2e;border:1px solid #24384f;border-radius:8px;color:#fff;padding:10px 12px;font-size:14px;outline:none">
          <button data-s style="background:#e2a840;color:#08121f;border:0;border-radius:8px;padding:0 16px;font-weight:600;cursor:pointer">${de ? 'Fragen' : 'Ask'}</button>
        </form>
      </div>`;
    host.appendChild(wrap);
    this.el = wrap;
    const log = wrap.querySelector('[data-log]'), inp = wrap.querySelector('[data-i]'), btn = wrap.querySelector('[data-s]');
    const add = (role, text) => {
      const d = document.createElement('div');
      d.style.cssText = role === 'user'
        ? 'align-self:flex-end;background:#e2a840;color:#08121f;padding:8px 12px;border-radius:10px;max-width:80%'
        : 'align-self:flex-start;max-width:92%;white-space:pre-wrap';
      d.textContent = text; log.appendChild(d); log.scrollTop = log.scrollHeight; return d;
    };
    this.history.forEach(m => add(m.role, m.content));
    if (!this.history.length) add('assistant', de
      ? 'Frag mich, wie deine Entscheidungen im Spiel zu deinen Werten geführt haben und was diese Muster für langfristiges Vorsorgesparen bedeuten können.'
      : 'Ask me how your in-game choices led to your scores, and what those patterns could mean for long-term retirement saving.');
    ['keydown', 'keyup', 'keypress'].forEach(t => inp.addEventListener(t, e => e.stopPropagation()));
    wrap.querySelector('[data-x]').onclick = () => this.close();
    wrap.querySelector('[data-f]').onsubmit = async e => {
      e.preventDefault();
      if (this.ctrl) { this.ctrl.abort(); return; }
      const q = inp.value.trim(); if (!q) return;
      inp.value = ''; add('user', q); this.history.push({ role: 'user', content: q });
      const out = add('assistant', '…'); btn.textContent = de ? 'Stopp' : 'Stop';
      this.ctrl = new AbortController(); let text = '';
      try {
        const r = await fetch('/api/explain', { method: 'POST', signal: this.ctrl.signal, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: de ? 'de' : 'en', context, messages: this.history.slice(-20) }) });
        if (!r.ok) throw new Error(await r.text() || 'Unavailable');
        const rd = r.body.getReader(), dc = new TextDecoder();
        for (;;) { const { done, value } = await rd.read(); if (done) break; text += dc.decode(value, { stream: true }); out.textContent = text; log.scrollTop = log.scrollHeight; }
        if (!text) throw new Error(de ? 'Keine Antwort erhalten.' : 'No answer received.');
      } catch (err) {
        if (err.name === 'AbortError') text = (text ? text + '\n\n' : '') + (de ? '(gestoppt)' : '(stopped)');
        else { text = ''; out.style.color = '#ff9b8a'; out.textContent = (de ? 'Erklärung nicht verfügbar: ' : 'Explainer unavailable: ') + err.message; }
      }
      if (text) { out.textContent = text; this.history.push({ role: 'assistant', content: text }); }
      else this.history.pop();
      this.ctrl = null; btn.textContent = de ? 'Fragen' : 'Ask'; inp.focus();
    };
    setTimeout(() => inp.focus(), 50);
  },

  close() { if (this.ctrl) this.ctrl.abort(); this.el?.remove(); this.el = null; },
  reset() { this.close(); this.history = []; }
};
