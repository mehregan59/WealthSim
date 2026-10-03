/**
 * District.js
 *
 * Represents a single city district on the game canvas.
 * District names are translated via Lang.t() so EN/DE both work.
 */
class District {

  /**
   * @param {Phaser.Scene} scene
   * @param {{ id: string, x: number, y: number, color: number, health: number }} config
   */
  constructor(scene, config) {
    this.scene  = scene;
    this.id     = config.id;
    this.x      = config.x;
    this.y      = config.y;
    this.color  = config.color;
    this.health = config.health ?? 50;

    // Translated name — falls back to id if key missing
    this.name = Lang.t(`district.${this.id}`);

    this._build();
  }

  /* ── build ────────────────────────────────────────────────── */

  _build() {
    const scene = this.scene;
    const s = (n) => scene.s ? scene.s(n) : n;

    const w = s(120);
    const h = s(90);

    this.block = scene.add.rectangle(this.x, this.y, w, h, this.color, 0.85)
      .setStrokeStyle(2, 0xffffff, 0.15)
      .setInteractive({ useHandCursor: true });

    this.label = scene.add.text(this.x, this.y + h / 2 + s(10), this.name, {
      fontFamily: 'Segoe UI, system-ui, sans-serif',
      fontSize:   `${s(13)}px`,
      color:      '#e8f5e9',
      alpha:      0.85,
    }).setOrigin(0.5, 0);

    const barW = w * 0.8;
    this._barBg = scene.add.rectangle(this.x, this.y - h / 2 - s(8), barW, s(5), 0x1b5e20);

    this._barFill = scene.add.rectangle(
      this.x - barW / 2,
      this.y - h / 2 - s(8),
      barW * (this.health / 100),
      s(5),
      0x66bb6a
    ).setOrigin(0, 0.5);

    this.block.on('pointerover',  () => this.block.setFillStyle(this.color, 1));
    this.block.on('pointerout',   () => this.block.setFillStyle(this.color, 0.85));
  }

  /* ── public API ────────────────────────────────────────────── */

  setHealth(value) {
    this.health = Math.max(0, Math.min(100, value));
    if (this._barFill) {
      const barW = this._barBg.width * 0.8;
      this._barFill.width = barW * (this.health / 100);
    }
  }

  refreshLabel() {
    this.name = Lang.t(`district.${this.id}`);
    if (this.label) this.label.setText(this.name);
  }

  onClick(fn) {
    this.block.on('pointerdown', fn);
    return this;
  }

  disable() {
    this.block.disableInteractive();
    this.block.setAlpha(0.55);
    return this;
  }

  enable() {
    this.block.setInteractive({ useHandCursor: true });
    this.block.setAlpha(1);
    return this;
  }

  destroy() {
    [this.block, this.label, this._barBg, this._barFill].forEach(o => o?.destroy());
  }
}
