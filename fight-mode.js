'use strict';
/* Attack timing, hit-once boxes, guard and rounds adapt the user's kung-fu
   example. The opponent, arena, animation and campaign flow are original. */
window.FightMode=(()=>{
 const tau=Math.PI*2;let r=null;
 const art={};
 const loadingPromise=Promise.all(Object.entries(window.FightSpriteManifest).map(([key,config])=>new Promise(resolve=>{
  const image=new Image(),record={image,config,ready:false,clips:config.frames.map(frame=>{const path=new Path2D();frame.clip.forEach(([x,y],i)=>{x-=frame.anchor[0];y-=frame.anchor[1];if(i)path.lineTo(x,y);else path.moveTo(x,y);});path.closePath();return path;})};art[key]=record;
  image.onload=()=>{record.ready=image.naturalWidth>0;resolve(true);};image.onerror=()=>resolve(true);image.src=config.src;
 })));
 const attacks={punch:{duration:.38,from:.35,to:.67},kick:{duration:.54,from:.35,to:.67}};
 function attackProgress(f){return f.attack?clamp(1-f.attackT/attacks[f.attack].duration,0,1):0;}
 function frameFor(f,key=f.enemy?'spider':hero){
  if(f.stun>0)return {key,i:7};
  if(f.attack){const t=attackProgress(f),step=t<.18?0:t<.35?1:t<.67?2:t<.9?3:4;
   if(!f.enemy&&art[key+'Attack']?.ready&&step<4)return {key:key+'Attack',i:(f.attack==='kick'?4:0)+step};
   if(f.enemy&&step===2)return {key,i:f.attack==='punch'?3:f.y<r.ground-3?5:4};
   if(f.enemy&&step<2)return {key,i:f.attack==='kick'?6:0};
  }
  return {key,i:f.guard?6:f.y<r.ground-3?5:Math.abs(f.vx)>14?1+Math.floor(f.walk/Math.PI)%2:0};
 }
 function poseFrame(f){return frameFor(f).i;}
 function drawAtlas(key,f,height,x=f.x,foot=f.y){const pose=frameFor(f,key),record=art[pose.key];if(!record?.ready)return false;const i=pose.i,frame=record.config.frames[i],[sx,sy,sw,sh]=frame.rect,[ax,ay]=frame.anchor,scale=height/record.config.commonHeight;
  ctx.save();ctx.translate(x,foot);ctx.scale(f.face*scale,scale);const breath=f.attack||Math.abs(f.vx)>14?1:1+Math.sin(r.elapsed*2.2)*.004;ctx.scale(1,breath);ctx.clip(record.clips[i]);ctx.drawImage(record.image,sx,sy,sw,sh,sx-ax,sy-ay,sw,sh);ctx.restore();return true;
 }
 function dims(){const d=ModeFX.measure();d.ground=d.h-Math.max(24,Math.min(58,d.h*.1));d.height=clamp((d.h-d.top-50)*.55,55,106);d.unit=d.height/104;return d;}
 function fighter(x,face,enemy=false){return {x,y:r.ground,vx:0,vy:0,face,hp:100,attack:null,attackT:0,attackHit:false,stun:0,inv:0,guard:false,walk:0,enemy,windup:0,next:'punch',ai:1.2,attackIndex:0};}
 function setup(retry=false){const d=dims();Object.assign(r,d);r.p=fighter(d.w*.26,1);r.e=fighter(d.w*.74,-1,true);r.timer=90;r.elapsed=0;r.intro=retry?1.3:2.2;r.freeze=0;r.effects=[];r.texts=[];r.shake=0;r.between=0;r.result=null;r.request={jump:0};r.buffer=null;r.entryScore=score;}
 function start(){r={round:1,wins:0};setup();}
 function resize(){if(!r)return;const d=dims(),scale=d.w/r.w;for(const f of [r.p,r.e]){f.x*=scale;f.y=d.ground-(r.ground-f.y)*d.unit/r.unit;f.vx*=d.unit/r.unit;f.vy*=d.unit/r.unit;}Object.assign(r,d);sync();}
 function press(action){if(!r||r.intro>0||r.between)return;if(action==='jump')r.request.jump=.16;else if(attacks[action])r.buffer={type:action,life:.22};}
 function rectHits(a,b){return Math.abs(a.x-b.x)<(a.w+b.w)*.5&&Math.abs(a.y-b.y)<(a.h+b.h)*.5;}
 function hurtbox(f){const h=r.height*(f.enemy?1.16:1);return {x:f.x,y:f.y-h*(f.guard?.42:.52),w:h*.33,h:h*(f.guard?.76:.92)};}
 function hitboxes(f){const pose=frameFor(f),cfg=FightSpriteManifest[pose.key],frame=cfg.frames[pose.i],contacts=frame.contacts||(frame.contact?[frame.contact]:[]);if(!f.attack||f.stun>0)return [];const scale=r.height*(f.enemy?1.16:1)/cfg.commonHeight;return contacts.map(c=>({x:f.x+f.face*c[0]*scale,y:f.y+c[1]*scale,w:c[2]*scale,h:c[3]*scale}));}
 function hitbox(f){return hitboxes(f)[0]||null;}
 function strike(f,type){if(f.attack||f.stun>0||f.windup>0)return false;f.guard=false;f.attack=type;f.attackT=attacks[type].duration;f.attackHit=false;tone(type==='kick'?160:260,.055);return true;}
 function jump(f){if(f.y>=r.ground-.1&&f.stun<=0&&!f.attack){const maxHeight=Math.max(24,Math.min(155*r.unit,r.ground-r.top-r.height*.75));f.guard=false;f.vy=-Math.sqrt(2*1300*r.unit*maxHeight);tone(330,.06);return true;}return false;}
 function burstAt(x,y,color){for(let i=0;i<15;i++){const a=Math.random()*tau,v=(65+Math.random()*190)*r.unit;r.effects.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.4+Math.random()*.25,color});}}
 function damage(a,b){const box=hitboxes(a).find(box=>rectHits(box,hurtbox(b)));if(a.attackHit||b.inv>0||!box)return;a.attackHit=true;const blocked=b.guard&&b.face===-a.face&&a.attack==='punch',dmg=blocked?2:a.attack==='kick'?14:9;b.hp=Math.max(0,b.hp-dmg);b.stun=blocked?.08:.24;b.inv=.32;b.attack=null;b.windup=0;b.vx=a.face*(blocked?65:150)*r.unit;if(!blocked)b.vy=-65*r.unit;r.freeze=.045;r.shake=blocked?1.5:4;
  burstAt(box.x,box.y,blocked?'#9fd7ff':'#f3d6a1');r.texts.push({x:b.x,y:b.y-r.height,life:.7,text:blocked?'GUARD':`−${dmg}`,color:blocked?'#b9e4ff':'#fff0cd'});tone(blocked?480:110,.1);
 }
 function physics(f,dt){f.stun=Math.max(0,f.stun-dt);f.inv=Math.max(0,f.inv-dt);if(f.attack){f.attackT-=dt;if(f.attackT<=0)f.attack=null;}
  f.vy+=1300*r.unit*dt;f.y+=f.vy*dt;if(f.y>=r.ground){if(f.vy>260*r.unit)burstAt(f.x,r.ground,'#bdc8e5');f.y=r.ground;f.vy=0;}f.x=clamp(f.x+f.vx*dt,r.height*.45,r.w-r.height*.45);f.walk+=Math.abs(f.vx)*dt*.04/r.unit;f.vx*=Math.exp(-dt*7.6);
 }
 function cpu(dt){const f=r.e,p=r.p,dist=Math.abs(f.x-p.x),range=r.height*.69;if(!f.attack&&!f.windup)f.face=p.x>f.x?1:-1;if(f.stun>0){f.windup=0;return;}
  if(f.windup>0){f.vx=approach(f.vx,0,22,dt);f.windup-=dt;if(f.windup<=0){f.windup=0;if(f.next==='leap'){jump(f);f.vx=f.face*200*r.unit;strike(f,'kick');}else strike(f,f.next);f.ai=r.round===2?.7:1;}return;}
  if(f.attack)return;f.ai-=dt;f.guard=!!p.attack&&dist<range&&f.ai>.15&&f.attackIndex%3===0;
  if(!f.guard&&dist>range*.82)f.vx=f.face*(r.round===2?150:125)*r.unit;
  else if(dist<r.height*.44)f.vx=-f.face*80*r.unit;
  if(f.ai<=0&&dist<range){const patterns=r.round===2?['punch','kick','leap','kick']:['punch','kick','punch'];f.next=patterns[f.attackIndex++%patterns.length];f.windup=f.next==='leap'?.7:r.round===2?.43:.6;f.guard=false;f.vx=0;}
 }
 function sync(){if(r)ModeFX.sync(r.p.x,r.p.y-r.height*.5,r.height,Math.ceil(r.p.hp/100*3));}
 function finish(){if(r.between)return;const won=r.e.hp<=0&&r.p.hp>0;r.result=won?'win':'retry';r.between=won?3:2.4;r.p.attack=r.e.attack=null;r.e.windup=0;clearInput();if(won){r.wins++;score+=60;burstAt(r.e.x,r.e.y-r.height*.65,'#bd9df3');window.GameAudio?.victory?.();}else tone(120,.2);}
 function update(dt){if(!r)return;r.elapsed+=dt;r.shake=Math.max(0,r.shake-dt*22);for(const e of r.effects){e.x+=e.vx*dt;e.y+=e.vy*dt;e.vy+=280*r.unit*dt;e.life-=dt;}r.effects=r.effects.filter(e=>e.life>0);for(const t of r.texts){t.y-=22*dt;t.life-=dt;}r.texts=r.texts.filter(t=>t.life>0);
  if(r.intro>0){r.intro=Math.max(0,r.intro-dt);sync();return;}
  if(r.between>0){r.between-=dt;if(r.between<=0){if(r.result==='win'){if(r.wins>=2){beginTransition({type:'level',stage:3});return;}r.round=2;setup();}else{score=r.entryScore;setup(true);}}return;}
  if(r.freeze>0){r.freeze-=dt;return;}
  r.timer=Math.max(0,r.timer-dt);const p=r.p;if(!p.attack)p.face=r.e.x>p.x?1:-1;
  r.request.jump=Math.max(0,r.request.jump-dt);if(r.buffer){r.buffer.life-=dt;if(r.buffer.life<=0)r.buffer=null;}
  if(p.stun<=0){const axis=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)||input.axis;p.guard=(input.guard||input.down||keys.has('KeyL')||keys.has('ArrowDown')||keys.has('KeyS'))&&p.y>=r.ground-.1&&!p.attack;
   if(!p.guard&&!p.attack)p.vx=approach(p.vx,axis*245*r.unit,28,dt);else p.vx=approach(p.vx,0,25,dt);
   if(r.request.jump&&jump(p))r.request.jump=0;if(!p.guard&&r.buffer&&strike(p,r.buffer.type))r.buffer=null;
  }
  cpu(dt);physics(p,dt);physics(r.e,dt);for(const [a,b] of [[p,r.e],[r.e,p]])if(a.attack){const t=attackProgress(a),spec=attacks[a.attack];if(t>=spec.from&&t<=spec.to)damage(a,b);}
  // No invisible wall when jumping past the opponent. On the floor the two
  // hurtboxes separate in the existing order, so left/right swapping is fair.
  const distance=p.x-r.e.x,min=r.height*.42;if(Math.abs(distance)<min&&Math.abs(p.y-r.e.y)<r.height*.7){const sign=distance<0?-1:1,mid=(p.x+r.e.x)/2;p.x=clamp(mid+sign*min*.5,r.height*.45,r.w-r.height*.45);r.e.x=clamp(mid-sign*min*.5,r.height*.45,r.w-r.height*.45);}
  sync();if(p.hp<=0||r.e.hp<=0||r.timer<=0)finish();
 }
 function scenery(d){const sky=ctx.createLinearGradient(0,0,0,d.h);sky.addColorStop(0,'#10142e');sky.addColorStop(.6,'#333055');sky.addColorStop(1,'#60445d');ctx.fillStyle=sky;ctx.fillRect(0,0,d.w,d.h);glow(d.w*.72,d.top+(d.h-d.top)*.28,d.h*.4,'#a893e029');
  const mx=d.w*.72,my=d.top+(d.h-d.top)*.24,mr=Math.min(51,d.w*.07),moon=ctx.createRadialGradient(mx-mr*.3,my-mr*.4,1,mx,my,mr);moon.addColorStop(0,'#dccfdf9c');moon.addColorStop(.6,'#b4abc67a');moon.addColorStop(1,'#7773994d');circle(mx,my,mr,moon);for(let i=0;i<6;i++)waCrater(mx+(noise(i+872)-.5)*mr*1.2,my+(noise(i+863)-.5)*mr*1.2,mr*(.06+noise(i+831)*.1),mr*.055);ctx.strokeStyle='#a8b8d12c';ctx.lineWidth=1;
  for(let i=0;i<45;i++){const x=noise(i+832)*d.w,y=d.top+noise(i+538)*(r.ground-d.top);circle(x,y,1,'#e1d4f84d');}
  waDistantTemple(d.w*.22,r.ground,r.height*2.9,r.height*2.8,2);waDistantTemple(d.w*.85,r.ground,r.height*2.2,r.height*2.2,4);
  const shrineScale=clamp((d.h-d.top)/430,.28,1.5);waRuin(d.w*.5,r.ground,shrineScale,2,false);
  for(const side of [.02,.98])waRuin(d.w*side,r.ground,shrineScale*.7,1,true);
  const mist=ctx.createLinearGradient(0,r.ground-r.height*1.7,0,r.ground);mist.addColorStop(0,'#a6aad800');mist.addColorStop(.55,'#a6aad810');mist.addColorStop(1,'#aaaadc35');ctx.fillStyle=mist;ctx.fillRect(0,r.ground-r.height*1.7,d.w,r.height*1.7);
  const mid=d.w/2,y=r.ground-r.height*1.45;ctx.strokeStyle='#c1b1dd44';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(mid,y,r.height*.72,r.height*.93,0,0,tau);ctx.stroke();for(let i=0;i<8;i++){const a=i*tau/8+r.elapsed*.05;star(mid+Math.cos(a)*r.height*.72,y+Math.sin(a)*r.height*.93,2,'#d8c6efa0');}
  const ground=ctx.createLinearGradient(0,r.ground,0,d.h);ground.addColorStop(0,'#4f506e');ground.addColorStop(1,'#1c2138');ctx.fillStyle=ground;ctx.fillRect(0,r.ground,d.w,d.h-r.ground);line(0,r.ground,d.w,r.ground,'#d2c5e3',1.5);for(let i=0;i<9;i++)line(i*d.w/8,r.ground,i*d.w/8+(i-4)*12,d.h,'#c7b8d323',1);
  // Silken pennants and lanterns move from fixed anchors instead of looking
  // like broken trees along the edge of the scene.
  for(const side of [.12,.88]){const x=d.w*side,y=d.top+22;line(x,d.top,x,y,'#dac8e667',1);glow(x,y+6,26,'#dcc0f529');rounded(x-7,y,14,21,5,'#9d75b780');line(x-5,y+19,x+5,y+19,'#e2c7da',1);}
  ctx.strokeStyle='#c5b1df23';ctx.lineWidth=.65;const silkY=d.top+10;
  for(const side of [0,1]){const sx=d.w*side;for(let i=1;i<5;i++){ctx.beginPath();ctx.moveTo(sx,silkY);ctx.quadraticCurveTo(sx+(side?-1:1)*i*18,silkY+40,sx+(side?-1:1)*i*28,silkY+75);ctx.stroke();}}
 }
 function limb(points,width,color,shine){ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#0b1024';ctx.lineWidth=width+3;ctx.beginPath();ctx.moveTo(...points[0]);for(const p of points.slice(1))ctx.lineTo(...p);ctx.stroke();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();if(shine){ctx.strokeStyle=shine;ctx.lineWidth=Math.max(1,width*.17);ctx.stroke();}}
 function ninja(f){
  if(art.spider?.ready){
   ellipse(f.x,r.ground+3,r.height*.41,r.height*.055,'#0710216b');glow(f.x,f.y-r.height*.65,r.height*.72,f.windup>0?'#c1f99626':'#aa7bda16');
   ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.face,1);if(f.inv>0)ctx.globalAlpha=.74+Math.sin(r.elapsed*38)*.2;
   // drawAtlas owns the frame scale; this wrapper only adds damage flash.
   ctx.restore();ctx.save();if(f.inv>0)ctx.globalAlpha=.74+Math.sin(r.elapsed*38)*.2;drawAtlas('spider',f,r.height*1.16);ctx.restore();
   if(f.windup>0){ctx.strokeStyle='#c9f9a280';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(f.x,f.y-r.height*.64,r.height*.58,-Math.PI/2,-Math.PI/2+(1-f.windup/.7)*tau);ctx.stroke();}
   return;
  }
  const h=r.height*1.16,k=h/104,phase=f.walk,t=f.attack?(f.attack==='kick'?(.48-f.attackT)/.48:(.32-f.attackT)/.32):0,extend=Math.sin(Math.PI*clamp(t*1.45,0,1)),air=f.y<r.ground-.1;
  ellipse(f.x,r.ground+3,h*.39,h*.055,'#0710216b');ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.face*k,k);if(f.inv>0)ctx.globalAlpha=.75+Math.sin(r.elapsed*40)*.2;
  glow(0,-65,56,f.windup>0?'#c9fd9e33':'#9064c526');const gait=Math.sin(phase)*8,cloak=Math.sin(r.elapsed*4)*3+Math.abs(f.vx)*.015;
  // Four articulated arms, a chitin hood, jade eyes and a streaming sash.
  for(const side of [-1,1])for(let pair=0;pair<2;pair++){const far=side<0,sy=-70+pair*21,attack=side>0&&f.attack==='punch',reach=attack?extend*(pair===0?58:35):0,bob=Math.sin(r.elapsed*2.7+pair)*2;
   ctx.save();if(far)ctx.globalAlpha*=.7;limb([[side*12,sy],[side*(29+reach*.5),sy+12-bob],[side*(22+reach),sy+5-pair*2]],9-pair,'#3c3a61','#af9bd770');ellipse(side*(22+reach),sy+5-pair*2,7,6,'#65557d');for(let i=0;i<3;i++)line(side*(25+reach),sy+2+i*3,side*(32+reach),sy+1+i*3,'#c9dda8',1.5);ctx.restore();}
  const kick=f.attack==='kick'?extend*50:0;limb([[-8,-33],[-12-gait*.5,-18],[-17-gait,-3]],12,'#2a2d4d','#7f739967');limb([[10,-33],[18+gait*.5+kick*.4,-20-kick*.45],[21+gait+kick,-4-kick*.63]],13,'#353652','#a498b95a');ellipse(-18-gait,-3,11,4,'#505376');ellipse(24+gait+kick,-4-kick*.63,11,4,'#73718d');
  const armor=ctx.createLinearGradient(-20,-78,25,-27);armor.addColorStop(0,'#86719b');armor.addColorStop(.5,'#393950');armor.addColorStop(1,'#151c32');ctx.fillStyle=armor;ctx.strokeStyle='#b5a2c478';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-15,-77);ctx.quadraticCurveTo(3,-88,20,-71);ctx.lineTo(17,-35);ctx.quadraticCurveTo(2,-24,-15,-36);ctx.closePath();ctx.fill();ctx.stroke();for(let i=0;i<3;i++)line(-11,-63+i*9,14,-63+i*9,'#b6a5d254',1);
  rounded(-18,-39,38,7,2,'#82739d');ctx.fillStyle='#ad9dd5';ctx.beginPath();ctx.moveTo(-13,-37);ctx.bezierCurveTo(-37-cloak,-43,-32-cloak,-20,-46-cloak,-25);ctx.lineTo(-38-cloak,-15);ctx.bezierCurveTo(-20,-18,-26,-31,-10,-31);ctx.fill();
  ctx.fillStyle='#252842';ctx.strokeStyle='#9b8fbd';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(-14,-77);ctx.quadraticCurveTo(-27,-97,-7,-106);ctx.lineTo(5,-113);ctx.quadraticCurveTo(25,-104,25,-85);ctx.quadraticCurveTo(13,-74,-14,-77);ctx.fill();ctx.stroke();ellipse(7,-91,16,11,'#101b2b');for(let i=0;i<3;i++){ellipse(4+i*7,-96+i*4,3,1.9,f.windup>0?'#ebffc0':'#a2df9d');}line(17,-84,23,-79,'#d5d3aa',2);line(11,-82,16,-76,'#c3c7aa',2);
  if(air){ctx.strokeStyle='#b5a2dc8a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-35,-85);ctx.quadraticCurveTo(-44,-122,0,-135);ctx.stroke();}
  if(f.windup>0){ctx.strokeStyle='#cafd9a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-64,40,-Math.PI/2,-Math.PI/2+(1-f.windup/.7)*tau);ctx.stroke();}
  ctx.restore();
 }
 function heroFighter(f){const h=r.height,j=ModeFX.exitPose(f.x,f.y,h);let introY=0,spin=0;if(r.intro>0){const a=clamp(1-r.intro/2.2,0,1);introY=-(1-journeyEase(a))*h*1.6;spin=(1-journeyEase(a))*tau;glow(f.x,f.y-h*.5+introY,70,'#d8c1ff33');}
  ellipse(f.x,r.ground+3,h*.29,h*.05,'#09102277');ctx.save();ctx.translate(j.x,j.foot+introY);ctx.rotate(j.tilt+spin);ctx.scale(j.size,j.size);ctx.globalAlpha=j.alpha*(f.inv>0?.75+Math.sin(r.elapsed*38)*.2:1);
  const morphIn=r.intro>0?journeyEase((1-r.intro/2.2-.22)/.35):1,morphOut=state==='transition'&&transition?.modeExit?1-journeyEase((transition.age/transition.duration-.1)/.4):1,costume=art[hero]?.ready?morphIn*morphOut:0;
  if(costume<1){ctx.save();ctx.globalAlpha*=1-costume;HeroSprites.draw(0,0,hero,f.face,{size:h/78,ground:f.y>=r.ground-.1,moving:true,steering:true,idleTime:0,vx:f.vx||f.face,vy:f.vy,phase:f.walk,attack:true,turn:f.face,clock:r.elapsed});ctx.restore();}
  if(costume>0){ctx.save();ctx.globalAlpha*=costume;drawAtlas(hero,f,h,0,0);ctx.restore();}
  if(f.guard){ctx.strokeStyle='#d3e8ffb3';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.face*h*.26,-h*.52,h*.16,h*.35,0,-Math.PI*.5,Math.PI*.5);ctx.stroke();}
  ctx.restore();
 }
 function meters(){const y=r.top+7,w=Math.min(r.w*.31,240),x=16;ctx.font=`${Math.min(11,r.w/37)}px system-ui`;ctx.fillStyle='#e4d3ee';ctx.textAlign='left';ctx.fillText(hero==='sun'?'SHAOLIN SUN':'KARATE MOON',x,y);ctx.textAlign='right';ctx.fillText('SPIDER NINJA',r.w-x,y);for(const [xx,f,color] of [[x,r.p,'#ebce99'],[r.w-x-w,r.e,'#b7a0d6']]){rounded(xx,y+7,w,5,2,'#c8bce82c');rounded(xx,y+7,w*f.hp/100,5,2,color);}ctx.textAlign='center';ctx.fillStyle='#e8e1e9';ctx.fillText(`${Math.ceil(r.timer)} · ${'●'.repeat(r.wins)}${'○'.repeat(2-r.wins)}`,r.w/2,y+6);
 }
 function render(){if(!r)return;const d=ModeFX.begin();ctx.save();if(r.shake>0)ctx.translate(Math.sin(r.elapsed*66)*r.shake*.5,Math.cos(r.elapsed*72)*r.shake*.3);scenery(d);ninja(r.e);heroFighter(r.p);for(const e of r.effects){ctx.globalAlpha=clamp(e.life/.65,0,1);star(e.x,e.y,2.5*r.unit,e.color);}ctx.globalAlpha=1;ctx.textAlign='center';ctx.font=`${Math.max(12,18*r.unit)}px system-ui`;for(const t of r.texts){ctx.globalAlpha=clamp(t.life/.2,0,1);ctx.fillStyle=t.color;ctx.fillText(t.text,t.x,t.y);}ctx.globalAlpha=1;
  if(r.e.windup>0){ctx.fillStyle='#dafaad';ctx.font=`${Math.min(12,r.w/32)}px system-ui`;ctx.fillText(r.e.next==='punch'?'FOUR FISTS · guard':r.e.next==='leap'?'LEAP KICK · move back':'SIDE KICK · jump',clamp(r.e.x,90,r.w-90),r.e.y-r.height*1.32);}
  ctx.restore();meters();ctx.fillStyle='#c8c8de';ctx.font=`${Math.min(11,r.w/38)}px system-ui`;ctx.textAlign='center';ctx.fillText(matchMedia('(pointer:coarse)').matches||innerWidth<700?'PUNCH · KICK · JUMP · HOLD GUARD':'J: PUNCH · K: KICK · SPACE: JUMP · L / ↓: GUARD',r.w/2,r.h-10);
  if(r.intro>0)ModeFX.caption(`WORLD 1 BOSS DUEL · ROUND ${r.round} / 2`,r.round===1?'Spider Ninja. Tap PUNCH or KICK. Hold GUARD against fists; JUMP over low kicks.':'The spider leaps. Find the opening after each attack.',d,Math.min(1,r.intro/.45));
  if(r.between>0)ModeFX.caption(r.result==='win'?(r.wins===2?'SPIDER NINJA DEFEATED':'K.O. · ROUND 1 WON'):'ROUND LOST · TRY AGAIN',r.result==='win'?(r.wins===2?'WORLD 1 COMPLETE · Next: World 2 — the Weeping Grotto.':'One round remains. The spider changes its technique.'):'The same round restarts. Move close enough for your hand or foot to connect.',d);ModeFX.end();
 }
 function hud(){return r?`WORLD 1 BOSS DUEL · ${r.round}/2\n✦ ${score} · ${r.wins}/2 ROUNDS WON`:'';}
 function snapshot(){return r?{round:r.round,wins:r.wins,intro:r.intro,timer:r.timer,between:r.between,result:r.result,p:{...r.p},e:{...r.e},bounds:{w:r.w,h:r.h,top:r.top,ground:r.ground,height:r.height}}:null;}
 return {start,resize,press,update,render,hud,snapshot,loadingPromise,get ready(){return Object.values(art).every(a=>a.ready);}};
})();
