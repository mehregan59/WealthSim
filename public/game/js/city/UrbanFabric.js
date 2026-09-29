// Continuous terrain and civic infill beneath the four interactive districts.
class UrbanFabric {
  constructor(scene, districts) {
    this.scene=scene; this.districts=districts; this.S=scene.S||1;
    this.gfx=scene.add.graphics().setDepth(1);
    this.detailGfx=scene.add.graphics().setDepth(2);
    this._draw();
  }
  s(v){return Math.round(v*this.S);}
  _draw(){
    const g=this.gfx,d=this.detailGfx,W=this.scene.scale.width,H=this.scene.scale.height;
    const left=this.scene.PANEL+this.s(18), top=this.scene.groundY-this.s(8);
    g.fillStyle(0x7ca66f,1); g.fillRect(left,top,W-left,H-top);
    // Broad connected parcels and subtle topographic bands.
    for(let i=0;i<7;i++){
      g.lineStyle(1,i%2?0x5d8e5d:0xa6c78b,0.22);
      g.beginPath(); g.moveTo(left,top+this.s(24+i*52));
      g.lineTo(W,top+this.s(8+i*48)); g.strokePath();
    }
    // Regional rail line.
    const railY=top+this.s(86);
    g.lineStyle(this.s(7),0x6f6f68,0.8); g.lineBetween(left,railY,W,railY+this.s(26));
    g.lineStyle(this.s(1.2),0xe7dfc7,0.8); g.lineBetween(left,railY-this.s(3),W,railY+this.s(23));
    g.lineBetween(left,railY+this.s(3),W,railY+this.s(29));
    for(let x=left;x<W;x+=this.s(20)) g.fillRect(x,railY-this.s(6)+(x-left)*0.025,this.s(3),this.s(12));
    // Shared park and civic infill make the neighborhoods read as one city.
    const cx=this.scene._cx(), cy=top+this.s(112);
    d.fillStyle(0x9bc789,0.95); d.fillRoundedRect(cx-this.s(76),cy-this.s(33),this.s(152),this.s(66),18);
    d.lineStyle(this.s(5),0xe8ddbd,0.82); d.beginPath(); d.moveTo(cx-this.s(65),cy+this.s(18)); d.lineTo(cx,cy-this.s(12)); d.lineTo(cx+this.s(62),cy+this.s(15)); d.strokePath();
    for(let i=0;i<10;i++){
      const a=(i/10)*Math.PI*2,tx=cx+Math.cos(a)*this.s(62),ty=cy+Math.sin(a)*this.s(24);
      d.fillStyle(0x376f48,1); d.fillCircle(tx,ty,this.s(6)); d.fillStyle(0x67553d,1); d.fillRect(tx-this.s(1),ty+this.s(4),this.s(2),this.s(7));
    }
    // Distant low-rise neighborhoods around the playable districts.
    const blocks=[[0.08,0.19],[0.2,0.05],[0.78,0.08],[0.9,0.24],[0.12,0.72],[0.83,0.74]];
    blocks.forEach((p,i)=>{
      const x=left+(W-left)*p[0],y=top+(H-top)*p[1];
      d.fillStyle(i%2?0xe8d8b9:0xf5edd9,0.8); d.fillRoundedRect(x,y,this.s(46),this.s(24),3);
      d.fillStyle(i%2?0xb66e55:0x668e94,0.8); d.fillRect(x,y,this.s(46),this.s(5));
    });
    // Dense urban infill: repeated street-facing buildings bridge the four
    // interactive neighborhoods into one continuous regional city.
    const cityW=W-left;
    const urbanRows=Math.max(4,Math.ceil((H-top-this.s(50))/this.s(92)));
    for(let row=0;row<urbanRows;row++){
      for(let col=0;col<12;col++){
        if((row+col)%5===0)continue;
        const x=left+this.s(16)+col*(cityW-this.s(40))/12+(row%2)*this.s(11);
        const y=top+this.s(38)+row*this.s(92);
        const bw=this.s(22+(col%3)*5),bh=this.s(14+(row+col)%3*6);
        d.fillStyle((row+col)%4===0?0xdcccae:((row+col)%3===0?0xc7d8d2:0xeee5d2),0.82);
        d.fillRoundedRect(x,y,bw,bh,2);
        d.fillStyle((row+col)%4===0?0xb86f55:0x668e94,0.78);d.fillRect(x,y,bw,this.s(4));
        d.fillStyle(0x88aa9e,.45);for(let wx=x+this.s(5);wx<x+bw-this.s(3);wx+=this.s(7))d.fillRect(wx,y+this.s(7),this.s(3),this.s(3));
        if((row+col)%4===1){d.fillStyle(0x39784e,.9);d.fillCircle(x-this.s(7),y+bh,this.s(5));d.fillStyle(0x66533c,1);d.fillRect(x-this.s(8),y+bh,this.s(2),this.s(6));}
      }
    }
    // A visible civic plaza and crosswalks at the central junction.
    d.fillStyle(0xd8d2bf,.94);d.fillCircle(cx,cy+this.s(72),this.s(30));
    d.lineStyle(this.s(3),0xf7f0db,.9);
    for(let i=-3;i<=3;i++)d.lineBetween(cx+this.s(i*7),cy+this.s(48),cx+this.s(i*7),cy+this.s(61));
  }
}