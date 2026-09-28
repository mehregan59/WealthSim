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
    this.container = this.scene.add.container(x, y);
    this.gfx = this.scene.add.graphics();
    this._drawCube(0, 0, 1.0);
    this.container.add(this.gfx);
    this.glowRing = this.scene.add.graphics();
    this.glowRing.fillStyle(0xe2a840, 0.2);
    this.glowRing.fillEllipse(0, 8, 40, 14);
    this.container.addAt(this.glowRing, 0);
    this.label = this.scene.add.text(0, -22, '💰', { fontSize: 14 }).setOrigin(0.5);
    this.container.add(this.label);
    this.hitZone = this.scene.add.rectangle(0, 0, 40, 40, 0xffffff, 0);
    this.hitZone.setInteractive({ useHandCursor: true, draggable: true });
    this.container.add(this.hitZone);
  }

  _drawCube(ox, oy, scale) {
    const g = this.gfx; g.clear();
    const s = 16 * scale;
    g.fillStyle(0xf0c060, 0.95);
    g.beginPath(); g.moveTo(ox, oy-s); g.lineTo(ox+s, oy-s/2); g.lineTo(ox, oy); g.lineTo(ox-s, oy-s/2); g.closePath(); g.fillPath();
    g.fillStyle(0xc8902a, 0.95);
    g.beginPath(); g.moveTo(ox-s, oy-s/2); g.lineTo(ox, oy); g.lineTo(ox, oy+s/2); g.lineTo(ox-s, oy); g.closePath(); g.fillPath();
    g.fillStyle(0xe2a840, 0.95);
    g.beginPath(); g.moveTo(ox+s, oy-s/2); g.lineTo(ox, oy); g.lineTo(ox, oy+s/2); g.lineTo(ox+s, oy); g.closePath(); g.fillPath();
    g.lineStyle(1, 0xffe080, 0.6);
    g.beginPath(); g.moveTo(ox, oy-s); g.lineTo(ox+s, oy-s/2); g.lineTo(ox, oy); g.lineTo(ox-s, oy-s/2); g.closePath(); g.strokePath();
  }

  _pulse() {
    this.scene.tweens.add({ targets: this.container, y: this.originY - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.scene.tweens.add({ targets: this.glowRing, alpha: { from: 0.2, to: 0.6 }, scaleX: { from: 1, to: 1.3 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  _addDrag() {
    this.scene.input.setDraggable(this.hitZone);
    this.hitZone.on('dragstart', () => {
      this.isDragging = true;
      this.scene.tweens.killTweensOf(this.container);
      this.scene.tweens.add({ targets: this.container, scaleX: 1.2, scaleY: 1.2, duration: 150 });
    });
    this.hitZone.on('drag', (ptr, dx, dy) => {
      this.container.x = ptr.x; this.container.y = ptr.y;
      const nearest = this._nearestDistrict(ptr.x, ptr.y);
      this.scene.districts?.forEach(d => {
        if (d === nearest && this._distanceTo(d, ptr.x, ptr.y) < 120) { d._showGlow(); this.targetDistrict = d; }
        else if (!d.isHovered) d._hideGlow();
      });
    });
    this.hitZone.on('dragend', (ptr) => {
      this.isDragging = false;
      const nearest = this._nearestDistrict(ptr.x, ptr.y);
      if (nearest && this._distanceTo(nearest, ptr.x, ptr.y) < 120) this._dropOnDistrict(nearest);
      else this._returnHome();
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
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.add({
      targets: this.container, x: district.cx, y: district.cy, scaleX: 0.1, scaleY: 0.1, alpha: 0, duration: 300, ease: 'Power2.easeIn',
      onComplete: () => {
        district.receiveResource(this.value);
        this.scene.events.emit('resourceDropped', { district, value: this.value });
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
