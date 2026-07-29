class WorldButton {
  constructor(scene,x,y,label,callback){
    this.scene=scene;this.x=x;this.y=y;this.label=label;this.callback=callback;
    this.used=false;
    this.container=scene.add.container(x,y).setDepth(70).setAlpha(0);
    this._build();this._appear();
  }
  _build(){
    // Sized at 75% bigger than the original button (44/34/26/18 radii
    // baseline) per explicit request — a clearly oversized, hard-to-miss
    // "move on" moment between steps.
    this.outerRing=this.scene.add.graphics();
    this.outerRing.lineStyle(3,0xe2a840,0.3);this.outerRing.strokeCircle(0,0,77);
    this.container.add(this.outerRing);
    this.midRing=this.scene.add.graphics();
    this.midRing.lineStyle(2,0xe2a840,0.6);this.midRing.strokeCircle(0,0,60);
    this.container.add(this.midRing);
    this.innerCircle=this.scene.add.graphics();
    this.innerCircle.fillStyle(0xe2a840,0.15);this.innerCircle.fillCircle(0,0,46);
    this.innerCircle.fillStyle(0xe2a840,0.4);this.innerCircle.fillCircle(0,0,32);
    this.container.add(this.innerCircle);
    this.arrow=this.scene.add.text(0,0,'▶',{fontSize:28,color:'#f0c060',fontStyle:'bold'}).setOrigin(0.5);
    this.container.add(this.arrow);
    // Single label, stacked directly beneath the circle — one visual unit,
    // not a separate floating chip.
    this.labelBg=this.scene.add.graphics();
    this.labelBg.fillStyle(0x060e1c,0.88);this.labelBg.fillRoundedRect(-91,88,182,46,14);
    this.labelBg.lineStyle(1.4,0xe2a840,0.5);this.labelBg.strokeRoundedRect(-91,88,182,46,14);
    this.container.add(this.labelBg);
    this.labelText=this.scene.add.text(0,110,this.label,{fontFamily:'Georgia,serif',fontSize:21,color:'#f0c060',fontStyle:'bold'}).setOrigin(0.5);
    this.container.add(this.labelText);
    const stem=this.scene.add.graphics();
    stem.lineStyle(1.4,0xe2a840,0.4); stem.lineBetween(0,77,0,88);
    this.container.add(stem);
    const shadow=this.scene.add.graphics();shadow.fillStyle(0x000000,0.2);shadow.fillEllipse(0,63,105,28);
    this.container.addAt(shadow,0);
    this.hitZone=this.scene.add.circle(0,0,77,0xffffff,0).setInteractive({useHandCursor:true});
    this.container.add(this.hitZone);
    this.hitZone.on('pointerover',()=>{if(this.used)return;this.scene.tweens.add({targets:this.container,scaleX:1.08,scaleY:1.08,duration:180});this.innerCircle.clear();this.innerCircle.fillStyle(0xe2a840,0.3);this.innerCircle.fillCircle(0,0,46);this.innerCircle.fillStyle(0xe2a840,0.7);this.innerCircle.fillCircle(0,0,32);});
    this.hitZone.on('pointerout',()=>{if(this.used)return;this.scene.tweens.add({targets:this.container,scaleX:1,scaleY:1,duration:180});this.innerCircle.clear();this.innerCircle.fillStyle(0xe2a840,0.15);this.innerCircle.fillCircle(0,0,46);this.innerCircle.fillStyle(0xe2a840,0.4);this.innerCircle.fillCircle(0,0,32);});
    this.hitZone.on('pointerdown',()=>{
      // Guard against a second pointerdown (double-tap, or a click landing
      // mid hover-tween) firing the disappear/callback sequence twice —
      // that race is what left the button stuck on screen.
      if(this.used) return;
      this.used=true;
      this.hitZone.disableInteractive();
      this.scene.cameras.main.shake(80,0.003);
      this._disappear(()=>{if(this.callback)this.callback();});
    });
  }
  _appear(){
    for(let i=0;i<8;i++){const angle=(i/8)*Math.PI*2;const p=this.scene.add.graphics().setDepth(71);p.fillStyle(0xe2a840,0.8);p.fillCircle(0,0,3);p.setPosition(this.x,this.y);this.scene.tweens.add({targets:p,x:this.x+Math.cos(angle)*96,y:this.y+Math.sin(angle)*96,alpha:0,duration:500,onComplete:()=>p.destroy()});}
    this.container.setScale(0.3);
    this.scene.tweens.add({targets:this.container,alpha:1,scaleX:1,scaleY:1,duration:500,ease:'Back.easeOut'});
    this.scene.tweens.add({targets:this.outerRing,scaleX:{from:0.85,to:1.4},scaleY:{from:0.85,to:1.4},alpha:{from:0.5,to:0},duration:1400,repeat:-1});
    this.scene.tweens.add({targets:this.midRing,alpha:{from:0.8,to:0.3},duration:800,yoyo:true,repeat:-1});
    this.scene.tweens.add({targets:this.container,y:this.y-14,duration:1100,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    this.scene.tweens.add({targets:this.arrow,x:5,duration:500,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  }
  _disappear(callback){
    this.scene.tweens.killTweensOf(this.container);this.scene.tweens.killTweensOf(this.outerRing);this.scene.tweens.killTweensOf(this.midRing);this.scene.tweens.killTweensOf(this.arrow);
    this.scene.tweens.add({targets:this.container,alpha:0,scaleX:1.5,scaleY:1.5,duration:350,ease:'Power2.easeIn',onComplete:()=>{try{this.container.destroy();}catch(e){}if(callback)callback();}});
  }
  destroy(){
    this.used=true;
    try{ if(this.hitZone) this.hitZone.disableInteractive(); }catch(e){}
    this.scene.tweens.killTweensOf(this.container);this.scene.tweens.killTweensOf(this.outerRing);this.scene.tweens.killTweensOf(this.midRing);this.scene.tweens.killTweensOf(this.arrow);
    try{this.container.destroy();}catch(e){}
  }
}
