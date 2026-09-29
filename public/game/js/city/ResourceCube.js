class ResourceCube {
  constructor(scene, x, y, value) {
    this.scene = scene;
    this.value = value || 1;
    this.isDragging = false;
    this.originX = x;
    this.originY = y;
    this.targetDistrict = null;
    this._build(x, y);
    this._addDrag();
    this._pulse();
  }

  _build(x, y) {
    const S = this.scene.S || 1;
    this.S = S;
    this.container = this.scene.add.container(x, y).setDepth(50);
    this.gfx = this.scene.add.graphics();
    this._drawCube(0, 0, 1.0);
    this.container.add(this.gfx);
    this.glowRing = this.scene.add.graphics();
    this.glowRing.fillStyle(0xe2a840, 0.2);
    this.glowRing.fillEllipse(0, Math.round(22 * S), Math.round(46 * S), Math.round(14 * S));
    this.container.addAt(this.glowRing, 0);
    // The coin itself carries the value and the city's name, so credits are
    // unmistakable on screen instead of a faint little block.
    const city = (this.scene.cityName || '').toString().slice(0, 14);
    this.label = this.scene.add.text(0, Math.round(-4 * S), '100', {
      fontFamily: CityTheme.heading, fontSize: Math.round(17 * S), color: '#5b3f0c', fontStyle: '700'
    }).setOrigin(0.5);
    this.container.add(this.label);
    if (city) {
      this.cityLabel = this.scene.add.text(0, Math.round(11 * S), city.toUpperCase(), {
        fontFamily: CityTheme.body, fontSize: Math.round(8 * S), color: '#6b4c12', fontStyle: '700'
      }).setOrigin(0.5);
      this.container.add(this.cityLabel);
    }
    this.hitZone = this.scene.add.rectangle(0, 0, Math.round(56 * S), Math.round(56 * S), 0xffffff, 0);
    this.hitZone.setInteractive({ useHandCursor: true, draggable: true });
    this.container.add(this.hitZone);
  }

  // A minted coin: outer rim, inner face, highlight — readable at a glance.
  _drawCube(ox, oy, scale) {
    const g = this.gfx; g.clear();
    const S = this.scene.S || 1;
    const r = 24 * S * scale;
    g.fillStyle(0x8a5f10, 0.35); g.fillCircle(ox + 2, oy + 4, r);
    g.fillStyle(0xc98f1c, 1); g.fillCircle(ox, oy, r);
    g.fillStyle(0xf0c04a, 1); g.fillCircle(ox, oy, r * 0.86);
    g.fillStyle(0xfadb8a, 1); g.fillCircle(ox, oy, r * 0.72);
    g.lineStyle(Math.max(1, 1.6 * S), 0xa9750f, 0.9); g.strokeCircle(ox, oy, r * 0.72);
    g.fillStyle(0xfff3c8, 0.55); g.fillEllipse(ox - r * 0.28, oy - r * 0.4, r * 0.5, r * 0.28);
  }

  _pulse() {
    const S = this.scene.S || 1;
    this.scene.tweens.add({ targets: this.container, y: this.originY - 5 * S, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.scene.tweens.add({ targets: this.glowRing, alpha: { from: 0.2, to: 0.6 }, scaleX: { from: 1, to: 1.3 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }


  _addDrag() {
    this.scene.input.setDraggable(this.hitZone);
    this.hitZone.on('dragstart', () => {
      this.isDragging = true;
      this.scene.tweens.killTweensOf(this.container);
      this.scene.tweens.add({ targets: this.container, scaleX: 1.2, scaleY: 1.2, duration: 150 });
      if(this.scene._armLevel3Idle) this.scene._armLevel3Idle();
    });
    this.hitZone.on('drag', (ptr, dx, dy) => {
      this.container.x = ptr.x; this.container.y = ptr.y;
      const nearest = this._nearestDistrict(ptr.x, ptr.y);
      this.scene.districts?.forEach(d => {
        if (d === nearest && this._distanceTo(d, ptr.x, ptr.y) < 150) { d._showGlow(); this.targetDistrict = d; }
        else if (!d.isHovered) d._hideGlow();
      });
    });
    this.hitZone.on('dragend', (ptr) => {
      this.isDragging = false;
      const nearest = this._nearestDistrict(ptr.x, ptr.y);
      if (nearest && this._distanceTo(nearest, ptr.x, ptr.y) < 120) this._dropOnDistrict(nearest);
      else {
        this._returnHome();
        if (this.scene._showDropRetry) this.scene._showDropRetry();
      }
    });
  }

  _nearestDistrict(px, py) {
    if (!this.scene.districts?.length) return null;
    let best = null, bestDist = Infinity;
    this.scene.districts.forEach(d => { const dist = Phaser.Math.Distance.Between(px, py, d.cx, d.cy); if (dist < bestDist) { bestDist = dist; best = d; } });
    return best;
  }

  _distanceTo(district, px, py) {
    if (!district) return Infinity;
    return Phaser.Math.Distance.Between(px, py, district.cx, district.cy);
  }

  _dropOnDistrict(district) {
    if (this._used) return;
    this._used = true;
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container, x: district.cx, y: district.cy, scaleX: 0.1, scaleY: 0.1, alpha: 0, duration: 300, ease: 'Power2.easeIn',
      onComplete: () => {
        district.receiveResource(this.value);
        this.scene.events.emit('resourceDropped', { district, value: this.value, cube: this });
        this.destroy();
      }
    });
  }

  _returnHome() {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({ targets: this.container, x: this.originX, y: this.originY, scaleX: 1, scaleY: 1, duration: 400, ease: 'Back.easeOut', onComplete: () => this._pulse() });
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.glowRing);
    this.container.destroy();
  }
}
