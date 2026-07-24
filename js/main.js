const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#060e1c',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game-container'
  },
  scene: [Boot, PlayerSetup, RetirementContext, StartingQuestions, GameScene],
  audio: { disableWebAudio: false }
};

const game = new Phaser.Game(config);
