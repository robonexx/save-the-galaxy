'use strict';
const $=s=>document.querySelector(s),canvas=$('#canvas'),ctx=canvas.getContext('2d');
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const T=GAME_TUNING;
let state='menu',mode='platform',hero='sun',stage=0,world=createWorld('sun',0),player=null;
let terrain=[],enemies=[],stars=[],powerups=[],beacons=[],shots=[],hostileShots=[],particles=[];
let camera=0,time=0,score=0,checkpoint={x:80,y:520},mainArea=null,bonusArea=null;
// Physics stays at 120 Hz; art interpolates between the two most recent states.
let previousCamera=0,previousTime=0,renderAlpha=1,renderTime=0;
let viewW=960,viewH=600,last=0,acc=0,pulseClock=0,jumpBuffer=0,coyote=0,portalCooldown=0;
let nearbyPortal=null,transportTime=0,pendingPortal=null,toastTimer=0,lockedGateTimer=0,previousGround=false;
let boss=null,bossPhase=0,bossIndex=0,doubleJumpUnlocked=false;
let transition=null,transportJourney=null,arrivalFX=null,screenFade=0,fogHazards=[],tentacleStrikes=[];
let bossVictory=null;
let sound=true,audio,boostJump=false;
const keys=new Set(),input={axis:0,vertical:0,jump:false,light:false,boost:false,down:false};
const pointers={stick:null,jump:null,pulse:null,boost:null};
const mobileLayout={blocked:false,width:0,height:0,playHeight:600,controlHeight:0};
const approach=(from,to,rate,dt)=>from+(to-from)*(1-Math.exp(-rate*dt));
function rememberPose(body){
 body.prevX=body.x;body.prevY=body.y;
 for(const field of ['walkPhase','motionPhase','facing','runBlend','gaitAmount','visualVX','visualVY']){
  if(Number.isFinite(body[field]))body['prev'+field[0].toUpperCase()+field.slice(1)]=body[field];
 }
}
function resetRenderPose(){
 previousCamera=camera;previousTime=time;renderTime=time;
 if(player)rememberPose(player);if(boss)rememberPose(boss);
 for(const group of [enemies,shots,hostileShots,particles])for(const body of group)rememberPose(body);
}
function resize(){
 const game=$('#game'),width=game.clientWidth||innerWidth,height=game.clientHeight||innerHeight;
 const coarse=typeof matchMedia==='function'&&matchMedia('(pointer:coarse)').matches;
 const blocked=false,reserve=$('#touch').offsetHeight||0;
 if(width!==mobileLayout.width||height!==mobileLayout.height||blocked!==mobileLayout.blocked){clearInput();resetBoost();}
 Object.assign(mobileLayout,{blocked,width,height,playHeight:Math.max(1,height-reserve),controlHeight:reserve});
 game.style.setProperty('--control-height',`${reserve}px`);
 const dpr=Math.min(devicePixelRatio||1,2),scale=mobileLayout.playHeight/600;
 canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);viewW=width/scale;viewH=height/scale;
 if(player)camera=clamp(player.x-viewW*.38+player.face*45,0,Math.max(0,world.width-viewW));
 previousCamera=camera;
 ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);
 if(mode==='fight')window.FightMode?.resize();else if(mode!=='platform')window.ArcadeModes?.resize();
}addEventListener('resize',resize);addEventListener('orientationchange',resize);
document.addEventListener('fullscreenchange',resize);resize();
function tone(freq,duration=.08){if(!sound)return;try{
 audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();
 const o=audio.createOscillator(),g=audio.createGain();o.type='sine';
 o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.6,audio.currentTime+duration);
 g.gain.setValueAtTime(.045,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
 o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);
}catch{}}
function notify(text){$('#toast').hidden=false;$('#toast').textContent=text;toastTimer=3.5;$('#toast').style.opacity=1;}
function resetBoost(){input.boost=false;boostJump=false;$('#boost').classList.remove('active');$('#boost').setAttribute('aria-pressed','false');}
function clearInput(){
 keys.clear();input.axis=input.vertical=0;input.jump=input.light=input.boost=input.down=false;boostJump=false;
 window.ArcadeModes?.clearAim();
 const captured=Object.entries(pointers);Object.keys(pointers).forEach(k=>pointers[k]=null);
 for(const [id,pointerId] of captured){const element=$('#'+id);if(pointerId!==null&&element.hasPointerCapture?.(pointerId))element.releasePointerCapture(pointerId);}
 $('#knob').style.transform='';
 document.querySelectorAll('#jump.active,#pulse.active,#boost.active').forEach(e=>e.classList.remove('active'));
 $('#boost').setAttribute('aria-pressed','false');
 $('#stick').classList.remove('boosting');jumpBuffer=0;
}
function buildArea(data){
 world=data;
 world.motionClock=0;
 world.slime=world.theme==='void'&&world.id!=='boss'?world.ground.map(([x,y,w],i)=>({x:x+Math.min(190,w*.35),y:y-5,w:Math.min(160,w*.35),h:9})):[];
 terrain=world.ground.map(([x,y,w])=>({x,y,w,h:180,oneWay:false})).concat(world.platforms.map(([x,y,w],i)=>{
  const motion=(world.movingPlatforms||[]).find(m=>m.platform===i);
  return {x,y,w,h:20,oneWay:true,baseX:x,baseY:y,prevX:x,prevY:y,dx:0,dy:0,motion};
 }));
 enemies=world.enemies.map(([x,foot,type],i)=>{
 const flying=['bat','wisp','drone'].includes(type),w=flying?40:36,h=flying?30:34;
 const y=flying?foot:foot-h,dir=i%2?1:-1;
 return {x,y,prevX:x,prevY:y,w,h,type,home:x,base:y,vx:0,vy:0,ground:false,dir,alive:true,hp:type==='turret'?2:1,clock:.8+i*.23,dive:0,
  motionPhase:i*.79,walkPhase:i*.79,facing:dir,turnBlend:dir,anticipation:0,attackFlash:0,landSquash:0,recoil:0,flightPhase:i*.79,flightVX:0,flightVY:0};
 });
 stars=[];terrain.forEach((t,index)=>{for(let x=t.x+60;x<t.x+t.w-30;x+=110)stars.push({x,y:t.y-60,w:20,h:20,got:false,carrier:t.motion?index:-1});});
 powerups=world.powerups.map(([x,y])=>({x,y,w:28,h:28,got:false}));
 for(const item of [...powerups,...(world.key?[world.key]:[])])item.carrier=terrain.findIndex(t=>t.motion&&item.x+item.w/2>t.x&&item.x+item.w/2<t.x+t.w&&t.y-item.y>=30&&t.y-item.y<=70);
 beacons=world.checkpoints.map(([x,y])=>({x,y,active:false}));
 shots=[];hostileShots=[];fogHazards=[];tentacleStrikes=[];checkpoint={x:world.spawn[0],y:world.spawn[1]};
}
function packArea(){return {world,terrain,enemies,stars,powerups,beacons,checkpoint:{...checkpoint}};}
function unpackArea(a){({world,terrain,enemies,stars,powerups,beacons,checkpoint}=a);shots=[];hostileShots=[];}
function placePlayer(x,foot){
 player.x=x;player.y=foot-player.h;player.vx=player.vy=0;player.visualVX=player.visualVY=0;
 player.ground=true;player.inv=1.2;player.landSquash=player.takeoff=player.turnAmount=0;
 player.runBlend=player.gaitAmount=0;player.facing=0;player.trailClock=0;
 player.carryPlatform=-1;player.carryDY=0;
 player.idleTime=0;player.idleExpression='neutral';player.steering=false;
 player.mistTrap=0;player.mistTaps=0;player.mistLastTap=-10;player.mistImmune=0;player.poisonTime=0;player.poisonTick=0;
 player.trail=[];player.magicTrailClock=0;player.landingPulse=player.doubleJumpPulse=0;
 player.landingX=player.doubleJumpX=x+player.w/2;player.landingY=player.doubleJumpY=foot;player.landingStrength=0;
 camera=clamp(x-viewW*.35,0,Math.max(0,world.width-viewW));coyote=jumpBuffer=0;resetRenderPose();
}
function loadLevel(){
 mode='platform';configureModeControls();
 boss=null;bossPhase=0;bossVictory=null;transportJourney=null;pendingPortal=null;arrivalFX=null;
 const hp=player?.hp??3,big=player?.big??false;
 buildArea(createWorld(hero,stage));mainArea=bonusArea=null;particles=[];
 player={x:80,y:458,w:32,h:62,vx:0,vy:0,face:1,facing:1,ground:true,hp,inv:1,big:false,visualSize:1,boosting:false,walkPhase:0,attack:0,knockback:0,autoJump:0,dropTimer:0,
  visualVX:0,visualVY:0,runBlend:0,gaitAmount:0,landSquash:0,takeoff:0,turnAmount:0,trailClock:0,
  trail:[],magicTrailClock:0,landingPulse:0,landingStrength:0,landingX:0,landingY:0,doubleJumpPulse:0,doubleJumpX:0,doubleJumpY:0,
  idleTime:0,idleExpression:'neutral',steering:false,mistTrap:0,mistTaps:0,mistImmune:0,poisonTime:0,poisonTick:0};
 if(big)setSize(true);placePlayer(80,520);
 pulseClock=0;portalCooldown=1;nearbyPortal=null;clearInput();notify(world.subtitle);refreshHUD();
}
function start(type){boss=null;bossVictory=null;bossPhase=0;bossIndex=0;doubleJumpUnlocked=false;transition=null;hero=type;stage=0;score=0;player=null;resetBoost();loadLevel();state='playing';$('#overlay').hidden=true;tone(550);window.GameAudio?.start();}
document.querySelectorAll('[data-hero]').forEach(b=>b.onclick=()=>start(b.dataset.hero));
function showOverlay(title,msg,choices=false){
 $('#overlay').hidden=false;$('h1').innerHTML=title;$('#message').textContent=msg;$('#choices').hidden=!choices;$('#continue').hidden=choices;
}
function pause(){
 if(state==='playing'){state='paused';clearInput();resetBoost();hidePortal();showOverlay('A quiet<br><em>moment</em>','Your journey is waiting.');$('#continue').textContent='Continue journey →';}
 else if(state==='paused'){state='playing';$('#overlay').hidden=true;clearInput();}
}
$('#pause').onclick=pause;
$('#continue').onclick=()=>{if(state==='paused')pause();else start(hero);};
$('#menu').onclick=()=>{state='menu';mode='platform';configureModeControls();transition=null;bossVictory=null;transportJourney=null;pendingPortal=null;arrivalFX=null;screenFade=0;boss=null;bossPhase=0;player=null;buildArea(createWorld(hero,0));clearInput();resetBoost();hidePortal();showOverlay('Across the<br><em>Eclipse</em>','Nine different trails, moving bridges, a karate duel, a starflight and three asteroid storms. Choose your light.',true);};
$('#sound').onclick=()=>{sound=!sound;$('#sound').textContent=sound?'♪':'∅';$('#sound').setAttribute('aria-label',sound?'Mute sound':'Enable sound');window.GameAudio?.setMuted();if(sound)window.GameAudio?.start();};
async function enterFullscreen(){
 try{
  if(!document.fullscreenElement&&!document.webkitFullscreenElement){
   const game=$('#game'),request=game.requestFullscreen||game.webkitRequestFullscreen;
   if(!request)return false;await request.call(game);
  }
  resize();return true;
 }catch{return false;}
}
$('#full').onclick=async()=>{
 if(document.fullscreenElement||document.webkitFullscreenElement){try{screen.orientation?.unlock?.();await (document.exitFullscreen||document.webkitExitFullscreen).call(document);}catch{}}
 else if(!await enterFullscreen())notify('Fullscreen is unavailable in this browser.');
};
const jumpCodes=['Space','ArrowUp','KeyW'];
const boostHeld=()=>input.boost||keys.has('ShiftLeft')||keys.has('ShiftRight');
addEventListener('keydown',e=>{
 if(['ArrowLeft','ArrowRight','ArrowDown',...jumpCodes,'Escape','ShiftLeft','ShiftRight'].includes(e.code))e.preventDefault();
 if(e.repeat)return;
 if(['KeyP','Escape'].includes(e.code)){pause();return;}
 keys.add(e.code);
 if(mode==='platform'&&state==='playing'&&['KeyX','KeyJ',...jumpCodes].includes(e.code))escapeTrap();
 if(jumpCodes.includes(e.code)&&state==='playing'&&mode==='platform')jumpBuffer=T.jumpBuffer;
 if(mode==='fight'&&state==='playing'){
  if(jumpCodes.includes(e.code))window.FightMode?.press('jump');
  if(['KeyX','KeyJ'].includes(e.code))window.FightMode?.press('punch');
  if(['KeyK','ShiftLeft','ShiftRight'].includes(e.code))window.FightMode?.press('kick');
 }
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>{if(state==='playing')pause();clearInput();resetBoost();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')pause();clearInput();});
const stick=$('#stick');
function stickMove(e){
 if(pointers.stick!==e.pointerId)return;
 const r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,max=r.width*.34,len=Math.hypot(x,y),k=len>max?max/len:1;
 // Save the Moon's radial dead zone and force curve, projected onto the trail.
 const force=clamp((len-7)/(max-7),0,1)**1.15;
 input.axis=len?x/len*force:0;
 input.vertical=len?y/len*force:0;
 input.down=y>max*.65&&y>Math.abs(x)*1.2;
 $('#knob').style.transform=`translate(${x*k}px,${y*k}px)`;
}
stick.onpointerdown=e=>{if(state!=='playing'||mobileLayout.blocked||pointers.stick!==null||e.button>0)return;e.preventDefault();pointers.stick=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e);};
stick.onpointermove=stickMove;
stick.onpointerup=stick.onpointercancel=stick.onlostpointercapture=e=>{if(pointers.stick===e.pointerId){pointers.stick=null;input.axis=input.vertical=0;input.down=false;$('#knob').style.transform='';}};
function syncTouchActions(){
 const jumping=pointers.jump!==null||boostJump;
 if(jumping&&!input.jump){if(mode==='platform'){jumpBuffer=T.jumpBuffer;escapeTrap();}else if(mode==='fight')window.FightMode?.press('jump');}
 if(mode==='fight'){
  if(pointers.pulse!==null&&!input.light)window.FightMode?.press('punch');
  if(pointers.boost!==null&&!input.boost)window.FightMode?.press('kick');
 }
 input.jump=jumping;input.light=pointers.pulse!==null;input.boost=pointers.boost!==null;
 for(const [id,on] of [['jump',input.jump],['pulse',input.light],['boost',input.boost]])$('#'+id).classList.toggle('active',on);
 $('#boost').setAttribute('aria-pressed',String(input.boost));$('#stick').classList.toggle('boosting',input.boost);
}
for(const id of ['jump','pulse','boost']){
 const b=$('#'+id);
 b.onpointerdown=e=>{
  if(state!=='playing'||mobileLayout.blocked||pointers[id]!==null||e.button>0)return;
  e.preventDefault();pointers[id]=e.pointerId;if(id==='pulse'&&mode==='platform')escapeTrap();
  if(id==='jump'&&['asteroid','flight'].includes(mode))window.ArcadeModes?.touchAim(e,true);
  b.setPointerCapture(e.pointerId);syncTouchActions();
 };
 b.onpointermove=e=>{
  if(id==='jump'&&pointers.jump===e.pointerId&&['asteroid','flight'].includes(mode))window.ArcadeModes?.touchAim(e);
  if(id!=='boost'||pointers.boost!==e.pointerId||mode==='fight')return;
  const r=$('#jump').getBoundingClientRect(),margin=12;
  boostJump=e.clientX>=r.left-margin&&e.clientX<=r.right+margin&&e.clientY>=r.top-margin&&e.clientY<=r.bottom+margin;
  syncTouchActions();
 };
 b.onpointerup=b.onpointercancel=b.onlostpointercapture=e=>{if(pointers[id]===e.pointerId){pointers[id]=null;if(id==='boost')boostJump=false;if(id==='jump')window.ArcadeModes?.clearTouchAim();syncTouchActions();}};
 b.oncontextmenu=e=>e.preventDefault();
}stick.oncontextmenu=e=>e.preventDefault();
const platformActions={jump:$('#jump').innerHTML,pulse:$('#pulse').innerHTML,boost:$('#boost').innerHTML};
function configureModeControls(){
 const space=['asteroid','flight'].includes(mode),fight=mode==='fight';
 $('#touch').dataset.mode=mode;
 $('#pulse').hidden=space;
 for(const id of ['jump','pulse','boost'])$('#'+id).innerHTML=platformActions[id];
 if(space){$('#jump').innerHTML='✦<small>FIRE</small>';$('#boost').innerHTML='»<small>DASH</small>';}
 if(fight){$('#pulse').innerHTML='✧<small>PUNCH</small>';$('#boost').innerHTML='↗<small>KICK</small>';}
 $('#jump').setAttribute('aria-label',space?'Fire light; drag to aim in asteroid battles':'Jump; hold for a higher jump');
 $('#pulse').setAttribute('aria-label',fight?'Punch':'Magic: shoot a light attack');
 $('#boost').setAttribute('aria-label',space?'Dash; brief shield, three second recharge':fight?'Kick':'Hold to boost; slide to Jump for a boost jump');
 $('.touch-help').innerHTML=space?(mode==='asteroid'?'Move in any direction<br>FIRE · drag to aim':'Fly past obstacles<br>FIRE + DASH'):fight?'Stick down: guard<br>PUNCH · KICK · JUMP':'Hold BOOST<br>slide to JUMP ↗';
}
function hidePortal(){nearbyPortal=null;$('#portal-hint').hidden=true;}
function updatePortal(){
 const cx=player.x+player.w/2,foot=player.y+player.h,previousFoot=player.prevY+player.h;
 if(portalCooldown<=0){
  const entry=world.portals.find(q=>{
   if(q.kind==='cloud')return !player.ground&&player.vy<0&&Math.abs(cx-q.x)<48&&player.y<q.y-96&&foot>q.y-140;
   if(q.kind==='blackhole')return !previousGround&&player.vy>=0&&Math.abs(cx-q.x)<31&&previousFoot<=q.y+1&&foot>=q.y-9&&foot<=q.y+6;
   return q.kind==='return'&&Math.abs(cx-q.x)<29&&foot>q.y-105&&player.y<q.y-5;
  });
  if(entry){usePortal(entry);return;}
 }
 nearbyPortal=portalCooldown>0?null:world.portals.find(q=>Math.abs(cx-q.x)<100&&Math.abs(foot-q.y)<140)||null;
 $('#portal-hint').hidden=!nearbyPortal;
 if(nearbyPortal)$('#portal-label').textContent=nearbyPortal.kind==='cloud'?'JUMP INTO THE BEAM ↑':nearbyPortal.kind==='blackhole'?'JUMP INTO THE HOLE ↓':'WALK INTO THE PORTAL →';
}
function usePortal(portal=nearbyPortal){
 if(state!=='playing'||!portal)return;
 pendingPortal=portal;state='transport';transportTime=.95;
 transportJourney={kind:portal.kind,age:0,duration:.95,fromCX:player.x+player.w/2,fromFoot:player.y+player.h,
  portalX:portal.x,portalY:portal.kind==='cloud'?portal.y-118:portal.kind==='blackhole'?portal.y-12:portal.y-54,
  height:78*player.visualSize,arrivalKind:world.id==='main'?(portal.kind==='cloud'?'rise':'fall'):(hero==='moon'?'fall':'rise')};
 clearInput();resetBoost();hidePortal();arrivalFX=null;player.ground=false;player.vx=0;player.vy=portal.kind==='cloud'?-480:190;
 player.steering=true;player.idleTime=0;player.idleExpression='neutral';player.trail=[];player.landingPulse=player.doubleJumpPulse=0;
 if(Math.abs(portal.x-transportJourney.fromCX)>2)player.face=Math.sign(portal.x-transportJourney.fromCX);
 player.facing=player.face;tone(portal.kind==='cloud'?620:220,.4);
}
function finishPortal(){
 const arrivalKind=transportJourney?.arrivalKind||'gate';
 if(world.id==='main'){
  mainArea=packArea();if(bonusArea)unpackArea(bonusArea);else buildArea(createBonus(hero,stage));
  placePlayer(checkpoint.x,checkpoint.y);
 }else{
  bonusArea=packArea();unpackArea(mainArea);
  const x=mainArea.world.portals[0].returnX,g=world.ground.find(g=>x>=g[0]&&x+player.w<=g[0]+g[2]);
  checkpoint={x,y:g[1]};placePlayer(x,g[1]);
 }
 portalCooldown=1.3;pendingPortal=null;transportJourney=null;particles=[];state='playing';screenFade=.32;beginArrival(arrivalKind);
 notify(world.id==='bonus'?world.subtitle:'Back on the trail · find the level key');refreshHUD();
}
function journeyEase(t){t=clamp(t,0,1);return t*t*(3-2*t);}
function sampleTransport(j,age=j.age){
 const p=clamp(age/j.duration,0,1),align=journeyEase(p/(j.kind==='cloud'?.25:.28));
 let cx=j.fromCX+(j.portalX-j.fromCX)*align,foot=j.fromFoot,scale=1,tilt=0,alpha=1,clipY=null,clipOval=null;
 if(j.kind==='blackhole'){
  const sink=journeyEase((p-.24)/.54);scale=1-.5*sink;
  cx+=Math.sin(sink*Math.PI*2)*Math.sin(sink*Math.PI)*2;
  foot=j.fromFoot+(j.portalY-j.fromFoot)*align+(j.height*scale+18)*sink;
  tilt=-.22*Math.sin(sink*Math.PI);alpha=1-journeyEase((p-.7)/.12);if(p>.22)clipY=j.portalY+1;
 }else if(j.kind==='cloud'){
  const lift=clamp((p-.04)/.78,0,1),travel=.3*lift+.7*lift*lift;
  foot=j.fromFoot+(-110-j.fromFoot)*travel;scale=1-.13*journeyEase((p-.5)/.32);
  alpha=1-journeyEase((p-.75)/.12);
 }else{
  const approach=journeyEase(p/.46),enter=journeyEase((p-.36)/.44);scale=1-.94*enter;
  cx=j.fromCX+(j.portalX-j.fromCX)*approach;
  const walkFoot=j.fromFoot+(j.portalY+j.height*.5-j.fromFoot)*approach-Math.sin(approach*Math.PI)*32;
  foot=walkFoot*(1-enter)+(j.portalY+j.height*scale*.5)*enter;
  alpha=1-journeyEase((p-.72)/.12);if(p>.34)clipOval={x:j.portalX,y:j.portalY,rx:30,ry:57};
 }
 return {cx,foot,scale,tilt,alpha,clipY,clipOval,progress:p};
}
function sampleTransition(j,age=j.age){
 if(j.swallow){
  const p=clamp(age/j.duration,0,1),pull=journeyEase(p/.72),scale=1-.97*journeyEase((p-.36)/.5),spiral=Math.sin(p*Math.PI)*16;
  return {cx:j.fromCX+(j.portalX-j.fromCX)*pull+Math.cos(p*Math.PI*4)*spiral,foot:j.fromFoot+(j.portalY+j.height*scale*.5-j.fromFoot)*pull-Math.sin(p*Math.PI)*100+Math.sin(p*Math.PI*4)*spiral,scale,tilt:-p*Math.PI*1.6,alpha:1-journeyEase((p-.82)/.12),progress:p,clipOval:p>.65?{x:j.portalX,y:j.portalY,rx:41,ry:52}:null};
 }
 const p=clamp(age/j.duration,0,1),approach=journeyEase(p/.46),enter=journeyEase((p-.4)/.4),scale=1-.96*enter;
 const cx=j.fromCX+(j.portalX-j.fromCX)*approach;
 const jumpFoot=j.fromFoot+(j.gateFoot-j.fromFoot)*approach-Math.sin(approach*Math.PI)*70;
 const foot=jumpFoot*(1-enter)+(j.portalY+j.height*scale*.5)*enter;
 return {cx,foot,scale,tilt:0,alpha:1-journeyEase((p-.72)/.12),progress:p,
  clipDoor:p>.46?{x:j.portalX,y:j.portalY,foot:j.gateFoot+4,arched:j.hasGate}:null};
}
function moveJourneyPlayer(pose,dt){
 const oldX=player.x,oldY=player.y;player.x=pose.cx-player.w/2;player.y=pose.foot-player.h;
 player.vx=(player.x-oldX)/dt;player.vy=(player.y-oldY)/dt;player.visualVX=player.vx;player.visualVY=player.vy;
}
function beginArrival(kind){arrivalFX={kind,age:0,duration:.68,x:player.x+player.w/2,foot:player.y+player.h};}
function burst(x,y,color,n=12){for(let i=0;i<n;i++){const a=i/n*Math.PI*2;particles.push({x,y,prevX:x,prevY:y,vx:Math.cos(a)*(45+Math.random()*100),vy:Math.sin(a)*100,life:.65,color});}}
function setSize(big){
 const p=player,foot=p.y+p.h,cx=p.x+p.w/2,w=big?44:32,h=big?86:62,candidate={x:cx-w/2,y:foot-h,w,h};
 if(big&&terrain.some(t=>!t.oneWay&&overlap(candidate,t)))return false;
 Object.assign(p,candidate,{big});return true;
}
function respawn(){
 if(boss){boss.hp=boss.maxHp;boss.x=800;boss.y=520-boss.h;boss.action='rest';boss.clock=1.4;boss.inv=0;boss.vy=0;boss.vx=0;boss.index=0;boss.ground=boss.kind!=='nebula';boss.actionAge=0;boss.walkPhase=0;boss.chargeBlend=boss.slamImpact=boss.recoil=0;boss.fireCount=0;}
 setSize(false);placePlayer(checkpoint.x,checkpoint.y);player.inv=1.8;player.knockback=0;shots=[];hostileShots=[];fogHazards=[];tentacleStrikes=[];clearInput();resetBoost();hidePortal();
}
function hurt(fall=false){
 const p=player;if(p.inv>0&&!fall)return;
 if(p.big&&!fall){setSize(false);p.inv=1.6;p.knockback=.18;p.vx=-p.face*240;p.vy=-290;notify('Your giant light shield absorbed the hit');tone(220,.18);burst(p.x+p.w/2,p.y+p.h/2,'#ffe5ad',18);return;}
 p.hp--;tone(120,.2);burst(p.x+p.w/2,p.y+20,'#f1a6b9');
 if(p.hp<=0){p.hp=3;notify('A new spark · back to the last beacon');respawn();}
 else if(fall)respawn();else{p.inv=1.4;p.knockback=.2;p.vx=-p.face*250;p.vy=-290;}
}
function defeat(e){e.alive=false;burst(e.x+e.w/2,e.y+e.h/2,'#b6a0ff',16);score+=3;tone(340);}
function damageEnemy(e){e.hp--;e.recoil=1;if(e.hp<=0)defeat(e);else{burst(e.x+e.w/2,e.y+10,'#eeaf9c',6);tone(250);}}
// Separate axes + swept downward crossing; thin ledges can be jumped through.
function updateTerrainMotion(dt){
 world.motionClock+=dt;
 terrain.forEach((t,index)=>{
  t.prevX=t.x;t.prevY=t.y;t.dx=t.dy=0;if(!t.motion)return;
  const riders=[player,...enemies].filter(b=>b&&b.ground&&Math.abs(b.y+b.h-t.y)<1.5&&b.x<t.x+t.w&&b.x+b.w>t.x);
  const offset=t.motion.amplitude*Math.sin(world.motionClock*Math.PI*2/t.motion.period);
  t.x=t.baseX+(t.motion.axis==='x'?offset:0);t.y=t.baseY+(t.motion.axis==='y'?offset:0);t.dx=t.x-t.prevX;t.dy=t.y-t.prevY;
  for(const body of riders){body.x+=t.dx;body.y+=t.dy;body.carryPlatform=index;body.carryDY=t.dy;if(body!==player){body.home+=t.dx;body.base+=t.dy;}}
  for(const item of [...stars,...powerups,...(world.key?[world.key]:[])])if(item.carrier===index){item.x+=t.dx;item.y+=t.dy;}
 });
}
function moveBody(body,dt){
 const previousY=body.y;body.x+=body.vx*dt;
 for(const t of terrain)if(!t.oneWay&&overlap(body,t)){if(body.vx>0)body.x=t.x-body.w;else if(body.vx<0)body.x=t.x+t.w;body.vx=0;}
 body.x=clamp(body.x,0,world.width-body.w);body.y+=body.vy*dt;body.ground=false;
 for(const [index,t] of terrain.entries()){
  if(t.oneWay&&body.dropTimer>0)continue;
  const horizontally=body.x<t.x+t.w&&body.x+body.w>t.x;
  const previousFoot=previousY+body.h-(body.carryPlatform===index?(body.carryDY||0):0),oldTop=t.motion?t.prevY:t.y;
  if((body.vy>=0||(t.motion&&body.vy>=t.dy/dt))&&horizontally&&previousFoot<=oldTop+.5&&body.y+body.h>=t.y){body.y=t.y-body.h;body.vy=0;body.ground=true;}
  else if(!t.oneWay&&body.vy<0&&overlap(body,t)){body.y=t.y+t.h;body.vy=0;}
 }
 body.carryPlatform=-1;body.carryDY=0;
}
function updateEnemies(dt,oldY){
 const p=player;
 for(const e of enemies){
  if(!e.alive||Math.abs(e.x-p.x)>viewW+360)continue;e.clock-=dt;
  const startX=e.x,wasGround=e.ground,fallSpeed=e.vy||0;
  e.motionPhase=(e.motionPhase||0)+dt;
  e.attackFlash=Math.max(0,(e.attackFlash||0)-dt*5);
  e.landSquash=Math.max(0,(e.landSquash||0)-dt*6);
  e.recoil=Math.max(0,(e.recoil||0)-dt*5);
  e.anticipation=0;
  if(e.type==='crawler'||e.type==='hopper'){
   const direction=e.dir,speed=e.type==='hopper'?62:68;
   const aheadX=e.x+e.w/2+direction*30,feet=e.y+e.h;
   const floorAhead=terrain.some(t=>aheadX>=t.x&&aheadX<=t.x+t.w&&Math.abs(t.y-feet)<10);
   if((e.ground&&!floorAhead)||(Math.abs(e.x-e.home)>115&&Math.sign(e.x-e.home)===e.dir))e.dir*=-1;
   if(e.type==='hopper'&&e.ground){
    e.anticipation=clamp(1-e.clock/.32,0,1);
    if(e.clock<=0){e.vy=-450;e.clock=1.8;e.attackFlash=1;e.anticipation=0;}
   }
   // Patrollers ease into a turn; hoppers visibly crouch before taking off.
   const stride=e.type==='hopper'?1-e.anticipation*.76:1;
   e.vx+=clamp(e.dir*speed*stride-e.vx,-420*dt,420*dt);
   e.vy=Math.min(e.vy+T.gravity*dt,700);moveBody(e,dt);
   if(!wasGround&&e.ground)e.landSquash=clamp(fallSpeed/650,.25,1);
  }else if(e.type==='turret'){
   e.dir=p.x>e.x?1:-1;
   e.anticipation=Math.abs(p.x-e.x)<550?clamp(1-e.clock/.4,0,1):0;
   if(e.clock<=0&&Math.abs(p.x-e.x)<550){
    const dx=p.x+p.w/2-e.x-e.w/2,dy=p.y+p.h/2-e.y-12,len=Math.hypot(dx,dy)||1;
    const x=e.x+e.w/2,y=e.y+12;
    hostileShots.push({x,y,prevX:x,prevY:y,w:12,h:12,vx:dx/len*195,vy:dy/len*195,life:3});e.clock=2.1;e.attackFlash=1;e.anticipation=0;tone(180,.06);
   }
  }else if(e.type==='bat'){
   e.flightPhase=(e.flightPhase||0)+dt*1.35;
   if(Math.abs(e.x-p.x)<270&&e.clock<=0){e.dive=1.2;e.clock=3.4;}
   e.dive=Math.max(0,e.dive-dt);e.anticipation=e.dive>0?Math.min(1,e.dive/.25):0;
   const targetX=e.home+Math.sin(e.flightPhase)*95;
   const targetY=e.base+(e.dive>0?155:Math.sin(e.flightPhase*2.22)*24);
   e.x=approach(e.x,targetX,3.5,dt);e.y=approach(e.y,targetY,e.dive>0?4.5:3.4,dt);
   e.dir=Math.abs(targetX-e.x)>3?Math.sign(targetX-e.x):e.dir;
  }else{
   const orbitSpeed=e.type==='drone'?1.1:1.5;e.flightPhase=(e.flightPhase||0)+dt*orbitSpeed;
   const targetX=e.home+Math.sin(e.flightPhase)*65,targetY=e.base+Math.sin(e.flightPhase*2/orbitSpeed)*26;
   e.x=approach(e.x,targetX,4,dt);e.y=approach(e.y,targetY,4,dt);
   e.dir=Math.abs(targetX-e.x)>3?Math.sign(targetX-e.x):e.dir;
   if(e.type==='drone'){
    e.anticipation=Math.abs(p.x-e.x)<470?clamp(1-e.clock/.4,0,1):0;
    if(e.clock<=0&&Math.abs(p.x-e.x)<470){const x=e.x+20,y=e.y+24;hostileShots.push({x,y,prevX:x,prevY:y,w:11,h:11,vx:0,vy:210,life:2.3});e.clock=2.5;e.attackFlash=1;e.anticipation=0;}
   }
  }
  e.walkPhase=(e.walkPhase||0)+Math.abs(e.x-startX)*.075;
  e.facing=approach(Number.isFinite(e.facing)?e.facing:e.dir,e.dir,12,dt);e.turnBlend=e.facing;
  e.flightVX=approach(e.flightVX||0,(e.x-startX)/dt,10,dt);
  if(overlap(p,e)){
   if(e.type!=='turret'&&p.vy>0&&oldY+p.h<=e.y+16){defeat(e);p.vy=-510;p.autoJump=.22;p.takeoff=1;}
   else hurt();
  }
 }
 for(const b of hostileShots){
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
  if(b.kind==='poison')b.vy+=500*dt;
  if(b.kind==='blackhole'){
   const dx=b.x+b.w/2-(p.x+p.w/2),dy=b.y+b.h/2-(p.y+p.h/2),distance=Math.hypot(dx,dy);
   if(distance<155&&distance>5){p.vx+=dx/distance*170*dt;p.vy+=dy/distance*80*dt;}
  }
  if(terrain.some(t=>overlap(b,t))){if(b.kind==='poison')fogHazards.push({kind:'poison',x:b.x-28,y:b.y-4,w:80,h:11,life:2.7,age:0});b.life=0;}
  if(b.life>0&&overlap(b,p)){if(b.kind==='poison'||b.kind==='dart'){p.poisonTime=2.6;p.poisonTick=1.4;}hurt();b.life=0;}
 }
 hostileShots=hostileShots.filter(b=>b.life>0);
}
function refreshHUD(){
 if(!player){$('#stats').textContent='';return;}
 if(mode!=='platform'){$('#stats').textContent=mode==='fight'?window.FightMode?.hud()||'':window.ArcadeModes?.hud()||'';return;}
 const phaseLabel=bossIndex===0?`ROUND ${bossPhase}/2`:bossIndex===2?(bossPhase===1?'BREAK THE SHELL':'FINAL ROUND'):'THE VEIL';
 const key=world.id==='boss'?`STOMPS ${boss.maxHp-boss.hp}/${boss.maxHp} · ${phaseLabel}`:world.id==='bonus'?'SECRET PATH':world.key.got?'KEY FOUND':'FIND KEY';
 const route=innerWidth<500?(world.id==='bonus'?world.name:world.id==='boss'?BOSS_DEFS[bossIndex].name:`W${Math.floor(stage/3)+1} · ${stage%3+1}/3`):world.name;
 const status=player.mistTrap>0?`TAP MAGIC / X · ${Math.floor(player.mistTaps)}/6`:player.poisonTime>0?'POISON':player.sticky?'SLIME':player.boosting?'» BOOST':'';
 $('#stats').textContent=`${route} · ${key}\n✦ ${score}  ${'♥'.repeat(player.hp)}${'♡'.repeat(3-player.hp)}  ${player.big?'GIANT · ':''}${status}`;
}
function finishStage(){
 beginTransition(stage%3===2?{type:'boss',index:Math.floor(stage/3),phase:1}:{type:'level',stage:stage+1});
}
function transitionCaption(destination){
 if(destination.type==='fight')return {title:'KARATE DUEL · SPIDER NINJA',detail:'Two rounds. PUNCH, KICK, JUMP — hold down to guard.'};
 if(destination.type==='arcade')return destination.kind==='flight'?{title:'STARFLIGHT · 3 WAVES',detail:'A horizontal space battle. Move freely, hold FIRE and use DASH.'}:{title:`ASTEROID STORM ${(destination.round||0)+1} / 3`,detail:'Free flight at the edge of the universe. Move in any direction and hold FIRE.'};
 if(destination.type==='boss')return {title:destination.index===2&&destination.phase===2?'THE DESTROYER · LAST BATTLE':`${BOSS_DEFS[destination.index].name.toUpperCase()}${destination.index===0?` · ROUND ${destination.phase}/2`:''}`,detail:destination.index===2&&destination.phase===2?'The asteroid storms are over. Eight head stomps will save the universe.':destination.index===0&&destination.phase===2?'Double jump unlocked! Release JUMP, then press again in the air.':'A new guardian awaits. Jump above its head and stomp.'};
 if(destination.type==='level')return {title:`WORLD ${Math.floor(destination.stage/3)+1} · TRAIL ${destination.stage%3+1}/3`,detail:STAGE_LAYOUTS[destination.stage].hint};
 return {title:'THE UNIVERSE IS SAVED',detail:'The Destroyer is defeated. Your light shines again.'};
}
function beginTransition(destination){
 if(state==='transition')return;
 const hasGate=!!world.exit,gateFoot=hasGate?516:player.y+player.h-10;
 transition={age:0,duration:1.45,destination,fromX:player.x,fromY:player.y,fromCX:player.x+player.w/2,fromFoot:player.y+player.h,
  portalX:hasGate?world.exit+43:clamp(player.x+player.w/2+140,60,world.width-70),portalY:hasGate?462:gateFoot-46,
  gateFoot,height:78*player.visualSize,hasGate,...transitionCaption(destination)};
 if(mode!=='platform'){transition.modeExit=true;transition.duration=1.7;}
 arrivalFX=null;
 state='transition';clearInput();resetBoost();hidePortal();$('#overlay').hidden=true;
 player.face=Math.sign(transition.portalX-transition.fromCX)||1;player.facing=player.face;player.ground=false;player.steering=true;player.idleTime=0;player.trail=[];player.landingPulse=player.doubleJumpPulse=0;
 tone(660,.42);
}
function completeTransition(){
 const destination=transition.destination;transition=null;screenFade=.32;
 if(destination.type==='level'){stage=destination.stage;player.hp=3;loadLevel();state='playing';beginArrival('gate');}
 else if(destination.type==='boss'){startBoss(destination.phase,destination.index);if(state==='playing')beginArrival('gate');}
 else if(destination.type==='arcade')startArcade(destination.kind,destination.round||0);
 else if(destination.type==='fight')startFight();
 else{state='won';boss=null;clearInput();resetBoost();showOverlay('Together<br><em>again</em>',`${hero==='sun'?'The Moon':'The Sun'} is free. Nine trails, three worlds, and the Destroyer defeated. The universe has its light back.`);$('#continue').textContent='Play again →';}
}
function finishBossVictory(){
 const victory=bossVictory;bossVictory=null;beginTransition(victory.destination);
 if(victory.swallow){Object.assign(transition,{swallow:true,duration:2.4,hasGate:false,portalX:boss.x+boss.w*.5,portalY:boss.y+boss.h*.5});boss.action='warn';boss.next='poison';boss.warnProgress=.7;window.GameAudio?.roar('destroyer');}
}
function escapeTrap(){
 if(state!=='playing'||!player||player.mistTrap<=0)return false;
 if(time-(player.mistLastTap??-10)>1.25)player.mistTaps=0;
 player.mistLastTap=time;player.mistTaps=(player.mistTaps||0)+1;tone(380+player.mistTaps*45,.04);
 if(player.mistTaps>=6){player.mistTrap=0;player.mistTaps=0;player.mistImmune=2.8;burst(player.x+player.w/2,player.y+25,'#cee1ff',20);notify('Free of the mist!');}
 return true;
}
function hazardBox(h){
 if(h.kind==='vent'){const phase=(time+h.phase)%h.period;return {...h,y:h.y+h.h-85,h:85,active:phase>=1.2&&phase<2.15,warning:phase>.55&&phase<1.2,progress:phase/ h.period};}
 if(h.kind==='orbit')return {...h,x:h.x+Math.sin(time*1.5+h.phase)*44,y:h.y+Math.cos(time*1.5+h.phase)*24,w:28,h:28,active:true};
 return {...h,active:true};
}
function updateHazards(dt){
 for(const h of world.hazards||[]){const box=hazardBox(h);if(box.active&&overlap(player,box))hurt();}
 for(const fog of fogHazards){
  fog.life-=dt;fog.age+=dt;
  if(fog.kind==='mist'){fog.x+=fog.vx*dt;fog.y+=fog.vy*dt;}
  const touches=fog.kind==='mist'?mistHits(player,fog):overlap(player,fog);
  if(fog.age>.18&&fog.life>0&&touches){
   if(fog.kind==='mist'&&player.mistTrap<=0&&player.mistImmune<=0){player.mistTrap=1;player.mistTaps=0;player.mistLastTap=-10;fog.life=0;notify('Mist hit · tap MAGIC / X quickly six times to escape!');}
   if(fog.kind==='poison'){player.poisonTime=Math.max(player.poisonTime,1.5);if(player.poisonTick<=0)player.poisonTick=1.1;}
  }
 }
 fogHazards=fogHazards.filter(fog=>fog.life>0);
 for(const strike of tentacleStrikes){strike.age+=dt;strike.life-=dt;if(strike.age>=strike.warning&&strike.age<strike.warning+.22&&overlap(player,{x:strike.x-18,y:370,w:36,h:150}))hurt();}
 tentacleStrikes=tentacleStrikes.filter(strike=>strike.life>0);
}
function mistHits(body,fog){
 // Only the visible central cloud is solid; the faint outer wisps are cosmetic.
 const cx=fog.x+fog.w*.5,cy=fog.y+fog.h*.5,rx=fog.w*.44,ry=fog.h*.43;
 const nx=clamp(cx,body.x,body.x+body.w),ny=clamp(cy,body.y,body.y+body.h);
 return Math.pow((nx-cx)/rx,2)+Math.pow((ny-cy)/ry,2)<=1;
}
function updateIdle(p,axis,dt){
 const active=Math.abs(axis)>.05||Math.abs(p.vx)>10||!p.ground||p.attack>0||p.knockback>0||input.light||keys.has('KeyX')||keys.has('KeyJ')||input.jump||jumpCodes.some(c=>keys.has(c));
 if(active){p.idleTime=0;p.idleExpression='neutral';return;}
 p.idleTime=(p.idleTime||0)+dt;
 const t=p.idleTime;
 if(t>=30){
  const sleepy=(t-30)%14;
  p.idleExpression=sleepy<2.2?'yawn':sleepy<11?'sleep':'neutral';
 }else{
  const blink=(t+(hero==='moon'?1.1:0))%5.3;
  p.idleExpression=(blink>3.1&&blink<3.24)||(blink>3.43&&blink<3.53)?'blink':(t%13.8>8.2&&t%13.8<10.5)?'smile':'neutral';
 }
}
function update(dt){
 if(mobileLayout.blocked)return;
 previousTime=time;previousCamera=camera;
 if(player)rememberPose(player);if(boss)rememberPose(boss);
 for(const group of [enemies,shots,hostileShots,particles])for(const body of group)rememberPose(body);
 time+=dt;renderTime=time;toastTimer-=dt;if(toastTimer<=0)$('#toast').style.opacity=0;
 screenFade=Math.max(0,screenFade-dt);
 if(arrivalFX&&state==='playing'){arrivalFX.age+=dt;if(arrivalFX.age>=arrivalFX.duration)arrivalFX=null;}
 particles.forEach(a=>{a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt;});particles=particles.filter(a=>a.life>0);
 if(state==='victory'){
  bossVictory.age+=dt;player.vx=0;player.vy=Math.min(player.vy+T.gravity*dt,850);moveBody(player,dt);
  player.facing=approach(player.facing,0,10,dt);player.runBlend=approach(player.runBlend,0,10,dt);player.inv=1;
  if(bossVictory.age>=bossVictory.duration)finishBossVictory();return;
 }
 if(state==='transition'){
  transition.age+=dt;moveJourneyPlayer(sampleTransition(transition),dt);
  if(transition.swallow)camera=approach(camera,clamp(player.x-viewW*.44,0,Math.max(0,world.width-viewW)),8,dt);
  if(transition.age>=transition.duration)completeTransition();return;
 }
 if(state==='transport'){
  transportJourney.age+=dt;transportTime=Math.max(0,transportJourney.duration-transportJourney.age);
  moveJourneyPlayer(sampleTransport(transportJourney),dt);if(transportTime<=0)finishPortal();return;
 }
 if(state!=='playing')return;
 if(mode==='fight'){window.FightMode.update(dt);refreshHUD();return;}
 if(mode!=='platform'){window.ArcadeModes.update(dt);refreshHUD();return;}
 updateTerrainMotion(dt);
 const p=player;
 p.inv=Math.max(0,p.inv-dt);p.attack=Math.max(0,p.attack-dt);p.knockback=Math.max(0,p.knockback-dt);p.autoJump=Math.max(0,p.autoJump-dt);p.dropTimer=Math.max(0,p.dropTimer-dt);
 p.mistImmune=Math.max(0,p.mistImmune-dt);if(p.mistTrap>0&&time-(p.mistLastTap??-10)>1.25)p.mistTaps=0;
 if(p.poisonTime>0){p.poisonTime=Math.max(0,p.poisonTime-dt);p.poisonTick-=dt;if(p.poisonTick<=0){p.poisonTick=1.4;hurt();}}
 p.landSquash=Math.max(0,(p.landSquash||0)-dt*5.5);p.takeoff=Math.max(0,(p.takeoff||0)-dt*5);
 p.turnAmount=Math.max(0,(p.turnAmount||0)-dt*6);
 p.landingPulse=Math.max(0,(p.landingPulse||0)-dt);p.doubleJumpPulse=Math.max(0,(p.doubleJumpPulse||0)-dt);
 p.visualSize+=( (p.big?1.38:1)-p.visualSize)*Math.min(1,dt*13);
 pulseClock=Math.max(0,pulseClock-dt);portalCooldown=Math.max(0,portalCooldown-dt);lockedGateTimer=Math.max(0,lockedGateTimer-dt);
 jumpBuffer=Math.max(0,jumpBuffer-dt);coyote=p.ground?T.coyote:Math.max(0,coyote-dt);
 const axis=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0)||input.axis;
 p.steering=Math.abs(axis)>.05;
 p.boosting=boostHeld();const sticky=p.ground&&(world.slime||[]).some(q=>p.x+p.w>q.x&&p.x<q.x+q.w&&Math.abs(p.y+p.h-q.y-5)<8);p.sticky=sticky;const speed=(sticky?.43:1)*(p.mistTrap>0?.28:1)*(p.poisonTime>0?.88:1)*(hero==='sun'?(p.boosting?T.boostSun:T.walkSun):(p.boosting?T.boostMoon:T.walkMoon));
 if(p.knockback===0)p.vx+=clamp(axis*speed-p.vx,-(p.ground?T.acceleration:T.airAcceleration)*dt,(p.ground?T.acceleration:T.airAcceleration)*dt);
 if(Math.abs(axis)>.05){const face=Math.sign(axis);if(face!==p.face)p.turnAmount=1;p.face=face;}
 const facingTarget=p.steering||!p.ground||Math.abs(p.vx)>15||p.attack>0?p.face:0;
 p.facing=approach(Number.isFinite(p.facing)?p.facing:0,facingTarget,15,dt);
 if(p.ground)p.airJump=false;
 if(jumpBuffer>0&&(coyote>0||(doubleJumpUnlocked&&!p.airJump))){
  const airborne=coyote<=0;if(airborne)p.airJump=true;
  const dropping=(input.down||keys.has('ArrowDown')||keys.has('KeyS'))&&terrain.some(t=>t.oneWay&&Math.abs(p.y+p.h-t.y)<1&&p.x<t.x+t.w&&p.x+p.w>t.x);
  if(dropping){p.dropTimer=.26;p.y+=3;p.vy=60;p.ground=false;coyote=jumpBuffer=0;}
  else{p.vy=-(p.boosting?T.boostJump:T.jump);p.ground=false;p.takeoff=1;coyote=0;jumpBuffer=0;tone(p.boosting?800:660,.1);
  if(airborne){p.doubleJumpPulse=.38;p.doubleJumpX=p.x+p.w/2;p.doubleJumpY=p.y+p.h*.6;}
  burst(p.x+p.w/2,p.y+p.h,hero==='sun'?'#f6ca73':'#b9b0ff',8);}
 }
 const holding=input.jump||jumpCodes.some(c=>keys.has(c));
 if(!holding&&p.autoJump===0&&p.vy< -260)p.vy=-260;
 const moonFloat=hero==='moon'&&holding&&p.vy>0;
 p.vy=Math.min(p.vy+(moonFloat?T.moonFallGravity:T.gravity)*dt,moonFloat?T.moonFallMax:850);
 const oldY=p.y,landingSpeed=p.vy;previousGround=p.ground;moveBody(p,dt);
 if(!previousGround&&p.ground){p.landSquash=clamp(landingSpeed/900,.12,1);p.landingPulse=.35;p.landingStrength=p.landSquash;p.landingX=p.x+p.w/2;p.landingY=p.y+p.h;burst(p.x+p.w/2,p.y+p.h,world.day?'#d6c8a2':'#9fbaba',5);}
 if(p.y>720){hurt(true);refreshHUD();return;}
 p.visualVX=approach(p.visualVX||0,p.vx,16,dt);p.visualVY=approach(p.visualVY||0,p.vy,18,dt);
 p.runBlend=approach(p.runBlend||0,clamp(Math.abs(p.vx)/100,0,1),13,dt);
 p.gaitAmount=approach(p.gaitAmount||0,clamp(Math.abs(p.vx)/speed,0,1),10,dt);
 // Authored full-body textures need about12–14 pose changes/second, not the
 // old vector IK clock. Distance keeps the loop still when a wall stops us.
 const runFrames=window.HeroSprites?.runFrameCount?.(hero)||8;
 const cycleDistance=Math.max(32,Math.abs(p.vx)*runFrames/(8+6*clamp(Math.abs(p.vx)/460,0,1)))*p.visualSize;
 p.walkPhase+=Math.abs(p.x-p.prevX)*Math.PI*2/cycleDistance;
 p.trail=(p.trail||[]).filter(q=>time-q.time<.18);
 p.magicTrailClock=(p.magicTrailClock||0)-dt;
 if((!p.ground||(p.boosting&&Math.abs(p.vx)>160))&&p.magicTrailClock<=0){
  p.trail.push({x:p.x+p.w/2,y:p.y+p.h*.48,time});p.magicTrailClock=1/60;
  if(p.trail.length>12)p.trail.shift();
 }
 p.trailClock=(p.trailClock||0)-dt;
 if(p.boosting&&Math.abs(p.vx)>200&&p.trailClock<=0){const x=p.x+p.w/2-p.face*20,y=p.y+p.h*.5;particles.push({x,y,prevX:x,prevY:y,vx:-p.face*40,vy:-20,life:.35,color:hero==='sun'?'#ffc562':'#bfa9fc'});p.trailClock=.035;}
 if((input.light||keys.has('KeyX')||keys.has('KeyJ'))&&pulseClock<=0){
  const x=p.x+p.w/2,y=p.y+p.h*.48;shots.push({x,y,prevX:x,prevY:y,w:p.big?22:16,h:p.big?18:12,vx:p.face*650,life:1.1});pulseClock=.33;p.attack=.16;tone(850,.06);
 }
 for(const s of shots){
  s.x+=s.vx*dt;s.life-=dt;if(terrain.some(t=>!t.oneWay&&overlap(s,t)))s.life=0;
  if(s.life>0)for(const e of enemies)if(e.alive&&overlap(s,e)){damageEnemy(e);s.life=0;break;}
 }shots=shots.filter(s=>s.life>0);
 updateEnemies(dt,oldY);
 if(boss)updateBoss(dt,oldY);
 updateHazards(dt);
 if(state!=='playing'){refreshHUD();return;}
 updateIdle(p,axis,dt);
 for(const s of stars)if(!s.got&&overlap(p,s)){s.got=true;score++;burst(s.x+10,s.y+10,'#ffe0a1',5);tone(1050,.04);}
 for(const item of powerups)if(!item.got&&overlap(p,item)){
  if(p.big||setSize(true)){item.got=true;score+=5;notify(p.big?'Giant light · one hit absorbed before losing a heart':'Starlight gathered');burst(p.x+p.w/2,p.y+p.h/2,'#ffe9a9',20);tone(520,.3);}
 }
 for(const b of beacons)if(!b.active&&Math.abs(p.x-b.x)<45&&p.ground&&Math.abs(p.y+p.h-b.y)<5){
  b.active=true;checkpoint={x:b.x,y:b.y};p.hp=3;notify('Beacon lit · hearts restored');burst(b.x,b.y-65,'#8de6d1',20);
 }
 if(world.key&&!world.key.got&&overlap(p,world.key)){world.key.got=true;notify('Level key found · open the star gate');burst(world.key.x,world.key.y,'#ffe49a',26);tone(1200,.25);}
 if(world.exit&&p.x+p.w>world.exit-10){
  if(world.key.got){finishStage();return;}
  p.x=world.exit-10-p.w;p.vx=0;
  if(lockedGateTimer<=0){notify('The gate needs a key · follow the golden key marker');lockedGateTimer=4;}
 }
 updatePortal();
 const desired=clamp(p.x-viewW*.38+p.facing*45,0,Math.max(0,world.width-viewW));camera+=(desired-camera)*(1-Math.exp(-dt*7));
 refreshHUD();
}
function frame(stamp){const delta=Math.min((stamp-last)/1000||0,.05);last=stamp;acc+=delta;while(acc>=1/120){update(1/120);acc-=1/120;}renderAlpha=clamp(acc*120,0,1);renderTime=previousTime+(time-previousTime)*renderAlpha;if(window.drawGame)drawGame();requestAnimationFrame(frame);}
// Start after all drawing modules are loaded, even on a slow local file read.
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(frame),{once:true});else requestAnimationFrame(frame);
window.EclipseGame=Object.freeze({snapshot:()=>({state,mode,hero,stage,worldIndex:Math.floor(stage/3),localStage:stage%3,difficulty:world.difficulty,theme:world.theme,area:world.id,score,key:world.key?.got??false,camera,player:player?{...player}:null,enemies:enemies.filter(e=>e.alive).length,stars:stars.filter(s=>!s.got).length,boss:boss?{...boss}:null,bossPhase,bossIndex,doubleJumpUnlocked,bossVictory:bossVictory?{...bossVictory}:null,movingPlatforms:terrain.filter(t=>t.motion).map(t=>({x:t.x,y:t.y,w:t.w,dx:t.dx,dy:t.dy})),arcade:mode==='asteroid'||mode==='flight'?window.ArcadeModes?.snapshot():null,fight:mode==='fight'?window.FightMode?.snapshot():null,transition:transition?{...transition}:null,transport:transportJourney?{...transportJourney}:null,arrival:arrivalFX?{...arrivalFX}:null,fogHazards:fogHazards.map(f=>({...f})),tentacleStrikes:tentacleStrikes.map(f=>({...f})),portal:nearbyPortal?.kind??null,input:{...input},layout:{...mobileLayout}})});

function startBoss(phase=1,index=Math.floor(stage/3)){
 mode='platform';configureModeControls();
 bossIndex=index;bossPhase=phase;bossVictory=null;arrivalFX=null;transportJourney=null;pendingPortal=null;const def=BOSS_DEFS[index],health=index===2&&phase===1?4:def.hp;
 buildArea(createBossWorld(phase,index));mainArea=bonusArea=null;
 player.hp=3;setSize(false);placePlayer(90,520);player.airJump=false;
 if(index>0||phase===2)doubleJumpUnlocked=true;
 boss={kind:def.kind,name:def.name,x:800,y:520-def.h,prevX:800,prevY:520-def.h,w:def.w,h:def.h,baseHeight:def.h,maxHp:health,hp:health,inv:0,action:'rest',clock:1.5,index:0,dir:-1,facing:0,turnBlend:0,vx:0,vy:0,ground:def.kind!=='nebula',
  motionPhase:0,walkPhase:0,actionAge:0,warnProgress:0,chargeBlend:0,slamImpact:0,recoil:0,fireFlash:0,fireCount:0,fireIndex:0,fireClock:0};
 resetRenderPose();state='playing';$('#overlay').hidden=true;clearInput();resetBoost();notify(world.subtitle);refreshHUD();window.GameAudio?.laugh(def.kind);
}
function bossProjectile(x,y,vx,vy,w=26,h=26,life=4,kind='fire'){
 hostileShots.push({x,y,prevX:x,prevY:y,vx,vy,w,h,life,fire:kind==='fire'||kind==='shockwave',kind});
}
function bossDefeated(){
 if(state!=='playing'||bossVictory)return;
 hostileShots=[];fogHazards=[];tentacleStrikes=[];score+=50*(bossIndex+1);
 let destination,title,detail,swallow=false;
 if(bossIndex===0&&bossPhase===1){doubleJumpUnlocked=true;destination={type:'boss',index:0,phase:2};title='ROUND 1 CLEARED · 4 / 4';detail='Double jump unlocked. Next: the Warden’s Inferno round.';}
 else if(bossIndex===0){destination={type:'fight'};title='CINDER WARDEN DEFEATED';detail='Next: Spider Ninja — a karate duel in two rounds.';}
 else if(bossIndex===1){destination={type:'arcade',kind:'flight'};title='NEBULA PHANTOM DEFEATED';detail='Next: Starflight — a horizontal shooter with three waves.';}
 else if(bossPhase===1){destination={type:'arcade',kind:'asteroid',round:0};title='THE DESTROYER’S SHELL BREAKS';detail='It opens a galaxy rift. Survive three asteroid storms!';swallow=true;}
 else{destination={type:'win'};title='THE DESTROYER IS DEFEATED';detail='Eight final stomps. The universe has its light back.';}
 boss.hp=0;boss.action='rest';boss.recoil=1;bossVictory={age:0,duration:2.1,destination,title,detail,swallow};state='victory';
 clearInput();resetBoost();hidePortal();player.vx=0;player.vy=-330;player.ground=false;$('#toast').hidden=true;toastTimer=0;burst(boss.x+boss.w/2,boss.y,'#ffe7a6',46);window.GameAudio?.victory?.();refreshHUD();
}
function prepareStyle(kind,name,theme){
 clearInput();mode=kind;configureModeControls();boss=null;bossVictory=null;transportJourney=null;pendingPortal=null;arrivalFX=null;transition=null;mainArea=bonusArea=null;particles=[];
 buildArea({id:kind,theme,day:false,name,width:viewW,ground:[],platforms:[],enemies:[],hazards:[],powerups:[],checkpoints:[],portals:[],spawn:[90,520],key:null,exit:null,difficulty:7});
 setSize(false);player.hp=3;placePlayer(90,520);camera=previousCamera=0;state='playing';$('#overlay').hidden=true;hidePortal();$('#toast').hidden=true;$('#toast').style.opacity=0;toastTimer=0;
 window.GameAudio?.morph?.(kind);
}
function startArcade(kind,round=0){prepareStyle(kind,kind==='asteroid'?'The Shattered Galaxy':'Starflight through the Veil','nebula');window.ArcadeModes.start(kind,round);refreshHUD();}
function startFight(){prepareStyle('fight','The Spider Ninja','void');window.FightMode.start();refreshHUD();}
function updateBoss(dt,oldY){
 const b=boss,p=player,startX=b.x,hard=bossPhase===2||b.hp<=b.maxHp/2;
 b.inv=Math.max(0,b.inv-dt);b.clock-=dt;b.actionAge=(b.actionAge||0)+dt;b.motionPhase=(b.motionPhase||0)+dt;
 b.slamImpact=Math.max(0,(b.slamImpact||0)-dt*3.8);b.recoil=Math.max(0,(b.recoil||0)-dt*4.5);b.fireFlash=Math.max(0,(b.fireFlash||0)-dt*6);
 if(b.action==='rest'&&b.clock<=0){
  const pattern=b.kind==='warden'?['fire','charge','smash']:b.kind==='nebula'?['blackhole','mist','orbit','blackhole','mist']:['poison','tentacle','dart','pounce','tentacle','poison'];
  b.action='warn';b.actionAge=0;b.dir=p.x+p.w/2>b.x+b.w/2?1:-1;b.next=pattern[b.index++%pattern.length];b.warnDuration=b.next==='mist'?1.15:b.kind==='destroyer'?1.08:.95;b.clock=b.warnDuration;
  if(b.next==='mist')b.mistTarget={x:p.x+p.w*.5,y:p.y+p.h*.55};
  if(b.next==='pounce')b.pounceTargetX=clamp(p.x+p.w*.5,110,world.width-110);
  const warnings={fire:'FIRE · jump over the flames',charge:'CHARGE · jump above the head',smash:'SMASH · jump over the shockwave',blackhole:'BLACK HOLES · keep moving, avoid their pull',mist:'MIST · dodge the drifting cloud',orbit:'STAR ORBIT · the Phantom sweeps through the air',poison:'VENOM · dodge the green spray',dart:'POISON DARTS · jump or change direction',tentacle:'TENTACLES · move out of the marked lanes',pounce:'SPIDER LEAP · leave the marked landing spot'};
  notify(warnings[b.next]);
 }
 else if(b.action==='warn'&&b.clock<=0){
  b.action=b.next;b.actionAge=0;b.clock=b.action==='orbit'?2.5:b.action==='charge'?1.05:b.action==='smash'||b.action==='pounce'?1.8:b.action==='tentacle'?1.55:1.5;
  b.fireCount=b.action==='blackhole'?(hard?5:3):b.action==='dart'?(hard?7:5):b.action==='poison'?(hard?6:4):(hard?5:3);b.fireIndex=0;b.fireClock=0;
  if(b.action==='smash'||b.action==='pounce'){b.vy=b.action==='pounce'?-560:-760;b.ground=false;b.h=b.baseHeight;b.y=520-b.h;if(b.action==='pounce')b.vx=clamp((b.pounceTargetX-(b.x+b.w*.5))/.62,-650,650);}
  if(b.action==='mist'){
   const x=b.x+b.w*.5+b.dir*b.w*.65,y=b.y+b.h*.58,target=b.mistTarget||{x:p.x+p.w*.5,y:p.y+p.h*.5},dx=target.x-x,dy=target.y-y,len=Math.max(1,Math.hypot(dx,dy)),speed=hard?205:175;
   fogHazards.push({kind:'mist',x:x-66,y:y-45,w:132,h:90,vx:dx/len*speed,vy:dy/len*speed,life:5.2,age:0});
  }
  if(b.action==='tentacle')for(const offset of [-115,0,115])tentacleStrikes.push({x:clamp(p.x+p.w/2+offset,45,world.width-45),sourceX:b.x+b.w/2,sourceY:b.y+75,age:0,life:1.5,warning:hard?.7:.92});
  if(['charge','smash','tentacle','pounce'].includes(b.action))window.GameAudio?.roar(b.kind);else window.GameAudio?.laugh(b.kind);
 }
 b.warnProgress=b.action==='warn'?clamp(1-b.clock/(b.warnDuration||.95),0,1):0;
 const chargeTarget=b.action==='charge'?clamp(Math.min(1,b.actionAge/.18,b.clock/.22),0,1):0;
 b.chargeBlend=approach(b.chargeBlend||0,chargeTarget,19,dt);
 if(b.action==='charge'){
  const speed=b.kind==='nebula'?360:b.kind==='destroyer'?(hard?530:420):(hard?570:440);
  b.x=clamp(b.x+b.dir*speed*b.chargeBlend*dt,40,world.width-b.w-40);
 }
 else if(b.kind==='nebula'){
  b.vx=approach(b.vx||0,Math.sin(b.motionPhase*(b.action==='orbit'?1.8:.85))*(b.action==='orbit'?225:80),4,dt);b.x=clamp(b.x+b.vx*dt,130,world.width-b.w-130);
 }
 if(b.kind==='nebula'){const targetY=b.action==='orbit'?280+Math.sin(b.motionPhase*2.4)*55:335+Math.sin(b.motionPhase*1.35)*28;b.y=approach(b.y,targetY,5.5,dt);b.ground=false;}
 const movingDirection=Math.abs(b.x-startX)>.035?Math.sign(b.x-startX):0;
 const bossYaw=b.action==='charge'||(['smash','pounce'].includes(b.action)&&!b.ground)?b.dir:b.action==='warn'?b.dir*(.25+.55*b.warnProgress):['rest','orbit'].includes(b.action)?movingDirection:b.dir;
 b.facing=approach(Number.isFinite(b.facing)?b.facing:0,bossYaw,13,dt);b.turnBlend=b.facing;
 if(['fire','blackhole','poison','dart'].includes(b.action)&&b.fireIndex<b.fireCount){
  b.fireClock-=dt;
  if(b.fireClock<=0){
   const i=b.fireIndex++,x=b.x+b.w/2+b.dir*b.w*.55,y=b.y+b.h*.5;
   if(b.action==='fire')bossProjectile(x,y-i*11,b.dir*(250+i*32),hard?-70+i*32:0);
   else if(b.action==='poison')bossProjectile(x,y,b.dir*(210+i*23),-210+i*88,24,24,4.2,'poison');
   else{const dx=p.x+p.w/2-x,dy=p.y+p.h*.5-y,len=Math.max(1,Math.hypot(dx,dy)),speed=b.action==='dart'?(hard?500:420):(hard?245:200),size=b.action==='dart'?16:34;
    bossProjectile(x,y,dx/len*speed,dy/len*speed+(i-b.fireCount/2)*(b.action==='dart'?15:30),size,size,b.action==='dart'?3:5,b.action);
   }
   b.fireClock=b.action==='dart'?.14:.22;b.fireFlash=1;
  }
 }
 if(['smash','pounce'].includes(b.action)&&!b.ground){
  b.x=clamp(b.x+(b.action==='pounce'?b.vx:b.dir*150*Math.min(1,b.actionAge/.12))*dt,40,world.width-b.w-40);b.vy+=1800*dt;b.y+=b.vy*dt;
  if(b.y+b.h>=520){b.y=520-b.h;b.vy=0;b.vx=0;b.ground=true;b.clock=.7;b.slamImpact=1;burst(b.x+b.w/2,520,b.kind==='destroyer'?'#bbff69':'#ff7843',36);
   if(b.action==='pounce')for(const side of [-1,1])fogHazards.push({kind:'poison',x:b.x+b.w*.5+side*85-35,y:511,w:70,h:9,life:2.4,age:0});
   else for(const dir of [-1,1])bossProjectile(b.x+b.w/2,496,dir*360,0,55,24,3,'shockwave');
  }
 }
 if(!['rest','warn'].includes(b.action)&&b.clock<=0){b.action='rest';b.actionAge=0;b.clock=b.kind==='warden'?(hard?1:1.55):hard?.85:1.2;}
 // Short grounded texture poses change the collision crown together with the
 // artwork. Their soles remain planted and their raster scale never pulses.
 if(b.ground){const poseHeight=window.BossSprites?.poseHeight?.(b);b.h=Number.isFinite(poseHeight)?poseHeight:b.baseHeight;b.y=520-b.h;}
 b.walkPhase=(b.walkPhase||0)+Math.abs(b.x-startX)*.07;
 if(overlap(p,b)){
  if(p.vy>0&&oldY+p.h<=b.y+20){
   p.y=b.y-p.h;p.vy=-730;p.autoJump=.3;p.airJump=false;p.takeoff=1;
   if(b.inv<=0){b.hp--;b.inv=.38;b.recoil=1;burst(b.x+b.w/2,b.y,'#ffeab7',24);tone(240,.18);notify(`HEAD STOMP ${b.maxHp-b.hp} / ${b.maxHp}${b.hp>0?` · ${b.hp} TO GO`:''}`);if(b.hp<=0)bossDefeated();}
  }else hurt();
 }
}
