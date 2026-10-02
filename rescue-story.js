'use strict';
// The final rescue uses the same approved textured Sun and Moon as the game.
// Every position is recomputed in CSS pixels, so a cinematic survives rotation.
window.RescueStory=(()=>{
 const tau=Math.PI*2,duration=10.5;
 let r=null;
 const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
 const mix=(a,b,t)=>a+(b-a)*t;
 const captive=()=>hero==='sun'?'moon':'sun';
 function color(a,b,t){const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));const aa=rgb(a),bb=rgb(b);return '#'+aa.map((v,i)=>Math.round(mix(v,bb[i],t)).toString(16).padStart(2,'0')).join('');}
 function bubble(x,y,text,scale=1,side=0,alpha=1){
  ctx.save();ctx.globalAlpha*=alpha;const size=13*scale;ctx.font=`600 ${size}px system-ui`;const w=ctx.measureText(text).width+24*scale,h=29*scale;
  rounded(x-w*.5,y-h,w,h,10*scale,'#fff8df');ctx.strokeStyle='#826b8c';ctx.lineWidth=1.1*scale;ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+side*8*scale,y-1*scale);ctx.lineTo(x+(side*8+7)*scale,y+9*scale);ctx.lineTo(x+(side*8+13)*scale,y-1*scale);ctx.fillStyle='#fff8df';ctx.fill();
  ctx.textAlign='center';ctx.fillStyle='#463651';ctx.fillText(text,x,y-9*scale);ctx.restore();
 }
 function drawPerson(type,x,foot,height,clock,{moving=false,face=1,happy=false,blink=false,cast=false,tilt=0,jump=0}={}){
  ctx.save();ctx.translate(x,foot-jump);ctx.rotate(tilt);
  HeroSprites.draw(0,0,type,face,{size:height/78,clock,ground:jump<=0,moving:moving||cast,steering:true,idleTime:moving||cast?0:.1,
   idleExpression:blink?'blink':happy?'smile':'neutral',phase:clock*9,vx:moving?face*100:cast?face:0,vy:jump>0?-20:0,turn:face,attack:cast});ctx.restore();
 }
 function cageBack(clock){
  ellipse(0,3,63,10,'#0409166b');
  rounded(-62,-6,124,15,5,waGradient(0,-6,0,9,['#635472','#29273f','#101a2c']));
  rounded(-50,-113,100,107,30,waGradient(0,-116,0,-8,['#1d213dd9','#27314599','#101b2980']));
  glow(0,-54,68,'#a1a6f21b');
  ctx.strokeStyle='#bbb3dc54';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(-55,-10);ctx.lineTo(-55,-89);ctx.quadraticCurveTo(-54,-122,0,-126);ctx.quadraticCurveTo(54,-122,55,-89);ctx.lineTo(55,-10);ctx.stroke();
  // Silk anchors identify the spider's prison without hiding the captive.
  for(const side of [-1,1]){
   line(side*43,-110,side*68,-133,'#b2acc35a',1.1);line(side*53,-104,side*72,-114,'#b2acc344',.8);
   circle(side*43,-111,2.5,'#a7dfab');
  }
  glow(0,-129,18,'#a7e79320');star(0,-128,4,'#c8e3ae');
 }
 function gate(side,open,clock,unlock){
  const hinge=side*55,width=55*Math.cos(open*1.52),depth=Math.sin(open*1.52)*10;
  const inner=hinge-side*width;ctx.save();ctx.strokeStyle=unlock?'#e2cfad':'#998eac';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(hinge,-103);ctx.quadraticCurveTo(hinge-side*width*.4,-119,inner,-115+depth);ctx.lineTo(inner,-10+depth);ctx.lineTo(hinge,-10);ctx.closePath();ctx.stroke();
  for(let i=1;i<4;i++){
   const x=mix(hinge,inner,i/4);line(x,-110+depth*i/4,x,-11+depth*i/4,unlock?'#edd9b7a0':'#b8aec299',1.35);
   line(x+.7,-102+depth*i/4,x+.7,-18+depth*i/4,'#ffffff21',.55);
  }
  line(hinge,-52,inner,-52+depth,unlock?'#e9dcb486':'#84788b8c',1.3);ctx.restore();
 }
 function cageFront(open=0,clock=0,unlock=0){
  gate(-1,open,clock,unlock);gate(1,open,clock,unlock);
  for(const side of [-1,1]){rounded(side*55-2.8,-104,5.6,98,2,'#6b647d');circle(side*55,-9,3,'#bdb4be');}
  if(unlock<.8){
   const x=-Math.sin(open*1.52)*55;rounded(x-8,-32,16,19,4,'#c5b89b');
   ctx.strokeStyle='#e8dac0';ctx.lineWidth=2.4;ctx.beginPath();ctx.arc(x,-32,5,Math.PI,0);ctx.stroke();circle(x,-25,1.7,'#55405b');
  }else{
   const pulse=clamp(1-(unlock-.8)/.8,0,1);glow(0,-25,25*pulse,'#fff0b460');
   for(let i=0;i<10;i++){const a=i*tau/10+clock*.3,z=10+(1-pulse)*38;star(Math.cos(a)*z,-25+Math.sin(a)*z,1.5+2*pulse,'#fff1bcb5');}
  }
 }
 function prisonSpeech(clock){
  const matrix=ctx.getTransform(),dpr=Math.min(devicePixelRatio||1,2),screenScale=Math.hypot(matrix.a,matrix.b)/dpr;
  bubble(0,-143+Math.sin(clock*2)*1.1,'Help me!',clamp(1/Math.max(.1,screenScale),.8,3.4),0);
 }
 function drawPlatformBubble({x,y,scale=1,clock=0,alpha=1}){
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.scale(scale,scale);prisonSpeech(clock);ctx.restore();
 }
 function drawPlatformCage({x,y,scale=1,clock=0,alpha=1,speech=true}){
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.scale(scale,scale);cageBack(clock);
  drawPerson(captive(),0,-11,79,clock,{blink:(clock%5.2)>4.4&&(clock%5.2)<4.6});
  cageFront(0,clock,0);
  // The platform canvas shrinks in short landscape views. Keep this one
  // important line readable instead of shrinking its letters with the cage.
  if(speech)prisonSpeech(clock);ctx.restore();
 }
 function drawDuelCage(d,elapsed){
  const short=d.h-d.top<240,available=Math.max(72,d.ground-d.top-42),s=clamp(Math.min(d.height/78*.85,available/171,short?.63:1.05),.42,1.05);
  const foot=d.ground-Math.min(d.height*.86,Math.max(7,available-166*s));
  // Place it above the combat plane where possible; narrow landscape views
  // put the smaller prison against the far wall, behind all attack effects.
  const x=d.w*(short?.50:.70);
  drawPlatformCage({x,y:foot,scale:s,clock:elapsed,alpha:.92});
 }
 function dims(){
  const d=ModeFX.measure(),available=Math.max(100,d.h-d.top),height=clamp(Math.min(available*.29,d.w*.30),54,146);
  const scale=height/78,ground=d.top+available*.79,cageX=d.w*.66;
  return {...d,available,height,scale,ground,cageX};
 }
 function pose(d,t){
  const c=d.cageX,h=d.height,s=d.scale,doorLeft=c-55*s,unlockX=doorLeft-h*.34;
  let rescuer=mix(d.w*.10,unlockX,ease(t/2.15)),friend=c;
  const approach=ease((t-3.8)/1.8);
  if(t>3.8){rescuer=mix(unlockX,d.w*.5-h*.20,approach);friend=mix(c,d.w*.5+h*.20,approach);}
  const reunion=t>5.35&&t<6.25?Math.sin(clamp((t-5.35)/.9,0,1)*Math.PI)*h*.10:0;
  const celebration=t>7.1&&t<8.15?Math.sin(clamp((t-7.1)/1.05,0,1)*Math.PI)*h*.13:0;
  return {rescuer,friend,friendFoot:mix(d.ground-11*s,d.ground,ease((t-3.8)/.75)),door:ease((t-2.8)/1.0),
   lock:ease((t-2.2)/1.15)*1.6,sunshine:ease((t-5.75)/2.25),cageAlpha:1-ease((t-5.4)/1.8),
   rescuerMoving:t<2.15||(t>3.8&&t<5.6),friendMoving:t>3.8&&t<5.6,reunion,celebration};
 }
 function start(){r={elapsed:0,rescuer:hero,friend:captive(),startedAt:time,done:false,chime:false,joy:false};}
 function update(dt){
  if(!r)return false;r.elapsed=Math.min(duration,r.elapsed+dt);
  if(!r.chime&&r.elapsed>=2.8){r.chime=true;if(window.GameAudio)GameAudio.morph('rescue');}
  if(!r.joy&&r.elapsed>=6.6){r.joy=true;if(window.GameAudio)GameAudio.victory();}
  r.done=r.elapsed>=duration;return r.done;
 }
 function hills(d,y,height,fill,seed){
  ctx.fillStyle=fill;ctx.beginPath();ctx.moveTo(-10,d.h+10);ctx.lineTo(-10,y);
  for(let x=-10;x<d.w+20;x+=d.w/5){ctx.bezierCurveTo(x+d.w*.04,y-height*Math.sin(seed+x*.009),x+d.w*.13,y+height*Math.cos(seed+x*.005),x+d.w*.2,y+height*.12*Math.sin(x*.013));}
  ctx.lineTo(d.w+20,d.h+10);ctx.closePath();ctx.fill();
 }
 function flower(x,y,size,seed,bloom,clock){
  ctx.save();ctx.translate(x,y);ctx.scale(bloom,bloom);const tilt=Math.sin(clock*1.2+seed)*.05;ctx.rotate(tilt);
  waStroke('#608967',1.4,()=>{ctx.moveTo(0,0);ctx.quadraticCurveTo(2,-size*.48,0,-size);});
  waLeaf(0,-size*.27,size*.32,-1.1,'#94b874');waLeaf(1,-size*.44,size*.26,.35,'#a5c887');
  for(let i=0;i<5;i++){const a=i*tau/5;ctx.save();ctx.translate(Math.cos(a)*size*.19,-size+Math.sin(a)*size*.19);ctx.rotate(a);ellipse(0,0,size*.18,size*.105,seed%3===0?'#eeb9d1':seed%3===1?'#faeed0':'#c6c2ea');ctx.restore();}
  circle(0,-size,size*.08,'#f4d890');ctx.restore();
 }
 function scenery(d,p,t){
  const light=p.sunshine,sky=ctx.createLinearGradient(0,d.top,0,d.h);
  sky.addColorStop(0,color('#091122','#82b9c7',light));sky.addColorStop(.54,color('#302943','#f4d6b0',light));sky.addColorStop(1,color('#3b3241','#dce5b6',light));ctx.fillStyle=sky;ctx.fillRect(0,0,d.w,d.h);
  const sunX=d.w*.27,sunY=d.top+d.available*.31;
  glow(sunX,sunY,Math.min(d.w*.4,d.available*.34),`rgba(255,225,156,${.035+light*.30})`);
  circle(sunX,sunY,d.height*.20,color('#5b546d','#fff1bd',light));
  if(light<1){
   ctx.save();ctx.globalAlpha=1-light;
   for(let i=0;i<35;i++){const x=noise(i+611)*d.w,y=d.top+noise(i+719)*d.available*.65;circle(x,y,.6+noise(i+333)*.7,'#cfdaee9e');}
   for(let j=0;j<4;j++)waStroke('#8680aa35',1,()=>{const yy=d.top+d.available*(.26+j*.13);ctx.moveTo(-40,yy);ctx.bezierCurveTo(d.w*.25,yy-d.height*.5,d.w*.60,yy+d.height*.50,d.w+40,yy-d.height*.16);});
   ctx.restore();
  }
  ctx.save();ctx.globalAlpha=light*.63;
  for(let j=0;j<3;j++)waCloud(d.w*(j*.43-.05)+Math.sin(t*.15+j)*10,d.top+d.available*(.20+noise(j+99)*.17),d.w*.18,d.height*.13,.60);
  ctx.restore();
  hills(d,d.ground-d.height*.25,d.height*.42,color('#36394a','#8ab7ad',light),1);
  hills(d,d.ground-d.height*.03,d.height*.18,color('#3b3d4e','#77a29a',light),3);
  ctx.save();ctx.globalAlpha=light;
  const trees=[[-.03,.85,302],[.12,.59,144],[.92,.68,210],[1.05,.91,316]];
  for(const [fraction,ratio,seed] of trees){const th=d.height*(1.35+ratio),x=d.w*fraction,y=d.ground+d.height*.07;
   waTrunk(x,y,th,Math.max(5,th*.035),waGradient(x,y-th,x,y,['#9dc5a3','#467f79']),seed,true,true);
   ctx.save();ctx.globalAlpha*=.40;ctx.beginPath();waCrownPath(x,y-th*.75,th*.38,th*.30,seed);ctx.fillStyle='#d4e3a7';ctx.fill();ctx.restore();
  }
  ctx.restore();
  // Asteroid stone becomes a continuous, softly rounded meadow underfoot.
  const ground=ctx.createLinearGradient(0,d.ground,0,d.h);ground.addColorStop(0,color('#494250','#90b47d',light));ground.addColorStop(.12,color('#332d40','#7eaa7b',light));ground.addColorStop(1,color('#211e33','#477974',light));ctx.fillStyle=ground;
  ctx.beginPath();ctx.moveTo(-10,d.ground+4);ctx.bezierCurveTo(d.w*.2,d.ground-2,d.w*.37,d.ground+7,d.w*.57,d.ground+3);ctx.bezierCurveTo(d.w*.8,d.ground-4,d.w*.9,d.ground+4,d.w+10,d.ground+4);ctx.lineTo(d.w+10,d.h+10);ctx.lineTo(-10,d.h+10);ctx.closePath();ctx.fill();
  waStroke(color('#9a82985a','#dfebad',light),1.4,()=>{ctx.moveTo(-10,d.ground+4);ctx.bezierCurveTo(d.w*.2,d.ground-2,d.w*.37,d.ground+7,d.w*.57,d.ground+3);ctx.bezierCurveTo(d.w*.8,d.ground-4,d.w*.9,d.ground+4,d.w+10,d.ground+4);});
  ctx.save();ctx.globalAlpha=light;
  for(let i=0;i<38;i++){const x=noise(i+971)*d.w,y=d.ground+10+noise(i+839)*(d.h-d.ground-10),size=d.height*(.10+noise(i+471)*.10);
   flower(x,y,size,i,clamp(light*1.7-noise(i+494)*.5,0,1),t);
  }
  for(let i=0;i<14;i++){const x=noise(i+127)*d.w+Math.sin(t*.7+i)*5,y=d.top+d.available*(.36+noise(i+116)*.50)+Math.sin(t*1.5+i)*7;glow(x,y,5,'#fff0b71c');circle(x,y,.8,'#fff3bcbd');}
  // A few distant birds return as daylight comes back.
  for(let i=0;i<3;i++){const x=(d.w*(.53+i*.16)+t*8)%d.w,y=d.top+d.available*(.27+i*.035),wing=3+Math.sin(t*4+i)*1.2;
   waStroke('#54798099',1,()=>{ctx.moveTo(x-7,y-wing);ctx.quadraticCurveTo(x-2,y-3,x,y);ctx.quadraticCurveTo(x+3,y-3,x+7,y-wing);});
  }
  ctx.restore();
 }
 function rescueLight(d,p,t){
  if(t<2.2||t>3.8)return;const q=ease((t-2.2)/.65),fade=1-ease((t-3.3)/.5),fromX=p.rescuer+d.height*.18,fromY=d.ground-d.height*.51,toX=d.cageX,toY=d.ground-25*d.scale;
  ctx.save();ctx.globalAlpha=q*fade;glow(toX,toY,d.height*.45,'#ffe6b845');
  waStroke('#fff0be80',3,()=>{ctx.moveTo(fromX,fromY);ctx.quadraticCurveTo(mix(fromX,toX,.5),fromY-d.height*.20,toX,toY);});
  waStroke('#fff8d5',.9,()=>{ctx.moveTo(fromX,fromY);ctx.quadraticCurveTo(mix(fromX,toX,.5),fromY-d.height*.20,toX,toY);});
  for(let i=0;i<12;i++){const a=i*tau/12+t*1.6,z=d.height*(.13+q*.23);star(toX+Math.cos(a)*z,toY+Math.sin(a)*z,1.4+q*1.6,'#fff0c6');}
  ctx.restore();
 }
 function joy(d,p,t){
  if(t<5.4)return;const alpha=ease((t-5.4)/.6),cx=d.w*.5,cy=d.ground-d.height*.74;
  ctx.save();ctx.globalAlpha=alpha;
  for(let i=0;i<14;i++){const a=i*tau/14+t*.42,rad=d.height*(.56+.06*Math.sin(t*2+i));star(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad*.63,1.8+noise(i+8)*1.2,i%2?'#fff0c8a0':'#e9d5fba0');}
  const y=d.ground-d.height*(1.28+.10*Math.sin(t*.8));ctx.translate(cx,y);ctx.scale(d.height*.042,d.height*.042);
  ctx.fillStyle='#e5a0b2b0';ctx.beginPath();ctx.moveTo(0,3);ctx.bezierCurveTo(-7,-1,-7,-7,-3,-7);ctx.bezierCurveTo(-1,-7,0,-6,0,-4);ctx.bezierCurveTo(0,-6,2,-7,4,-7);ctx.bezierCurveTo(8,-7,8,-1,0,3);ctx.fill();ctx.restore();
 }
 function title(d,t){
  if(state==='won')return;
  ctx.save();ctx.textAlign='center';let heading='',detail='',alpha=1;
  if(t<2.0){heading='THE LAST WEB';detail=`${r.rescuer==='sun'?'Sun':'Moon'} has won. ${r.friend==='sun'?'Sun':'Moon'} is still waiting.`;alpha=1-ease((t-1.5)/.5);}
  else if(t>6.65){heading='Together again';detail='The universe has its light back.';alpha=ease((t-6.65)/.7);}
  if(heading){const size=clamp(d.w/18,20,35),y=d.top+d.available*.15;ctx.globalAlpha=alpha;ctx.fillStyle=t>6.65?'#375f66':'#f5e5c9';ctx.font=`${size}px Georgia`;ctx.fillText(heading,d.w*.5,y);
   ctx.font=`${clamp(d.w/33,11,14)}px system-ui`;ctx.fillStyle=t>6.65?'#526e6d':'#ccc8da';ctx.fillText(detail,d.w*.5,y+27);}
  ctx.restore();
 }
 function render(){
  if(!r)return;ModeFX.begin();const d=dims(),t=r.elapsed,p=pose(d,t);scenery(d,p,t);
  // The captive is visibly inside the prison before the doors open.
  ctx.save();ctx.translate(d.cageX,d.ground);ctx.scale(d.scale,d.scale);ctx.globalAlpha=p.cageAlpha;cageBack(t);ctx.restore();
  ellipse(p.friend,d.ground+4,d.height*.23,d.height*.04,'#152b3847');ellipse(p.rescuer,d.ground+4,d.height*.23,d.height*.04,'#152b3847');
  const hugging=t>5.35&&t<6.35,happy=t>5.2,blink=t%4.8>4.4&&t%4.8<4.55;
  drawPerson(r.friend,p.friend,p.friendFoot,d.height,t,{moving:p.friendMoving,face:-1,happy,blink,cast:hugging,tilt:hugging?-.08*Math.sin((t-5.35)*Math.PI):0,jump:p.reunion+p.celebration*.91});
  ctx.save();ctx.globalAlpha=p.cageAlpha;ctx.translate(d.cageX,d.ground);ctx.scale(d.scale,d.scale);cageFront(p.door,t,p.lock);ctx.restore();
  drawPerson(r.rescuer,p.rescuer,d.ground,d.height,t,{moving:p.rescuerMoving,face:1,happy,blink,cast:(t>2.15&&t<3.8)||hugging,tilt:hugging?.08*Math.sin((t-5.35)*Math.PI):0,jump:p.reunion+p.celebration});
  if(t<2.75)bubble(d.cageX,d.ground-143*d.scale,'Help me!',clamp(d.scale,.72,1.3),0,1-ease((t-2.2)/.55));
  if(t>4.0&&t<5.6)bubble(p.friend,p.friendFoot-d.height*1.17,'Thank you!',clamp(d.scale*.82,.7,1.2),0,Math.sin((t-4)/1.6*Math.PI));
  rescueLight(d,p,t);joy(d,p,t);title(d,t);ModeFX.end();
 }
 function snapshot(){if(!r)return null;const d=dims(),p=pose(d,r.elapsed);return {...r,duration,phase:r.elapsed<2.2?'approach':r.elapsed<3.8?'unlock':r.elapsed<5.6?'free-and-reunite':r.elapsed<8?'sunrise':'celebrate',
   captiveHero:r.friend,cageOpen:p.door,sunshine:p.sunshine,rescuerX:p.rescuer,friendX:p.friend,ground:d.ground,height:d.height,bounds:{w:d.w,h:d.h,top:d.top}};}
 function hud(){return r?`${r.elapsed<5.6?'THE FINAL RESCUE':'THE UNIVERSE IS SAFE'}\n✦ ${score} · ${r.rescuer==='sun'?'Sun saves Moon':'Moon saves Sun'}`:'';}
 return {drawPlatformCage,drawPlatformSpeech:drawPlatformBubble,drawPlatformBubble,drawDuelCage,start,update,render,snapshot,hud,resize:()=>{}};
})();
