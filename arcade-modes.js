'use strict';
/* The free-flight movement, radial aiming, meteor shapes and swept bullet
   collision adapt the user's Save the Moon opening. No film/story is loaded. */
window.ModeFX=(()=>{
 const tau=Math.PI*2;
 function measure(){return {w:mobileLayout.width,h:mobileLayout.playHeight,top:Math.max(64,document.querySelector('header').getBoundingClientRect().bottom+8)};}
 function begin(){const dpr=Math.min(devicePixelRatio||1,2),d=measure();ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.fillStyle='#081222';ctx.fillRect(0,0,d.w,mobileLayout.height);ctx.beginPath();ctx.rect(0,0,d.w,d.h);ctx.clip();return d;}
 function end(){if(screenFade>0){const d=measure();ctx.fillStyle=`rgba(8,12,30,${screenFade/.32})`;ctx.fillRect(0,0,d.w,d.h);}if(state==='transition'&&transition)caption(transition.title,transition.detail,measure());ctx.restore();}
 function space(d,clock,kind,round=0){
  const g=ctx.createLinearGradient(0,0,d.w,d.h);g.addColorStop(0,round===2?'#160c24':'#0b152f');g.addColorStop(.5,kind==='flight'?'#212344':'#1d183d');g.addColorStop(1,'#080f22');ctx.fillStyle=g;ctx.fillRect(0,0,d.w,d.h);
  glow(d.w*.67,d.h*.43,d.w*.55,round===2?'#943b561d':'#764faa29');glow(d.w*.22,d.h*.8,d.w*.4,'#3088ad20');
  ctx.lineWidth=.7;ctx.strokeStyle='#9183ce22';
  ctx.save();ctx.globalAlpha=.3;
  const planetY=d.top+(d.h-d.top)*.28,planetR=Math.min(d.w*.075,(d.h-d.top)*.23);
  if(kind==='flight'||round===0)waRingPlanet(d.w*.81,planetY,planetR);
  else if(round===1){waRingPlanet(d.w*.82,planetY,planetR);waAsteroid(d.w*.76,planetY+planetR,planetR*.48,planetR*.36,63,true);}
  else waConsumedStar(d.w*.82,planetY,planetR);
  for(let i=0;i<4;i++){const x=((noise(i+777)*d.w-clock*(kind==='flight'?10:2))%d.w+d.w)%d.w,y=d.top+noise(i+817)*(d.h-d.top);waAsteroid(x,y,15+noise(i+747)*33,12+noise(i+715)*24,41+i,false);}
  ctx.restore();
  for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(d.w*.8,d.h*.55,d.w*(.22+i*.08),d.h*(.16+i*.045),-.35,0,tau);ctx.stroke();}
  for(let i=0;i<95;i++){const depth=.35+noise(i+4)*.65,x=((noise(i*3)*d.w-clock*(kind==='flight'?35:5)*depth)%d.w+d.w)%d.w,y=noise(i*3+1)*d.h;
   ctx.globalAlpha=.25+noise(i*3+2)*.5;circle(x,y,.5+depth,'#d9e5ff');if(kind==='flight')line(x,y,x+5*depth,y,'#c3dbf74d',.6);
  }ctx.globalAlpha=1;
  if(round>0&&kind==='asteroid')for(let i=0;i<7;i++){const x=noise(i+221)*d.w,y=noise(i+341)*d.h;ctx.strokeStyle='#c99bd122';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-40,y+50);ctx.lineTo(x,y);ctx.lineTo(x+18,y+11);ctx.lineTo(x+65,y-40);ctx.stroke();}
 }
 function caption(title,detail,d,alpha=1){
  ctx.save();ctx.globalAlpha*=alpha;const w=Math.min(620,d.w-28),titleSize=clamp(d.w/23,15,26),detailSize=clamp(d.w/32,11,13);
  function wrap(text,size,font){ctx.font=`${size}px ${font}`;const rows=[],words=String(text||'').split(' ');let row='';for(const word of words){const next=row?row+' '+word:word;if(row&&ctx.measureText(next).width>w-32){rows.push(row);row=word;}else row=next;}if(row)rows.push(row);return rows;}
  const titles=wrap(title,titleSize,'Georgia'),details=wrap(detail,detailSize,'system-ui'),th=titleSize*1.2,dh=detailSize*1.45,h=40+titles.length*th+details.length*dh;
  const y=clamp(d.top+(d.h-d.top)*.14,d.top+6,Math.max(d.top+6,d.h-h-8));
  rounded((d.w-w)/2,y,w,h,13,'#091322ed');ctx.strokeStyle='#d3bded60';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect((d.w-w)/2,y,w,h,13);ctx.stroke();
  ctx.textAlign='center';ctx.fillStyle='#f3e5c4';ctx.font=`${titleSize}px Georgia`;let yy=y+17+titleSize;
  for(const row of titles){ctx.fillText(row,d.w/2,yy);yy+=th;}yy+=3;ctx.font=`${detailSize}px system-ui`;ctx.fillStyle='#d0dbee';for(const row of details){ctx.fillText(row,d.w/2,yy);yy+=dh;}ctx.restore();
 }
 function exitPose(x,foot,height){if(state!=='transition'||!transition?.modeExit)return {x,foot,size:1,tilt:0,alpha:1};
  const d=measure(),p=clamp(transition.age/transition.duration,0,1),a=journeyEase(clamp((p-.1)/.63,0,1)),px=d.w*.68,py=d.top+(d.h-d.top)*.43;
  glow(px,py,95,'#b6a4ff32');ctx.save();ctx.translate(px,py);ctx.strokeStyle='#c1dfff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,29,51,0,0,tau);ctx.stroke();ctx.fillStyle='#111629d9';ctx.fill();for(let i=0;i<10;i++){const q=i*tau/10-p*7;star(Math.cos(q)*36,Math.sin(q)*58,2,'#e5d9fc');}ctx.restore();
  return {x:x+(px-x)*a,foot:foot+(py+height*.2-foot)*a,size:1-journeyEase(clamp((p-.28)/.5,0,1))*.98,tilt:Math.sin(p*8)*.3,alpha:1-clamp((p-.76)/.15,0,1)};
 }
 function sync(x,y,h,hp=3){if(!player)return;const scale=mobileLayout.playHeight/600;player.x=x/scale-player.w/2;player.y=(y+h*.5)/scale-player.h;player.hp=hp;player.vx=player.vy=0;}
 return {measure,begin,end,space,caption,exitPose,sync};
})();
window.ArcadeModes=(()=>{
 const tau=Math.PI*2;
 const tiers=Object.freeze([
  {name:'The Broken Orbit',target:30,interval:1.3,cap:8,speed:1,armor:2,shower:0},
  {name:'The Falling Constellations',target:36,interval:.98,cap:10,speed:1.28,armor:2,shower:9},
  {name:'The Edge of the Universe',target:42,interval:.78,cap:12,speed:1.52,armor:3,shower:6.8}
 ]);
 let r=null,mouse=null,touchOrigin=null,touchAngle=null,mousePointer=null;
 function dims(){const d=ModeFX.measure();d.unit=clamp(Math.min(d.w/700,(d.h-d.top)/370),.65,1.3);return d;}
 function start(kind,round=0,retry=false){
  const d=dims(),savedScore=retry?r.entryScore:score;
  r={kind,round,entryScore:savedScore,...d,elapsed:0,intro:retry?1.1:3.1,defeated:0,wave:0,spawned:0,waveKills:0,wavePause:0,spawnClock:1.5,showerClock:0,barrierClock:5.5,
   ship:{x:kind==='flight'?d.w*.2:d.w*.5,y:d.top+(d.h-d.top)*.57,vx:0,vy:0,r:14*d.unit,face:1,hp:3,inv:2.5,aim:kind==='flight'?0:-Math.PI/2,dash:0,dashCD:0,phase:0},
   enemies:[],bullets:[],hostile:[],effects:[],warnings:[],barriers:[],rift:null,fireClock:0,lastDash:false,dead:0,shake:0,serial:0,flash:0};
  clearAim();ModeFX.sync(r.ship.x,r.ship.y,58*r.unit);world.difficulty=kind==='flight'?7:7+round;
 }
 function resize(){if(!r)return;const d=dims(),oldH=Math.max(1,r.h-r.top),rx=d.w/r.w,ry=(d.h-d.top)/oldH;
  const ru=d.unit/r.unit;
  for(const list of [[r.ship],r.enemies,r.bullets,r.hostile,r.effects,r.warnings,r.barriers])for(const o of list){o.x*=rx;if(Number.isFinite(o.y))o.y=d.top+(o.y-r.top)*ry;if(Number.isFinite(o.gapY)){o.gapY=d.top+(o.gapY-r.top)*ry;o.gapH*=ry;}if(Number.isFinite(o.r))o.r*=ru;}
  if(r.rift){r.rift.x*=rx;r.rift.y=d.top+(r.rift.y-r.top)*ry;}Object.assign(r,d);r.ship.r=14*d.unit;r.ship.x=clamp(r.ship.x,22*d.unit,d.w-22*d.unit);r.ship.y=clamp(r.ship.y,d.top+30*d.unit,d.h-32*d.unit);ModeFX.sync(r.ship.x,r.ship.y,58*r.unit,r.ship.hp);
 }
 function clearAim(){const captured=mousePointer;mouse=null;mousePointer=null;touchOrigin=null;touchAngle=null;if(captured!==null&&canvas.hasPointerCapture?.(captured))canvas.releasePointerCapture(captured);}
 function clearTouchAim(){touchOrigin=null;touchAngle=null;}
 function touchAim(e,begin=false){if(!r||r.kind!=='asteroid')return;if(begin){touchOrigin={x:e.clientX,y:e.clientY};touchAngle=null;}else if(touchOrigin){const dx=e.clientX-touchOrigin.x,dy=e.clientY-touchOrigin.y;if(Math.hypot(dx,dy)>9)touchAngle=Math.atan2(dy,dx);}}
 canvas.addEventListener('pointerdown',e=>{if(!['asteroid','flight'].includes(mode)||state!=='playing'||e.pointerType==='touch'||e.button!==0)return;const b=canvas.getBoundingClientRect();mouse={x:e.clientX-b.left,y:e.clientY-b.top,fire:true};mousePointer=e.pointerId;canvas.setPointerCapture(e.pointerId);e.preventDefault();});
 canvas.addEventListener('pointermove',e=>{if(!['asteroid','flight'].includes(mode)||e.pointerType==='touch')return;const b=canvas.getBoundingClientRect();mouse={x:e.clientX-b.left,y:e.clientY-b.top,fire:mouse?.fire||false};});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(mousePointer===e.pointerId){if(mouse)mouse.fire=false;mousePointer=null;}});
 function burstAt(x,y,color,count=16){for(let i=0;i<count;i++){const a=Math.random()*tau,v=(40+Math.random()*180)*r.unit;r.effects.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.3+Math.random()*.4,max:.7,r:(1+Math.random()*3)*r.unit,color});}if(r.effects.length>220)r.effects.splice(0,r.effects.length-220);}
 function meteor(x,y,vx,vy,kind='rock',radius){const seed=Math.random()*40,k=r.kind==='asteroid'?tiers[r.round]:null,armored=kind==='planet';return {id:++r.serial,x,y,vx,vy,kind,r:radius||(18+Math.random()*12)*r.unit,hp:armored?(k?.armor||2):kind==='drone'?2:1,angle:Math.random()*tau,spin:(Math.random()-.5)*1.2,seed,shape:Array.from({length:11},()=>.78+Math.random()*.22),fire:2+Math.random()*2,warn:0};}
 function spawn(){
  const p=r.ship,u=r.unit;
  if(r.kind==='flight'){
   const kind=Math.random()<.58?'drone':'rock',x=r.w+45*u,y=r.top+30*u+Math.random()*Math.max(1,r.h-r.top-70*u),speed=(80+r.wave*17+Math.random()*30)*u;
   r.enemies.push(meteor(x,y,-speed,0,kind));r.spawned++;return;
  }
  const cfg=tiers[r.round],edge=Math.floor(Math.random()*4),margin=45*u;let x,y;
  if(edge===0){x=-margin;y=r.top+Math.random()*(r.h-r.top);}else if(edge===1){x=r.w+margin;y=r.top+Math.random()*(r.h-r.top);}else if(edge===2){x=Math.random()*r.w;y=r.top-margin;}else{x=Math.random()*r.w;y=r.h+margin;}
  if(Math.hypot(x-p.x,y-p.y)<140*u){x=p.x<r.w*.5?r.w+margin:-margin;}
  const a=Math.atan2(p.y-y,p.x-x)+(Math.random()-.5)*.45,speed=(25+Math.random()*20+r.defeated*.75)*cfg.speed*u;
  const roll=Math.random(),kind=r.defeated>4&&roll<.22?'planet':r.defeated>7&&roll<.36?'orb':'rock';r.enemies.push(meteor(x,y,Math.cos(a)*speed,Math.sin(a)*speed,kind));
 }
 // The same swept segment test as the original shooter avoids tunnelling
 // on small screens and lets fast bolts hit a meteor between simulation ticks.
 function segmentHit(ax,ay,bx,by,x,y,rad){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(ax+dx*t-x,ay+dy*t-y)<=rad;}
 function hit(){const p=r.ship;if(p.inv>0||p.dash>0||r.dead)return;p.hp--;p.inv=1.6;r.shake=7;r.flash=.15;burstAt(p.x,p.y,'#ffbba3',24);tone(110,.15);if(p.hp<=0){r.dead=1.9;clearInput();}ModeFX.sync(p.x,p.y,58*r.unit,p.hp);}
 function destroy(e){if(e.dead)return;e.dead=true;r.defeated++;r.waveKills++;score+=2;burstAt(e.x,e.y,e.kind==='orb'?'#b7e5ff':'#ecc79d',19);r.shake=Math.max(r.shake,1.7);
  if(r.kind==='asteroid'&&r.round===2&&e.kind==='planet'&&r.enemies.filter(x=>!x.dead).length<tiers[2].cap){for(const side of [-1,1]){const a=Math.atan2(e.vy,e.vx)+side*.8;r.enemies.push(meteor(e.x+side*e.r,e.y,Math.cos(a)*85*r.unit,Math.sin(a)*85*r.unit,'shard',11*r.unit));}}
 }
 function aim(firing,dt){const p=r.ship;let a=r.kind==='flight'?0:p.aim;
  if(r.kind==='asteroid'){
   if(touchAngle!==null)a=touchAngle;
   else if(mouse)a=Math.atan2(mouse.y-p.y,mouse.x-p.x);
   else if(firing){let target=null,best=Infinity;for(const e of r.enemies){if(e.dead)continue;const distance=Math.hypot(e.x-p.x,e.y-p.y);if(distance<best){best=distance;target=e;}}if(target)a=Math.atan2(target.y-p.y,target.x-p.x);}
  }
  const diff=Math.atan2(Math.sin(a-p.aim),Math.cos(a-p.aim));p.aim+=diff*(1-Math.exp(-dt*24));
 }
 function fire(){const p=r.ship,a=p.aim,u=r.unit,speed=550*u;r.bullets.push({x:p.x+Math.cos(a)*26*u,y:p.y+Math.sin(a)*26*u,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:2.2,r:3*u});r.fireClock=.16;}
 function warning(){const u=r.unit,x=30*u+Math.random()*(r.w-60*u);r.warnings.push({x,y:r.top+13,life:1.35,age:0,r:20*u});}
 function barrier(){const available=r.h-r.top,gapH=Math.max(90*r.unit,available*.44),gapY=r.top+gapH*.5+18*r.unit+Math.random()*Math.max(1,available-gapH-36*r.unit);r.barriers.push({x:r.w+65*r.unit,gapY,gapH,w:25*r.unit,age:0,speed:82*r.unit});}
 function update(dt){if(!r)return;const p=r.ship,u=r.unit;r.elapsed+=dt;r.shake=Math.max(0,r.shake-dt*25);r.flash=Math.max(0,r.flash-dt);r.effects.forEach(e=>{e.x+=e.vx*dt;e.y+=e.vy*dt;e.life-=dt;});r.effects=r.effects.filter(e=>e.life>0);
  if(r.dead){r.dead-=dt;if(r.dead<=0){const kind=r.kind,round=r.round;score=r.entryScore;clearInput();start(kind,round,true);}return;}
  if(r.intro>0){r.intro=Math.max(0,r.intro-dt);ModeFX.sync(p.x,p.y,58*u,p.hp);return;}
  if(r.wavePause>0){r.wavePause-=dt;if(r.wavePause<=0){r.wave++;r.waveKills=r.spawned=0;r.spawnClock=1.4;r.barrierClock=4;r.hostile=[];p.inv=1.6;}return;}
  p.inv=Math.max(0,p.inv-dt);p.dashCD=Math.max(0,p.dashCD-dt);p.dash=Math.max(0,p.dash-dt);r.fireClock=Math.max(0,r.fireClock-dt);
  let mx=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)||input.axis;
  let my=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0)||input.vertical;
  const len=Math.hypot(mx,my);if(len>1){mx/=len;my/=len;}
  const firing=input.jump||keys.has('Space')||mouse?.fire;aim(firing,dt);
  const dash=boostHeld();if(dash&&!r.lastDash&&p.dashCD<=0){const a=len>.1?Math.atan2(my,mx):p.aim;p.dash=.22;p.dashCD=3;p.dx=Math.cos(a);p.dy=Math.sin(a);p.inv=Math.max(p.inv,.35);burstAt(p.x,p.y,'#d0e7ff',10);tone(440,.09);}r.lastDash=dash;
  const speed=clamp(r.w*.58,190,250),moving=len>.05;p.vx=approach(p.vx,p.dash>0?p.dx*speed*3.8:mx*speed,moving?26:42,dt);p.vy=approach(p.vy,p.dash>0?p.dy*speed*3.8:my*speed,moving?26:42,dt);
  p.x=clamp(p.x+p.vx*dt,25*u,r.w-25*u);p.y=clamp(p.y+p.vy*dt,r.top+29*u,r.h-31*u);if(Math.abs(p.vx)>8)p.face=Math.sign(p.vx);p.phase+=Math.hypot(p.vx,p.vy)*dt*.025;
  if(r.rift){r.rift.life-=dt;const q=r.rift,dx=q.x-p.x,dy=q.y-p.y,dist=Math.hypot(dx,dy);if(dist<150*u&&dist>10&&p.dash<=0){p.x=clamp(p.x+dx/dist*30*u*dt,25*u,r.w-25*u);p.y=clamp(p.y+dy/dist*30*u*dt,r.top+29*u,r.h-31*u);}if(q.life<=0)r.rift=null;}
  if(firing&&r.fireClock<=0)fire();
  r.spawnClock-=dt;const cfg=r.kind==='asteroid'?tiers[r.round]:null,goal=[10,12,14][r.wave],cap=cfg?.cap||5+r.wave;
  if(r.spawnClock<=0&&r.enemies.length<cap&&(cfg||r.spawned<goal)){spawn();r.spawnClock=cfg?Math.max(.55,cfg.interval-r.defeated*.012):.95-r.wave*.12;}
  if(cfg?.shower){r.showerClock+=dt;if(r.showerClock>cfg.shower){r.showerClock=0;warning();if(r.round===2&&!r.rift)r.rift={x:clamp(p.x+120*u,60*u,r.w-60*u),y:r.top+(r.h-r.top)*.45,life:4};}}
  if(r.kind==='flight'){r.barrierClock-=dt;if(r.barrierClock<=0){barrier();r.barrierClock=8-r.wave*.6;}}
  for(const w of r.warnings){w.age+=dt;w.life-=dt;if(w.life<=0){r.hostile.push({x:w.x,y:r.top-24*u,vx:0,vy:300*u,r:17*u,meteor:true,life:4});}}r.warnings=r.warnings.filter(w=>w.life>0);
  for(const e of r.enemies){
   if(e.dead)continue;e.angle+=e.spin*dt;
   if(e.kind==='orb'){const a=Math.atan2(p.y-e.y,p.x-e.x),v=Math.hypot(e.vx,e.vy);e.vx=approach(e.vx,Math.cos(a)*v,1.1,dt);e.vy=approach(e.vy,Math.sin(a)*v,1.1,dt);}
   if(e.kind==='drone'){
    e.y+=Math.sin(r.elapsed*2.2+e.seed)*18*u*dt;e.fire-=dt;if(e.x<r.w-40*u&&e.fire<.65)e.warn=.65-e.fire;
    if(e.fire<=0&&e.x>p.x+90*u){const a=Math.atan2(p.y-e.y,p.x-e.x);r.hostile.push({x:e.x-e.r,y:e.y,vx:Math.cos(a)*155*u,vy:Math.sin(a)*155*u,r:5*u,life:5});e.fire=2.8-r.wave*.35;e.warn=0;}
   }
   const oldX=e.x,oldY=e.y;e.x+=e.vx*dt;e.y+=e.vy*dt;
   if(segmentHit(oldX,oldY,e.x,e.y,p.x,p.y,p.r+e.r*.8)){hit();e.dead=true;if(r.kind==='flight')r.spawned--;burstAt(e.x,e.y,'#dfa6ba',10);}
   if(e.x< -100*u||e.x>r.w+160*u||e.y<r.top-140*u||e.y>r.h+140*u){e.dead=true;if(r.kind==='flight')r.spawned--;}
  }
  for(const b of r.bullets){const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;for(const e of r.enemies){if(e.dead||b.life<=0)continue;if(segmentHit(ox,oy,b.x,b.y,e.x,e.y,e.r+b.r)){b.life=0;e.hp--;burstAt(b.x,b.y,'#f7e0ba',4);if(e.hp<=0)destroy(e);}}
   for(const bar of r.barriers)if(Math.abs(b.x-bar.x)<bar.w&&Math.abs(b.y-bar.gapY)>bar.gapH*.5)b.life=0;
  }r.bullets=r.bullets.filter(b=>b.life>0&&b.x> -60&&b.x<r.w+60&&b.y>r.top-60&&b.y<r.h+60);
  for(const b of r.hostile){const ox=b.x,oy=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(segmentHit(ox,oy,b.x,b.y,p.x,p.y,p.r+b.r)){hit();b.life=0;}}r.hostile=r.hostile.filter(b=>b.life>0&&b.y<r.h+60&&b.x> -60);
  for(const bar of r.barriers){bar.x-=bar.speed*dt;bar.age+=dt;if(Math.abs(p.x-bar.x)<p.r+bar.w*.5&&(p.y-p.r<bar.gapY-bar.gapH*.5||p.y+p.r>bar.gapY+bar.gapH*.5))hit();}r.barriers=r.barriers.filter(b=>b.x> -50);
  r.enemies=r.enemies.filter(e=>!e.dead);ModeFX.sync(p.x,p.y,58*u,p.hp);
  // A fatal hit never awards a simultaneous stage clear.
  if(r.dead)return;
  if(cfg&&r.defeated>=cfg.target){score+=40*(r.round+1);beginTransition(r.round<2?{type:'arcade',kind:'asteroid',round:r.round+1}:{type:'boss',index:2,phase:2});}
  if(r.kind==='flight'&&r.waveKills>=goal){r.enemies=[];r.bullets=[];r.hostile=[];r.barriers=[];if(r.wave<2){r.wavePause=2;clearInput();tone(600,.2);}else{score+=100;beginTransition({type:'level',stage:6});}}
 }
 function rock(e){ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);const rr=e.r;
  if(e.kind==='drone'){glow(0,0,rr*2,e.warn>0?'#ed7d8e49':'#92afff29');ctx.fillStyle='#263d63';ctx.strokeStyle=e.warn>0?'#ffb39b':'#b0d1f3';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-rr,0);ctx.lineTo(-rr*.35,-rr*.55);ctx.quadraticCurveTo(rr*.7,-rr*.9,rr*1.25,-rr*.7);ctx.lineTo(rr*.65,0);ctx.lineTo(rr*1.25,rr*.7);ctx.quadraticCurveTo(rr*.7,rr*.9,-rr*.35,rr*.55);ctx.closePath();ctx.fill();ctx.stroke();circle(-rr*.3,0,rr*.22,e.warn>0?'#ffc196':'#b2ebef');ctx.restore();return;}
  if(e.kind==='orb'){glow(0,0,rr*2.2,'#a3bbff44');ctx.fillStyle='#b7d6ed';ctx.beginPath();ctx.moveTo(0,-rr);ctx.quadraticCurveTo(rr*.15,-rr*.15,rr,0);ctx.quadraticCurveTo(rr*.15,rr*.15,0,rr);ctx.quadraticCurveTo(-rr*.15,rr*.15,-rr,0);ctx.quadraticCurveTo(-rr*.15,-rr*.15,0,-rr);ctx.fill();}
  else{const g=ctx.createRadialGradient(-rr*.4,-rr*.5,1,0,0,rr*1.2);g.addColorStop(0,e.kind==='planet'?'#c49a9b':'#8b9faa');g.addColorStop(1,e.kind==='planet'?'#443452':'#273a50');ctx.fillStyle=g;ctx.strokeStyle=e.kind==='shard'?'#cc9ce5':'#b7c9d299';ctx.lineWidth=1.3;ctx.beginPath();if(e.kind==='planet')ctx.arc(0,0,rr,0,tau);else{e.shape.forEach((v,i)=>{const a=i/11*tau;if(i)ctx.lineTo(Math.cos(a)*rr*v,Math.sin(a)*rr*v);else ctx.moveTo(Math.cos(a)*rr*v,Math.sin(a)*rr*v);});ctx.closePath();}ctx.fill();ctx.stroke();for(let i=0;i<3;i++)circle(Math.sin(e.seed+i*3)*rr*.48,Math.cos(e.seed+i*2)*rr*.45,rr*(.12+i*.03),'#12243777');if(e.kind==='planet'){ctx.strokeStyle=e.hp>1?'#dac4bd':'#ffe6ad';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(0,0,rr*1.5,rr*.35,-.3,0,Math.PI);ctx.stroke();}}
  ctx.restore();
 }
 function ship(){const p=r.ship,u=r.unit,h=58*u,j=ModeFX.exitPose(p.x,p.y+h*.5,h);let introScale=1,introTilt=0;
  if(r.intro>0){const a=1-r.intro/(r.elapsed+r.intro);introScale=.15+journeyEase(a)*.85;introTilt=(1-journeyEase(a))*tau;glow(p.x,p.y,75,'#d7c4ff3b');}
  ctx.save();ctx.translate(j.x,j.foot-h*.5);ctx.rotate(j.tilt+introTilt);ctx.scale(j.size*introScale,j.size*introScale);ctx.globalAlpha=j.alpha*(p.inv>0?.76+Math.sin(r.elapsed*17)*.2:1);
  if(r.kind==='flight'){
   const tail=28*u;for(let i=0;i<4;i++)line(-tail-i*12*u,8*u,-tail-(i+1)*12*u,8*u,'#aab9ff'+['9a','72','40','20'][i],(8-i)*u);
   ctx.fillStyle='#252b52';ctx.strokeStyle='#b4c8ff';ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(38*u,9*u);ctx.quadraticCurveTo(17*u,-5*u,-35*u,-16*u);ctx.lineTo(-19*u,7*u);ctx.lineTo(-36*u,28*u);ctx.quadraticCurveTo(10*u,23*u,38*u,9*u);ctx.fill();ctx.stroke();glow(12*u,13*u,32*u,'#a0d9ff34');
  }else{ctx.strokeStyle=p.dash>0?'#edf4ff':'#c9b4fca0';ctx.lineWidth=p.dash>0?3:1.4;ctx.beginPath();ctx.ellipse(0,9*u,30*u,13*u,-.2,0,tau);ctx.stroke();glow(0,6*u,45*u,'#c6a5ff2c');}
  HeroSprites.draw(0,h*.5,hero,r.kind==='flight'?1:p.face,{size:h/78,ground:Math.hypot(p.vx,p.vy)<10,moving:Math.hypot(p.vx,p.vy)>10,vx:p.vx,vy:0,phase:p.phase,turn:r.kind==='flight'?1:p.face,idleTime:r.elapsed%4.8,clock:r.elapsed});
  if(p.dash>0){ctx.strokeStyle='#d7f4ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,35*u,0,tau);ctx.stroke();}
  ctx.rotate(p.aim);line(29*u,0,39*u,0,'#f8e7be',1.4);ctx.restore();
 }
 function render(){if(!r)return;const d=ModeFX.begin();ModeFX.space(d,r.elapsed,r.kind,r.round);ctx.save();ctx.beginPath();ctx.rect(0,r.top,r.w,r.h-r.top);ctx.clip();
  if(r.shake>0)ctx.translate(Math.sin(r.elapsed*65)*r.shake*.4,Math.cos(r.elapsed*72)*r.shake*.4);
  if(r.rift){const q=r.rift;glow(q.x,q.y,85*r.unit,'#9d7eed37');ctx.strokeStyle='#b3a2d966';ctx.lineWidth=1;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(q.x,q.y,(15+i*9)*r.unit,(9+i*5)*r.unit,r.elapsed,0,tau);ctx.stroke();}}
  for(const w of r.warnings){const alpha=.25+Math.sin(w.age*13)*.12;ctx.fillStyle=`rgba(250,164,132,${alpha})`;ctx.fillRect(w.x-w.r,r.top,w.r*2,r.h-r.top);ctx.fillStyle='#ffe0bb';ctx.textAlign='center';ctx.font='15px system-ui';ctx.fillText('↓',w.x,r.top+20);}
  for(const b of r.barriers){for(const [y,h] of [[r.top,b.gapY-b.gapH*.5-r.top],[b.gapY+b.gapH*.5,r.h-b.gapY-b.gapH*.5]]){const g=ctx.createLinearGradient(b.x-b.w/2,0,b.x+b.w/2,0);g.addColorStop(0,'#30294d');g.addColorStop(.5,'#ad93ce');g.addColorStop(1,'#444268');ctx.fillStyle=g;ctx.fillRect(b.x-b.w/2,y,b.w,h);line(b.x,y,b.x,y+h,'#c7bbdd',1.2);}if(b.x>r.w-70){ctx.fillStyle='#d8d3f3';ctx.font='18px system-ui';ctx.fillText('←',r.w-24,b.gapY+6);}}
  for(const e of r.enemies)rock(e);
  for(const b of r.bullets){line(b.x-b.vx*.023,b.y-b.vy*.023,b.x,b.y,hero==='sun'?'#ffe0a0':'#dcd2ff',3*r.unit);circle(b.x,b.y,2.5*r.unit,'#fff3d8');}
  for(const b of r.hostile){if(b.meteor){line(b.x,b.y-40*r.unit,b.x,b.y,'#ffbf9f65',8*r.unit);circle(b.x,b.y,b.r,'#d69c89');circle(b.x-b.r*.25,b.y-b.r*.25,b.r*.35,'#f5d3b5');}else{glow(b.x,b.y,14*r.unit,'#ff9cb44a');circle(b.x,b.y,b.r,'#ffc2d7');}}
  ship();for(const e of r.effects){ctx.globalAlpha=clamp(e.life/e.max,0,1);circle(e.x,e.y,e.r,e.color);}ctx.globalAlpha=1;ctx.restore();
  const progress=r.kind==='asteroid'?r.defeated/tiers[r.round].target:r.waveKills/[10,12,14][r.wave],bw=Math.min(220,r.w*.45),y=r.top+4;rounded((r.w-bw)/2,y,bw,3,1,'#bac8f32b');rounded((r.w-bw)/2,y,bw*clamp(progress,0,1),3,1,'#d5c1fc');
  ctx.textAlign='left';ctx.fillStyle='#c7d5eb';ctx.font=`${Math.min(11,r.w/39)}px system-ui`;const help=r.kind==='asteroid'?'FIRE: nearest target · drag to aim':'Fly through the gaps · clear all three waves';ctx.fillText(help,16,r.h-10);ctx.textAlign='right';ctx.fillText(r.ship.dashCD>0?`DASH ${r.ship.dashCD.toFixed(1)}s`:'DASH READY',r.w-16,r.h-10);
  if(r.intro>0)ModeFX.caption(r.kind==='asteroid'?`ASTEROID ${r.round+1} / 3 · ${tiers[r.round].name}`:'STARFLIGHT · Through the Veil',r.kind==='asteroid'?'Keep your light alive. Move freely. Hold FIRE.':'Move in every direction. FIRE ahead. DASH through danger.',d,Math.min(1,r.intro/.45));
  if(r.wavePause>0)ModeFX.caption(`WAVE ${r.wave+1} CLEARED`,`Wave ${r.wave+2} is approaching…`,d);
  if(r.dead>0)ModeFX.caption('A new spark…','Try this stage again. Your earlier progress is safe.',d);
  if(r.flash>0){ctx.fillStyle=`rgba(242,144,151,${r.flash})`;ctx.fillRect(0,0,d.w,d.h);}ModeFX.end();
 }
 function hud(){if(!r)return '';const p=r.ship,title=r.kind==='asteroid'?`ASTEROID ${r.round+1}/3 · ${r.defeated}/${tiers[r.round].target}`:`STARFLIGHT · WAVE ${r.wave+1}/3 · ${r.waveKills}/${[10,12,14][r.wave]}`;return `${title}\n✦ ${score}  ${'♥'.repeat(Math.max(0,p.hp))}${'♡'.repeat(3-Math.max(0,p.hp))}`;}
 function snapshot(){if(!r)return null;return {kind:r.kind,round:r.round,wave:r.wave,target:r.kind==='asteroid'?tiers[r.round].target:[10,12,14][r.wave],defeated:r.defeated,waveKills:r.waveKills,intro:r.intro,dead:r.dead,elapsed:r.elapsed,ship:{...r.ship},enemies:r.enemies.map(e=>({...e,shape:[...e.shape]})),bullets:r.bullets.map(e=>({...e})),warnings:r.warnings.map(e=>({...e})),barriers:r.barriers.map(e=>({...e})),bounds:{w:r.w,h:r.h,top:r.top},difficulty:r.kind==='asteroid'?{...tiers[r.round]}:null};}
 return {start,resize,update,render,hud,snapshot,clearAim,clearTouchAim,touchAim};
})();
