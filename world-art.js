'use strict';

// Illustrated scenery. All walkable top edges stay at their physics coordinates.
// These functions replace the prototype scenery without changing game logic.
function waGradient(x,y,xx,yy,stops){const g=ctx.createLinearGradient(x,y,xx,yy);stops.forEach((c,i)=>g.addColorStop(i/(stops.length-1),c));return g;}
function waStroke(color,width,draw){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();draw();ctx.stroke();}
function waLeaf(x,y,size,angle,color){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-size*.18,-size*.66,size*.3,-size*.91,size*.8,-size);ctx.bezierCurveTo(size*.7,-size*.22,size*.25,size*.15,0,0);ctx.fill();ctx.restore();}
function waCrownKind(seed){
 const type=((Math.floor(seed)%3)+3)%3;
 // Hanging willow curtains are occasional accents. Most trees have a leafy,
 // rounded edge, so a whole forest no longer reads as dripping gel.
 return type===1&&noise(seed+83)<.62?0:type;
}
function waCrownPath(x,y,rx,ry,seed){
 const type=waCrownKind(seed);
 if(type===1){
  // Willow: one vaulted mass falls into unequal curtains around the trunk.
  ctx.moveTo(x-rx*.91,y+ry*.43);ctx.bezierCurveTo(x-rx*1.11,y-ry*.05,x-rx*.8,y-ry*.72,x-rx*.42,y-ry*.79);ctx.bezierCurveTo(x-rx*.1,y-ry*1.03,x+rx*.35,y-ry*.92,x+rx*.66,y-ry*.52);ctx.bezierCurveTo(x+rx*.98,y-ry*.4,x+rx*1.06,y+ry*.21,x+rx*.83,y+ry*.77);ctx.quadraticCurveTo(x+rx*.68,y+ry*.98,x+rx*.55,y+ry*.36);ctx.quadraticCurveTo(x+rx*.44,y+ry*.91,x+rx*.3,y+ry*.5);ctx.quadraticCurveTo(x+rx*.17,y+ry*.72,x+rx*.03,y+ry*.26);ctx.quadraticCurveTo(x-rx*.16,y+ry*.5,x-rx*.23,y+ry*.16);ctx.quadraticCurveTo(x-rx*.37,y+ry*.77,x-rx*.52,y+ry*.45);ctx.quadraticCurveTo(x-rx*.64,y+ry*.98,x-rx*.78,y+ry*.5);ctx.quadraticCurveTo(x-rx*.83,y+ry*.88,x-rx*.91,y+ry*.43);
 }else if(type===2){
  // Cedar: rounded swept shoulders, with a single tall curved crown.
  ctx.moveTo(x-rx*.91,y+ry*.45);ctx.bezierCurveTo(x-rx*.83,y+ry*.09,x-rx*.56,y+ry*.14,x-rx*.62,y-ry*.14);ctx.bezierCurveTo(x-rx*.71,y-ry*.31,x-rx*.26,y-ry*.39,x-rx*.28,y-ry*.61);ctx.bezierCurveTo(x-rx*.35,y-ry*.89,x+rx*.12,y-ry*1.08,x+rx*.18,y-ry*.91);ctx.bezierCurveTo(x+rx*.21,y-ry*.56,x+rx*.49,y-ry*.53,x+rx*.62,y-ry*.26);ctx.bezierCurveTo(x+rx*.8,y-ry*.21,x+rx*.6,y+ry*.06,x+rx*.81,y+ry*.18);ctx.quadraticCurveTo(x+rx*1.01,y+ry*.38,x+rx*.91,y+ry*.53);ctx.bezierCurveTo(x+rx*.62,y+ry*.66,x+rx*.38,y+ry*.52,x+rx*.12,y+ry*.59);ctx.bezierCurveTo(x-rx*.24,y+ry*.75,x-rx*.5,y+ry*.54,x-rx*.91,y+ry*.45);
 }else{
  // An arched broadleaf crown leans organically rather than repeating three puffs.
  ctx.moveTo(x-rx*.92,y+ry*.12);ctx.bezierCurveTo(x-rx*1.03,y-ry*.29,x-rx*.69,y-ry*.62,x-rx*.43,y-ry*.56);ctx.bezierCurveTo(x-rx*.34,y-ry*.93,x+rx*.08,y-ry*.95,x+rx*.31,y-ry*.64);ctx.bezierCurveTo(x+rx*.51,y-ry*.78,x+rx*.8,y-ry*.42,x+rx*.77,y-ry*.2);ctx.bezierCurveTo(x+rx*1.05,y-ry*.01,x+rx*.96,y+ry*.44,x+rx*.62,y+ry*.47);ctx.bezierCurveTo(x+rx*.4,y+ry*.66,x+rx*.02,y+ry*.45,x-rx*.13,y+ry*.61);ctx.bezierCurveTo(x-rx*.4,y+ry*.78,x-rx*.73,y+ry*.39,x-rx*.84,y+ry*.34);ctx.quadraticCurveTo(x-rx,y+ry*.29,x-rx*.92,y+ry*.12);
 }
 ctx.closePath();
}
function waCanopy(x,y,rx,ry,seed,far=false){
 const day=world.day;
 ctx.fillStyle=waGradient(x,y-ry,x+rx*.25,y+ry,far?(day?['#779e9c','#568897']:['#2e516c','#28465e']):(day?['#a7c48b','#679865','#335f58']:['#87ac91','#568774','#294e55']));
 ctx.beginPath();waCrownPath(x,y,rx,ry,seed);ctx.fill();
 if(far)return;
 // Dappled volume is broad and soft; small brush-shaped leaves sit within the mass.
 ctx.save();ctx.clip();
 const shade=ctx.createRadialGradient(x+rx*.2,y+ry*.15,2,x+rx*.2,y+ry*.15,rx*.72);shade.addColorStop(0,day?'#1c66732d':'#103d602d');shade.addColorStop(1,'#ffffff00');ctx.fillStyle=shade;ctx.fillRect(x-rx*.55,y-ry*.38,rx*1.2,ry*.93);
 const light=ctx.createRadialGradient(x-rx*.35,y-ry*.48,0,x-rx*.35,y-ry*.48,rx*.63);light.addColorStop(0,day?'#eeefb32e':'#bce8d426');light.addColorStop(1,'#ffffff00');ctx.fillStyle=light;ctx.fillRect(x-rx*.8,y-ry*.94,rx,ry*.82);
 ctx.restore();
 ctx.save();ctx.beginPath();waCrownPath(x,y,rx,ry,seed);ctx.clip();
 waStroke(day?'#d2e4af57':'#b4edce49',1.4,()=>{ctx.moveTo(x-rx*.82,y-ry*.22);ctx.bezierCurveTo(x-rx*.78,y-ry*.65,x-rx*.59,y-ry*.8,x-rx*.38,y-ry*.74);});
 for(let j=0;j<23;j++){const xx=x+(noise(seed+j*5)-.5)*rx*1.5,yy=y+(noise(seed+j*11)-.5)*ry*.88;waLeaf(xx,yy,4+noise(seed+j*7)*8,-1+noise(j+seed)*2,day?'#d3e3b538':'#a1dfc537');}
 if(waCrownKind(seed)===1)for(let j=-3;j<4;j++)waStroke(day?'#dce3b633':'#b1e2d032',.8,()=>{ctx.moveTo(x+j*rx*.2,y-ry*.37);ctx.bezierCurveTo(x+j*rx*.22,y-ry*.04,x+j*rx*.25,y+ry*.3,x+j*rx*.23,y+ry*.67);});
 ctx.restore();
}
function waTrunk(x,base,h,width,color,seed,canopies=true,far=false){
 const sway=(noise(seed+8)-.5)*h*.18,crownY=base-h*.77;
 ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x-width*1.3,base);
 ctx.bezierCurveTo(x-width*.4,base-h*.17,x-width*.9+sway*.4,base-h*.51,x+sway-width*.28,crownY+12);
 ctx.lineTo(x+sway+width*.27,crownY+9);
 ctx.bezierCurveTo(x+width*.55+sway*.4,base-h*.55,x+width*.2,base-h*.22,x+width*1.35,base);
 ctx.quadraticCurveTo(x+width*.6,base-4,x,base-3);ctx.quadraticCurveTo(x-width*.6,base-4,x-width*1.3,base);ctx.closePath();
 if(far){
  // One union fill means the hazy crown and trunk share identical opacity.
  // Branches never poke through a translucent canopy.
  if(canopies)waCrownPath(x+sway,crownY,h*.4,h*.34,seed);ctx.fill();return;
 }
 ctx.fill();
 for(let j=0;j<2;j++)waStroke(color,width*.55,()=>{const side=j?1:-1;ctx.moveTo(x+sway*.25,base-h*.42);ctx.bezierCurveTo(x+sway*.6,base-h*.59,x+sway+side*h*.15,crownY+h*.12,x+sway+side*h*.2,crownY+h*.04);});
 if(!far){waStroke(world.day?'#b9cbae36':'#91c9c33a',1.4,()=>{ctx.moveTo(x-width*.23,base-8);ctx.bezierCurveTo(x+width*.1,base-h*.35,x-width*.35+sway*.5,base-h*.52,x+sway-1,crownY+42);});for(let j=0;j<3;j++)waStroke('#122c3b24',1.2,()=>{ctx.moveTo(x+(j-1)*width*.23,base-24);ctx.quadraticCurveTo(x+width*.7,base-h*.3,x+(j-1)*width*.19+sway*.4,base-h*.51);});}
 if(canopies)waCanopy(x+sway+h*(noise(seed+3)-.5)*.06,crownY,h*(.38+noise(seed+1)*.06),h*(.32+noise(seed+6)*.045),seed,false);
}
function waMist(y,color,phase=0){
 const g=ctx.createLinearGradient(0,y-45,0,y+65);g.addColorStop(0,'#ffffff00');g.addColorStop(.5,color);g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(0,y-45,viewW,110);
 for(let j=0;j<3;j++)ellipse(viewW*(j*.42-.04)+Math.sin(time*.12+j+phase)*35,y+Math.sin(j)*12,viewW*.38,12,color);
}
function waCloud(x,y,w,h,opacity=1){ctx.save();ctx.globalAlpha*=opacity;ctx.fillStyle=waGradient(x,y-h,x,y+h,['#fffaf0','#e7f1f5','#bfd6e8']);ctx.beginPath();ctx.moveTo(x-w,y+h*.2);ctx.bezierCurveTo(x-w*1.2,y-h*.25,x-w*.6,y-h*.6,x-w*.42,y-h*.48);ctx.bezierCurveTo(x-w*.25,y-h*1.18,x+w*.16,y-h*1.15,x+w*.33,y-h*.5);ctx.bezierCurveTo(x+w*.74,y-h*.63,x+w*1.13,y-h*.16,x+w*.94,y+h*.2);ctx.bezierCurveTo(x+w*.5,y+h*.67,x-w*.6,y+h*.58,x-w,y+h*.2);ctx.fill();ctx.restore();}
function waRuin(x,base,scale,seed,distant=false){
 const day=world.day;ctx.save();ctx.translate(x,base);ctx.scale(scale,scale);
 const variant=((seed%3)+3)%3;
 const stone=waGradient(-140,-230,160,10,day?['#a894a6','#8b839e','#6f718d']:['#645770','#4c4566','#353a59']);
 ctx.globalAlpha=distant?.35:.7;
 // Two joined towers support a continuous arch with a deliberately missing span.
 for(const side of [-1,1]){ctx.fillStyle=stone;ctx.beginPath();ctx.moveTo(side*87,0);ctx.lineTo(side*89,-163);ctx.quadraticCurveTo(side*92,-176,side*100,-182);ctx.lineTo(side*118,-188);ctx.lineTo(side*126,-171);ctx.lineTo(side*123,0);ctx.closePath();ctx.fill();
  rounded(side*105-25,-27,50,15,3,day?'#a394a67a':'#64547477');rounded(side*105-23,-166,46,10,3,day?'#c1aba96a':'#8c748666');
 }
 waStroke(stone,27,()=>{ctx.moveTo(-104,-166);ctx.bezierCurveTo(-103,-241,-49,-276,variant===1?-19:2,-268);if(variant!==1){ctx.moveTo(27,-263);ctx.bezierCurveTo(77,-253,105,-221,107,-172);}else{ctx.moveTo(74,-209);ctx.quadraticCurveTo(108,-190,107,-172);}});
 waStroke(day?'#edd3b984':'#b69a9c74',2,()=>{ctx.moveTo(-109,-169);ctx.bezierCurveTo(-107,-235,-60,-266,variant===1?-23:-10,-270);if(variant!==1){ctx.moveTo(32,-265);ctx.quadraticCurveTo(96,-249,110,-185);}});
 if(variant===2){
  // A sun shrine has a shallow scalloped roof over the normal broken gate.
  ctx.fillStyle=stone;ctx.beginPath();ctx.moveTo(-53,-282);ctx.quadraticCurveTo(-32,-298,0,-300);ctx.quadraticCurveTo(35,-299,54,-280);ctx.lineTo(46,-270);ctx.quadraticCurveTo(5,-282,-45,-271);ctx.closePath();ctx.fill();
  star(0,-285,7,'#e9d0a583');
 }
 for(const side of [-1,1])for(let j=0;j<5;j++)line(side*91,-135+j*26,side*121,-134+j*26,day?'#c3b0a357':'#927d9950',1);
 if(!distant){
  for(const side of [-1,1]){for(let j=0;j<2;j++){const vx=side*(92+j*10),end=80+noise(seed+j)*35;waStroke(day?'#4e77767c':'#47787a99',2,()=>{ctx.moveTo(vx,-177);ctx.bezierCurveTo(vx-18,-144,vx+16,-121,vx-4,-177+end);});for(let k=0;k<5;k++)waLeaf(vx+Math.sin(k*1.7+j)*6,-173+k*17,9,-.6+(k%2?1.6:0),day?'#709988aa':'#67aa98aa');}}
  const yy=-107;glow(0,yy,112,day?'#ffe19c43':'#edc9973a');ctx.strokeStyle='#edcb93a0';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,yy,33,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#f8e4b46a';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(0,yy,39,0,Math.PI*2);ctx.stroke();for(let j=0;j<8;j++){const a=j*Math.PI/4;line(Math.cos(a)*29,yy+Math.sin(a)*29,Math.cos(a)*34,yy+Math.sin(a)*34,'#fae7b699',1.4);}star(0,yy,12,'#ffe0a982');
  ctx.fillStyle='#ffe6b009';ctx.beginPath();ctx.moveTo(-15,-233);ctx.lineTo(-87,26);ctx.lineTo(88,26);ctx.lineTo(17,-233);ctx.fill();
 }
 ctx.restore();
}
function waObservatory(x,y,scale,seed){
 const day=world.day;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=.69;
 const stone=waGradient(-80,-240,70,80,day?['#b9add1','#7b82ac','#505f8b']:['#7a82b2','#455d8c','#2a3d68']);
 // Curved floating island, with roots joining its underside rather than cutout triangles.
 ctx.fillStyle=stone;ctx.beginPath();ctx.moveTo(-104,0);ctx.quadraticCurveTo(-99,26,-56,30);ctx.bezierCurveTo(-48,60,-25,75,-6,82);ctx.quadraticCurveTo(0,61,12,58);ctx.bezierCurveTo(45,62,64,38,62,26);ctx.quadraticCurveTo(91,29,106,0);ctx.closePath();ctx.fill();ellipse(0,0,107,12,day?'#b4bbd066':'#7babc66b');
 waStroke('#b2deee55',1.4,()=>{ctx.moveTo(-92,7);ctx.quadraticCurveTo(-33,15,67,8);});
 // Tower whose dome, drum and plinth share one silhouette.
 rounded(-58,-138,116,138,9,stone);rounded(-64,-16,128,15,4,day?'#c2b1d077':'#8496bc88');
 ctx.fillStyle=waGradient(0,-210,0,-137,day?['#c9b8d6','#8196ba']:['#98a2ce','#54739e']);ctx.beginPath();ctx.moveTo(-60,-137);ctx.bezierCurveTo(-59,-173,-36,-199,0,-199);ctx.bezierCurveTo(39,-199,59,-173,60,-137);ctx.closePath();ctx.fill();
 waStroke('#b7dce9aa',2,()=>{ctx.moveTo(-55,-139);ctx.quadraticCurveTo(-41,-190,-8,-193);});
 rounded(-67,-140,134,8,3,day?'#ccbcd6aa':'#a7bdcfaa');line(0,-199,0,-216,'#d1e4f0',2);star(0,-219,5,'#f2dfb4');
 for(const j of [-1,0,1]){const xx=j*30;glow(xx,-80,37,'#b6f5ef4a');rounded(xx-9,-112,18,58,9,day?'#daf7f0ba':'#a7e9e6b0');line(xx-7,-103,xx-7,-62,'#fbf8e8a0',1);}
 for(const side of [-1,1]){waStroke('#e4d3b67a',1.4,()=>{ctx.moveTo(side*48,-113);ctx.lineTo(side*48,-29);});circle(side*48,-28,3,'#e4d3b67a');}
 if(noise(seed+12)>.45){
  // The library annex is joined to a balcony, making alternate towers different.
  rounded(52,-61,38,53,5,stone);ctx.fillStyle=waGradient(50,-79,70,-54,day?['#c3b9d7','#7e91b5']:['#8b9dbe','#52739b']);ctx.beginPath();ctx.moveTo(49,-62);ctx.quadraticCurveTo(70,-95,91,-62);ctx.closePath();ctx.fill();
  glow(71,-43,23,'#b6f4e746');rounded(66,-53,10,25,5,'#c5eee7a3');waStroke('#b5d8d783',1.2,()=>{ctx.moveTo(46,-8);ctx.lineTo(101,-8);ctx.moveTo(61,-8);ctx.quadraticCurveTo(65,13,39,18);});
 }
 // A sculpted armillary sphere at the top, with one small planet.
 ctx.strokeStyle='#e8d8b180';ctx.lineWidth=1.2;for(let j=0;j<2;j++){ctx.beginPath();ctx.ellipse(0,-245,68,20,-.35+j*.6,0,Math.PI*2);ctx.stroke();}glow(52,-257,17,'#f8d99439');circle(52,-257,5,'#ecd69f');
 ctx.restore();
}
function waDistantTemple(x,base,height,width,seed){
 const day=world.day,w=width;
 ctx.fillStyle=waGradient(x,base-height-35,x,base+100,day?['#7c8ea0','#717d99','#8c92a08a']:['#3c547a','#425573','#6a738b70']);
 ctx.beginPath();ctx.moveTo(x-w*.5,base+70);ctx.lineTo(x-w*.5,base-height*.56);ctx.quadraticCurveTo(x-w*.47,base-height*.69,x-w*.33,base-height*.66);ctx.lineTo(x-w*.31,base-height);ctx.lineTo(x-w*.2,base-height);
 ctx.bezierCurveTo(x-w*.18,base-height-48,x+w*.19,base-height-48,x+w*.21,base-height);ctx.lineTo(x+w*.35,base-height);ctx.lineTo(x+w*.38,base-height*.61);ctx.quadraticCurveTo(x+w*.55,base-height*.62,x+w*.54,base-height*.49);ctx.lineTo(x+w*.54,base+70);ctx.closePath();ctx.fill();
 // Shadowed window recesses make these silhouettes inhabited and architectural.
 for(let j=-1;j<=1;j++){const xx=x+j*w*.17,yy=base-height*.78;ctx.fillStyle=day?'#44577647':'#152b4c50';ctx.beginPath();ctx.moveTo(xx-6,yy+40);ctx.lineTo(xx-6,yy+8);ctx.quadraticCurveTo(xx,yy-4,xx+6,yy+8);ctx.lineTo(xx+6,yy+40);ctx.closePath();ctx.fill();}
 line(x-w*.34,base-height-2,x+w*.36,base-height-2,day?'#d2c0b332':'#bbc2d62d',1.5);
}
function waCelestialLandmark(x,y){
 const day=world.day;ctx.save();ctx.translate(x,y);ctx.globalAlpha=.24;
 const stone=waGradient(-230,-240,140,130,day?['#7290b7','#6d80a9','#9cacbf']:['#45658a','#355277','#7699af']);
 // A distant linked cathedral dominates the skyline once per level.
 ctx.fillStyle=stone;ctx.beginPath();ctx.moveTo(-220,94);ctx.quadraticCurveTo(-201,33,-184,18);ctx.lineTo(-177,-127);ctx.quadraticCurveTo(-173,-168,-145,-174);ctx.quadraticCurveTo(-111,-171,-111,-125);ctx.lineTo(-102,5);ctx.bezierCurveTo(-70,-20,-47,-33,-31,-39);ctx.lineTo(-26,-210);ctx.bezierCurveTo(-26,-255,35,-265,52,-218);ctx.lineTo(56,-18);ctx.bezierCurveTo(96,-15,113,12,131,30);ctx.lineTo(140,-105);ctx.quadraticCurveTo(152,-143,177,-140);ctx.quadraticCurveTo(203,-131,204,-105);ctx.lineTo(217,47);ctx.quadraticCurveTo(233,83,229,117);ctx.bezierCurveTo(121,100,-74,125,-220,94);ctx.closePath();ctx.fill();
 for(const [xx,yy,ww] of [[-145,-140,14],[17,-212,21],[174,-114,12]]){rounded(xx-ww*.5,yy,ww,47,ww*.5,day?'#dce6e5b0':'#b0dfdc9c');glow(xx,yy+25,39,'#b2ecec34');}
 // Curved aqueduct linking the towers, visibly set into the background haze.
 waStroke(day?'#c5d3d0':'#8faebd',7,()=>{ctx.moveTo(-238,48);ctx.bezierCurveTo(-150,34,-129,-24,-59,-10);ctx.bezierCurveTo(4,3,34,55,97,57);ctx.bezierCurveTo(167,57,177,22,248,14);});
 waStroke(day?'#eff1d2':'#c2e6dc',1.3,()=>{ctx.moveTo(-238,43);ctx.bezierCurveTo(-147,29,-125,-29,-59,-15);ctx.bezierCurveTo(4,-2,34,50,97,52);ctx.bezierCurveTo(167,52,177,17,248,9);});
 // Gold orbit crowns the entire monument rather than filling the sky with dots.
 ctx.strokeStyle='#ead9b9';ctx.lineWidth=1.1;ctx.beginPath();ctx.ellipse(12,-244,137,42,-.22,0,Math.PI*2);ctx.stroke();circle(125,-271,6,'#f3dfb3');line(18,-244,18,-274,'#c7d6df',2);star(18,-279,6,'#f3dfb3');
 ctx.restore();
}

// The later worlds share the same restrained lighting language, while their
// silhouettes, depth layers and terrain materials remain deliberately distinct.
function waCosmicTheme(theme){return ['dream','nebula','asteroid','rings','inferno'].includes(theme);}
function waSoftVolume(x,y,rx,ry,color){
 ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,color);g.addColorStop(.45,color);g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
}
function waSpaceStars(color,amount=64){
 // Spatial seeds are tied to world coordinates, so scrolling never changes a star.
 const spacing=158,par=.026,first=Math.floor(camera*par/spacing)-1,last=Math.ceil((camera*par+viewW)/spacing)+1;
 for(let i=first;i<last;i++)for(let j=0;j<8;j++){
  const seed=i*43+j*7,xx=i*spacing-camera*par+noise(seed+1)*spacing,yy=22+noise(seed+9)*405;
  const twinkle=.65+Math.sin(time*.65+seed)*.15;ctx.save();ctx.globalAlpha=twinkle;
  if(j===3&&noise(seed+8)>.67)star(xx,yy,2.4,color);else circle(xx,yy,.45+noise(seed+4)*.8,color);ctx.restore();
 }
}
function waSilkRibbon(x,y,width,height,seed,color,edge){
 ctx.save();ctx.translate(x,y);ctx.rotate((noise(seed+6)-.5)*.32);
 ctx.fillStyle=waGradient(0,-height,0,height,[color+'00',color+'39',color+'14']);ctx.beginPath();ctx.moveTo(-width,-height*.32);
 ctx.bezierCurveTo(-width*.38,-height*1.08,-width*.28,height*.67,width*.24,-height*.06);ctx.bezierCurveTo(width*.57,-height*.59,width*.77,-height*.5,width,-height*.27);
 ctx.bezierCurveTo(width*.7,-height*.3,width*.63,-height*.21,width*.28,height*.2);ctx.bezierCurveTo(-width*.26,height*1.12,-width*.47,-height*.8,-width,-height*.32);ctx.closePath();ctx.fill();
 waStroke(edge,1,()=>{ctx.moveTo(-width,-height*.32);ctx.bezierCurveTo(-width*.38,-height*1.08,-width*.28,height*.67,width*.24,-height*.06);ctx.bezierCurveTo(width*.57,-height*.59,width*.77,-height*.5,width,-height*.27);});ctx.restore();
}
function waDreamIsland(x,y,scale,seed){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=.62;
 const stone=waGradient(-60,-65,40,100,['#bcc0df','#7a81b2','#535785']);
 ctx.fillStyle=stone;ctx.beginPath();ctx.moveTo(-82,3);ctx.bezierCurveTo(-64,31,-30,49,-9,66);ctx.quadraticCurveTo(2,78,10,53);ctx.bezierCurveTo(41,48,62,32,84,3);ctx.quadraticCurveTo(2,-13,-82,3);ctx.closePath();ctx.fill();
 ellipse(0,1,83,10,'#c0bde45e');
 // The suspended crescent arches grow directly from their island plinth.
 const variant=((seed%3)+3)%3;ctx.fillStyle=waGradient(-37,-151,30,0,['#ebe3e8','#aa9dcc','#756c9c']);ctx.beginPath();
 if(variant===2){ctx.ellipse(-29,-80,30,80,-.1,0,Math.PI*2);ctx.ellipse(-28,-80,20,69,-.1,0,Math.PI*2);ctx.fill('evenodd');waStroke('#f3edf478',1.1,()=>{ctx.ellipse(-29,-81,28,77,-.1,Math.PI*.8,Math.PI*1.65);});}
 else{ctx.moveTo(-43,0);ctx.bezierCurveTo(-78,-63,-56,-142,-2,-163);ctx.bezierCurveTo(-36,-122,-29,-50,-9,-4);ctx.closePath();ctx.fill();waStroke('#f3edf4a0',1.2,()=>{ctx.moveTo(-40,-6);ctx.bezierCurveTo(-68,-61,-48,-130,-6,-157);});}
 const pearlX=21,pearlY=-72;waSoftVolume(pearlX,pearlY,44,44,'#cefbef28');circle(pearlX,pearlY,13,waGradient(pearlX-6,pearlY-10,pearlX+8,pearlY+14,['#f4f2ec','#c2bdda','#837da9']));ellipse(pearlX-4,pearlY-5,4,2,'#ffffff86');
 waStroke('#b7dbd462',.8,()=>{ctx.ellipse(pearlX,pearlY,39,12,-.45,0,Math.PI*2);});
 for(let j=0;j<3;j++)waStroke('#a7b8d63b',1.1,()=>{const xx=-35+j*31;ctx.moveTo(xx,24);ctx.bezierCurveTo(xx-8,50,xx+17,61,xx+6,88+noise(seed+j)*23);});ctx.restore();
}
function waRockPath(x,y,rx,ry,seed){
 const points=[];for(let k=0;k<10;k++){const a=k*Math.PI/5,r=.88+noise(seed+k*13)*.2;points.push({x:x+Math.cos(a)*rx*r,y:y+Math.sin(a)*ry*r});}
 const last=points[points.length-1],first=points[0];ctx.moveTo((last.x+first.x)/2,(last.y+first.y)/2);
 for(let k=0;k<points.length;k++){const p=points[k],next=points[(k+1)%points.length];ctx.quadraticCurveTo(p.x,p.y,(p.x+next.x)/2,(p.y+next.y)/2);}ctx.closePath();
}
function waCrater(x,y,rx,ry,bright=false){
 ellipse(x,y,rx,ry,bright?'#17233183':'#16203180');ellipse(x-1,y-1,rx*.72,ry*.68,bright?'#28344392':'#34425479');
 waStroke(bright?'#b0a99b69':'#a4bac44b',1,()=>{ctx.ellipse(x,y+.5,rx,ry,0,.09,Math.PI*.91);});
 waStroke('#111a2d53',1.3,()=>{ctx.ellipse(x,y-.6,rx*.96,ry*.91,0,Math.PI*1.05,Math.PI*1.88);});
}
function waAsteroid(x,y,rx,ry,seed,near=false){
 ctx.save();ctx.globalAlpha=near?.73:.38;ctx.fillStyle=waGradient(x-rx*.7,y-ry,x+rx*.6,y+ry,near?['#8e929b','#566779','#2b3d55']:['#5d6c81','#344b69','#1b304c']);ctx.beginPath();waRockPath(x,y,rx,ry,seed);ctx.fill();ctx.save();ctx.clip();
 waSoftVolume(x-rx*.4,y-ry*.55,rx*.9,ry*.95,'#d7d1b322');
 for(let j=0;j<6;j++){const xx=x+(noise(seed+j*5)-.5)*rx*1.6,yy=y+(noise(seed+j*9)-.5)*ry*1.3,r=4+noise(seed+j*3)*rx*.14;waCrater(xx,yy,r,r*.59,near);}
 ctx.restore();waStroke(near?'#c1c4bb54':'#8098ad2b',1,()=>{ctx.moveTo(x-rx*.78,y-ry*.35);ctx.quadraticCurveTo(x-rx*.48,y-ry*.86,x-rx*.02,y-ry*.87);});ctx.restore();
}
function waRingPlanet(x,y,r){
 ctx.save();ctx.translate(x,y);ctx.rotate(-.29);
 waSoftVolume(0,0,r*2.25,r*1.32,'#dab5a01b');
 const ring=(front)=>{for(let k=0;k<12;k++){if(k===5||k===6)continue;const rx=r*(1.38+k*.074),ry=rx*.245;ctx.strokeStyle=k<5?['#b49b9250','#eddac887','#cbb5b19a'][k%3]:['#bcb4c55e','#dacdbb9e','#f2dfc088'][k%3];ctx.lineWidth=3.2;ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,front?0:Math.PI,front?Math.PI:Math.PI*2);ctx.stroke();}};
 ring(false);
 const gas=ctx.createRadialGradient(-r*.36,-r*.42,r*.08,0,0,r);gas.addColorStop(0,'#f2e0bd');gas.addColorStop(.6,'#cbb296');gas.addColorStop(.86,'#9c8a89');gas.addColorStop(1,'#595b75');circle(0,0,r,gas);
 ctx.save();ctx.beginPath();ctx.arc(0,0,r-.7,0,Math.PI*2);ctx.clip();
 for(let j=-4;j<=4;j++){const yy=j*r*.19;waStroke(j%2?'#8d747b38':'#fff0ca4b',j%2?8:5,()=>{ctx.moveTo(-r,yy);ctx.bezierCurveTo(-r*.42,yy+r*.09,r*.47,yy+r*.15,r,yy+r*.03);});}
 const shade=ctx.createLinearGradient(-r,0,r,0);shade.addColorStop(0,'#eadaac00');shade.addColorStop(.4,'#1c243000');shade.addColorStop(1,'#15223b80');ctx.fillStyle=shade;ctx.fillRect(-r,-r,r*2,r*2);ctx.restore();
 ring(true);ctx.restore();
}
function waConsumedStar(x,y,r){
 ctx.save();ctx.translate(x,y);
 waSoftVolume(0,0,r*2.9,r*2.3,'#dc62352f');waSoftVolume(0,0,r*1.9,r*1.5,'#f8a65640');
 // Hot gas broadens into a flattened accretion disk; it is not a set of rings.
 const disk=(front)=>{
  ctx.save();ctx.rotate(-.21);
  for(const [width,color] of [[22,'#d8623230'],[12,'#f6a95871'],[5,'#ffe2b8c9'],[1.5,'#fff2d3ed']])waStroke(color,width,()=>{ctx.ellipse(0,0,r*2.0,r*.24,0,front?0:Math.PI,front?Math.PI:Math.PI*2);});
  ctx.restore();
 };
 disk(false);
 const halo=ctx.createRadialGradient(0,0,r*.91,0,0,r*1.26);halo.addColorStop(0,'#f6ab6b00');halo.addColorStop(.25,'#f5ad6c2c');halo.addColorStop(.45,'#d4744f25');halo.addColorStop(1,'#de643100');circle(0,0,r*1.26,halo);
 circle(0,0,r,'#03050c');
 // The bent far disk makes a glowing crown above the event horizon.
 for(const [width,color] of [[12,'#d763333a'],[6,'#f0ad6981'],[2,'#ffe4b5cb']])waStroke(color,width,()=>{ctx.arc(0,-1,r+3,Math.PI*.99,Math.PI*1.94);});
 disk(true);
 ctx.save();ctx.rotate(-.21);const hot=waGradient(-r*2.15,0,r*2.15,0,['#fa995400','#e983466e','#ffe4b8c8','#f4a65e8a','#fa995400']);waStroke(hot,4,()=>{ctx.moveTo(-r*2.15,2);ctx.bezierCurveTo(-r*.81,-4,r*.7,9,r*2.15,2);});ctx.restore();
 // Broad tapering trails carry nebula light inward, visibly being consumed.
 for(let j=0;j<3;j++){
  const sy=-r*1.12+j*r*.67;ctx.fillStyle=waGradient(-r*4.6,0,-r*.7,0,['#a05d7a00',j%2?'#e99a6a24':'#a45d7829','#eeaa7337']);ctx.beginPath();ctx.moveTo(-r*4.8,sy-20);ctx.bezierCurveTo(-r*3.4,sy-r*.58,-r*1.8,-r*1.52+j*39,-r*.76,-r*.55+j*19);ctx.bezierCurveTo(-r*1.8,-r*1.2+j*35,-r*3.2,sy-r*.39,-r*4.8,sy+20);ctx.closePath();ctx.fill();
  waStroke(waGradient(-r*4.6,0,-r*.72,0,['#f4b37400','#f4b37435','#ffdfae92']),1.1,()=>{ctx.moveTo(-r*4.6,sy);ctx.bezierCurveTo(-r*3.4,sy-r*.48,-r*1.8,-r*1.38+j*37,-r*.76,-r*.55+j*19);});
 }
 ctx.restore();
}
function waDistantFlame(x,base,height,seed){
 const sway=Math.sin(time*.85+seed)*height*.04;ctx.save();ctx.globalAlpha=.47;
 waSoftVolume(x,base-height*.28,height*.43,height*.78,'#d651273d');ctx.fillStyle=waGradient(x,base-height,x,base+6,['#efbd6745','#dd782898','#b7432799']);ctx.beginPath();ctx.moveTo(x-height*.16,base+7);
 ctx.bezierCurveTo(x-height*.33,base-height*.2,x+height*.09+sway,base-height*.55,x-height*.06+sway,base-height);
 ctx.bezierCurveTo(x+height*.29,base-height*.66,x-height*.05,base-height*.35,x+height*.19,base-height*.17);ctx.quadraticCurveTo(x+height*.3,base+1,x+height*.13,base+7);ctx.closePath();ctx.fill();
 ctx.fillStyle=waGradient(x,base-height*.6,x,base+5,['#ffd99b16','#efb34d96']);ctx.beginPath();ctx.moveTo(x-height*.05,base+4);ctx.bezierCurveTo(x-height*.12,base-height*.14,x+height*.1,base-height*.3,x,base-height*.59);ctx.quadraticCurveTo(x+height*.18,base-height*.2,x+height*.09,base+4);ctx.closePath();ctx.fill();ctx.restore();
}
function waCosmicBackground(theme){
 const day=world.day,palettes={dream:day?['#62688f','#a69ec0','#777eaa']:['#171a44','#555180','#7887a5'],nebula:['#0c1934','#233b65','#344d66'],asteroid:['#090e29','#202846','#3d435f'],rings:['#101830','#444765','#878197'],inferno:['#070812','#211423','#563136']};
 ctx.fillStyle=waGradient(0,0,0,600,palettes[theme]);ctx.fillRect(0,0,viewW,600);
 waSpaceStars(theme==='inferno'?'#d2b5b279':theme==='dream'?'#e8e7f399':'#dce6f1a3');
 if(theme==='dream'){
  waSoftVolume(viewW*.64-camera*.028,162,330,170,'#c4b0e837');waSoftVolume(viewW*.23-camera*.043,353,320,160,'#a1e4df24');
  for(let layer=0;layer<2;layer++){const spacing=630,par=.045+layer*.06;for(let j=Math.floor(camera*par/spacing)-1;j<(camera*par+viewW)/spacing+2;j++)waSilkRibbon(j*spacing-camera*par,173+noise(j+7)*134,370,100+noise(j+4)*36,j+layer*3,layer?'#e9c6e0':'#a2d5e6',layer?'#f4d3e73d':'#c1ddef39');}
  const spacing=430,par=.15;for(let i=Math.floor(camera*par/spacing)-1;i<(camera*par+viewW)/spacing+1;i++)waDreamIsland(i*spacing-camera*par+noise(i+31)*100,325+noise(i+9)*78,.53+noise(i+6)*.19,i*11);
  waMist(483,'#d7ceeb13');
 }else if(theme==='nebula'){
  const spacing=640,par=.042;for(let i=Math.floor(camera*par/spacing)-1;i<(camera*par+viewW)/spacing+2;i++){
   const xx=i*spacing-camera*par;waSoftVolume(xx+80,199,380,210,'#966fc54a');waSoftVolume(xx+230,285,280,180,'#69bdd545');waSoftVolume(xx-110,124,210,120,'#e4a1b63d');
   // Soft molecular clouds follow a rising gas plume. Unlike the dream's silk,
   // their boundaries dissolve and their lit centers have irregular volume.
   for(let k=0;k<5;k++){const px=xx-240+k*110,py=274-Math.sin(k*.72+i)*72;waSoftVolume(px,py,135,92,['#b386c53c','#69b9cf3c','#bdd9cf38'][k%3]);}
   const plume=()=>{ctx.moveTo(xx-337,292);ctx.bezierCurveTo(xx-187,335,xx-89,168,xx+81,207);ctx.bezierCurveTo(xx+153,224,xx+224,163,xx+342,129);};
   waStroke(waGradient(xx-337,0,xx+342,0,['#8acdd300','#8acdd31a','#8acdd310','#8acdd300']),19,plume);waStroke(waGradient(xx-337,0,xx+342,0,['#cde3db00','#cde3db28','#cde3db19','#cde3db00']),1.7,plume);waStroke(waGradient(xx-231,0,xx+289,0,['#a4cfe600','#a4cfe622','#a4cfe600']),1.1,()=>{ctx.moveTo(xx-231,284);ctx.bezierCurveTo(xx-97,233,xx-47,149,xx+98,170);ctx.quadraticCurveTo(xx+186,186,xx+289,128);});
  }
  const px=viewW*.75-camera*.022,py=126;waSoftVolume(px,py,95,95,'#87bccb27');circle(px,py,34,waGradient(px-24,py-30,px+26,py+25,['#b4c6ca','#5f899f','#344569']));ellipse(px-11,py-10,9,4,'#d9e9db21');
  // A dark dust lane cuts through the luminous gas, with smooth receding edges.
  for(let layer=0;layer<2;layer++){const yy=342+layer*49;ctx.fillStyle=waGradient(0,yy-35,0,yy+90,['#102b4400','#172b443d','#10274100']);ctx.beginPath();ctx.moveTo(0,yy);for(let xx=0;xx<=viewW+45;xx+=45)ctx.lineTo(xx,yy+Math.sin((xx+camera*.065)*.006+layer)*27);ctx.lineTo(viewW,yy+100);ctx.lineTo(0,yy+100);ctx.fill();}
  waMist(464,'#9ec4d913');
 }else if(theme==='asteroid'){
  const px=viewW*.72-camera*.023;waSoftVolume(px,155,181,180,'#ad9ca71b');circle(px,155,108,waGradient(px-80,72,px+86,236,['#807e93','#4a5673','#222e51']));ctx.save();ctx.beginPath();ctx.arc(px,155,108,0,Math.PI*2);ctx.clip();for(let j=0;j<8;j++)waCrater(px+(noise(j*5)-.5)*150,155+(noise(j*7)-.5)*150,11+noise(j+3)*13,7+noise(j+3)*9);ctx.restore();
  for(let layer=0;layer<2;layer++){const spacing=layer?330:245,par=layer?.18:.068;for(let i=Math.floor(camera*par/spacing)-1;i<(camera*par+viewW)/spacing+2;i++){const xx=i*spacing-camera*par+(noise(i+13)-.5)*100,yy=layer?334+noise(i*7)*125:94+noise(i*11)*210,rx=(layer?59:31)+noise(i+9)*(layer?32:23);waAsteroid(xx,yy,rx,rx*(.55+noise(i+3)*.25),i*31+layer,!!layer);}}
  waMist(503,'#a4a6c411');
 }else if(theme==='rings'){
  waSoftVolume(viewW*.69-camera*.024,176,390,255,'#c3acc228');waRingPlanet(viewW*.7-camera*.024,178,96);
  const moonX=viewW*.17-camera*.046;circle(moonX,99,18,waGradient(moonX-12,84,moonX+14,111,['#d2c5bb','#6b7088']));waCrater(moonX+4,102,4.5,3);waCrater(moonX-7,96,3,2.1);
  // The nearer orbital dust follows one broad perspective curve, not stray arcs.
  const sx=viewW*.4-camera*.05;ctx.save();ctx.translate(sx,529);ctx.rotate(-.18);for(let j=0;j<5;j++)waStroke(j%2?'#d3c2ad14':'#e9d6b41f',3+j*.4,()=>{ctx.ellipse(0,-156,viewW*.81+j*15,124+j*5,0,.2,Math.PI*.94);});ctx.restore();
  for(let i=Math.floor(camera*.15/370)-1;i<(camera*.15+viewW)/370+1;i++){const xx=i*370-camera*.15;waAsteroid(xx,396+noise(i+8)*59,38+noise(i+5)*27,17+noise(i)*13,i*23,false);}
  waMist(489,'#e6d8c714');
 }else if(theme==='inferno'){
  waConsumedStar(viewW*.69-camera*.026,154,96);
  waSoftVolume(viewW*.3,488,viewW*.75,194,'#f378333d');
  for(let layer=0;layer<2;layer++){const par=.075+layer*.08,spacing=236;ctx.save();ctx.globalAlpha=layer?.73:.37;for(let i=Math.floor(camera*par/spacing)-1;i<(camera*par+viewW)/spacing+2;i++){const xx=i*spacing-camera*par,hh=95+noise(i+layer*29)*111;ctx.fillStyle=layer?'#211b29':'#3d2639';ctx.beginPath();ctx.moveTo(xx-128,600);ctx.bezierCurveTo(xx-93,527,xx-81,600-hh,xx-36,580-hh);ctx.quadraticCurveTo(xx-17,566-hh,xx+4,597-hh);ctx.bezierCurveTo(xx+42,620-hh,xx+51,525,xx+128,600);ctx.closePath();ctx.fill();}ctx.restore();}
  // The lake and its plumes are far below the safe ledges and gameplay fire lanes.
  ctx.fillStyle=waGradient(0,529,0,600,['#a53d2d44','#e5792cb0','#f8ba5ceb']);ctx.fillRect(0,529,viewW,71);
  const flamePar=.12,flameSpacing=284;for(let i=Math.floor(camera*flamePar/flameSpacing)-1;i<(camera*flamePar+viewW)/flameSpacing+1;i++)waDistantFlame(i*flameSpacing-camera*flamePar+noise(i+9)*77,560+noise(i)*21,75+noise(i+14)*68,i*13);
  for(let j=0;j<7;j++)waStroke(j%2?'#ffd99748':'#87363049',1.1+j%2*.6,()=>{ctx.moveTo(0,539+j*9);for(let xx=0;xx<viewW;xx+=93)ctx.quadraticCurveTo(xx+47,534+j*9+Math.sin(time*.7+xx*.014+j)*5,xx+93,539+j*9);});
  for(let i=0;i<25;i++){const xx=((i*167-camera*.19+Math.sin(time*.16+i)*10)%(viewW+120)+viewW+120)%(viewW+120),yy=585-((time*18+i*39)%380);circle(xx,yy,.65+noise(i)*.9,'#f5bd7786');if(i%7===0)line(xx-.5,yy+3,xx,yy-1,'#f4ae5b3d',.6);}
 }
 const vignette=ctx.createRadialGradient(viewW*.52,298,viewW*.18,viewW*.52,298,Math.max(570,viewW*.72));vignette.addColorStop(0,'#03091800');vignette.addColorStop(1,theme==='dream'?'#16163138':'#03071666');ctx.fillStyle=vignette;ctx.fillRect(0,0,viewW,600);
}

function background(){
 const theme=world.theme,day=world.day,below=theme==='void';
 if(waCosmicTheme(theme)){waCosmicBackground(theme);return;}
 const colors=below?['#080e1d','#15283b','#363044']:theme==='forest'?(day?['#739daf','#b5d4c4','#619995']:['#0b1639','#2c4668','#355e6c']):theme==='ruins'?(day?['#7f83a7','#e5c2ab','#af9b97']:['#17183b','#695776','#86747b']):theme==='clouds'?['#647aaa','#c5dbea','#efe5dc']:(day?['#4b639e','#a7b7d8','#cfc9de']:['#0a1337','#314d7a','#667895']);
 ctx.fillStyle=waGradient(0,0,0,600,colors);ctx.fillRect(0,0,viewW,600);
 if(!below){
  const sunX=viewW*.79;glow(sunX,139,day?200:135,day?'#ffedbd50':'#d3e7fc33');circle(sunX,139,day?29:33,day?'#fff0c5':'#d8e7f4');if(!day){circle(sunX-13,129,28,colors[0]);for(let j=0;j<60;j++){const xx=((j*137.21-camera*.04)%(viewW+90)+viewW+90)%(viewW+90);circle(xx,22+noise(j*3)*250,j%7===0?1.3:.65,'#dae9ed8a');}}
  for(let j=-1;j<Math.ceil(viewW/340)+2;j++){const xx=j*340-camera*.04%340;waCloud(xx,104+noise(j+4)*98,73+noise(j+8)*52,34+noise(j+1)*12,day?.22:.05);}
 }
 if(theme==='forest'){
  // Atmospheric bands recede continuously; the near trees are separate world objects.
  for(let layer=0;layer<3;layer++){const par=.06+layer*.045;ctx.fillStyle=day?['#90b6b4','#77a4a6','#5b8c97'][layer]:['#344e6c','#2d4c6a','#25435d'][layer];ctx.beginPath();ctx.moveTo(0,600);for(let xx=0;xx<=viewW+35;xx+=35){const z=xx+camera*par;ctx.lineTo(xx,330+layer*45+Math.sin(z*.0023+layer)*32+Math.sin(z*.006)*10);}ctx.lineTo(viewW,600);ctx.fill();}
  for(let layer=0;layer<2;layer++){const spacing=layer?330:235,par=layer?.23:.11;ctx.save();ctx.globalAlpha=layer?.38:.24;
   const first=Math.floor(camera*par/spacing)-2,last=Math.ceil((camera*par+viewW)/spacing)+2;
   for(let i=first;i<last;i++){const xx=i*spacing-camera*par+(noise(i+31)-.5)*110,ht=(layer?335:275)+noise(i+7)*100;waTrunk(xx,575,ht,layer?17:10,day?(layer?'#2e6075':'#6b9aa6'):(layer?'#173e58':'#345d79'),i*17,true,true);}
   ctx.restore();
  }
  waMist(390,day?'#d6eedb0e':'#c6ede00d');
  // Lanterns are suspended from the canopy, never mistaken for walkable platforms.
  for(let i=0;i<4;i++){const xx=((i*391-camera*.22)%(viewW+400)+viewW+400)%(viewW+400)-140,yy=218+noise(i*7)*98;line(xx,yy-37,xx,yy-4,day?'#779d9355':'#91c7c166',.8);glow(xx,yy,41,day?'#e5ffc934':'#a9f5df54');ctx.fillStyle=day?'#e9f7cf':'#cbfff1';ctx.beginPath();ctx.moveTo(xx,yy-6);ctx.quadraticCurveTo(xx+8,yy,xx,yy+7);ctx.quadraticCurveTo(xx-8,yy,xx,yy-6);ctx.fill();}
 }else if(theme==='ruins'){
  // Far city terraces dissolve into haze instead of a repeated row of arch cutouts.
  for(let layer=0;layer<2;layer++){ctx.save();ctx.globalAlpha=layer?.31:.18;const par=layer?.12:.055;for(let j=Math.floor(camera*par/380)-1;j<(camera*par+viewW)/380+1;j++){const xx=j*380-camera*par,yy=445-layer*35,hh=86+noise(j+16)*68;waDistantTemple(xx,yy,hh,168+noise(j)*82,j);}ctx.restore();}
  const par=.23,spacing=440;for(let j=Math.floor(camera*par/spacing)-1;j<(camera*par+viewW)/spacing+2;j++){const xx=j*spacing-camera*par+(noise(j+8)-.5)*140;waRuin(xx,476+noise(j)*34,.86+noise(j+2)*.24,j*11);}
  waMist(474,day?'#fff1d317':'#dbbbd710');
 }else if(theme==='observatory'){
  // Deep blue rounded clouds and a distant city give scale to the floating towers.
  for(let layer=0;layer<2;layer++){ctx.save();ctx.globalAlpha=layer?.27:.16;for(let j=-1;j<Math.ceil(viewW/470)+2;j++){const xx=j*470-camera*(.06+layer*.055)%470;waCloud(xx,485+layer*29,210,67,.8);}ctx.restore();}
  const monument=(world.width||6000)*.105-camera*.085;
  if(monument>-350&&monument<viewW+350)waCelestialLandmark(monument,378);
  const par=.17,spacing=510;for(let j=Math.floor(camera*par/spacing)-1;j<(camera*par+viewW)/spacing+2;j++){waObservatory(j*spacing-camera*par+(noise(j+5)-.5)*130,401+noise(j+3)*55,.78+noise(j+11)*.2,j);}
  const points=[];for(let j=-1;j<9;j++)points.push({x:j*183-camera*.036%183,y:174+noise(j+8)*68});ctx.strokeStyle='#e8ddc443';ctx.lineWidth=.8;ctx.beginPath();points.forEach((p,j)=>j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();for(const p of points)circle(p.x,p.y,1.5,'#f7e4b0aa');
  waMist(463,day?'#e8e7f014':'#caedf416');
 }else if(theme==='clouds'){
  for(let layer=0;layer<3;layer++)for(let j=-1;j<Math.ceil(viewW/330)+2;j++){waCloud(j*330-camera*(.05+layer*.035)%330,383+layer*70,190,60,.4+layer*.13);}
  for(let j=0;j<4;j++){const xx=j*414-camera*.16%414;glow(xx,218,100,'#ffdfb424');ctx.strokeStyle='#ffecbd66';ctx.lineWidth=1;ctx.beginPath();ctx.arc(xx,218,35,0,Math.PI*2);ctx.stroke();star(xx,218,10,'#ffedc476');}
 }else{
  // Recessed grotto: the negative space is curved, dim and mysterious.
  glow(viewW*.6,344,250,'#5ccbc42b');
  for(let layer=0;layer<2;layer++){const par=.065+layer*.08,spacing=370;ctx.save();ctx.globalAlpha=layer?.65:.4;
   for(let j=Math.floor(camera*par/spacing)-1;j<(camera*par+viewW)/spacing+2;j++){const xx=j*spacing-camera*par,hh=190+noise(j+layer*8)*150;ctx.fillStyle=layer?'#101725':'#213148';ctx.beginPath();ctx.moveTo(xx-160,0);ctx.bezierCurveTo(xx-140,105,xx-79,hh-28,xx-72,hh);ctx.bezierCurveTo(xx-55,hh+26,xx-34,hh-25,xx-26,hh-58);ctx.bezierCurveTo(xx+17,120,xx+119,79,xx+145,0);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(xx-155,600);ctx.bezierCurveTo(xx-157,494,xx-84,417,xx-24,408);ctx.bezierCurveTo(xx+21,399,xx+19,449,xx+43,458);ctx.bezierCurveTo(xx+85,470,xx+133,484,xx+153,600);ctx.closePath();ctx.fill();
   }ctx.restore();}
  waMist(476,'#6bc3c51a');
 }
 // Small motes are less bright and much smaller than collectibles.
 for(let j=0;j<26;j++){const xx=((j*151.7-camera*.26+Math.sin(time*.18+j)*18)%(viewW+80)+viewW+80)%(viewW+80),yy=175+noise(j*7)*330+Math.sin(time*.35+j)*11;circle(xx,yy,j%6===0?1.5:.75,below?'#9bccbf54':day?'#ffffd481':'#b8efd186');}
 const vig=ctx.createRadialGradient(viewW*.5,340,viewW*.2,viewW*.5,340,Math.max(500,viewW*.7));vig.addColorStop(0,'#0a1a2400');vig.addColorStop(1,'#08142b37');ctx.fillStyle=vig;ctx.fillRect(0,0,viewW,600);
}

function tree(x,base,seed){
 x+=(noise(seed+71)-.5)*28;const day=world.day,h=147+noise(seed+5)*82;const bark=waGradient(x-16,0,x+17,0,day?['#2c5462','#7a9d8a','#305964']:['#1c4052','#4c7881','#203f59']);
 ctx.save();ctx.globalAlpha=.9;waTrunk(x,base+2,h,10+noise(seed)*3,bark,seed,true,false);ctx.restore();
 // A shaded knot and a root flare lend an individual tree a sculpted surface.
 const knotY=base-h*.32;ellipse(x+3,knotY,3.6,7,day?'#2b566351':'#113d565d');waStroke(day?'#c9d9b651':'#91d6c948',1,()=>{ctx.moveTo(x,knotY-7);ctx.bezierCurveTo(x+6,knotY-10,x+9,knotY+5,x+4,knotY+8);});
 for(let j=-1;j<=1;j++){waStroke(day?'#456e728f':'#2c556e9c',3-Math.abs(j),()=>{ctx.moveTo(x+j*5,base-9);ctx.quadraticCurveTo(x+j*10,base-2,x+j*19,base+1);});}
 // Tiny hanging lights sit inside the crown rather than decorative floating leaves.
 if(noise(seed+1)>.57){const xx=x+h*.2,yy=base-h+64;line(xx,yy-18,xx,yy-3,day?'#81a79b66':'#82cbbd66',.8);glow(xx,yy,25,day?'#e4ffbb24':'#b5ffe647');circle(xx,yy,2,day?'#e4f3c5':'#cdffea');}
}

function waThinPlatform(t){
 const x=t.x,y=t.y,w=t.w,h=t.h,theme=world.theme,day=world.day;
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 if(theme==='forest'){
  // A living branch supports the mossy straight walkable lip.
  ctx.fillStyle=waGradient(x,y,x,y+h+7,day?['#94a68a','#657970','#354e58']:['#749585','#4c716d','#294c60']);
  ctx.beginPath();ctx.moveTo(x+2,y);ctx.lineTo(x+w-2,y);ctx.quadraticCurveTo(x+w+1,y+3,x+w-2,y+9);ctx.bezierCurveTo(x+w-8,y+h+3,x+w*.81,y+h+4,x+w*.65,y+h-1);ctx.bezierCurveTo(x+w*.51,y+h+4,x+w*.44,y+h+2,x+w*.31,y+h+4);ctx.bezierCurveTo(x+w*.2,y+h+3,x+9,y+h+6,x+4,y+h-2);ctx.quadraticCurveTo(x-3,y+8,x+2,y);ctx.fill();
  waStroke(day?'#314f5a88':'#163d569c',1.2,()=>{ctx.moveTo(x+9,y+10);ctx.bezierCurveTo(x+w*.28,y+14,x+w*.28,y+8,x+w*.49,y+12);ctx.bezierCurveTo(x+w*.66,y+17,x+w*.76,y+10,x+w-9,y+13);});
  for(let xx=x+24;xx<x+w-18;xx+=55){waStroke(day?'#b8ccb055':'#a4d7be4a',.8,()=>{ctx.moveTo(xx,y+8);ctx.quadraticCurveTo(xx+10,y+5,xx+21,y+10);});}
  for(let k=0;k<2;k++){const xx=x+w*(.22+k*.53);waStroke(day?'#476e68':'#427773',1.5,()=>{ctx.moveTo(xx,y+h);ctx.quadraticCurveTo(xx-7,y+h+10,xx-1,y+h+20);});waLeaf(xx-3,y+h+12,7,.7,day?'#93af91':'#8dc5a8');}
  line(x+2,y+1,x+w-2,y+1,day?'#d0dfb7':'#b2e2c8',2.6);
  waStroke(day?'#88af87':'#82b8a1',2.1,()=>{ctx.moveTo(x+6,y+4);for(let xx=x+6;xx<x+w-8;xx+=32)ctx.quadraticCurveTo(xx+9,y+7,Math.min(x+w-5,xx+32),y+4);});
 }else if(theme==='ruins'){
  // Fractured carved stone has irregular chipped underside edges and veined seams.
  ctx.fillStyle=waGradient(x,y,x,y+h+3,day?['#d0b3a0','#a69a9b','#777b92']:['#ab9299','#7c728d','#505b7c']);ctx.beginPath();ctx.moveTo(x+2,y);ctx.lineTo(x+w-2,y);ctx.quadraticCurveTo(x+w+1,y+3,x+w-1,y+h-5);
  for(let k=6;k>=0;k--){const xx=x+w*k/6,yy=y+h+(noise(x+k*13)-.5)*6;ctx.lineTo(xx+Math.min(7,w*.025),yy-3);ctx.quadraticCurveTo(xx,yy+2,Math.max(x,xx-4),yy);}
  ctx.quadraticCurveTo(x-2,y+6,x+2,y);ctx.closePath();ctx.fill();line(x+3,y+1,x+w-3,y+1,'#f0d8b8',2.2);
  for(let xx=x+24;xx<x+w-13;xx+=67){waStroke('#4c53727a',1.1,()=>{ctx.moveTo(xx,y+5);ctx.lineTo(xx-4,y+10);ctx.lineTo(xx+3,y+15);});line(xx+3,y+6,xx+29,y+6,day?'#f9ddc562':'#d7b8bd55',.8);}
  waStroke('#c9bca46b',.9,()=>{ctx.moveTo(x+8,y+h-5);ctx.quadraticCurveTo(x+w*.4,y+h-9,x+w*.75,y+h-6);});
 }else if(theme==='void'){
  // Wet rock belongs to the cave walls: uneven lobes replace manufactured bars.
  ctx.fillStyle=waGradient(x,y,x,y+h+12,['#71808b','#49566d','#25344e']);ctx.beginPath();ctx.moveTo(x+2,y);ctx.lineTo(x+w-2,y);ctx.quadraticCurveTo(x+w+3,y+7,x+w-5,y+h-1);ctx.bezierCurveTo(x+w*.91,y+h+13,x+w*.83,y+h+4,x+w*.76,y+h+7);ctx.bezierCurveTo(x+w*.65,y+h+3,x+w*.54,y+h+11,x+w*.41,y+h+5);ctx.bezierCurveTo(x+w*.32,y+h+12,x+w*.19,y+h+4,x+7,y+h+2);ctx.quadraticCurveTo(x-4,y+10,x+2,y);ctx.closePath();ctx.fill();
  line(x+2,y+1,x+w-2,y+1,'#b2d4d6',2.1);
  for(let xx=x+20;xx<x+w-12;xx+=57){waStroke('#172b4666',1.1,()=>{ctx.moveTo(xx,y+7);ctx.quadraticCurveTo(xx-8,y+13,xx+2,y+h+3);});waStroke('#c3ccd330',.8,()=>{ctx.moveTo(xx+2,y+7);ctx.quadraticCurveTo(xx-3,y+12,xx+6,y+17);});}
  if(noise(x+37)>.68){const xx=x+w*(.3+noise(x+9)*.4);waStroke('#77bfb88f',1.5,()=>{ctx.moveTo(xx,y+h+3);ctx.quadraticCurveTo(xx+2,y+h+9,xx,y+h+19);});ellipse(xx,y+h+20,2,4,'#8cdacb');ellipse(xx-.5,y+h+18,.6,1.4,'#d6fff39e');}
 }else{
  // Celestial limestone has a carved, curved underside and one anchored crystal.
  ctx.fillStyle=waGradient(x,y,x,y+h+8,day?['#bfd1dc','#89a5be','#577795']:['#9cbed1','#628aab','#315577']);ctx.beginPath();ctx.moveTo(x+2,y);ctx.lineTo(x+w-2,y);ctx.quadraticCurveTo(x+w,y+4,x+w-3,y+9);ctx.quadraticCurveTo(x+w*.92,y+h+2,x+w*.82,y+h+4);ctx.bezierCurveTo(x+w*.65,y+h+1,x+w*.62,y+h+9,x+w*.5,y+h+9);ctx.bezierCurveTo(x+w*.37,y+h+9,x+w*.35,y+h+1,x+w*.18,y+h+4);ctx.quadraticCurveTo(x+3,y+h+2,x,y+7);ctx.quadraticCurveTo(x,y+2,x+2,y);ctx.closePath();ctx.fill();
  line(x+2,y+1,x+w-2,y+1,'#ddf0ef',2.2);waStroke('#bdd8d497',1,()=>{ctx.moveTo(x+9,y+10);ctx.bezierCurveTo(x+w*.26,y+15,x+w*.36,y+9,x+w*.5,y+14);ctx.bezierCurveTo(x+w*.64,y+9,x+w*.74,y+15,x+w-9,y+10);});
  for(let xx=x+22;xx<x+w-12;xx+=61){ctx.strokeStyle='#d4e8e29f';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(xx-3,y+8);ctx.quadraticCurveTo(xx,y+3,xx+3,y+8);ctx.quadraticCurveTo(xx,y+13,xx-3,y+8);ctx.stroke();}
  const cx=x+w/2;line(cx,y+h+7,cx,y+h+15,'#8aabb9',1);glow(cx,y+h+18,17,'#a6ead82c');crystal(cx,y+h+19,5,'#97c3c8');
 }
 ctx.restore();
}

function waCosmicPlatform(t){
 const x=t.x,y=t.y,w=t.w,h=t.h,theme=world.theme,thin=!!t.oneWay;
 const palettes={dream:['#d4d7e7','#a9a4c8','#6d739f'],nebula:['#9dc5d1','#6386aa','#35446f'],asteroid:['#8d949e','#586675','#2b3e56'],rings:['#d6c7ae','#aaa091','#626682'],inferno:['#51434b','#302b3a','#171a29']};
 const edge={dream:'#eef1e8',nebula:'#c5e7e6',asteroid:'#c9c8c1',rings:'#f3e0bb',inferno:'#ada5a4'}[theme];
 ctx.save();ctx.fillStyle=waGradient(x,y,x,y+Math.min(thin?h+18:h,155),palettes[theme]);ctx.beginPath();ctx.moveTo(x+2,y);ctx.lineTo(x+w-2,y);ctx.quadraticCurveTo(x+w,y+2,x+w,y+7);
 if(thin){
  if(theme==='dream'){
   ctx.bezierCurveTo(x+w*.93,y+h+9,x+w*.69,y+h+9,x+w*.54,y+h+14);ctx.bezierCurveTo(x+w*.41,y+h+23,x+w*.15,y+h+8,x+5,y+h);ctx.quadraticCurveTo(x-3,y+9,x+2,y);
  }else if(theme==='nebula'){
   ctx.lineTo(x+w-9,y+h-1);ctx.lineTo(x+w*.73,y+h+9);ctx.lineTo(x+w*.59,y+h+8);ctx.lineTo(x+w*.47,y+h+20);ctx.lineTo(x+w*.34,y+h+10);ctx.lineTo(x+10,y+h+3);ctx.quadraticCurveTo(x-3,y+11,x+2,y);
  }else{
   const deeper=theme==='rings'?10:theme==='inferno'?5:13;ctx.quadraticCurveTo(x+w+2,y+h*.8,x+w-11,y+h+1);ctx.bezierCurveTo(x+w*.74,y+h+deeper,x+w*.67,y+h+deeper*.6,x+w*.5,y+h+deeper);ctx.bezierCurveTo(x+w*.32,y+h+deeper*.8,x+w*.13,y+h+4,x+6,y+h);ctx.quadraticCurveTo(x-2,y+10,x+2,y);
  }
 }else{ctx.lineTo(x+w,y+h);ctx.lineTo(x,y+h);ctx.lineTo(x,y+6);ctx.quadraticCurveTo(x,y+1,x+2,y);}
 ctx.closePath();ctx.fill();ctx.save();ctx.clip();
 const first=Math.max(x+12,Math.floor((camera-70)/62)*62),last=Math.min(x+w-10,camera+viewW+80);
 if(theme==='dream'){
  // Iridescent contours flow through opal, rather than painted facade blocks.
  for(let j=0;j<(thin?2:4);j++){const yy=y+10+j*(thin?9:30);waStroke(j%2?'#cddbd96b':'#7c79ab43',1.2,()=>{ctx.moveTo(x-10,yy);for(let xx=x-10;xx<x+w+10;xx+=65)ctx.quadraticCurveTo(xx+29,yy+Math.sin(xx*.015+j)*9,xx+65,yy+Math.sin((xx+65)*.015+j)*7);});}
  for(let xx=first;xx<last;xx+=82){const yy=y+15+noise(xx+8)*Math.min(63,h*.55);waSoftVolume(xx,yy,29,23,noise(xx)>.5?'#ddc5e630':'#b7e5db2d');}
 }else if(theme==='nebula'){
  // Joined facets retain the solid top and form suspended gemstone ledges.
  for(let xx=first;xx<last;xx+=62){const len=Math.min(h+12,21+noise(xx+9)*51);ctx.fillStyle=noise(xx+3)>.5?'#c2e3e320':'#101d5030';ctx.beginPath();ctx.moveTo(xx-9,y+6);ctx.lineTo(xx+18,y+8);ctx.lineTo(xx+4,y+len);ctx.lineTo(xx-13,y+len*.72);ctx.closePath();ctx.fill();waStroke('#a7e2df5e',.8,()=>{ctx.moveTo(xx+18,y+8);ctx.lineTo(xx+4,y+len);ctx.lineTo(xx-13,y+len*.72);});}
  waStroke('#ccdbe15a',.8,()=>{ctx.moveTo(x+9,y+13);ctx.lineTo(x+w*.3,y+17);ctx.lineTo(x+w*.49,y+13);ctx.lineTo(x+w-9,y+19);});
 }else if(theme==='asteroid'){
  for(let xx=first;xx<last;xx+=79){const radius=5+noise(xx+11)*9,yy=y+12+radius+noise(xx+3)*Math.max(0,Math.min(h-37,65));waCrater(xx,yy,radius,radius*.57,true);}
  for(let xx=first+22;xx<last;xx+=119)waStroke('#c6c5b231',.8,()=>{ctx.moveTo(xx,y+7);ctx.bezierCurveTo(xx-7,y+17,xx+9,y+22,xx+1,y+34);});
 }else if(theme==='rings'){
  const count=thin?3:7;for(let j=0;j<count;j++){const yy=y+9+j*(thin?5:17);waStroke(j%2?'#5e657b3a':'#e0d2bc59',.8+j%2*.4,()=>{ctx.moveTo(x+3,yy);for(let xx=x+3;xx<x+w;xx+=100)ctx.quadraticCurveTo(xx+45,yy+Math.sin(xx*.008+j)*4,xx+100,yy+Math.sin((xx+100)*.008+j)*3);});}
  for(let xx=first;xx<last;xx+=103){const yy=y+12+noise(xx+7)*Math.min(h*.4,37);ellipse(xx,yy,2.2,1.3,'#e1d2bd57');ellipse(xx+17,yy+8,1.3,1,'#343f612e');}
 }else if(theme==='inferno'){
  for(let xx=first;xx<last;xx+=67){const depth=Math.min(h-2,22+noise(xx)*72);waStroke('#10172892',2,()=>{ctx.moveTo(xx,y+5);ctx.lineTo(xx-7,y+depth*.29);ctx.lineTo(xx+3,y+depth*.66);ctx.lineTo(xx-2,y+depth);});
   if(noise(xx+13)>.32){const seam=()=>{ctx.moveTo(xx-6,y+depth*.32);ctx.lineTo(xx+4,y+depth*.66);ctx.lineTo(xx-1,y+depth);};waStroke('#db6e3938',4,seam);waStroke('#f3a45899',1.15,seam);waSoftVolume(xx,y+depth*.76,17,25,'#df75362f');}
  }
  if(!thin)for(let j=0;j<2;j++){const yy=y+28+j*39;waStroke('#d67c444d',1.1,()=>{ctx.moveTo(x+7,yy);for(let xx=x+7;xx<x+w-5;xx+=87)ctx.quadraticCurveTo(xx+41,yy+noise(xx+j)*13,xx+87,yy+noise(xx+17)*7);});}
  waStroke('#94919b2b',1,()=>{ctx.moveTo(x+6,y+7);ctx.bezierCurveTo(x+w*.33,y+11,x+w*.6,y+3,x+w-6,y+9);});
 }
 ctx.restore();
 // Bright narrow rims identify the exact playable lip in every material.
 line(x+2,y+1,x+w-2,y+1,edge,2.3);line(x+5,y+4,x+w-5,y+4,edge+'36',.8);
 if(thin&&theme==='dream'){
  const cx=x+w*.63;waStroke('#c3c1de69',1,()=>{ctx.moveTo(cx,y+h+10);ctx.bezierCurveTo(cx-10,y+h+24,cx+11,y+h+33,cx+2,y+h+43);});ellipse(cx+2,y+h+44,2.4,3.2,'#d1dddca8');
 }
 ctx.restore();
}
function waCosmicDecorate(t){
 const x=t.x,y=t.y,w=t.w,theme=world.theme,spacing=theme==='inferno'?229:163;
 const origin=x+33,first=origin+Math.max(0,Math.floor((camera-35-origin)/spacing))*spacing;
 for(let xx=first;xx<x+w-20&&xx<camera+viewW+40;xx+=spacing){
  const seed=xx+13;if(noise(seed)<.34)continue;
  if(theme==='dream'){
   const stem=7+noise(seed+6)*8;waStroke('#a9b6cbb8',1.2,()=>{ctx.moveTo(xx,y+1);ctx.quadraticCurveTo(xx-3,y-stem*.52,xx+1,y-stem);});
   circle(xx+1,y-stem,3.5,waGradient(xx-2,y-stem-4,xx+4,y-stem+4,['#f3e5e6','#b2becf']));ellipse(xx,y-stem-1.4,1.1,.6,'#ffffffa9');waSoftVolume(xx+1,y-stem,17,17,'#d7e5df1b');
   waLeaf(xx,y-3,5,-1.2,'#b0c2ccbd');waLeaf(xx+1,y-5,4,.6,'#e3cedbc4');
  }else if(theme==='nebula'){
   // Short prisms grow out of the ledge, unlike free-floating yellow power-ups.
   for(let j=0;j<3;j++){const cx=xx+j*4-4,hh=7+noise(seed+j*7)*9;ctx.fillStyle=j%2?'#a7cbd0b8':'#79b6c7cf';ctx.beginPath();ctx.moveTo(cx-3,y+.4);ctx.lineTo(cx-2,y-hh*.65);ctx.lineTo(cx,y-hh);ctx.lineTo(cx+2.4,y-hh*.72);ctx.lineTo(cx+3,y+.4);ctx.closePath();ctx.fill();line(cx,y-hh+2,cx,y,'#d1ece27a',.7);}
  }else if(theme==='asteroid'||theme==='rings'){
   const pale=theme==='rings';for(let j=0;j<2;j++){const rx=3+noise(seed+j)*4,ry=rx*.51;ctx.fillStyle=waGradient(xx,y-8,xx,y+2,pale?['#e7d8b8','#a5a092']:['#a3a6a4','#687a87']);ctx.beginPath();waRockPath(xx+j*9,y-ry+1,rx,ry,seed+j);ctx.fill();}
  }else if(theme==='inferno'){
   // Cool safe rim; an ember seam glows underneath without faking fire damage.
   const yy=y+13;waSoftVolume(xx,yy,16,9,'#da854521');waStroke('#b97a5c62',.8,()=>{ctx.moveTo(xx-7,yy+4);ctx.lineTo(xx-2,yy);ctx.lineTo(xx+4,yy+2);});
  }
 }
}

function platform(t){
 const x=t.x,y=t.y,w=t.w,h=t.h,theme=world.theme,day=world.day;
 if(waCosmicTheme(theme)){waCosmicPlatform(t);return;}
 const forest=theme==='forest',ruins=theme==='ruins',voidW=theme==='void';
 if(theme==='clouds'){
  const depth=Math.min(h,46),cg=waGradient(x,y,x,y+Math.max(25,depth+7),['#fff8e9','#e4eef2','#b6cadd']);ctx.fillStyle=cg;ctx.beginPath();ctx.moveTo(x+4,y);ctx.lineTo(x+w-4,y);ctx.quadraticCurveTo(x+w,y+1,x+w,y+8);ctx.quadraticCurveTo(x+w+2,y+depth,x+w-14,y+depth+3);
  for(let xx=x+w-14;xx>x+14;xx-=38){const end=Math.max(x+14,xx-38);ctx.bezierCurveTo(xx-7,y+depth+17,xx-30,y+depth+13,end,y+depth+1);}
  ctx.quadraticCurveTo(x-3,y+depth,x,y+8);ctx.quadraticCurveTo(x,y+1,x+4,y);ctx.closePath();ctx.fill();
  for(let xx=x+17;xx<x+w-14;xx+=44){waStroke('#fffdf379',1.3,()=>{ctx.moveTo(xx-9,y+8);ctx.quadraticCurveTo(xx,y+3,xx+12,y+7);});}line(x+3,y+1,x+w-3,y+1,'#fff9df',2);return;
 }
 if(t.oneWay){waThinPlatform(t);return;}
 const shades=forest?(day?['#72968c','#4b7375','#253f51']:['#547a81','#365468','#182b44']):ruins?(day?['#b3a39a','#8f8293','#525773']:['#98828e','#70657d','#3d4868']):voidW?['#535165','#32354c','#172135']:(day?['#a0b5c8','#718da8','#3d527c']:['#6d92b2','#3e5f87','#1b365d']);
 const stone=waGradient(x,y,x,y+Math.min(h,170),shades);rounded(x,y,w,h,Math.min(5,h*.25),stone);
 // Inner lip shade gives depth without moving the collision edge.
 rounded(x+2,y+5,w-4,5,2,'#101c352b');
 const edge=forest?(day?'#c7ddb2':'#a4dac9'):ruins?'#edcdb0':voidW?'#a6c8d0':'#c9e8f0';
 line(x+2,y+1,x+w-2,y+1,edge,2.6);line(x+5,y+3,x+w-5,y+3,edge+'40',1);
 // Material-specific strata stay entirely within the visible cliff face.
 if(forest){
  for(let k=0;k<3;k++){const yy=y+34+k*33;if(yy>y+h-8)continue;waStroke(k%2?'#c4d9bd16':'#173b5427',3-k*.5,()=>{ctx.moveTo(x+7,yy);for(let xx=x+7;xx<x+w-9;xx+=70)ctx.quadraticCurveTo(xx+35,yy+Math.sin(xx*.013+k)*9,Math.min(x+w-8,xx+70),yy+Math.sin(xx*.009)*5);});}
  for(let xx=x+38;xx<x+w-24;xx+=131){const length=Math.min(h-10,27+noise(xx)*49);waStroke('#1e485e90',2,()=>{ctx.moveTo(xx,y+7);ctx.bezierCurveTo(xx-9,y+17,xx+12,y+length*.7,xx+3,y+length);});waStroke('#b7ccb830',.8,()=>{ctx.moveTo(xx+2,y+9);ctx.quadraticCurveTo(xx-4,y+16,xx+5,y+25);});}
 }else if(ruins){
  const hh=Math.min(h,143);for(let xx=x+24;xx<x+w-8;xx+=82){line(xx,y+12,xx-4,y+hh,'#41506a43',1.1);line(xx+1,y+13,xx-3,y+hh,'#e5cabb30',.7);}for(let k=0;k<3;k++){const yy=y+27+k*39;if(yy<y+h)line(x+6,yy,x+w-6,yy,'#dfc6b322',1);}
  for(let xx=x+74;xx<x+w-21;xx+=217){waStroke('#36425e65',1.1,()=>{ctx.moveTo(xx,y+16);ctx.lineTo(xx-7,y+24);ctx.lineTo(xx+3,y+31);ctx.lineTo(xx-1,y+38);});}
 }else if(voidW){
  for(let xx=x+31;xx<x+w-10;xx+=88){const hh=Math.min(h-8,40+noise(xx)*69);waStroke('#69638237',4,()=>{ctx.moveTo(xx,y+12);ctx.bezierCurveTo(xx-17,y+30,xx+15,y+hh*.8,xx+2,y+hh);});waStroke('#adc9c826',.9,()=>{ctx.moveTo(xx-2,y+11);ctx.quadraticCurveTo(xx-11,y+24,xx-3,y+34);});}
 }else{
  for(let xx=x+22;xx<x+w-12;xx+=61){line(xx,y+8,xx,y+19,'#bedceb49',1);const yy=y+12;ctx.strokeStyle='#d1e8ee78';ctx.lineWidth=.9;ctx.beginPath();ctx.moveTo(xx-4,yy);ctx.quadraticCurveTo(xx,yy-6,xx+4,yy);ctx.quadraticCurveTo(xx,yy+6,xx-4,yy);ctx.stroke();}
  if(h>45){line(x+4,y+26,x+w-4,y+26,'#e2eff225',1);}
 }
}

function decorate(t){
 const theme=world.theme,day=world.day,x=t.x,y=t.y,w=t.w;
 if(waCosmicTheme(theme)){waCosmicDecorate(t);return;}
 if(t.oneWay)return;
 if(theme==='forest'){
  // All stems originate exactly at the collision rim; no clipped or hovering plants.
  const origin=x+14,first=origin+Math.max(0,Math.floor((camera-30-origin)/59))*59;for(let xx=first;xx<x+w-12&&xx<camera+viewW+40;xx+=59){const n=noise(xx+4);if(n>.64){for(let j=0;j<3;j++){const px=xx+j*5-5,height=6+noise(px+8)*6;waStroke(day?'#6d9e87':'#75b6a2',1,()=>{ctx.moveTo(px,y+.7);ctx.quadraticCurveTo(px-3,y-height*.6,px-1,y-height);});for(let k=0;k<5;k++){const a=k*Math.PI*.4;ellipse(px-1+Math.cos(a)*2,y-height-1+Math.sin(a)*2,1.8,1.3,day?'#e2edbc':'#b5ebd4');}circle(px-1,y-height-1,1,'#ffe5a2');}glow(xx,y-7,20,day?'#ecffd819':'#a1f4d934');}
   else if(n>.36){waStroke('#618d83',1.4,()=>{ctx.moveTo(xx,y+1);ctx.quadraticCurveTo(xx+1,y-7,xx,y-10);});const cap=waGradient(xx,y-16,xx,y-8,day?['#c5dda8','#78aaa0']:['#c0f0d9','#5eacae']);ctx.fillStyle=cap;ctx.beginPath();ctx.moveTo(xx-5,y-9);ctx.quadraticCurveTo(xx-5,y-15,xx,y-15);ctx.quadraticCurveTo(xx+5,y-15,xx+6,y-9);ctx.quadraticCurveTo(xx,y-7,xx-5,y-9);ctx.fill();line(xx-3,y-10,xx+3,y-10,'#e5f9d275',.7);}
   else for(let j=-1;j<=1;j++)waLeaf(xx,y+1,6+Math.abs(j)*2,j*.67,day?'#8fb99c':'#78b7ad');
  }
 }else if(theme==='ruins'){
  const origin=x+23,first=origin+Math.max(0,Math.floor((camera-30-origin)/183))*183;for(let xx=first;xx<x+w-15&&xx<camera+viewW+35;xx+=183){waStroke(day?'#547676':'#538184',1.2,()=>{ctx.moveTo(xx,y+3);ctx.bezierCurveTo(xx-10,y+9,xx+9,y+23,xx+1,y+34);});for(let j=0;j<3;j++)waLeaf(xx+Math.sin(j*2)*4,y+8+j*8,6,j%2?1.8:.2,day?'#7b9a87':'#6b9a96');}
 }else if(theme==='void'){
  const origin=x+28,first=origin+Math.max(0,Math.floor((camera-30-origin)/107))*107;for(let xx=first;xx<x+w-15&&xx<camera+viewW+25;xx+=107){ellipse(xx,y+2,8,2,'#b7d4ce21');waStroke('#89909871',1.2,()=>{ctx.moveTo(xx,y+4);ctx.quadraticCurveTo(xx+4,y+7,xx+1,y+14);});}
 }
}

function drawUnderworld(){
 // A continuous ceiling and broad attached side ribs enclose the playable void.
 // Unlike hanging tendrils, these masses connect roof to the distant cave floor.
 const roofFirst=Math.floor((camera-180)/120),roofLast=Math.ceil((camera+viewW+180)/120),roof=[];
 for(let i=roofFirst;i<=roofLast;i++)roof.push({x:i*120,y:58+noise(i+53)*52});
 ctx.fillStyle=waGradient(0,0,0,145,['#121c2c','#2c3046','#29374a']);ctx.beginPath();ctx.moveTo(roof[0].x,0);ctx.lineTo(roof[roof.length-1].x,0);ctx.lineTo(roof[roof.length-1].x,roof[roof.length-1].y);
 for(let i=roof.length-1;i>0;i--){const p=roof[i],prev=roof[i-1];ctx.quadraticCurveTo(p.x,p.y,(p.x+prev.x)/2,(p.y+prev.y)/2);}ctx.lineTo(roof[0].x,roof[0].y);ctx.closePath();ctx.fill();
 const wallFirst=Math.floor((camera-170)/920),wallLast=Math.ceil((camera+viewW+170)/920);
 for(let i=wallFirst;i<=wallLast;i++){const px=i*920+34,side=i%2?-1:1;ctx.save();ctx.translate(px,0);ctx.scale(side,1);ctx.globalAlpha=.66;
  ctx.fillStyle=waGradient(-65,0,68,0,['#142234','#29364b','#49425a','#29354a']);ctx.beginPath();ctx.moveTo(-84,-10);ctx.lineTo(45,-10);ctx.bezierCurveTo(20,111,54,189,33,288);ctx.bezierCurveTo(11,376,47,439,111,532);ctx.quadraticCurveTo(134,557,139,584);ctx.lineTo(-73,584);ctx.bezierCurveTo(-8,496,-61,426,-47,344);ctx.bezierCurveTo(-21,244,-65,102,-84,-10);ctx.closePath();ctx.fill();
  waStroke('#9490a02b',1.6,()=>{ctx.moveTo(18,48);ctx.bezierCurveTo(8,146,40,207,17,304);ctx.bezierCurveTo(6,393,30,452,87,534);});
  for(let j=0;j<3;j++)waStroke('#0e1d323d',2,()=>{ctx.moveTo(-31+j*12,177+j*58);ctx.quadraticCurveTo(-15+j*13,199+j*58,-24+j*12,214+j*58);});
  ctx.restore();
 }
 const first=Math.floor((camera-170)/290),last=Math.ceil((camera+viewW+170)/290);
 for(let i=first;i<=last;i++){const x=i*290+(noise(i+4)-.5)*120,length=180+noise(i+9)*190;
  // Thick connected root/rib shapes have a light wet face and a dark far side.
  const rib=waGradient(x-22,0,x+32,0,['#171d2b','#4d405a','#716077','#2a2d43']);ctx.fillStyle=rib;ctx.beginPath();ctx.moveTo(x-18,-15);ctx.bezierCurveTo(x+29,106,x-34,188,x+20,length);ctx.quadraticCurveTo(x+33,length+19,x+43,length+1);ctx.bezierCurveTo(x-1,193,x+64,94,x+21,-15);ctx.closePath();ctx.fill();
  waStroke('#c0a2bd2d',1.1,()=>{ctx.moveTo(x+9,7);ctx.bezierCurveTo(x+41,118,x-15,203,x+31,length-4);});
  // Only selected roots carry cool jade sap. Spatial seeds keep the choice
  // fixed while scrolling; the warm violet puddles are the slowing surface.
  if(noise(i+61)>.68){
   const dripX=x+24,dripEnd=106+noise(i+1)*123,wobble=Math.sin(time*.75+i)*2;
   waStroke('#60ada49c',2.4,()=>{ctx.moveTo(dripX,26);ctx.quadraticCurveTo(dripX-6,65,dripX,dripEnd+wobble);});
   ellipse(dripX,dripEnd+6+wobble,3.5,7,'#88d2bdce');ellipse(dripX-1,dripEnd+4+wobble,.8,2.6,'#dcfff1c4');
   const dropY=dripEnd+13+(time*46+i*41)%Math.max(60,430-dripEnd);ellipse(dripX,dropY,1.8,3.8,'#9fe3cba8');
  }
  if(noise(i+7)>.43){const px=x+100,yy=448+noise(i)*22;glow(px,yy,50,'#8ed9d329');for(let j=0;j<3;j++){const r=9+noise(i+j)*11;crystal(px+j*11,yy+j*3,r,j%2?'#92c6d0':'#8a91b2');}}
 }
}
function drawSlime(q){
 const x=q.x,y=q.y,w=q.w;
 const g=waGradient(x,y-3,x,y+11,['#e2b2f1','#a362c0','#61377f']);
 // Broad footprint, opaque gel and a bright meniscus distinguish a sticky
 // puddle from the blue-grey rock and the cool decorative sap above it.
 ellipse(x+w*.5,y+8,w*.5+4,4.5,'#26153579');
 ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,y+3);ctx.bezierCurveTo(x+w*.04,y-1,x+w*.12,y+1,x+w*.19,y+1);ctx.bezierCurveTo(x+w*.34,y-2,x+w*.42,y+3,x+w*.55,y);ctx.bezierCurveTo(x+w*.71,y-2,x+w*.85,y+1,x+w*.94,y+2);ctx.quadraticCurveTo(x+w+8,y+4,x+w-2,y+7);ctx.bezierCurveTo(x+w*.75,y+13,x+w*.4,y+9,x+w*.24,y+10);ctx.quadraticCurveTo(x-10,y+11,x,y+3);ctx.fill();
 waStroke('#f7daf7dc',1.6,()=>{ctx.moveTo(x+8,y+3);ctx.bezierCurveTo(x+w*.15,y+1,x+w*.22,y+3,x+w*.35,y+2);ctx.moveTo(x+w*.58,y+2);ctx.quadraticCurveTo(x+w*.7,y+1,x+w*.8,y+3);});
 for(let j=0;j<w-12;j+=39){const xx=x+j+10,yy=y+2+Math.sin(time*1.8+j)*.7,r=1.8+noise(j+x)*1.5;circle(xx,yy,r,'#c590dfc4');ellipse(xx-.6,yy-.8,r*.45,r*.2,'#fff0ffd9');}
}
