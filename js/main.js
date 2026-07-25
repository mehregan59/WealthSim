const DPR = Math.max(2, Math.min(window.devicePixelRatio || 1, 3));

(function patchTextResolution() {
  const F = Phaser.GameObjects.GameObjectFactory.prototype;
  const origText = F.text;
  F.text = function (x, y, text, style) {
    style = style || {};
    if (style.resolution === undefined) style.resolution = DPR;
    return origText.call(this, x, y, text, style);
  };
})();

const BASE_H = 720;
const _aspect = window.innerWidth / Math.max(1, window.innerHeight);
const GAME_W = Math.round(Math.max(1100, Math.min(2100, BASE_H * _aspect)));

const config = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: BASE_H,
  backgroundColor: '#0a1420',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container'
  },
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false
  },
  scene: [Boot, PlayerSetup, RetirementContext, StartingQuestions, GameScene, ProfileScene],
  audio: { disableWebAudio: false }
};

const game = new Phaser.Game(config);
