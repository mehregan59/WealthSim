class HUD {
  constructor(scene) {
    this.scene = scene; this.container = scene.add.container(0,0).setDepth(50);
    this.statBars = {}; this.year = 2024;
    this._build();
  }

  _build() {
    const W = 1280;
    const topBg = this.scene.add.graphics();
    topBg.fillStyle(0x060e1c,0.85); topBg.fillRect(0,0,W,48);
    topBg.lineStyle(1,0x1a2744,1); topBg.lineBetween(0,48,W,48);
    this.container.add(topBg);
    this.levelText = this.scene.add.text(20,14,'LEVEL 1',{fontFamily:'Georgia,serif',fontSize:13,color:'#e2a840',letterSpacing:3});
    this.container.add(this.levelText);
    this.yearText = this.scene.add.text(120,14,'Year 2024',{fontFamily:'Arial,sans-serif',fontSize:12,color:'#6b8aaa'});
    this.container.add(this.yearText);
    const stats = [{id:'happiness',label:'❤',color:0xe74c7c,x:W-360},{id:'development',label:'🏗',color:0x4ecdc4,x:W-240},{id:'resources',label:'💰',color:0xe2a840,x:W-120}];
    stats.forEach(stat => {
      const icon = this.scene.add.text(stat.x,8,stat.label,{fontSize:14});
      const barBg = this.scene.add.graphics();
      barBg.fillStyle(0x1a2744,1); barBg.fillRoundedRect(stat.x+20,16,80,8,4);
      const barFill = this.scene.add.graphics();
      this.statBars[stat.id] = {fill:barFill,color:stat.color,x:stat.x+20,maxW:80};
      this.container.add([icon,barBg,barFill]);
    });
    this.hintText = this.scene.add.text(W/2,700,'',{fontFamily:'Arial,sans-serif',fontSize:13,color:'#6b8aaa',alpha:0.8}).setOrigin(0.5);
    this.container.add(this.hintText);
    const keyHint = this.scene.add.text(W-20,700,'S=Storm  R=Resource  1/2/3/5=Level',{fontFamily:'Arial,sans-serif',fontSize:11,color:'#2a3a5a'}).setOrigin(1,0.5);
    this.container.add(keyHint);
  }

  updateStats(happiness,development,resources) {
    const vals={happiness,development,resources};
    Object.entries(this.statBars).forEach(([id,bar]) => {
      const pct=Math.max(0,Math.min(100,vals[id]))/100;
      bar.fill.clear(); bar.fill.fillStyle(bar.color,0.9); bar.fill.fillRoundedRect(bar.x,16,bar.maxW*pct,8,4);
    });
  }

  setLevel(num,name) { this.levelText.setText('LEVEL '+num); this.showHint(name); }

  advanceYear(years) {
    this.year+=years||1;
    this.scene.tweens.add({targets:this.yearText,alpha:{from:0,to:1},duration:500,onStart:()=>this.yearText.setText('Year '+this.year)});
  }

  showHint(text) {
    this.hintText.setText(text); this.hintText.setAlpha(0);
    this.scene.tweens.add({targets:this.hintText,alpha:0.8,duration:400,hold:3000,yoyo:true});
  }

  showMessage(text,duration) {
    const W=1280,H=720;
    const msg=this.scene.add.text(W/2,H-80,text,{fontFamily:'Georgia,serif',fontSize:18,color:'#e2a840',backgroundColor:'#060e1c',padding:{x:20,y:10}}).setOrigin(0.5).setDepth(60).setAlpha(0);
    this.scene.tweens.add({targets:msg,alpha:1,y:H-90,duration:400,hold:duration||2500,yoyo:true,onComplete:()=>msg.destroy()});
  }

  showLevelTitle(levelNum,title) {
    const W=1280,H=720;
    const overlay=this.scene.add.graphics().setDepth(55);
    overlay.fillStyle(0x060e1c,0.7); overlay.fillRect(0,H/2-60,W,120);
    const lvlLabel=this.scene.add.text(W/2,H/2-25,'LEVEL '+levelNum,{fontFamily:'Arial,sans-serif',fontSize:12,color:'#e2a840',letterSpacing:6}).setOrigin(0.5).setDepth(56).setAlpha(0);
    const titleLabel=this.scene.add.text(W/2,H/2+10,title,{fontFamily:'Georgia,serif',fontSize:32,color:'#f0f4ff'}).setOrigin(0.5).setDepth(56).setAlpha(0);
    this.scene.tweens.add({targets:[lvlLabel,titleLabel,overlay],alpha:1,duration:600,hold:1800,yoyo:true,onComplete:()=>{overlay.destroy();lvlLabel.destroy();titleLabel.destroy();}});
  }
}
