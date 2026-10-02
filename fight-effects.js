'use strict';
// The final fighter keeps the Destroyer's authored chitin, eye-tendrils and
// jade eyes. These effects reveal that real sprite as the old shell breaks.
window.FightEffects=(()=>{
 const cfg=window.MonsterFightManifest,texture=new Image();let ready=false;
 const clips=cfg?.frames.map(f=>{const p=new Path2D();f.clip.forEach(([x,y],i)=>{x-=f.anchor[0];y-=f.anchor[1];if(i)p.lineTo(x,y);else p.moveTo(x,y);});p.closePath();return p;})||[];
 const loadingPromise=new Promise(resolve=>{texture.onload=()=>{ready=texture.naturalWidth>0;resolve(ready);};texture.onerror=()=>resolve(false);if(cfg)texture.src=cfg.src;else resolve(false);});
 const limit=t=>Math.max(0,Math.min(1,t)),smooth=t=>{t=limit(t);return t*t*(3-2*t);};
 function frame(i,x,foot,height,face,alpha=1){if(!ready||alpha<=0)return;const f=cfg.frames[i],[sx,sy,sw,sh]=f.rect,[ax,ay]=f.anchor;ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,foot);ctx.scale(face*height/cfg.commonHeight,height/cfg.commonHeight);ctx.clip(clips[i]);ctx.drawImage(texture,sx,sy,sw,sh,sx-ax,sy-ay,sw,sh);ctx.restore();}
 function halo(x,y,r,color){const g=ctx.createRadialGradient(x,y,1,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#87e75e00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 function drawTransformation(b,progress){
  if(!b)return;const p=limit(progress),x=b.x+b.w*.5,foot=b.y+b.h,height=Math.max(152,b.baseHeight||b.h)*1.27,burst=Math.sin(Math.PI*p),reveal=smooth((p-.16)/.64),face=(b.facing||b.dir||-1)<0?-1:1;
  ctx.save();halo(x,foot-height*.56,height*(.6+burst*.4),`rgba(174,249,101,${.14+burst*.29})`);
  // Broken chitin shards follow separate outward arcs; they never resemble
  // an attack or harm the player during the cinematic.
  const shell=smooth(p/.64);for(let i=0;i<14;i++){const a=i*Math.PI*2/14+.17*(i%3),spread=height*(.14+shell*(.65+i%3*.07)),xx=x+Math.cos(a)*spread,yy=foot-height*.47+Math.sin(a)*spread*.64-shell*height*.32+shell*shell*height*.34;
   ctx.save();ctx.translate(xx,yy);ctx.rotate(a+shell*(i%2?3:-3));ctx.globalAlpha*=Math.sin(Math.PI*limit(shell))*.85;ctx.fillStyle=i%3?'#4b3459':'#b7ee83';ctx.strokeStyle='#e7b07aa8';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-4,-6);ctx.lineTo(5,-2);ctx.lineTo(3,6);ctx.lineTo(-3,3);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  const ring=smooth((p-.03)/.46);ctx.save();ctx.translate(x,foot-height*.53);ctx.scale(1,.72);ctx.rotate(p*.65);ctx.strokeStyle=`rgba(192,253,139,${burst*.74})`;ctx.lineWidth=2.2;ctx.beginPath();ctx.arc(0,0,height*(.26+ring*.48),0,Math.PI*2);ctx.stroke();ctx.lineWidth=.7;ctx.strokeStyle=`rgba(237,221,255,${burst*.65})`;ctx.beginPath();ctx.arc(0,0,height*(.22+ring*.44),.1,Math.PI*1.95);ctx.stroke();ctx.restore();
  // Crouched guard and upright stance share a planted anchor. Their dissolve
  // reads as a creature unfolding, followed by a clear fighting silhouette.
  const stand=smooth((p-.36)/.42),size=.58+reveal*.42,lift=Math.sin(Math.PI*reveal)*height*.07;
  frame(cfg.poses.guard,x,foot-lift,height*size,face,reveal*(1-stand));
  frame(cfg.poses.idle,x,foot-lift,height*size,face,reveal*stand);
  if(p>.58){const flash=Math.max(0,1-(p-.58)/.2);halo(x+face*height*.12,foot-height*.65,height*.24,`rgba(207,255,142,${flash*.23})`);}
  ctx.restore();
 }
 function drawWeb(q,elapsed=0){const rad=q.r||q.radius||8;ctx.save();ctx.strokeStyle='#ddf7ff';ctx.lineWidth=Math.max(1,rad*.15);ctx.shadowColor='#a9e2ff';ctx.shadowBlur=5;const angle=elapsed*5;for(let i=0;i<8;i++){const a=i*Math.PI/4+angle;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x+Math.cos(a)*rad,q.y+Math.sin(a)*rad);ctx.stroke();}for(const size of [.46,.82]){ctx.beginPath();for(let i=0;i<=8;i++){const a=i*Math.PI/4+angle,x=q.x+Math.cos(a)*rad*size,y=q.y+Math.sin(a)*rad*size;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.stroke();}ctx.restore();}
 function drawShuriken(q,elapsed=0){const rad=q.r||q.radius||9;ctx.save();ctx.translate(q.x,q.y);ctx.rotate(elapsed*14+(q.age||0)*5);ctx.shadowColor='#c2ff53';ctx.shadowBlur=8;ctx.fillStyle='#8fe144';ctx.strokeStyle='#efffc2';ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,rr=i%2?rad*.28:rad;const x=Math.cos(a)*rr,y=Math.sin(a)*rr;if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(0,0,rad*.16,0,Math.PI*2);ctx.fillStyle='#295332';ctx.fill();ctx.restore();}
 return {loadingPromise,get ready(){return ready;},drawTransformation,drawWeb,drawShuriken};
})();
