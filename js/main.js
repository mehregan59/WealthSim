// ── Crisp text ────────────────────────────────────────────
// Two things are required for sharp text in Phaser 3:
//  1. The canvas must render at NATIVE size (no FIT upscaling).
//  2. Each Text object needs its own `resolution` (game config is a no-op).
window.WS_TEXT_RES = Math.max(2, Math.min(window.devicePixelRatio || 1, 3));

(function patchText() {
  const F = Phaser.GameObjects.GameObjectFactory.prototype;
  const orig = F.text;
  F.text = function (x, y, text, style) {
    style = style || {};
    if (style.resolution === undefined) style.resolution = window.WS_TEXT_RES;
    return orig.call(this, x, y, text, style);
  };
})();

// Live text-resolution change from the in-game settings control
window.WS_setTextRes = function (r) {
  window.WS_TEXT_RES = r;
  const scenes = (window.WS_game && window.WS_game.scene) ? window.WS_game.scene.getScenes(true) : [];
  scenes.forEach(function (sc) { sc.scene.restart(); });
};

// ── Native-resolution sizing ──────────────────────────────────
// RESIZE mode makes the canvas match its parent 1:1 in CSS pixels, so
// nothing is stretched. Scenes scale layout from a 720 design height.
const config = {
  type: Phaser.AUTO,
  backgroundColor: '#0a1420',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER,
    parent: 'game-container',
    width: '100%',
    height: '100%'
  },
  render: { antialias: true, antialiasGL: true, pixelArt: false, roundPixels: false },
  scene: [Boot, PlayerSetup, RetirementContext, StartingQuestions, GameScene, ProfileScene],
  audio: { disableWebAudio: false }
};

const game = new Phaser.Game(config);
window.WS_game = game;
