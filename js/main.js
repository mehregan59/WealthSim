// Detect device pixel ratio for crisp rendering on retina/HiDPI screens
const DPR = Math.min(window.devicePixelRatio || 1, 3);

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#060e1c',
  resolution: DPR,
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
  scene: [Boot, PlayerSetup, RetirementContext, StartingQuestions, GameScene],
  audio: { disableWebAudio: false }
};

const game = new Phaser.Game(config);
