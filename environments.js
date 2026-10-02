'use strict';
// Landmarks and materials have their own silhouettes, not just tinted skies.
const trailBackground=background,trailPlatform=platform,trailDecorate=decorate,trailUnderworld=drawUnderworld;
function envRepeat(spacing,par,draw){for(let i=Math.floor(camera*par/spacing)-1;i<(camera*par+viewW)/spacing+2;i++)draw(i*spacing-camera*par,i);}
function envSky(colors){ctx.fillStyle=waGradient(0,0,0,600,colors);ctx.fillRect(0,0,viewW,600);}
function envHills(y,par,color,amplitude=28){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,600);for(let x=0;x<=viewW+40;x+=40){const z=x+camera*par;ctx.lineTo(x,y+Math.sin(z*.003)*amplitude+Math.sin(z*.008)*amplitude*.28);}ctx.lineTo(viewW,600);ctx.closePath();ctx.fill();}
function envPlanet(x,y,r,colors){glow(x,y,r*1.55,colors[0]+'25');circle(x,y,r,waGradient(x-r,y-r,x+r,y+r,colors));ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();for(let i=0;i<4;i++)waStroke('#ffffff12',r*.13,()=>{ctx.moveTo(x-r,y-r*.7+i*r*.45);ctx.bezierCurveTo(x-r*.1,y-r+i*r*.45,x+r*.3,y-r*.4+i*r*.45,x+r,y-r*.2+i*r*.45);});ctx.restore();}
function envBalloon(x,y,scale,seed){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);const drift=Math.sin(time*.65+seed)*4;ctx.translate(0,drift);ellipse(0,0,32,44,waGradient(-30,-40,30,40,['#ffe2af','#d6a474','#a77683']));waStroke('#fff1c482',1.3,()=>{ctx.moveTo(0,-43);ctx.bezierCurveTo(-18,-21,-17,18,0,41);});waStroke('#aa717a70',1.2,()=>{ctx.moveTo(3,-42);ctx.bezierCurveTo(25,-20,24,17,4,40);});line(-17,36,-10,61,'#d1b2a7',1);line(17,36,10,61,'#d1b2a7',1);rounded(-13,58,26,17,4,'#946d83');line(-10,61,10,61,'#ebc6a7',1.5);ctx.restore();}
function envStationModule(x,y,scale,seed,reactor=false){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);const h=120+noise(seed+8)*75;
 rounded(-175,-h,350,h,14,waGradient(0,-h,0,0,['#476275','#293e53','#152b42']));rounded(-180,-h,360,13,5,'#678190');rounded(-181,-8,362,11,4,'#435e73');
 for(const side of [-1,1]){rounded(side*153-9,-h+12,18,h-22,3,'#71838b55');for(let j=0;j<4;j++)circle(side*153,-h+25+j*(h-43)/4,2,'#aac2c9a0');}
 for(let j=0;j<3;j++){const xx=-104+j*100;rounded(xx-29,-h+27,58,62,8,'#112e45');rounded(xx-24,-h+32,48,52,5,waGradient(xx,-h+32,xx,-h+84,['#80d4d87a','#3f8caa59','#245875']));line(xx-23,-h+56,xx+23,-h+56,'#bdd1d65e',2);line(xx,-h+33,xx,-h+83,'#a8d0d14a',2);}
 waStroke('#1a3047',15,()=>{ctx.moveTo(-180,-h+14);ctx.lineTo(-230,-h+14);ctx.quadraticCurveTo(-248,-h+14,-248,-h+38);ctx.lineTo(-248,-16);ctx.quadraticCurveTo(-248,0,-269,0);ctx.lineTo(-330,0);});
 waStroke('#769fafa0',2,()=>{ctx.moveTo(-181,-h+9);ctx.lineTo(-230,-h+9);ctx.quadraticCurveTo(-254,-h+9,-254,-h+35);ctx.lineTo(-254,-16);});
 line(-175,-h-13,175,-h-13,'#829eaa8f',3);for(let j=0;j<6;j++)line(-170+j*65,-h-14,-170+j*65,-h-30,'#829eaa8f',2);line(-175,-h-30,175,-h-30,'#9bb2bc7a',2);
 if(reactor){const rx=90;rounded(rx-33,-h-78,66,72,12,waGradient(rx-33,0,rx+33,0,['#3d6474','#93b2b4','#2a5066']));glow(rx,-h-44,68,'#5ad7c52f');rounded(rx-19,-h-67,38,45,8,'#7bdfce78');for(let j=0;j<3;j++)line(rx-29,-h-65+j*22,rx+29,-h-65+j*22,'#b4d9d399',4);}
 else{line(-78,-h-31,-78,-h-107,'#9ab3be',3);waStroke('#a5c5d080',3,()=>{ctx.ellipse(-78,-h-116,43,19,-.45,.05,Math.PI+.15);});line(-78,-h-115,-53,-h-145,'#d1d7c7',2);circle(-53,-h-145,3,'#ffe3a6');}
 for(let j=0;j<3;j++)rounded(-115+j*110,-24,46,9,3,reactor?'#82d7c959':'#e6b48269');ctx.restore();
}
function envStation(reactor=false,orbital=false){
 if(orbital)waCosmicBackground('rings');else{envSky(reactor?['#061c29','#153d4c','#376263']:['#0c1830','#25415c','#678391']);waSpaceStars('#d6e3efa1');if(!reactor)envPlanet(viewW*.76-camera*.022,145,94,['#c1b5c4','#6a89a1','#234664']);}
 if(reactor){ctx.fillStyle=waGradient(0,0,0,125,['#122938','#26404c','#315563']);ctx.fillRect(0,0,viewW,88);envRepeat(340,.1,(x)=>{rounded(x-30,75,60,57,7,'#173441');line(x-20,127,x+20,127,'#789497',3);waStroke('#4b7181',10,()=>{ctx.moveTo(x+90,0);ctx.lineTo(x+90,97);ctx.quadraticCurveTo(x+90,112,x+125,112);ctx.lineTo(x+255,112);});glow(x,144,72,'#88e5d624');});}
 envRepeat(700,.055,(x,i)=>{ctx.save();ctx.globalAlpha=.34;envStationModule(x,410,.75,i+5,reactor);ctx.restore();});
 envRepeat(840,.19,(x,i)=>{ctx.save();ctx.globalAlpha=orbital?.48:.68;envStationModule(x+175,495,1.04,i+41,reactor);ctx.restore();});
 if(!reactor)envRepeat(700,.085,(x)=>{waStroke('#789aa95d',6,()=>{ctx.moveTo(x-155,540);ctx.lineTo(x-155,256);ctx.lineTo(x+125,256);ctx.lineTo(x+125,318);});line(x-140,263,x+117,263,'#b0c2c52c',2);line(x+106,270,x+106,320,'#b0c2c55c',1);rounded(x+81,320,49,31,4,'#46607480');});
 waMist(490,reactor?'#8ccac114':'#bbd8de13');
}
function envMesa(x,base,w,h,color,seed){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x-w*.7,base);ctx.quadraticCurveTo(x-w*.3,base-h*.24,x-w*.28,base-h*.81);ctx.quadraticCurveTo(x-w*.23,base-h,x-w*.1,base-h);ctx.lineTo(x+w*.3,base-h+noise(seed)*12);ctx.quadraticCurveTo(x+w*.36,base-h*.87,x+w*.4,base-h*.65);ctx.quadraticCurveTo(x+w*.5,base-h*.25,x+w*.7,base);ctx.closePath();ctx.fill();waStroke('#f4caa51f',2,()=>{ctx.moveTo(x-w*.27,base-h*.64);ctx.quadraticCurveTo(x,base-h*.73,x+w*.39,base-h*.6);});}
function envCrystal(x,y,h,color,lean=0){ctx.save();ctx.translate(x,y);ctx.rotate(lean);ctx.fillStyle=waGradient(-h*.16,0,h*.15,0,[color,'#756194','#202641']);ctx.beginPath();ctx.moveTo(-h*.17,0);ctx.lineTo(-h*.14,-h*.75);ctx.lineTo(0,-h);ctx.lineTo(h*.18,-h*.71);ctx.lineTo(h*.13,0);ctx.closePath();ctx.fill();waStroke(color+'a0',1,()=>{ctx.moveTo(0,-h);ctx.lineTo(0,-h*.3);ctx.lineTo(h*.13,0);});line(-h*.13,-h*.75,0,-h*.7,color+'5b',1);ctx.restore();}
function envDesert(style='desert'){
 const underground=style==='fossil',sky=style==='dustsky';envSky(underground?['#201723','#49333c','#775045']:sky?['#744b7d','#d7918e','#e8c795']:['#695576','#ca928c','#f2d1a0']);
 if(!underground){envPlanet(viewW*.76-camera*.02,132,sky?78:100,['#e1a3b0','#8d638b','#5c506f']);glow(viewW*.2,275,145,'#ffe6a337');circle(viewW*.2,275,25,'#ffe6b6b0');}
 for(let layer=0;layer<3;layer++){const par=.045+layer*.045;envRepeat(510+layer*70,par,(x,i)=>{ctx.save();ctx.globalAlpha=.43+layer*.08;envMesa(x,490+layer*37,250+noise(i+12)*100,145+noise(i+layer*4)*120,['#896d83','#947482','#98705e'][layer],i);ctx.restore();});}
 if(sky){envRepeat(490,.14,(x,i)=>{ctx.save();ctx.globalAlpha=.65;envMesa(x,370+noise(i)*65,130,55,'#a78582',i);waCloud(x+32,385+noise(i)*65,155,21,.21);ctx.restore();});}
 else if(underground){envRepeat(530,.11,(x,i)=>{ctx.fillStyle=waGradient(0,0,0,173,['#241e2b','#3f2e3d','#6d4c45']);ctx.beginPath();ctx.moveTo(x-285,0);ctx.lineTo(x+285,0);ctx.quadraticCurveTo(x+213,73,x+84,117);ctx.quadraticCurveTo(x+20,134,x-47,203);ctx.quadraticCurveTo(x-78,183,x-106,83);ctx.quadraticCurveTo(x-187,39,x-285,0);ctx.fill();ctx.save();ctx.globalAlpha=.32;for(let j=0;j<5;j++){const yy=501-j*38,rx=85-j*7;waStroke('#debd93',7-j*.7,()=>{ctx.moveTo(x-rx-20,520);ctx.bezierCurveTo(x-rx,yy-45,x+rx,yy-45,x+rx+20,520);});}waStroke('#e3c49e',6,()=>{ctx.moveTo(x-2,501);ctx.quadraticCurveTo(x-12,420,x+4,285);});ctx.restore();glow(x+168,376,50,'#ffd47c25');circle(x+168,376,3,'#efce947c');});}
 else{envHills(473,.16,'#b4877492',24);envHills(540,.22,'#bf936f',16);envRepeat(760,.18,(x)=>{ctx.save();ctx.globalAlpha=.4;waTrunk(x,515,96,5,'#66545d',5,false,false);ctx.restore();});}
 waMist(492,'#f5d2a015');for(let j=0;j<20;j++){const x=((j*137-camera*.2+time*7)%(viewW+100)+viewW+100)%(viewW+100);circle(x,260+noise(j+7)*235,.6,'#ffe6c578');}
}
function envSunrise(){envSky(['#708494','#e7baa0','#d7dfb7']);const sx=viewW*.72-camera*.022;glow(sx,245,185,'#fff4a646');circle(sx,245,34,'#fff1b5');envRepeat(530,.045,(x,i)=>waCloud(x,145+noise(i+3)*85,160,33,.24));
 envHills(334,.055,'#92b5a3',29);envHills(402,.11,'#68999a',22);
 envRepeat(650,.09,(x,i)=>{waStroke('#d8f3e435',26,()=>{ctx.moveTo(x+178,358);ctx.bezierCurveTo(x+168,394,x+184,422,x+176,484);});line(x+175,360,x+173,474,'#e1eee14c',4);});
 for(let layer=0;layer<2;layer++)envRepeat(layer?355:270,layer?.22:.12,(x,i)=>{ctx.save();ctx.globalAlpha=layer?.56:.28;waTrunk(x,574,300+noise(i+9)*110,layer?15:10,layer?'#2f6068':'#689b9b',i*17,true,true);ctx.restore();});
 waMist(470,'#e4f5d31c');for(let j=0;j<20;j++){const x=((j*171-camera*.24)%(viewW+60)+viewW+60)%(viewW+60);circle(x,330+noise(j+7)*177,1,'#ffecc39f');}
}
function envSunset(){envSky(['#685779','#c9899a','#f1c7a5']);const x=viewW*.72-camera*.025;glow(x,261,195,'#ffd39139');circle(x,261,48,'#f5ceab9c');envRepeat(600,.04,(x,i)=>waCloud(x,130+noise(i)*90,180,34,.19));envHills(456,.06,'#a587a067',28);
 envRepeat(650,.15,(x,i)=>{ctx.save();ctx.globalAlpha=.74;waObservatory(x+170,444,.9+noise(i)*.12,i);ctx.restore();});
 const pts=[];for(let j=-1;j<viewW/200+2;j++)pts.push([j*200-camera*.04%200,170+noise(j+8)*40]);waStroke('#ffecd453',.8,()=>pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p)));for(const p of pts)star(...p,2,'#f4ead4a6');waMist(481,'#ebbdc42c');}
function envClouds(style){const dawn=style==='dawnsky',aurora=style==='aurorasky';envSky(dawn?['#9d99b9','#f0c3b1','#f8e6c1']:aurora?['#172d54','#427b91','#b2d5c3']:['#688ba8','#b4cedb','#eadfe5']);
 if(aurora){waSpaceStars('#e4faf5a0');for(let j=0;j<3;j++){const yy=130+j*59;waStroke(['#9de4cd2e','#acd1ed2b','#d2aef53b'][j],38,()=>{ctx.moveTo(-90,yy);for(let x=-90;x<viewW+90;x+=200)ctx.bezierCurveTo(x+60,yy-110,x+143,yy+90,x+200,yy-15);});waStroke('#dafff634',1.4,()=>{ctx.moveTo(-60,yy-15);ctx.bezierCurveTo(viewW*.25,yy-130,viewW*.57,yy+90,viewW+80,yy-35);});}envPlanet(viewW*.78-camera*.025,158,43,['#e9e5d6','#9ebbbd','#516e86']);}
 else{const sx=viewW*.7-camera*.028;glow(sx,188,180,'#ffe9ac3e');circle(sx,188,dawn?30:22,'#fff4c9bd');}
 for(let layer=0;layer<3;layer++)envRepeat(510,.05+layer*.045,(x,i)=>waCloud(x,380+layer*75+noise(i)*30,230,55,.3+layer*.15));
 if(dawn)envRepeat(780,.12,(x,i)=>envBalloon(x+90,185+noise(i+2)*85,.78+noise(i)*.18,i));
 else envRepeat(530,.14,(x,i)=>{waDreamIsland(x,350+noise(i+9)*70,.57+noise(i)*.15,i*11);if(aurora){ctx.save();ctx.globalAlpha=.5;envCrystal(x+18,335+noise(i+9)*70,65,'#a7ebd6',-.08);ctx.restore();}});
 waMist(490,'#e3eff527');
}
function envAmethyst(){envSky(['#170f30','#332753','#5b4568']);glow(viewW*.61-camera*.022,300,265,'#c99ef82e');
 for(let layer=0;layer<2;layer++)envRepeat(420,.06+layer*.065,(x,i)=>{ctx.save();ctx.globalAlpha=layer?.63:.36;const y=490+layer*30;envCrystal(x+80,y,135+noise(i+3)*135,'#b69fd2',-.14);envCrystal(x+127,y,93+noise(i+5)*75,'#9ccbd7',.2);envCrystal(x+29,y,100+noise(i+7)*95,'#daa9cf',-.3);ctx.restore();});
 envRepeat(550,.13,(x,i)=>{ctx.fillStyle=waGradient(0,0,0,130,['#1d1935','#332846']);ctx.beginPath();ctx.moveTo(x-285,0);ctx.lineTo(x+285,0);ctx.quadraticCurveTo(x+90,143,x+31,105);ctx.quadraticCurveTo(x-41,185,x-90,71);ctx.quadraticCurveTo(x-157,74,x-285,0);ctx.fill();ctx.save();ctx.translate(x+70,85);ctx.rotate(Math.PI);envCrystal(0,0,57+noise(i)*37,'#c1a4ed',.12);ctx.restore();});waMist(478,'#ceb7e31c');
}
background=function(){switch(world.environment){case 'sunrise':return envSunrise();case 'station':return envStation();case 'reactor':return envStation(true);case 'sunset':return envSunset();case 'desert':case 'dustsky':case 'fossil':return envDesert(world.environment);case 'dawnsky':case 'aurorasky':case 'cloudsea':return envClouds(world.environment);case 'crystal':return envAmethyst();case 'orbital':return envStation(false,true);default:return trailBackground();}};
platform=function(t){
 const station=world.theme==='station',desert=world.theme==='desert';if(!station&&!desert)return trailPlatform(t);
 const {x,y,w,h}=t,depth=t.oneWay?20:h;
 if(station){rounded(x,y,w,depth,4,waGradient(x,y,x,y+Math.min(depth,145),['#7d97a4','#3e596c','#1b3047']));line(x+2,y+1,x+w-2,y+1,'#cce9e5',2.6);rounded(x+3,y+6,w-6,5,2,'#102b4394');
  for(let xx=x+20;xx<x+w-12;xx+=82){circle(xx,y+15,1.8,'#a5beca');if(!t.oneWay){rounded(xx-9,y+35,64,57,5,'#132f4657');line(xx-6,y+38,xx+51,y+38,'#a7c5d82d',1);for(let j=0;j<3;j++)line(xx+4,y+52+j*8,xx+40,y+52+j*8,'#101f365e',2);line(xx+59,y+11,xx+59,y+depth-8,'#17354c78',1);}}
  if(!t.oneWay)line(x+5,y+104,x+w-5,y+104,'#7b9cad38',2);
 }else{rounded(x,y,w,depth,5,waGradient(x,y,x,y+Math.min(150,depth),world.environment==='fossil'?['#b59579','#866258','#443648']:['#dfc499','#b68a70','#6e5262']));line(x+3,y+1,x+w-3,y+1,'#ffe2b1',2.6);line(x+6,y+6,x+w-6,y+6,'#72535740',2);
  if(!t.oneWay)for(let j=0;j<4;j++){const yy=y+31+j*30;waStroke(j%2?'#ffdfab27':'#60435d40',2.5,()=>{ctx.moveTo(x+7,yy);for(let xx=x+7;xx<x+w-8;xx+=83)ctx.quadraticCurveTo(xx+40,yy+Math.sin(xx*.006+j)*9,Math.min(xx+83,x+w-8),yy+Math.sin(xx*.004+j)*4);});}
 }
};
decorate=function(t){if(!['station','desert'].includes(world.theme))return trailDecorate(t);if(t.oneWay)return;
 const first=t.x+38+Math.max(0,Math.floor((camera-t.x-38)/171))*171;for(let x=first;x<t.x+t.w-28&&x<camera+viewW+40;x+=171){if(world.theme==='station'){rounded(x-13,t.y+19,26,4,2,'#87dad173');circle(x-17,t.y+21,1.6,'#ffe7b3');}else{ellipse(x,t.y-1,8,2,'#f1d7ac8a');if(noise(x)>.7){waLeaf(x,t.y,11,-.55,'#8c9e91');waLeaf(x,t.y,14,.2,'#a9ad8b');waLeaf(x,t.y,9,.75,'#86948b');}}}
};
drawUnderworld=function(){if(world.environment!=='crystal')trailUnderworld();};
