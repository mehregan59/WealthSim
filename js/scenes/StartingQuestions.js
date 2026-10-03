/**
 * StartingQuestions.js
 *
 * Three pre-game personality/risk questions shown before GameScene.
 * All visible text is routed through Lang.t() for EN/DE support.
 * The selected language is read from window.WEALTHSIM_LANG (set by index.html).
 */
class StartingQuestions extends Phaser.Scene {

  constructor() {
    super({ key: 'StartingQuestions' });
  }

  /* ── helpers ───────────────────────────────────────────────────── */

  t(key) { return Lang.t(key); }

  s(n) {
    return Math.round(n * (this.scale.height / 720));
  }

  /* ── lifecycle ─────────────────────────────────────────────── */

  create() {
    LangMixin.attach(this);

    this.W = this.scale.width;
    this.H = this.scale.height;

    this.answers = {};
    this._currentQ = 0;

    this._buildBackground();
    this._showQuestion(0);
  }

  shutdown() {
    LangMixin.detach(this);
  }

  /* ── background ───────────────────────────────────────────── */

  _buildBackground() {
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x0d1f12);
    const g = this.add.graphics();
    g.lineStyle(1, 0x1b5e20, 0.18);
    for (let x = 0; x < this.W; x += 80) g.lineBetween(x, 0, x, this.H);
    for (let y = 0; y < this.H; y += 80) g.lineBetween(0, y, this.W, y);
  }

  /* ── questions ───────────────────────────────────────────── */

  _questions() {
    return [
      {
        key: 'risk',
        text: this.t('sq.q1.text'),
        options: [
          { label: this.t('sq.q1.safe'),       value: 'safe'       },
          { label: this.t('sq.q1.balanced'),    value: 'balanced'   },
          { label: this.t('sq.q1.aggressive'),  value: 'aggressive' },
        ],
      },
      {
        key: 'patience',
        text: this.t('sq.q2.text'),
        options: [
          { label: this.t('sq.q2.impatient'), value: 'impatient' },
          { label: this.t('sq.q2.moderate'),  value: 'moderate'  },
          { label: this.t('sq.q2.patient'),   value: 'patient'   },
        ],
      },
      {
        key: 'loss',
        text: this.t('sq.q3.text'),
        options: [
          { label: this.t('sq.q3.stop'),     value: 'stop'     },
          { label: this.t('sq.q3.wait'),     value: 'wait'     },
          { label: this.t('sq.q3.research'), value: 'research' },
        ],
      },
    ];
  }

  _showQuestion(index) {
    if (this._qGroup) this._qGroup.destroy(true);
    this._qGroup = this.add.group();

    const questions = this._questions();
    if (index >= questions.length) {
      this._finish();
      return;
    }

    const q  = questions[index];
    const cx = this.W / 2;
    const s  = this.s.bind(this);

    // Progress dots
    questions.forEach((_, i) => {
      const dot = this.add.circle(
        cx + (i - 1) * s(28),
        s(80),
        s(5),
        i === index ? 0x66bb6a : 0x2e7d32
      );
      this._qGroup.add(dot);
    });

    // Question number
    const numTxt = this.add.text(cx, s(115), `${index + 1} / ${questions.length}`, {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize:   `${s(15)}px`,
      color:      '#66bb6a',
      alpha:      0.7,
    }).setOrigin(0.5);
    this._qGroup.add(numTxt);

    // Question text
    const qTxt = this.add.text(cx, s(200), q.text, {
      fontFamily:  'Segoe UI, system-ui, sans-serif',
      fontSize:    `${s(22)}px`,
      color:       '#e8f5e9',
      wordWrap:    { width: this.W * 0.72 },
      align:       'center',
      lineSpacing: s(6),
    }).setOrigin(0.5);
    this._qGroup.add(qTxt);

    // Option buttons
    const btnW  = Math.min(480, this.W * 0.6);
    const btnH  = s(52);
    const gap   = s(14);
    const startY = s(320);

    q.options.forEach((opt, i) => {
      const by = startY + i * (btnH + gap);
      const bg = this.add.rectangle(cx, by, btnW, btnH, 0x1b5e20)
        .setStrokeStyle(1.5, 0x388e3c)
        .setInteractive({ useHandCursor: true });

      const lbl = this.add.text(cx, by, opt.label, {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize:   `${s(18)}px`,
        color:      '#a5d6a7',
      }).setOrigin(0.5);

      bg.on('pointerover',  () => { bg.setFillStyle(0x2e7d32); lbl.setColor('#e8f5e9'); });
      bg.on('pointerout',   () => { bg.setFillStyle(0x1b5e20); lbl.setColor('#a5d6a7'); });
      bg.on('pointerdown',  () => this._choose(q.key, opt.value, index));

      this._qGroup.add(bg);
      this._qGroup.add(lbl);
    });

    // Fade in
    this._qGroup.getChildren().forEach(obj => {
      if (obj.setAlpha) {
        obj.setAlpha(0);
        this.tweens.add({ targets: obj, alpha: 1, duration: 280, ease: 'Quad.easeOut' });
      }
    });
  }

  _choose(key, value, index) {
    this.answers[key] = value;
    this.time.delayedCall(120, () => this._showQuestion(index + 1));
  }

  _finish() {
    this.registry.set('startingAnswers', this.answers);
    this.cameras.main.fadeOut(400, 13, 31, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }
}
