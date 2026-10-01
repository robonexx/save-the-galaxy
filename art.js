'use strict';
function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function rounded(x,y,w,h,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();}
function line(x,y,xx,yy,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.stroke();}
function star(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,rr=i%2?r*.33:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.closePath();ctx.fill();}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#ffffff00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
const noise=n=>{const v=Math.sin(n*127.1+43.7)*43758.5453;return v-Math.floor(v);};
function drawPortal(q){
 const x=q.x,y=q.y;
 if(q.kind==='cloud'){
  const cloudY=y-118;glow(x,cloudY,95,'#e5f6ff45');
  ctx.fillStyle=waGradient(x,100,x,cloudY,['#effaff00','#effaff0b','#effaff28']);ctx.beginPath();ctx.moveTo(x-27,cloudY);ctx.lineTo(x-40,92);ctx.quadraticCurveTo(x,74,x+40,92);ctx.lineTo(x+27,cloudY);ctx.closePath();ctx.fill();
  waCloud(x,cloudY,43,16,.97);
  for(let i=0;i<7;i++){const yy=cloudY-20-((time*55+i*47)%Math.max(100,cloudY-95));ctx.globalAlpha=.2+.3*(yy/Math.max(1,cloudY));ctx.strokeStyle='#ecf8ff';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x-7,yy+3);ctx.quadraticCurveTo(x,yy-5,x+7,yy+3);ctx.stroke();}ctx.globalAlpha=1;
  ctx.fillStyle='#e5f4ed';ctx.font='9px system-ui';ctx.textAlign='center';ctx.fillText('JUMP ↑',x,cloudY+31);
 }else if(q.kind==='return'){
  const cy=y-54;glow(x,cy,80,'#a6e1d231');
  ellipse(x,cy,29,57,waGradient(x,cy-57,x,cy+57,['#19394db8','#102236eb','#0a1621']));
  for(let j=0;j<3;j++){ctx.strokeStyle=j===0?'#c1e8db':'#a5dccc55';ctx.lineWidth=j===0?2:1;ctx.beginPath();ctx.ellipse(x,cy,30+j*4,57+j*5,-.04,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<8;i++){const a=i*Math.PI*.25+time*.65;star(x+Math.cos(a)*34,cy+Math.sin(a)*62,1.4,'#def5e3ae');}
 }else{
  const returning=q.kind==='return',color=returning?'#c1e8db':'#a7bbeb';
  glow(x,y-15,75,returning?'#a6e1d230':'#a7a0e638');ctx.save();ctx.translate(x,y-12);ctx.rotate(-.14);ellipse(0,0,36,13,'#0a1424');
  for(let j=0;j<3;j++){ctx.strokeStyle=j===0?color:color+'66';ctx.lineWidth=1.5-j*.3;ctx.beginPath();ctx.ellipse(0,0,35+j*5,12+j*2,0,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9+time*.4,xx=Math.cos(a)*41,yy=Math.sin(a)*16;circle(xx,yy,1.2,color);}
  ctx.restore();
 }
}
function drawPortalTransitEffects(q){
 if(!transportJourney)return;const p=clamp(transportJourney.age/transportJourney.duration,0,1);
 if(q.kind==='cloud'){
  const cy=q.y-118;ctx.save();
  ctx.fillStyle=waGradient(q.x-22,0,q.x+22,0,['#e7f8ff00','#ecfaff28','#e7f8ff00']);ctx.fillRect(q.x-25,18,50,cy-8);
  for(let i=0;i<8;i++){const yy=cy-((time*125+i*47)%Math.max(100,cy-15));line(q.x-10+i%3*9,yy+16,q.x-10+i%3*9,yy,'#ecf9ff7d',1.2);}
  ctx.restore();
 }else if(q.kind==='blackhole'){
  const cy=q.y-12;glow(q.x,cy,66,'#ad93ef24');
  for(let i=0;i<12;i++){const a=i*Math.PI/6-time*3,r=12+((i*11-time*45)%45+45)%45;star(q.x+Math.cos(a)*r,cy+Math.sin(a)*r*.3-1,1.2*(1-p*.45),'#d2c5f2ab');}
 }
}
function drawPortalForeground(q){
 if(q.kind==='cloud'){
  // The cloud's near edge wraps around the actor before the beam lifts them.
  waCloud(q.x,q.y-113,34,9,.78);return;
 }
 if(q.kind==='return'){
  ctx.strokeStyle='#d5f3e3b5';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(q.x,q.y-54,30,57,-.04,-Math.PI*.45,Math.PI*.46);ctx.stroke();return;
 }
 ctx.save();ctx.translate(q.x,q.y-12);ctx.rotate(-.14);
 // The opaque near half is drawn after the hero. The actor therefore passes
 // behind the mouth's lip instead of falling in front of the cliff face.
 ctx.fillStyle='#0a1424';ctx.beginPath();ctx.moveTo(36,0);ctx.ellipse(0,0,36,13,0,0,Math.PI);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#b8c2f0';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(0,0,36,13,0,0,Math.PI);ctx.stroke();ctx.restore();
}
function drawJourneyAperture(front=false){
 if(!transition)return;const j=transition,p=clamp(j.age/j.duration,0,1),x=j.portalX,y=j.portalY;
 if(front){
  ctx.strokeStyle='#ebdbb3c2';ctx.lineWidth=2;
  ctx.beginPath();
  if(j.hasGate){ctx.moveTo(x-35,j.gateFoot+3);ctx.lineTo(x-35,y-29);ctx.bezierCurveTo(x-35,y-79,x+35,y-79,x+35,y-29);ctx.lineTo(x+35,j.gateFoot+3);}
  else ctx.ellipse(x,y,32,57,0,-Math.PI*.49,Math.PI*.49);
  ctx.stroke();return;
 }
 ctx.save();ctx.globalAlpha=journeyEase(p/.12);glow(x,y,90,'#c5eddb24');
 ctx.fillStyle=waGradient(x,y-58,x,y+58,['#325465b0','#10212be8','#1a2839bd']);ctx.beginPath();
 if(j.hasGate){ctx.moveTo(x-33,j.gateFoot+4);ctx.lineTo(x-33,y-29);ctx.bezierCurveTo(x-33,y-77,x+33,y-77,x+33,y-29);ctx.lineTo(x+33,j.gateFoot+4);ctx.closePath();}
 else ctx.ellipse(x,y,31,57,0,0,Math.PI*2);
 ctx.fill();
 if(!j.hasGate){ctx.strokeStyle='#d8d5f2a8';ctx.lineWidth=2;ctx.stroke();}
 for(let i=0;i<11;i++){const a=i*Math.PI*2/11-time*1.8,r=5+((i*13-time*42)%29+29)%29;star(x+Math.cos(a)*r,y+Math.sin(a)*r*1.55,1.3,'#e7ecdbc3');}
 ctx.restore();
}
function drawArrivalEffect(front=false){
 if(!arrivalFX)return;const a=arrivalFX,t=clamp(a.age/a.duration,0,1),fade=Math.sin(Math.PI*t),x=a.x,y=a.foot;
 ctx.save();ctx.globalAlpha=fade*.65;
 if(front){
  if(a.kind==='rise'){ctx.strokeStyle='#d6f5e4';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(x,y,24,5,0,0,Math.PI);ctx.stroke();}
 }else{
  glow(x,y-32,55,'#bdebd72c');
  if(a.kind==='gate'){ctx.strokeStyle='#c6e5e89c';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(x,y-40,23+9*t,47,0,0,Math.PI*2);ctx.stroke();}
  else{ctx.strokeStyle='#caeedab5';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(x,y,20+13*t,4+3*t,0,0,Math.PI*2);ctx.stroke();}
  for(let i=0;i<7;i++){const angle=i*Math.PI*2/7;star(x+Math.cos(angle)*(13+t*34),y-12+Math.sin(angle)*(8+t*26)-t*17,1.3,'#e2f6dc');}
 }
 ctx.restore();
}
function drawKey(k){
 if(k.got)return;const yy=k.y+Math.sin(time*3)*4;
 glow(k.x+14,yy+12,45,'#fff2ab55');ctx.strokeStyle='#ffe59c';ctx.lineWidth=4;ctx.beginPath();ctx.arc(k.x+10,yy+8,6,0,Math.PI*2);ctx.stroke();line(k.x+14,yy+13,k.x+25,yy+25,'#ffe59c',4);line(k.x+24,yy+24,k.x+28,yy+20,'#ffe59c',3);line(k.x+20,yy+20,k.x+24,yy+16,'#ffe59c',3);
}
function gate(){
 if(!world.exit)return;
 const x=world.exit,active=world.key.got,color=active?'#ffe3a0':'#b3b6cf';
 const stone=waGradient(x-6,0,x+18,0,world.day?['#566d85','#91a0aa','#52657e']:['#303e62','#7c819a','#35465f']);
 ctx.save();
 if(active){
  glow(x+43,461,94,'#ffd79124');
  ctx.fillStyle=waGradient(x,407,x,521,['#f9dfa809','#e5d4b432','#bde5ed15']);ctx.beginPath();ctx.moveTo(x+9,520);ctx.lineTo(x+9,434);ctx.bezierCurveTo(x+9,399,x+77,399,x+77,434);ctx.lineTo(x+77,520);ctx.closePath();ctx.fill();
  for(let j=0;j<11;j++){const yy=517-((time*26+j*19)%111),xx=x+43+Math.sin(j*1.9+time*.6)*24;ctx.globalAlpha=.22+.3*Math.sin((yy-406)/111*Math.PI);star(xx,yy,1.6,color);}ctx.globalAlpha=1;
 }
 // A single curved stone frame, with a recessed gold inlay and grounded plinths.
 ctx.strokeStyle='#172e454b';ctx.lineWidth=20;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,513);ctx.lineTo(x,433);ctx.bezierCurveTo(x,377,x+86,377,x+86,433);ctx.lineTo(x+86,513);ctx.stroke();
 ctx.strokeStyle=stone;ctx.lineWidth=15;ctx.beginPath();ctx.moveTo(x,513);ctx.lineTo(x,431);ctx.bezierCurveTo(x,379,x+86,379,x+86,431);ctx.lineTo(x+86,513);ctx.stroke();
 ctx.strokeStyle=active?'#eedba3b9':'#c5c5cc71';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+1,507);ctx.lineTo(x+1,433);ctx.bezierCurveTo(x+1,382,x+85,382,x+85,433);ctx.lineTo(x+85,507);ctx.stroke();
 for(const xx of [x,x+86]){rounded(xx-12,509,24,11,3,stone);for(let j=0;j<3;j++){line(xx-5,449+j*20,xx+5,449+j*20,'#d6d5c254',.8);circle(xx,444+j*20,1.1,color+'99');}}
 glow(x+43,399,22,active?'#ffe8a93e':'#bec7e319');star(x+43,398,8,color);circle(x+43,398,2.2,'#fff2d1');
 if(!active){ellipse(x+43,465,13,16,'#34405fc4');ctx.strokeStyle='#d4c6a8';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+43,459,5,Math.PI,0);ctx.stroke();rounded(x+36,459,14,12,3,'#d2bd94');circle(x+43,463,1.5,'#68576f');line(x+43,464,x+43,467,'#68576f',1.5);}
 if(world.final){const target=hero==='sun'?'moon':'sun';character(x+51,516,target,-1,{ground:true,size:.8});if(!active)for(let i=0;i<4;i++)line(x+15+i*18,423,x+15+i*18,516,'#8d80aabb',2);}
 ctx.restore();
}

const visualLerp=(a,b,t)=>a+(b-a)*t;
function renderBody(body,alpha){
 const p={...body,x:visualLerp(body.prevX??body.x,body.x,alpha),y:visualLerp(body.prevY??body.y,body.y,alpha)};
 for(const [field,prev] of [['walkPhase','prevWalkPhase'],['motionPhase','prevMotionPhase'],['facing','prevFacing'],['runBlend','prevRunBlend'],['gaitAmount','prevGaitAmount'],['visualVX','prevVisualVX'],['visualVY','prevVisualVY']])if(Number.isFinite(body[field])&&Number.isFinite(body[prev]))p[field]=visualLerp(body[prev],body[field],alpha);
 if(Number.isFinite(p.facing))p.turnBlend=p.facing;
 return p;
}
window.drawGame=function(){
 const savedCamera=camera,savedTime=time;
 const alpha=typeof renderAlpha==='number'?clamp(renderAlpha,0,1):1;
 if(typeof previousCamera==='number')camera=visualLerp(previousCamera,camera,alpha);
 if(typeof renderTime==='number'&&renderTime>0&&state==='playing')time=renderTime;
 try{
 ctx.clearRect(0,0,viewW,viewH);ctx.fillStyle='#101626';ctx.fillRect(0,0,viewW,viewH);background();
 ctx.save();ctx.translate(-camera,0);
 const visible=x=>x>camera-160&&x<camera+viewW+160;
 if(world.theme==='forest')for(const t of (terrain.length?terrain:world.ground.map(([x,y,w])=>({x,y,w})))){
  if(t.h===20)continue;
  const spacing=220+Math.floor(noise(t.x)*90);let treeIndex=0;
  for(let x=t.x+80;x<t.x+t.w-10;x+=spacing,treeIndex++)if(visible(x))tree(x,t.y,Math.floor(x/3)*3+treeIndex%3);
 }
 if(world.theme==='void')drawUnderworld();
 for(const t of terrain)if(t.x+t.w>camera-40&&t.x<camera+viewW+40){platform(t);decorate(t);}
 if(state==='menu'&&terrain.length===0)for(const [x,y,w] of world.ground)if(x+w>camera&&x<camera+viewW)platform({x,y,w,h:180,oneWay:false});
 for(const s of stars)if(!s.got&&visible(s.x))drawStardust(s);
 for(const b of beacons)if(visible(b.x))drawBeacon(b);
 for(const item of powerups)if(!item.got&&visible(item.x)){const yy=item.y+14+Math.sin(time*2.6)*3;glow(item.x+14,yy,33,'#fff0a940');crystal(item.x+14,yy,14,'#ffdfa0');star(item.x+14,yy,6,'#fff8db');}
 for(const q of world.slime||[])if(visible(q.x)||visible(q.x+q.w))drawSlime(q);
 for(const q of world.hazards||[])if(visible(q.x))drawHazard(q);
 for(const q of fogHazards)if(visible(q.x)||visible(q.x+q.w))drawBossFog(q);
 for(const q of tentacleStrikes)drawTentacleStrike(q);
 for(const q of world.portals)if(visible(q.x))drawPortal(q);
 for(const e of enemies)if(e.alive&&visible(e.x))drawEnemy(renderBody(e,alpha));
 if(boss)drawBoss(renderBody(boss,alpha));
 for(const s of shots)if(visible(s.x))drawLightShot(renderBody(s,alpha));
 for(const s of hostileShots)if(visible(s.x))drawHostileShot(renderBody(s,alpha));
 if(world.key&&visible(world.key.x))drawKey(world.key);if(world.exit&&visible(world.exit))gate();
 if(state==='transport'&&pendingPortal)drawPortalTransitEffects(pendingPortal);
 if(state==='transition')drawJourneyAperture();
 if(arrivalFX)drawArrivalEffect();
 if(player&&state!=='won'){
  const p=renderBody(player,alpha);
  const j=state==='transport'&&transportJourney?sampleTransport(transportJourney,Math.max(0,transportJourney.age-(1-alpha)/120)):state==='transition'&&transition?sampleTransition(transition,Math.max(0,transition.age-(1-alpha)/120)):null;
  if(!j)drawHeroMagic(p,hero);
  let cx=j?.cx??p.x+p.w/2,foot=j?.foot??p.y+p.h,shrink=j?.scale??1,clipY=j?.clipY??null;
  if(arrivalFX){const a=journeyEase(arrivalFX.age/arrivalFX.duration);shrink*=.82+.18*a;
   if(arrivalFX.kind==='rise'){foot+=(78*p.visualSize*shrink+4)*(1-a);clipY=arrivalFX.foot;}
   else foot-=(arrivalFX.kind==='fall'?36:14)*(1-a);
  }
  ctx.save();ctx.globalAlpha=(j?.alpha??1)*(state==='playing'&&p.inv>0?(.75+.25*Math.sin(time*18)):1);
  if(clipY!==null){ctx.beginPath();ctx.rect(camera-200,-1200,viewW+400,clipY+1200);ctx.clip();}
  if(j?.clipOval){const c=j.clipOval;ctx.beginPath();ctx.ellipse(c.x,c.y,c.rx,c.ry,0,0,Math.PI*2);ctx.clip();}
  if(j?.clipDoor){const c=j.clipDoor;ctx.beginPath();
   if(c.arched){ctx.moveTo(c.x-34,c.foot);ctx.lineTo(c.x-34,c.y-29);ctx.bezierCurveTo(c.x-34,c.y-77,c.x+34,c.y-77,c.x+34,c.y-29);ctx.lineTo(c.x+34,c.foot);ctx.closePath();}
   else ctx.ellipse(c.x,c.y,31,57,0,0,Math.PI*2);
   ctx.clip();
  }
  ctx.translate(cx,foot);ctx.rotate(j?.tilt??0);ctx.scale(shrink,shrink);
  character(0,0,hero,p.face,{size:p.visualSize,moving:Math.abs(p.vx)>15,ground:p.ground,phase:p.walkPhase,vx:p.visualVX??p.vx,vy:p.visualVY??p.vy,attack:p.attack>0,attackPhase:p.attack,boosting:p.boosting,landSquash:p.landSquash??0,turn:p.facing??p.face,turnAmount:p.turnAmount,takeoff:p.takeoff,runBlend:p.runBlend,gaitAmount:p.gaitAmount,hurt:p.knockback>0,idleTime:p.idleTime??0,idleExpression:p.idleExpression??'neutral',steering:p.steering});ctx.restore();ctx.globalAlpha=1;
 }
 if(state==='transport'&&pendingPortal)drawPortalForeground(pendingPortal);
 if(state==='transition')drawJourneyAperture(true);
 if(arrivalFX)drawArrivalEffect(true);
 for(const part of particles){const p=renderBody(part,alpha);ctx.globalAlpha=clamp(p.life/.65,0,1);circle(p.x,p.y,2,p.color);}ctx.globalAlpha=1;ctx.restore();
 if(state==='playing'&&world.id==='boss')drawBossMeter();
 if(state==='playing'&&world.id==='main'){
  const w=Math.min(190,viewW*.3),x=(viewW-w)/2;rounded(x,76,w,2,1,'#d3e6ee1a');rounded(x,76,w*clamp(player.x/world.width,0,1),2,1,'#ecd5a099');
  if(!world.key.got&&world.key.x-camera>viewW-45){ctx.fillStyle=world.day?'#6e6447':'#e6d59c';ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillText('KEY →',viewW-20,112);}
 }
 if(state==='transport'&&transportJourney){const p=transportJourney.age/transportJourney.duration,f=journeyEase((p-.84)/.15);ctx.fillStyle=`rgba(13,15,36,${f})`;ctx.fillRect(0,0,viewW,viewH);}
 if(state==='transition')drawTransitionEffect();
 if(screenFade>0){ctx.fillStyle=`rgba(13,15,36,${screenFade/.32})`;ctx.fillRect(0,0,viewW,viewH);}
 if(state==='won'){glow(viewW/2,400,170,'#f6dd8925');character(viewW/2-30,510,'sun',1,{size:1.3,ground:true});character(viewW/2+30,510,'moon',-1,{size:1.3,ground:true});}
 }finally{camera=savedCamera;time=savedTime;}
};
function portraits(){
 for(const name of ['sun','moon']){const c=$('#'+name+'-portrait').getContext('2d');ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,180,180);character(90,168,name,1,{size:2,ground:true,profile:0,vx:0,vy:0});c.clearRect(0,0,180,180);c.drawImage(canvas,0,0,180,180,0,0,180,180);ctx.restore();}
}
function crystal(x,y,size,color){
 ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size*.45,y);ctx.lineTo(x,y+size*.45);ctx.lineTo(x-size*.4,y);ctx.closePath();ctx.fill();ctx.fillStyle='#e8d6ff55';ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x,y+size*.45);ctx.lineTo(x-size*.4,y);ctx.closePath();ctx.fill();
}

function drawHazard(h){
 const q=hazardBox(h),base=q.y+q.h;ctx.save();
 if(h.kind==='vent'){
  ellipse(q.x+q.w/2,base,Math.max(16,q.w*.6),4,'#2b1826');
  const hot=q.active?1:q.warning?.55:.18;glow(q.x+q.w/2,base-6,38,`rgba(255,139,58,${hot*.4})`);
  line(q.x,base-1,q.x+q.w,base-1,q.warning?'#ffc46f':'#bc6946',2);
  if(q.active)for(let i=0;i<3;i++){
   const x=q.x+q.w*(.22+i*.27),height=q.h*(.65+.3*Math.sin(time*9+i));
   ctx.fillStyle=waGradient(x,base-height,x,base,['#fff5b0','#ffac53','#bf4544']);ctx.beginPath();ctx.moveTo(x-7,base);ctx.bezierCurveTo(x-14,base-height*.45,x+8,base-height*.65,x,base-height);ctx.bezierCurveTo(x+17,base-height*.4,x+12,base-12,x+7,base);ctx.closePath();ctx.fill();
  }
  if(q.warning){ctx.fillStyle='#ffe3a0';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText('!',q.x+q.w/2,base-22);}
 }else if(h.kind==='orbit'){
  const x=q.x+14,y=q.y+14;glow(x,y,30,'#e698c02d');circle(x,y,12,waGradient(x,y-12,x,y+12,['#ddc0f5','#956fa8','#493c75']));
  ctx.strokeStyle='#f2d3ef8c';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(x,y,19,5,-.35,0,Math.PI*2);ctx.stroke();circle(x-3,y-4,2.2,'#f8dcee');
 }else{
  const count=Math.max(3,Math.floor(q.w/12)),color=h.kind==='thorns'?'#759d88':h.kind==='crystal'?'#b1cad9':'#b5a3b1';
  for(let i=0;i<count;i++){
   const x=q.x+q.w*i/count,ww=q.w/count;ctx.fillStyle=waGradient(x,q.y,x,base,[color,h.kind==='thorns'?'#35544e':'#51405d']);
   ctx.beginPath();ctx.moveTo(x,base);ctx.quadraticCurveTo(x+ww*.4,q.y+4,x+ww*.5,q.y);ctx.quadraticCurveTo(x+ww*.65,q.y+4,x+ww,base);ctx.closePath();ctx.fill();line(x+ww*.5,q.y+4,x+ww*.7,base-2,color+'aa',.8);
  }
 }
 ctx.restore();
}
function drawBossFog(f){
 const alpha=clamp(Math.min(f.age/.35,f.life/.8),0,1);ctx.save();ctx.globalAlpha*=alpha;
 if(f.kind==='poison'){
  glow(f.x+f.w/2,f.y,60,'#aaff3b27');rounded(f.x,f.y,f.w,f.h,5,'#91ce4c83');line(f.x+8,f.y+2,f.x+f.w-8,f.y+2,'#d7ffac',1.1);
 }else{
  for(let i=0;i<7;i++){const x=f.x+f.w*(i+.5)/7,y=f.y+f.h*.45+Math.sin(time*1.6+i)*17;glow(x,y,65,'#b4a2e624');ellipse(x,y,37,52,waGradient(x,y-52,x,y+52,['#beace329','#514f755d','#a6b9db12']));}
  line(f.x+8,f.y+f.h-2,f.x+f.w-8,f.y+f.h-2,'#c9bcf13a',1);
 }
 ctx.restore();
}
function drawTentacleStrike(s){
 const active=s.age>=s.warning&&s.age<s.warning+.24,alpha=clamp(s.life/.25,0,1);
 ctx.save();ctx.globalAlpha*=alpha;
 if(!active){glow(s.x,515,33,'#baff4b22');ctx.strokeStyle='#c4ff87a8';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(s.x,520,22,4,0,0,Math.PI*2);ctx.stroke();line(s.x,510,s.x,492,'#d6ffa655',1);}
 else{
  const sx=boss?boss.x+boss.w/2:s.sourceX,sy=boss?boss.y+75:s.sourceY;
  ctx.lineCap='round';ctx.strokeStyle='#271d38';ctx.lineWidth=18;ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(sx+(s.x-sx)*.4,sy-90,s.x+44,405,s.x,515);ctx.stroke();
  ctx.strokeStyle='#698d57';ctx.lineWidth=10;ctx.stroke();ctx.strokeStyle='#bde879';ctx.lineWidth=2;ctx.stroke();glow(s.x,505,35,'#b9ff6739');
 }
 ctx.restore();
}
function drawTransitionEffect(){
 const p=clamp(transition.age/transition.duration,0,1),intensity=Math.sin(Math.PI*clamp((p-.48)/.36,0,1));
 const px=transition.portalX-camera,py=transition.portalY,pixelScale=canvas.width/viewW;
 // Horizontal refraction bends the rendered scene around the opening portal.
 if(intensity>.01)for(let y=Math.max(85,py-100);y<Math.min(viewH,py+110);y+=18){const focus=Math.exp(-Math.pow((y-py)/85,2)),shift=Math.sin(y*.043-time*11)*intensity*focus*4;ctx.drawImage(canvas,0,y*pixelScale,canvas.width,18*pixelScale,shift,y,viewW,18);}
 if(intensity>.01)glow(px,py,90+intensity*40,'#bcaeff24');
 const fade=journeyEase((p-.84)/.15);ctx.fillStyle=`rgba(13,15,36,${fade})`;ctx.fillRect(0,0,viewW,viewH);
}
