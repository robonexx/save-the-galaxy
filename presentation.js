'use strict';
function drawStardust(s){
 const x=s.x+10,y=s.y+10+Math.sin(time*2.3+s.x)*2;
 glow(x,y,15,'#ffdd8d25');star(x,y,6.3,'#ffe5ab');circle(x-.7,y-1,1,'#fff9e5');
}
function drawLightShot(s){
 const x=s.x+s.w/2,y=s.y+s.h/2,dir=Math.sign(s.vx);
 const col=hero==='sun'?'#ffd187':'#cdd4ff';glow(x,y,22,hero==='sun'?'#ffd0803a':'#b9ccff3a');
 ctx.strokeStyle=col+'55';ctx.lineCap='round';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x-dir*18,y);ctx.quadraticCurveTo(x-dir*7,y+Math.sin(time*18)*2,x,y);ctx.stroke();star(x,y,s.w*.5,col);circle(x,y,2.1,'#fff6e0');
}
function drawBeacon(b){
 const color=b.active?'#c0f4d8':'#829bab';
 line(b.x,b.y,b.x,b.y-59,'#5a7c82',3);rounded(b.x-9,b.y-63,18,18,4,'#223d4c');
 if(b.active)glow(b.x,b.y-53,45,'#a4efd839');crystal(b.x,b.y-53,7,color);line(b.x-10,b.y-62,b.x,b.y-71,'#789491',2);line(b.x,b.y-71,b.x+10,b.y-62,'#789491',2);
}
function drawBossMeter(){
 const d=ModeFX.measure(),dpr=Math.min(devicePixelRatio||1,2),bw=Math.min(300,d.w-42),bx=(d.w-bw)/2,y=d.top+18;
 ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
 const color=boss.kind==='destroyer'?'#b6db73':boss.kind==='nebula'?'#ccb1f0':'#eeb36d';
 rounded(bx,y,bw,5,3,'#242235db');rounded(bx,y,bw*boss.hp/boss.maxHp,5,3,color);
 ctx.font=`${Math.min(12,d.w/33)}px system-ui`;ctx.fillStyle='#f8dcaf';ctx.textAlign='center';ctx.fillText(boss.name.toUpperCase(),d.w/2,y-7);
 const phase=bossIndex===0?`ROUND ${bossPhase}/2`:bossIndex===2?(bossPhase===1?'BREAK THE SHELL':'BREAK ITS ARMOR'):'THE VEIL';
 ctx.font='10px system-ui';ctx.fillText(`${boss.maxHp-boss.hp} / ${boss.maxHp} HEAD STOMPS · ${phase}`,d.w/2,y+20);ctx.restore();
}
function drawHeroMagic(p,type){
 const moon=type==='moon',color=moon?'#c9d9f7':'#ffdc97';
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 // A short ribbon records the real trajectory. Its tail fades before a direction change.
 const tail=(p.trail||[]).filter(q=>time-q.time<.18);
 for(let i=1;i<tail.length;i++){
  const a=tail[i-1],b=tail[i],age=clamp(1-(time-b.time)/.18,0,1);
  ctx.globalAlpha=age*age*.20;ctx.strokeStyle=color;ctx.lineWidth=2+age*4;
  ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo((a.x+b.x)*.5,(a.y+b.y)*.5,b.x,b.y);ctx.stroke();
  ctx.globalAlpha=age*age*.38;ctx.lineWidth=.7+age*.8;ctx.stroke();
 }
 if(tail.length>2){const q=tail[Math.max(0,tail.length-5)],age=clamp(1-(time-q.time)/.18,0,1);ctx.globalAlpha=age*.38;star(q.x,q.y+Math.sin(time*7)*4,2.1,color);}
 ctx.globalAlpha=1;
 if(p.boosting&&Math.abs(p.vx)>100)glow(p.x+p.w/2,p.y+p.h*.43,35,moon?'#b9d6f012':'#ffd68312');
 if(p.landingPulse>0){
  const t=clamp(1-p.landingPulse/.35,0,1),r=9+t*25;
  ctx.globalAlpha=(1-t)*(p.landingStrength||.4)*.42;ctx.strokeStyle=color;ctx.lineWidth=1-t*.5;
  ctx.beginPath();ctx.ellipse(p.landingX,p.landingY-.6,r,1.8+t*4,0,0,Math.PI*2);ctx.stroke();
 }
 if(p.doubleJumpPulse>0){
  const t=clamp(1-p.doubleJumpPulse/.38,0,1);
  ctx.globalAlpha=Math.sin(Math.PI*t)*.48;ctx.strokeStyle=color;ctx.lineWidth=1.2*(1-t)+.5;
  ctx.beginPath();ctx.ellipse(p.doubleJumpX,p.doubleJumpY,12+t*29,5+t*10,-.16,0,Math.PI*2);ctx.stroke();
  for(let j=0;j<5;j++){const a=j*Math.PI*2/5;star(p.doubleJumpX+Math.cos(a)*(12+t*32),p.doubleJumpY+Math.sin(a)*(7+t*17),2.5*(1-t)+.5,color);}
 }
 ctx.restore();
}
// Start choices only after their complete texture atlases have decoded.
const heroChoices=[...document.querySelectorAll('[data-hero]')];
heroChoices.forEach(button=>button.disabled=true);
Promise.all([HeroSprites.loadingPromise,window.BossSprites?.loadingPromise??Promise.resolve({ready:true}),window.FightMode?.loadingPromise??Promise.resolve(true)]).then(results=>{
 if(results.every(result=>result!==false&&result?.ready!==false)){
  portraits();heroChoices.forEach(button=>button.disabled=false);
 }else{
  $('#message').textContent='Character artwork could not load. Keep the assets folder beside index.html and reload the game.';
 }
});
