// Shared visual language for every WealthSim scene.
const CityTheme = {
  colors: {
    sky: 0xa7d8de, skyDeep: 0x78bac5, land: 0x82ad72, landDark: 0x5d9b62,
    cream: 0xf2e7c9, paper: 0xfffbf1, teal: 0x296b72, tealDark: 0x174d52,
    gold: 0xe0a82e, ink: 0x173b40, muted: 0x55777a, road: 0x485b5b,
    pavement: 0xc9c9b7, white: 0xffffff, danger: 0xc85848,
  },
  heading: 'Space Grotesk, Arial, sans-serif',
  body: 'DM Sans, Arial, sans-serif',

  drawBackdrop(scene, options) {
    const W=scene.scale.width,H=scene.scale.height,o=options||{};
    const g=scene.add.graphics().setDepth(o.depth===undefined?-20:o.depth);
    g.fillStyle(this.colors.sky,1); g.fillRect(0,0,W,H);
    g.fillStyle(0xd9eef0,0.72); g.fillRect(0,H*0.34,W,H*0.16);
    g.fillStyle(this.colors.land,1); g.fillRect(0,H*0.48,W,H*0.52);
    g.fillStyle(this.colors.landDark,0.34); g.fillRect(0,H*0.72,W,H*0.28);
    // Distant connected skyline, roads and tree belt preview the playable city.
    const horizon=H*0.5;
    g.fillStyle(0x6b9580,0.46);
    for(let x=-20,i=0;x<W+40;x+=54,i++){
      const h=18+(i%4)*7;
      g.fillRoundedRect(x,horizon-h,42,h,3);
      if(i%3===0) g.fillRect(x+17,horizon-h-12,8,12);
    }
    g.fillStyle(this.colors.road,0.72);
    g.beginPath(); g.moveTo(W*0.38,H); g.lineTo(W*0.47,horizon); g.lineTo(W*0.53,horizon); g.lineTo(W*0.72,H); g.closePath(); g.fillPath();
    g.lineStyle(2,0xf4d576,0.65); g.lineBetween(W*0.55,H,W*0.50,horizon);
    for(let x=18;x<W;x+=58){
      g.fillStyle(0x3f7f55,0.95); g.fillCircle(x,horizon+18+(x%3)*5,10);
      g.fillStyle(0x6b5942,0.9); g.fillRect(x-2,horizon+22,4,12);
    }
    return g;
  },

  panel(g,x,y,w,h,accent) {
    g.fillStyle(this.colors.paper,0.96); g.fillRoundedRect(x,y,w,h,10);
    g.lineStyle(1,accent||this.colors.teal,0.28); g.strokeRoundedRect(x,y,w,h,10);
  }
};