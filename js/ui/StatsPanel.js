class StatsPanel {
  constructor(scene){
    this.scene=scene;
    this.container=scene.add.container(0,0).setDepth(55);
    this.bars={};
    this._build();
  }

  _build(){
    // LEFT side panel
    const px=8, py=68, pw=90, ph=225;
    const bg=this.scene.add.graphics();
    bg.fillStyle(0x060e1c,0.88); bg.fillRoundedRect(px,py,pw,ph,10);
    bg.lineStyle(1,0x1a2744,1); bg.strokeRoundedRect(px,py,pw,ph,10);
    // Accent line on RIGHT edge of panel
    bg.lineStyle(2,0xe2a840,0.35); bg.lineBetween(px+pw,py,px+pw,py+ph);
    this.container.add(bg);

    const title=this.scene.add.text(px+pw/2,py+14,'CITY',{
      fontFamily:'Arial,sans-serif',fontSize:9,color:'#e2a840',letterSpacing:4
    }).setOrigin(0.5);
    this.container.add(title);

    const stats=[
      {id:'happiness',  icon:'❤', label:'Happy',  color:0xe74c7c, y:py+36},
      {id:'development',icon:'🏗', label:'Growth', color:0x4ecdc4, y:py+93},
      {id:'resources',  icon:'💰', label:'Funds',  color:0xe2a840, y:py+150}
    ];

    stats.forEach(stat=>{
      const icon=this.scene.add.text(px+pw/2,stat.y,stat.icon,{fontSize:18}).setOrigin(0.5);
      const lbl=this.scene.add.text(px+pw/2,stat.y+22,stat.label,{
        fontFamily:'Arial,sans-serif',fontSize:9,color:'#6b8aaa'
      }).setOrigin(0.5);
      const barBg=this.scene.add.graphics();
      barBg.fillStyle(0x1a2744,1);
      barBg.fillRoundedRect(px+10,stat.y+34,pw-20,8,4);
      const barFill=this.scene.add.graphics();
      this.bars[stat.id]={
        fill:barFill, color:stat.color,
        x:px+10, y:stat.y+34, maxW:pw-20,
        displayValue:50
      };
      const valText=this.scene.add.text(px+pw/2,stat.y+46,'50',{
        fontFamily:'Arial,sans-serif',fontSize:9,color:'#4a6080'
      }).setOrigin(0.5);
      this.bars[stat.id].text=valText;
      this.container.add([icon,lbl,barBg,barFill,valText]);
    });

    this._redrawBars();
  }

  updateStats(happiness,development,resources){
    const vals={happiness,development,resources};
    Object.entries(this.bars).forEach(([id,bar])=>{
      const target=Math.max(0,Math.min(100,vals[id]));
      this.scene.tweens.add({
        targets:bar, displayValue:target, duration:600, ease:'Power2.easeOut',
        onUpdate:()=>this._redrawBar(id)
      });
    });
  }

  _redrawBars(){ Object.keys(this.bars).forEach(id=>this._redrawBar(id)); }

  _redrawBar(id){
    const bar=this.bars[id];
    const pct=bar.displayValue/100;
    bar.fill.clear();
    if(pct>0.1){ bar.fill.fillStyle(bar.color,0.1); bar.fill.fillRoundedRect(bar.x,bar.y,bar.maxW,8,4); }
    bar.fill.fillStyle(bar.color,0.9);
    bar.fill.fillRoundedRect(bar.x,bar.y,bar.maxW*pct,8,4);
    if(bar.text){
      bar.text.setText(Math.round(bar.displayValue));
      bar.text.setColor(pct<0.3?'#e74c3c':pct>0.7?'#4ecdc4':'#6b8aaa');
    }
  }
}
