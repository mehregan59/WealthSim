class Boot extends Phaser.Scene {
  constructor() { super({ key: 'Boot' }); }
  preload() {
    const W=this.scale.width, H=this.scale.height;
    // Painted regional-city artwork used as the playable backdrop.
    this.load.image('cityPanorama', (window.WS_ASSET_BASE||'/game/assets/')+'city-panorama.jpg');
    const bar=this.add.graphics();
    const progress=this.add.graphics();
    const text=this.add.text(W/2, H/2-50, 'Building your city...', {
      fontFamily:CityTheme.heading, fontSize:22, color:'#296b72'
    }).setOrigin(0.5);
    bar.fillStyle(0xd7e3d5).fillRoundedRect(W/2-200, H/2-10, 400, 20, 10);
    this.load.on('progress', v => {
      progress.clear();
      progress.fillStyle(0xe0a82e).fillRoundedRect(W/2-200, H/2-10, 400*v, 20, 10);
    });
    this.load.on('complete', () => { text.destroy(); bar.destroy(); progress.destroy(); });
  }
  create() {
    this.scene.start('PlayerSetup');
  }
}
