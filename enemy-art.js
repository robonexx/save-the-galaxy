'use strict';
// Jointed creatures share the illustrated world's light, while their bodies
// remain readable at the game's actual collision size. Render only: no physics.
(() => {
 const TAU = Math.PI * 2;
 const sat = n => Math.max(0, Math.min(1, n));
 const ease = n => { n = sat(n); return n * n * (3 - 2 * n); };
 const mix = (a, b, n) => a + (b - a) * n;
 // The manifest can be supplied before this script or after generated assets
 // have arrived. Headless physics tests have no Image constructor and resolve
 // immediately; the procedural profile renderer remains their safe fallback.
 const bossSpriteRecords = new Map();
 let bossSpriteLoading = Promise.resolve(false);
 function loadBossTexture(record) {
  return new Promise(resolve=>{
   const config=record.config;
   if(typeof Image==='undefined' && !config.image){record.error='headless';resolve(false);return;}
   const img=config.image || new Image();record.image=img;
   const done=()=>{record.ready=(img.naturalWidth || img.width || 0)>0;resolve(record.ready);};
   if(config.image && (img.complete || typeof img.complete==='undefined') && (img.naturalWidth || img.width)){done();return;}
   img.onload=done;img.onerror=()=>{record.error='load';resolve(false);};
   if(!config.image)img.src=config.src;
  });
 }
 function bossActionTexture(record,b) {
  const named=record.config.actions?.[b?.action || 'rest']?.texture;
  return named && record.textures?.[named] ? record.textures[named] : record;
 }
 const bossSpriteAPI = {
  get ready() { return bossSpriteRecords.size > 0 && [...bossSpriteRecords.values()].every(r => r.ready && Object.values(r.textures || {}).every(t=>t.ready)); },
  get loadingPromise() { return bossSpriteLoading; },
  isReady(kind) { const r=bossSpriteRecords.get(kind);return !!r?.ready && Object.values(r.textures || {}).every(t=>t.ready); },
  get(kind) { const r = bossSpriteRecords.get(kind); return bossSpriteAPI.isReady(kind) ? r : null; },
  poseFrame(b) { const r=bossSpriteRecords.get(b?.kind || 'warden');return r ? selectedBossFrame(r,b) : 0; },
  poseHeight(b) {
   let r=bossSpriteRecords.get(b?.kind || 'warden');
   if(!r)return b?.baseHeight || b?.h || 130;
   const index=selectedBossFrame(r,b);r=bossActionTexture(r,b);
   const f=r.config.frames?.[index],a=f?.anchor;
   if(!a || !Number.isFinite(f.groundFootY))return r.config.targetHeight || b.baseHeight || b.h;
   const scale=((r.config.targetHeight || b.baseHeight || b.h)-3)/(r.config.commonSpan || a.footY-a.headY);
   return Math.max(50,3+(f.groundFootY-a.headY)*scale);
  },
  load(manifest) {
   bossSpriteRecords.clear();
   const entries = Object.entries(manifest?.bosses || manifest || {}).filter(([,config]) => config && (config.src || config.image));
   bossSpriteLoading = Promise.all(entries.map(async ([kind,config]) => {
    const record={kind,config,image:null,ready:false,error:null,textures:{}};bossSpriteRecords.set(kind,record);
    const mainLoad=loadBossTexture(record),loads=[mainLoad];
    for(const [name,extra] of Object.entries(config.textures || {})){
     const texture={kind,config:{targetHeight:config.targetHeight,...extra},image:null,ready:false,error:null};record.textures[name]=texture;loads.push(loadBossTexture(texture));
    }
    record.ready=(await Promise.all(loads)).every(Boolean);return record.ready;
   })).then(() => bossSpriteAPI.ready);
   return bossSpriteLoading;
  },
 };
 window.BossSprites = bossSpriteAPI;
 if (window.BossSpriteManifest) bossSpriteAPI.load(window.BossSpriteManifest);
 const bossColors = {
  warden: {bright:'#ffe1a2',light:'#ffae61',glow:'#ff8b3a45',ink:'#eac090'},
  nebula: {bright:'#f5e5ff',light:'#dba6ff',glow:'#bd68ff45',ink:'#bd9aea'},
  destroyer: {bright:'#e8ffae',light:'#b7f458',glow:'#8de52a45',ink:'#a9d478'},
 };
 function rasterFrame(record, index) {
  const c = record.config, frame = c.frames?.[index];
  const cols = c.cols || 4, rows = c.rows || 2;
  const iw = record.image.naturalWidth || record.image.width, ih = record.image.naturalHeight || record.image.height;
  const rect = frame?.rect || [index % cols * iw / cols, Math.floor(index / cols) * ih / rows, iw / cols, ih / rows];
  const anchor = {...(c.anchor || {}), ...(frame?.anchor || {})};
  // Anchors are relative to their source rectangle. Only metadata establishes
  // the vulnerable crown: alpha bounds would incorrectly count cosmetic horns.
  return {rect,clip:frame?.clip,anchor:{x:anchor.x ?? rect[2] / 2,headY:anchor.headY ?? rect[3] * .2,footY:anchor.footY ?? rect[3] * .94}};
 }
 function actionFrames(record, action, view, fallback) {
  let frames = record.config.actions?.[action];
  if (frames && !Array.isArray(frames) && typeof frames === 'object') frames = frames[view] ?? frames.frames;
  if (typeof frames === 'number') return [frames];
  return Array.isArray(frames) && frames.length ? frames : fallback;
 }
 function frameAt(frames, phase) { return frames[Math.floor(Math.max(0, phase)) % frames.length]; }
 function selectedBossFrame(record,b) {
  const action=b.action || 'rest',age=b.actionAge || 0;
  if(action==='charge')return frameAt(actionFrames(record,'charge','profile',[2,3]),(b.walkPhase ?? age*8)/Math.PI);
  if(action==='warn'){
   const frames=actionFrames(record,'warn_'+b.next,'profile',actionFrames(record,'warn','profile',[5]));
   return frames[Math.min(frames.length-1,Math.floor((b.warnProgress || 0)*frames.length))];
  }
  if(action==='smash')return frameAt(actionFrames(record,b.ground?'land':'air','profile',b.ground?[7]:[6]),age*5);
  if(action==='rest'||action==='idle'){
   if(Math.abs(b.facing || 0)<.48)return frameAt(actionFrames(record,'rest','front',[0]),(b.motionPhase || 0)*.7);
   const views=record.config.actions?.rest;
   return frameAt(views?.profile?actionFrames(record,'rest','profile',[1]):actionFrames(record,'profile','profile',[1]),(b.motionPhase || 0)*.7);
  }
  const defaults={fire:[4],blackhole:[4],mist:[7],poison:[4],dart:[7],tentacle:[6]};
  return frameAt(actionFrames(record,action,'profile',defaults[action] || [4]),age*7);
 }
 function paintBossFrame(record,index,b,p,mirror,alpha=1) {
  if(alpha < .003)return;
  const {rect,anchor,clip} = rasterFrame(record,index), [sx,sy,sw,sh] = rect;
  const span = Math.max(1,record.config.commonSpan || anchor.footY-anchor.headY);
  const scale = ((record.config.targetHeight || b.h)-3) / span;
  const top = b.y+3, recoil = sat(b.recoil || 0);
  ctx.save();ctx.globalAlpha *= alpha * (b.inv > 0 ? .79 + Math.sin(p.phase * 37) * .14 : 1);
  ctx.translate(p.x,top);ctx.scale(mirror*scale,scale);
  // Head remains anchored while ribs and cloak breathe by less than 2 pixels.
  const breathe=1 + Math.sin(p.phase * 2.25) * .006 - recoil * .018;
  ctx.scale(1 + recoil * .016,breathe);
  if(clip?.length){ctx.beginPath();for(let i=0;i<clip.length;i++){const [cx,cy]=clip[i];if(i)ctx.lineTo(cx-anchor.x,cy-anchor.headY);else ctx.moveTo(cx-anchor.x,cy-anchor.headY);}ctx.closePath();ctx.clip();}
  ctx.drawImage(record.image,sx,sy,sw,sh,-anchor.x,-anchor.headY,sw,sh);
  ctx.restore();
 }
 function drawBossRaster(b,p) {
  const record=bossSpriteAPI.get(b.kind || 'warden');if(!record)return false;
  const texture=bossActionTexture(record,b);
  const yaw=Math.max(-1,Math.min(1,b.facing ?? b.turnBlend ?? (b.action==='rest'?0:p.dir)));
  const facing=yaw < -.025 ? -1 : yaw > .025 ? 1 : p.dir;
  const mirror=facing / (record.config.nativeFacing || 1), action=b.action || 'rest', age=b.actionAge || 0;
  let frames,index,framePhase=age*8;
  if(action==='charge') {
   frames=actionFrames(record,'charge','profile',[2,3]);framePhase=(b.walkPhase ?? age*8)/Math.PI;index=frameAt(frames,framePhase);
  } else if(action==='warn') {
   frames=actionFrames(record,'warn_'+b.next,'profile',actionFrames(record,'warn','profile',[5]));
   index=frames[Math.min(frames.length-1,Math.floor((b.warnProgress || 0)*frames.length))];
  } else if(action==='smash') {
   const state=b.ground || p.impact>.04?'land':'air';frames=actionFrames(record,state,'profile',state==='land'?[7]:[6]);index=frameAt(frames,age*5);
  } else if(action==='rest' || action==='idle') {
   const front=actionFrames(record,'rest','front',[0]);
   const idleViews=record.config.actions?.rest;
   const side=idleViews?.profile ? actionFrames(record,'rest','profile',[1]) : actionFrames(record,'profile','profile',[1]);
   // A short turn dissolve bridges the genuine front and profile source poses.
   // The front is never squeezed into a synthetic side view.
   const sideAlpha=ease((Math.abs(yaw)-.12)/.36);
   paintBossFrame(record,frameAt(front,p.phase*.7),b,p,1,1-sideAlpha);
   paintBossFrame(record,frameAt(side,p.phase*.7),b,p,mirror,sideAlpha);
  } else {
   const defaults={fire:[4],blackhole:[4],mist:[7],poison:[4],dart:[7],tentacle:[6]};
   frames=actionFrames(record,action,'profile',defaults[action] || [4]);index=frameAt(frames,age*7);
  }
  if(index!==undefined)paintBossFrame(texture,index,b,p,mirror);
  const color=bossColors[b.kind] || bossColors.warden;
  if(b.inv<=0){
   const shimmer=.65+Math.sin(p.phase*3)*.15;
   ctx.save();ctx.globalAlpha*=shimmer;curve(color.bright,1.45,()=>ctx.ellipse(p.x,b.y+3,Math.min(b.w*.3,27),3.4,0,0,TAU));ctx.restore();
  }
  // A few highlights move independently of the raster, maintaining visible
  // attack energy and environmental light at the actual game scale.
  if(b.kind==='nebula')for(let i=0;i<5;i++){
   const q=p.phase*1.5+i*1.26;
   circle(p.x+Math.sin(q)*b.w*.48,b.y+b.h*.48+Math.cos(q*1.3)*b.h*.38,1+Math.sin(q*2)*.25,color.bright);
  }
  if((b.fireFlash||0)>.02)glow(p.x+p.dir*b.w*.5,b.y+b.h*.58,35,color.glow);
  return true;
 }
 const material = (x, y, r, top, mid, edge) => {
  const g = ctx.createRadialGradient(x - r * .36, y - r * .4, r * .06, x, y, r * 1.2);
  g.addColorStop(0, top); g.addColorStop(.55, mid); g.addColorStop(1, edge); return g;
 };
 function path(fill, outline, width, draw) {
  ctx.beginPath(); draw(); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (outline) { ctx.strokeStyle = outline; ctx.lineWidth = width || 1; ctx.stroke(); }
 }
 function curve(color, width, draw) {
  ctx.beginPath(); draw(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
 }
 function joint(a, k, f, shade, width) {
  curve('#172238', width + 1.6, () => { ctx.moveTo(...a); ctx.lineTo(...k); ctx.lineTo(...f); });
  curve(shade, width, () => { ctx.moveTo(...a); ctx.lineTo(...k); ctx.lineTo(...f); });
  circle(k[0], k[1], width * .62, shade);
  line(a[0], a[1] - .8, k[0], k[1] - .8, '#e4f2ed32', Math.max(.65, width * .24));
 }
 function groundAt(x, below) {
  let floor = 520;
  if (typeof terrain !== 'undefined') {
   const candidates = terrain.filter(t => x >= t.x && x <= t.x + t.w && t.y >= below - 5);
   if (candidates.length) floor = Math.min(...candidates.map(t => t.y));
  }
  return floor;
 }
 function eye(x, y, rx, ry, danger = false, gaze = 0) {
  glow(x, y, rx * 4, danger ? '#ff693744' : '#ffd69825');
  ellipse(x, y, rx, ry, '#18233a'); ellipse(x, y - .2, rx * .7, ry * .73, danger ? '#ffcf79' : '#ffe7b1');
  ellipse(x + .25 + gaze * rx * .18, y + .1, rx * .25, ry * .47, '#653651'); circle(x - .5, y - ry * .35, rx * .24, '#fffbea');
 }
 function crawler(e, phase, facing) {
  const walk = (e.walkPhase ?? time * 2.5) * 2.8;
  const direction = (e.vx ?? e.dir ?? 1) < 0 ? -1 : 1;
  // Alternating tripods: planted feet hold still while the opposite set lifts.
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
   const p = walk + i * 2.1 + (side < 0 ? Math.PI : 0);
   const stride = Math.sin(p) * 7.2 * direction, lift = Math.max(0, Math.cos(p)) * 4.5;
   const a = [side * (7 + i * 2), -1 + i * 3];
   const k = [side * (15 + i * 2) + stride * .5, 4 + i * 2 - lift * .45];
   const f = [side * (20 + i) + stride, 16 - lift];
   joint(a, k, f, side < 0 ? '#334256' : '#546477', 2.7);
  }
  ctx.save(); ctx.translate(0, Math.sin(walk * 2) * .6); ctx.scale(facing, 1);
  ellipse(-3, -1, 16, 12, material(-3, -1, 17, '#b7e9df', '#4b9c9e', '#244d68'));
  path(material(-3, -5, 16, '#c3f1df', '#74bfc0', '#2d5f77'), '#203b54', .9, () => {
   ctx.moveTo(-18, 0); ctx.bezierCurveTo(-20, -16, 12, -17, 12, -2); ctx.quadraticCurveTo(-2, 10, -18, 0);
  });
  curve('#223f5c', 1.15, () => { ctx.moveTo(-3, -12); ctx.quadraticCurveTo(-1, -4, -2, 6); });
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) ellipse(-3 + side * (5 + i * .3), -8 + i * 4, 2.1, 1.3, '#bfe4cb80');
  curve('#dcffe1a8', 1.25, () => { ctx.moveTo(-16, -3); ctx.quadraticCurveTo(-15, -12, -5, -12); });
  ellipse(-8, -8, 4, 1.25, '#eeffed94');
  ellipse(12, -1, 8, 8, material(12, -1, 9, '#92738c', '#485167', '#242d47'));
  eye(16, -3, 2.15, 2.6, false, 1); eye(16, 2, 2.05, 2.5, false, 1);
  for (const side of [-1, 1]) {
   const sway = Math.sin(phase * 3 + side) * 2;
   curve('#ab7b9e', 1.25, () => { ctx.moveTo(13, -7); ctx.quadraticCurveTo(19, -12, 22 + sway, -12 + side * 3); });
   circle(22 + sway, -12 + side * 3, 1.35, '#f4b3ad');
  }
  ctx.restore();
 }
 function hopper(e, phase) {
  const wind = sat(e.anticipation ?? (e.ground ? ( .32 - e.clock) / .32 : 0));
  const land = sat(e.landSquash || 0), air = e.ground ? 0 : Math.min(1, Math.abs(e.vy || 0) / 430);
  const squat = Math.max(wind * .22, land * .28), stretch = e.vy < 0 ? air * .12 : 0;
  const sy = 1 - squat + stretch, sx = 1 + squat * .65 - stretch * .35;
  const feetY = 16, tuck = e.ground ? wind * 2 : 5 + air * 4;
  for (const side of [-1, 1]) {
   const hip = [side * 9, 7], knee = [side * (15 - tuck * .35), 11 - tuck * .3];
   const toe = [side * (19 - tuck * .5), feetY - tuck];
   ellipse(knee[0], knee[1], 6.4, 7.7 - tuck * .3, material(knee[0], knee[1], 8, '#99b299', '#547675', '#304a5e'));
   joint(hip, knee, toe, '#64877e', 3.9); ellipse(toe[0] + side * 2, toe[1] + 1, 5.3, 2, '#8db29e');
  }
  ctx.save(); ctx.translate(0, feetY); ctx.scale(sx, sy); ctx.translate(0, -feetY);
  ellipse(0, 1.5, 12.5, 13.3, material(0, 1, 15, '#efd3bd', '#bf9ea0', '#6e6478'));
  ellipse(0, 6, 8, 6, '#f2d9bb4f');
  // Cap bounces a fraction behind the body, as if it has a soft edge.
  const hatBob = Math.sin(phase * 2.3) * .35;
  path(material(0, -8, 23, '#ffd5a1', '#c5897e', '#744d69'), '#663e5d', .8, () => {
   ctx.moveTo(-21, -5 + hatBob); ctx.bezierCurveTo(-18, -20 + hatBob, 16, -21 + hatBob, 21, -5 + hatBob);
   ctx.quadraticCurveTo(0, 1, -21, -5 + hatBob);
  });
  ellipse(0, -4.2, 18, 2.1, '#52394e88');
  for (const [x, y, r] of [[-10, -10, 3.3], [1, -14, 3.8], [12, -9, 2.9]]) ellipse(x, y + hatBob, r, r * .57, '#ffe4b8d9');
  curve('#fff0c5b0', 1, () => { ctx.moveTo(-15, -10); ctx.quadraticCurveTo(-7, -17, 5, -16); });
  const gaze = e.facing ?? e.dir ?? 1;
  for (const x of [-5, 5]) eye(x + gaze * .5, 2, 2.9, 3.6, false, gaze);
  curve('#6c465c', 1.1, () => { ctx.moveTo(-3, 9); ctx.quadraticCurveTo(0, e.vy < 0 ? 7 : 10, 3, 9); });
  ctx.restore();
 }
 function bat(e, phase, facing) {
  const dive = sat(e.dive || 0), beat = Math.sin(phase * 12);
  const fold = dive * .45, spread = mix(1, .63, fold);
  ctx.save(); ctx.rotate(Math.max(-.32, Math.min(.32, (e.flightVX || 0) * .002 + facing * dive * .2)));
  for (const side of [-1, 1]) {
   const root = [side * 4, -5], elbow = [side * (15 * spread), -11 + beat * 9], tip = [side * (31 * spread), -4 + beat * 12];
   const lower = [side * 12 * spread, 12 + beat * 2];
   path(material(side * 12, -5, 30, '#c09cc3', '#855f9c', '#342b55'), '#473452', .8, () => {
    ctx.moveTo(...root); ctx.quadraticCurveTo(side * 8, -15 + beat * 5, ...elbow);
    ctx.quadraticCurveTo(side * 29 * spread, -20 + beat * 11, ...tip);
    ctx.quadraticCurveTo(side * 24 * spread, -1 + beat * 5, side * 23 * spread, 8 + beat * 5);
    ctx.quadraticCurveTo(side * 17 * spread, 2 + beat * 3, ...lower);
    ctx.quadraticCurveTo(side * 8, 7, side * 4, 8);
   });
   curve('#d5afc180', 1, () => { ctx.moveTo(...root); ctx.lineTo(...elbow); ctx.lineTo(...tip); });
   curve('#dc9db171', .9, () => { ctx.moveTo(...root); ctx.quadraticCurveTo(side * 16 * spread, 0, side * 23 * spread, 8 + beat * 5); });
   curve('#cb92ad70', .9, () => { ctx.moveTo(...root); ctx.lineTo(...lower); });
   circle(elbow[0], elbow[1], 1.2, '#d5b6c7');
  }
  ellipse(0, 0, 7, 11.5, material(0, 0, 13, '#a187ab', '#574a72', '#262b49'));
  path('#655175', '#33283f', .7, () => { ctx.moveTo(-7, -5); ctx.lineTo(-7, -15); ctx.lineTo(-1, -10); ctx.lineTo(6, -15); ctx.lineTo(7, -5); });
  ellipse(0, 7, 4, 3, '#bc90a659');
  for (const x of [-3, 3]) { eye(x, -3, 2.1, 2.5, dive > .2, e.facing ?? e.dir ?? 1); path('#f3ddc4', null, 0, () => { ctx.moveTo(x - .5, 3); ctx.lineTo(x + .7, 3); ctx.lineTo(x, 6); }); }
  ctx.restore();
 }
 function drone(e, phase) {
  const charge = sat(e.anticipation ?? ((.4 - e.clock) / .4));
  const recoil = sat(e.attackFlash || 0), tilt = Math.max(-.2, Math.min(.2, (e.flightVX || 0) * .0015));
  ctx.save(); ctx.rotate(tilt); ctx.translate(0, Math.sin(phase * 2.2) * .6 - recoil * 2);
  curve('#8ae8ea70', 1.1, () => { ctx.ellipse(0, 0, 26, 10, -.3 + Math.sin(phase) * .08, 0, TAU); });
  ellipse(0, 6, 22, 6, material(0, 4, 23, '#bfdfed', '#667e9e', '#263c59'));
  ellipse(0, 0, 19, 9, material(0, -2, 21, '#dbf3f2', '#7590ae', '#364462'));
  path(material(-2, -8, 14, '#f0f8f4', '#a8bdd3', '#4a6a8b'), '#263e5f', .7, () => { ctx.moveTo(-12, -3); ctx.bezierCurveTo(-13, -19, 12, -19, 12, -3); ctx.quadraticCurveTo(0, 2, -12, -3); });
  ellipse(-4, -11, 5, 1.8, '#ffffffad'); curve('#caffef9c', .7, () => { ctx.moveTo(-15, -2); ctx.quadraticCurveTo(0, 2, 16, -2); });
  const scan = Math.sin(phase * 3) * 2;
  rounded(-7, -5, 14, 4, 2, '#203548'); rounded(-5 + scan, -4.2, 7, 2.4, 1, charge > .2 ? '#ffbd81' : '#a9f5e3');
  for (const side of [-1, 1]) { circle(side * 17, 4, 2, '#8cd8df'); circle(side * 17 - .5, 3.5, .65, '#fcfff0'); }
  line(0, 6, 0, 12, '#607d94', 3); ellipse(0, 12, 4, 2.6, '#37516c');
  glow(0, 12, 11 + charge * 14, charge > .2 ? '#ff824b66' : '#7df7ed33');
  circle(0, 12, 1.7 + charge, charge > .2 ? '#ffe0a0' : '#b8fff0');
  if (charge > .2) for (let i = 0; i < 3; i++) { const a = phase * 8 + i * TAU / 3; circle(Math.cos(a) * (8 - charge * 5), 12 + Math.sin(a) * 3, .9, '#ffd5a2'); }
  ctx.restore();
 }
 function turret(e, phase, facing) {
  const charge = sat(e.anticipation ?? ((.35 - e.clock) / .35)), flash = sat(e.attackFlash || 0);
  ellipse(0, 13, 19, 4, '#263248');
  path(material(-3, -1, 26, '#c7ab98', '#857d85', '#414758'), '#353649', 1, () => {
   ctx.moveTo(-17, 16); ctx.lineTo(-18, -3); ctx.lineTo(-15, -14); ctx.lineTo(-8, -7); ctx.lineTo(-1, -17); ctx.lineTo(6, -8); ctx.lineTo(14, -13); ctx.lineTo(18, -2); ctx.lineTo(16, 16);
  });
  curve('#e8c39b70', 1, () => { ctx.moveTo(-15, -2); ctx.lineTo(-13, -10); ctx.lineTo(-8, -3); });
  curve('#253444', 2, () => { ctx.moveTo(-3, -14); ctx.lineTo(-6, -6); ctx.lineTo(-1, -1); ctx.lineTo(-5, 7); ctx.lineTo(-2, 16); });
  const crack = charge > .1 ? '#ffbb77' : '#c39778';
  curve(crack, .95 + charge, () => { ctx.moveTo(-4, -6); ctx.lineTo(-1, -1); ctx.lineTo(-5, 7); });
  glow(-2, 0, 10 + charge * 10, '#ff94552f'); circle(1, -1, 3.5, material(1, -1, 4, '#ffe0b0', '#d9957c', '#734854'));
  ctx.save(); ctx.translate(2, 2); ctx.scale(facing, 1); ctx.translate(-flash * 3, 0);
  path(material(11, 1, 19, '#be9e9d', '#856d80', '#424258'), '#363147', .8, () => { ctx.moveTo(0, -3); ctx.lineTo(23, -2); ctx.lineTo(23, 5); ctx.lineTo(0, 6); });
  ellipse(23, 1.5, 3.2, 4.2, '#293549'); ellipse(23.7, 1.5, 1.8, 2.8, charge > .2 ? '#ffdc9d' : '#81667b');
  glow(25, 1.5, 9 + charge * 12 + flash * 13, '#ffae6755');
  if (flash > .05) star(26, 1.5, 6 + flash * 4, '#fff3cbd9');
  ctx.restore();
  if (e.hp === 1) curve('#efc1a9', 1.1, () => { ctx.moveTo(8, 9); ctx.lineTo(3, 13); ctx.lineTo(7, 15); });
 }
 function wisp(e, phase, facing) {
  const turn = facing * .9, bob = Math.sin(phase * 2.2) * .75;
  glow(0, bob, 30, '#94edf531');
  // Tails use staggered phase, following the head rather than translating rigidly.
  for (let i = 0; i < 4; i++) {
   const start = i * 4 - 6, lag = phase * 3 - i * .55;
   const endX = Math.sin(lag) * 9 - turn * (9 + i * 2), endY = 23 + i * 2 + Math.cos(lag) * 3;
   curve(i % 2 ? '#99d7e679' : '#75a7c68c', 3.1 - i * .45, () => { ctx.moveTo(start, 6 + bob); ctx.bezierCurveTo(start - turn * 7, 13 + bob, Math.sin(lag - .6) * 8 - turn * 7, 17, endX, endY); });
   circle(endX, endY, .7, '#d3f0e59f');
  }
  path(material(-2, -2, 22, '#dcfbe8', '#79bcca', '#465d98'), '#44678770', .8, () => {
   ctx.moveTo(-13, 8 + bob); ctx.bezierCurveTo(-17, -17 + bob, 9, -24 + bob, 14, -3 + bob); ctx.bezierCurveTo(21, 16 + bob, -4, 16 + bob, -13, 8 + bob);
  });
  curve('#d7ffed9b', 1, () => { ctx.moveTo(-11, 1 + bob); ctx.quadraticCurveTo(-15, -13, -3, -16 + bob); });
  ellipse(-4, -9 + bob, 4.3, 2, '#f8ffe857');
  for (const x of [-5, 5]) eye(x + facing * .5, -2 + bob, 2.25, 3.25, false, facing);
  ellipse(facing, 6 + bob, 2.2, 2.9, '#395476');
 }
 window.drawEnemy = function(e) {
  const x = e.x + e.w / 2, y = e.y + e.h / 2;
  const phase = e.motionPhase ?? (time + e.home * .013);
  const turn = e.turnBlend ?? e.facing ?? e.dir ?? 1;
  // Turning narrows the creature briefly instead of popping its silhouette.
  const facing = (turn < 0 ? -1 : 1) * (.72 + Math.abs(turn) * .28);
  const floor = groundAt(x, e.y + e.h), height = Math.max(0, floor - (e.y + e.h));
  ellipse(x, floor + 1.5, Math.max(8, 18 - height * .012), Math.max(1.2, 3 - height * .004), `rgba(7,16,36,${Math.max(.07, .29 - height * .0007)})`);
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (e.recoil) { ctx.rotate(Math.sin(phase * 33) * e.recoil * .08); glow(0, 0, 24, '#ffdba545'); }
  if (e.type === 'crawler') crawler(e, phase, facing);
  else if (e.type === 'hopper') hopper(e, phase);
  else if (e.type === 'bat') bat(e, phase, facing);
  else if (e.type === 'drone') drone(e, phase);
  else if (e.type === 'turret') turret(e, phase, facing);
  else wisp(e, phase, facing);
  ctx.restore();
 };
 function bossHorn(side, tilt) {
  const shade = material(side * 34, -140, 34, '#6c8693', '#293446', '#101727');
  path(shade, '#101728', 1.4, () => {
   ctx.moveTo(side * 18, -122); ctx.bezierCurveTo(side * 49, -137, side * 57, -150, side * 43, -174);
   ctx.bezierCurveTo(side * 76, -151, side * 64, -122, side * 32, -108);
  });
  for (let j = 0; j < 6; j++) curve('#b5a18b60', 1.2, () => {
   ctx.moveTo(side * (40 + Math.sin(j * .5) * 8), -126 - j * 5.2);
   ctx.quadraticCurveTo(side * (47 + Math.sin(j * .5) * 6), -130 - j * 5.1, side * (53 + Math.sin(j * .5) * 2), -129 - j * 5.1);
  });
  curve('#aaa6a086', .85, () => { ctx.moveTo(side * 34, -117); ctx.bezierCurveTo(side * 59, -137, side * 52, -155, side * 44, -169); });
  line(side * 46, -169, side * 50, -160, '#ff9c54', 3.1); glow(side * 46, -166, 20, '#ff6e3a54');
 }
 function bossHand(x, y, angle, heat) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
  ellipse(0, 0, 12.2, 11, material(-2, -3, 15, '#9d8885', '#493542', '#1b1b30'));
  ellipse(0, 4, 10, 5.5, '#2d2538');
  // Rounded knuckles and hooked claws retain the reference's organic hands.
  for (let i = -1; i <= 1; i++) {
   ellipse(i * 5.8, -2, 3.1, 6.3, material(i * 5.8 - .8, -4, 7, '#b49a8c', '#615064', '#322939'));
   curve('#d2b9a172', .75, () => { ctx.moveTo(i * 5.8 - 2, -4); ctx.quadraticCurveTo(i * 5.8, -6, i * 5.8 + 1.6, -4); });
   path('#dcc29e', '#42313f', .45, () => { ctx.moveTo(i * 5.8 - 1.4, 3); ctx.lineTo(i * 5.8 + 1.8, 3.5); ctx.quadraticCurveTo(i * 5.8 + 3, 8, i * 5.8 + .3, 10); ctx.quadraticCurveTo(i * 5.8 + 1, 6.6, i * 5.8 - 1.4, 3); });
  }
  ellipse(-10, 1, 3.8, 5.2, '#665367');
  if (heat > 0) { glow(0, 1, 18 + heat * 8, '#f995493f'); circle(-4, -2, 1.5, '#ffd49b'); }
  ctx.restore();
 }

 function bossProjectedBody(b, pose) {
  const {x, foot, dir, phase, warn, fire, charge, airborne, impact, swing, step, lift, lean, squash, breathing, windAttack} = pose;
  const yaw = Math.max(-1, Math.min(1, Number.isFinite(b.facing) ? b.facing : ((charge > .05 || airborne) ? dir : 0)));
  const p = Math.abs(yaw), sign = yaw < 0 ? -1 : 1;
  const g = (front, profile) => mix(front, profile, p);
  const headY = -b.h + 31;
  const metal = material(-8, -77, 74, '#89a9b5', '#34485f', '#142338');
  const dark = material(0, -40, 58, '#55637b', '#263247', '#111b2f');
  ctx.save(); ctx.translate(x, foot); ctx.scale(sign, 1); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (b.inv > 0 && Math.floor(time * 18) % 2) ctx.globalAlpha = .65;
  glow(0, -70, 94, warn > 0 ? '#f68a4031' : '#f0743020');
  // Mantle changes from two frontal hems to one trailing mass in a side view.
  const cape = Math.sin(phase * 2.3) * 3 + charge * 8;
  path(material(-9, -66, 59, '#4d445a', '#252335', '#111928'), '#171b2b', .8, () => {
   ctx.moveTo(g(-28,-17), -84); ctx.quadraticCurveTo(g(-46,-34),-67,g(-42-cape,-33-cape),-24);
   ctx.lineTo(g(-31-cape*.4,-24-cape*.4),-28); ctx.lineTo(g(-27-cape*.3,-26-cape*.3),-17); ctx.lineTo(g(-15,-9),-34);
   ctx.lineTo(g(20,12),-33); ctx.lineTo(g(30+cape*.4,14),-20); ctx.lineTo(g(33+cape*.3,16),-30); ctx.lineTo(g(43+cape,17),-25);
   ctx.quadraticCurveTo(g(45,22),-64,g(28,16),-84);
  });
  curve('#96716b35',1,()=>{ctx.moveTo(g(-28,-18),-77);ctx.quadraticCurveTo(g(-35,-28),-55,g(-34-cape*.45,-26-cape*.5),-32);});
  for (const side of [-1,1]) {
   glow(g(side*23,side*8),-6,25,'#e66d3830');
   const fx=g(side*23,side*8),h=8+Math.sin(phase*7+side)*3;
   path('#ff91404c',null,0,()=>{ctx.moveTo(fx-3,-4);ctx.bezierCurveTo(fx-6,-9,fx+4,-9-h,fx,-9-h);ctx.bezierCurveTo(fx+5,-6-h,fx+5,-6,fx+3,-4);});
  }
  function leg(side, far) {
   const fp=swing+(side<0?Math.PI:0),stride=Math.sin(fp)*charge*17;
   const lifted=Math.max(0,Math.cos(fp))*charge*9,tuck=airborne?7*(1-sat((b.vy||0)/700)):0;
   const hx=g(side*15,far?-3:3),kx=g(side*18,far?-4:3)+stride*.4,ax=g(side*21,far?-6:4)+stride;
   const knee=[kx,-24-tuck-lifted*.35],ankle=[ax,-8-lifted-tuck];
   ctx.save(); if(far)ctx.globalAlpha*=g(1,.68);
   joint([hx,-41],knee,ankle,'#394c65',g(17,far?13:17));
   ellipse(knee[0],knee[1],g(11,far?8.5:11),8,metal);
   for(let j=0;j<2;j++)line(knee[0]-8,knee[1]-2+j*4,knee[0]+8,knee[1]-1+j*4,'#a1adb162',1.2);
   ctx.translate(ankle[0],ankle[1]);ctx.rotate(Math.sin(fp)*charge*.1);
   ellipse(g(2,4),2,g(19,far?15:19),9,dark);
   path(metal,'#1c2b3e',1,()=>{ctx.moveTo(g(-17,-12),2);ctx.quadraticCurveTo(g(-18,-12),-9,g(-2,1),-10);ctx.lineTo(g(16,20),-4);ctx.lineTo(g(19,23),3);ctx.quadraticCurveTo(g(2,7),8,g(-17,-12),2);});
   curve('#c9b29b78',1,()=>{ctx.moveTo(g(-12,-8),1);ctx.lineTo(g(12,18),3);});ctx.restore();
  }
  // Anatomical far limbs are drawn behind the body and foreshortened in profile.
  leg(1,true);
  function arm(side, far) {
   const shoulder=[g(side*30,far?2:4),-77];
   const lead=far?-charge*9:charge*14;
   const elbow=[g(side*43+lead,far?-8-step*6:12+charge*5+step*6),-57-lift*.56+step*side*3];
   const hand=[g(side*(45-lift*.18)+lead*1.1,far?-12-step*9:16+charge*18+step*8),-43-lift+step*side*5-(b.fireFlash||0)*2];
   ctx.save();if(far)ctx.globalAlpha*=g(1,.64);
   joint(shoulder,elbow,hand,'#3d526c',g(16,far?12:16));
   const sx=shoulder[0];
   path(metal,'#1b2b42',.8,()=>{ctx.moveTo(sx-g(5,10),-86);ctx.lineTo(sx+g(side*13,11),-94);ctx.lineTo(sx+g(side*21,15),-78);ctx.lineTo(sx+g(side*2,-9),-68);});
   path(material(sx,-95,17,'#b6c6be','#567184','#263b53'),'#28384a',.75,()=>{ctx.moveTo(sx+g(side*6,2),-87);ctx.lineTo(sx+g(side*15,9),-105);ctx.lineTo(sx+g(side*18,10),-83);});
   line(sx-g(1,6),-83,sx+g(side*13,9),-90,'#c5d0bb78',1.1);
   ellipse(elbow[0],elbow[1],g(9,far?7:9),9,metal);
   bossHand(hand[0],hand[1],side*(lift*.014+charge*-.3),fire+warn*.5);
   ctx.restore();
  }
  ctx.save();ctx.translate(lean*40,breathing+squash*16);ctx.rotate(lean*.45);ctx.scale(1+squash*.15,1-squash);
  arm(1,true);
  path(metal,'#14253a',1.1,()=>{ctx.moveTo(g(-29,-18),-84);ctx.quadraticCurveTo(g(0,4),-94,g(29,21),-84);ctx.lineTo(g(32,23),-49);ctx.quadraticCurveTo(g(25,17),-34,g(0,3),-32);ctx.quadraticCurveTo(g(-26,-14),-34,g(-32,-18),-49);});
  for(let i=0;i<4;i++)path(i%2?'#343a4d':'#293247','#17223566',.8,()=>{
   const y=-74+i*9;ctx.moveTo(g(-27+i,-17+i*.5),y);ctx.quadraticCurveTo(g(0,8),y+9,g(27-i,21-i*.3),y);ctx.lineTo(g(24-i,19-i*.3),y+6);ctx.quadraticCurveTo(g(0,8),y+15,g(-24+i,-16+i*.5),y+6);
  });
  curve('#a7999050',1,()=>{ctx.moveTo(g(-26,-15),-74);ctx.quadraticCurveTo(g(0,8),-65,g(26,20),-74);});
  curve('#1b293f',4,()=>{ctx.moveTo(g(2,15),-82);ctx.lineTo(g(-3,10),-61);ctx.lineTo(g(5,17),-43);});
  glow(g(0,13),-65,22,'#ff8e4441');curve('#ffaf67',2.2,()=>{ctx.moveTo(g(2,15),-82);ctx.lineTo(g(-3,10),-61);ctx.lineTo(g(5,17),-43);});
  curve('#fff0bc',.85,()=>{ctx.moveTo(g(2,15),-82);ctx.lineTo(g(-3,10),-61);});
  ctx.restore();
  leg(-1,false);
  ctx.save();ctx.translate(lean*40,breathing+squash*16);ctx.rotate(lean*.45);ctx.scale(1+squash*.15,1-squash);arm(-1,false);ctx.restore();
  // Horns and ears acquire depth: the far horn is shorter and hidden behind the
  // skull, while the near horn retains its broad curved silhouette.
  for(const far of [true,false]) {
   const side=far?1:-1;ctx.save();if(far)ctx.globalAlpha*=g(1,.6);
   const bx=g(side*30,far?3:-18),tip=g(side*57,far?9:-38);
   path(metal,'#1c2b3f',.85,()=>{ctx.moveTo(bx,headY-12);ctx.lineTo(tip,headY-22);ctx.quadraticCurveTo(tip-g(side*4,3),headY-1,bx-g(side*3,0),headY-1);});
   path('#a25e53',null,0,()=>{ctx.moveTo(bx+g(side*5,-1),headY-10);ctx.lineTo(tip-g(side*7,-4),headY-17);ctx.lineTo(bx+g(side*9,-4),headY-6);});
   ctx.translate(far?p*7:-p*3,0);ctx.scale(g(1,far?.2:.65),g(1,far?.82:1));bossHorn(side,lean);ctx.restore();
  }
  // One continuous skull outline, rather than a compressed or mirrored frontal
  // head. The profile has a rounded 4px nose bridge, cheek, jaw and back of skull.
  path(material(g(-6,-10),headY-3,48,'#738898','#2c354c','#10162b'),'#121d30',1,()=>{
   ctx.moveTo(g(0,-5),headY-28);
   ctx.bezierCurveTo(g(22,11),headY-29,g(36,19),headY-21,g(39,21),headY-10);
   ctx.quadraticCurveTo(g(41,25),headY-6,g(39,24),headY-1);
   ctx.quadraticCurveTo(g(38,27),headY+5,g(30,21),headY+8);
   ctx.quadraticCurveTo(g(27,25),headY+16,g(17,15),headY+26);
   ctx.quadraticCurveTo(g(0,-3),headY+31,g(-17,-12),headY+26);
   ctx.lineTo(g(-30,-24),headY+17);ctx.quadraticCurveTo(g(-42,-30),headY+8,g(-39,-26),headY-6);
   ctx.bezierCurveTo(g(-36,-25),headY-21,g(-22,-16),headY-29,g(0,-5),headY-28);
  });
  // Crown and recessed orbital brow morph with the skull. Only the near eye
  // remains at full yaw; the far socket slides behind the nose and disappears.
  for(const far of [true,false]) {
   const side=far?-1:1,visibility=far?1-ease((p-.16)/.48):1;
   if(visibility<.01)continue;
   ctx.save();ctx.globalAlpha*=visibility;
   const ex=g(side*16,far?7:10),socketL=g(side*5,far?3:5),socketR=g(side*33,far?10:22);
   path('#0c172b',null,0,()=>{ctx.moveTo(socketL,headY);ctx.lineTo(socketR,headY-10);ctx.lineTo(socketR,headY+12);ctx.lineTo(g(side*10,far?4:7),headY+15);});
   glow(ex,headY+3,23+warn*9+fire*5,'#ff923174');
   path('#ffbd55',null,0,()=>{ctx.moveTo(g(side*6,far?3:6),headY+1);ctx.lineTo(g(side*29,far?11:22),headY-6);ctx.quadraticCurveTo(g(side*29,far?11:22),headY+10,g(side*11,far?5:8),headY+10);});
   path('#fff0b3',null,0,()=>{ctx.moveTo(g(side*10,far?4:9),headY+3);ctx.lineTo(g(side*25,far?10:20),headY-1);ctx.lineTo(g(side*23,far?9:18),headY+3);ctx.lineTo(g(side*12,far?5:9),headY+6);});
   ctx.restore();
  }
  path(material(g(-12,4),headY-15,37,'#607988','#2f4259','#13273d'),'#0e1e34',1.15,()=>{
   ctx.moveTo(g(-37,-24),headY-15);ctx.bezierCurveTo(g(-25,-10),headY-20,g(-17,3),headY-20,g(0,9),headY-6);
   ctx.bezierCurveTo(g(17,13),headY-20,g(25,18),headY-20,g(37,24),headY-15);
   ctx.quadraticCurveTo(g(28,21),headY-5,g(10,12),headY);
   ctx.lineTo(g(0,9),headY-1);ctx.lineTo(g(-10,2),headY);ctx.quadraticCurveTo(g(-28,-17),headY-5,g(-37,-24),headY-15);
  });
  curve('#acb7a15c',1,()=>{ctx.moveTo(g(-31,-20),headY-15);ctx.quadraticCurveTo(g(-19,-7),headY-18,g(-5,6),headY-7);});
  // Small nose ridge follows the skull contour, without extending its silhouette.
  if(p>.12) {ctx.save();ctx.globalAlpha*=p;path('#30435a','#1b2b42',.6,()=>{ctx.moveTo(20,headY-9);ctx.quadraticCurveTo(21,headY-3,25,headY-1);ctx.lineTo(21,headY+3);ctx.lineTo(17,headY+1);});ctx.restore();}
  for(const side of [-1,1]){
   ctx.save();if(side<0)ctx.globalAlpha*=1-p*.8;
   path(material(g(side*29,side<0?-12:16),headY+13,15,'#687884','#30394f','#151c32'),'#1c283e',.7,()=>{ctx.moveTo(g(side*36,side<0?-20:23),headY+8);ctx.quadraticCurveTo(g(side*32,side<0?-16:22),headY+24,g(side*15,side<0?-3:8),headY+28);ctx.lineTo(g(side*19,side<0?-5:10),headY+15);ctx.quadraticCurveTo(g(side*28,side<0?-12:18),headY+16,g(side*36,side<0?-20:23),headY+8);});
   curve('#d9997766',.75,()=>{ctx.moveTo(g(side*31,side<0?-15:20),headY+12);ctx.lineTo(g(side*25,side<0?-10:15),headY+20);});ctx.restore();
  }
  const mouthY=headY+20,heat=Math.max(fire,windAttack==='fire'?warn*.65:0),mouthX=g(0,18),mouthHalf=g(15,6);
  if(heat)glow(mouthX,mouthY,20+heat*12,'#ff9a575c');
  path(heat>.2?'#eaa171':'#0a1325','#101c30',.8,()=>{ctx.moveTo(mouthX-mouthHalf,mouthY-3);ctx.quadraticCurveTo(mouthX,mouthY-5,mouthX+mouthHalf,mouthY-3);ctx.lineTo(mouthX+mouthHalf-3,mouthY+4);ctx.quadraticCurveTo(mouthX,mouthY+2,mouthX-mouthHalf+3,mouthY+4);});
  for(let i=-10;i<=10;i+=5){const fx=mouthX+i*mouthHalf/15;path('#e8c6a3',null,0,()=>{ctx.moveTo(fx-1,mouthY-2.5);ctx.lineTo(fx+1.4,mouthY-2.5);ctx.lineTo(fx+.4,mouthY+(Math.abs(i)>7?3.7:1));});}
  curve('#92716965',.8,()=>{ctx.moveTo(g(-10,8),headY+26);ctx.quadraticCurveTo(g(0,13),headY+29,g(10,19),headY+26);});
  if(b.inv<=0){const shimmer=.45+Math.sin(phase*3)*.12;curve(`rgba(255,223,156,${shimmer})`,1.15,()=>ctx.ellipse(g(0,-3),-b.h+3,g(23,16),3.3,0,0,TAU));}
  ctx.restore();
 }

 window.drawBoss = function(b = boss) {
  if (!b) return;
  const x = b.x + b.w / 2, foot = b.y + b.h, phase = b.motionPhase ?? time;
  const dir = b.dir ?? -1, warn = b.action === 'warn' ? ease(b.warnProgress ?? ((.9 - b.clock) / .9)) : 0;
  const color = bossColors[b.kind] || bossColors.warden;
  const age = b.actionAge || 0, windAttack = b.action === 'warn' ? b.next : b.action;
  const charge = b.action === 'charge' ? sat(b.chargeBlend ?? ease(Math.min(age / .18, b.clock / .22))) : 0;
  const fire = b.action === 'fire' ? (1 - ease(Math.max(0, (age - 1.05) / .35))) : 0;
  const airborne = b.action === 'smash' && !b.ground, impact = sat(b.slamImpact || 0);
  const breathing = Math.sin(phase * 2.25) * .8;
  // Charge steps are tied to distance. A fast-moving body cannot have an idle
  // two-steps-per-second cycle without its planted feet visibly skating.
  const swing = (b.walkPhase ?? b.x * dir * .09) + phase * .5;
  const step = charge * Math.sin(swing);
  const descent = sat(((b.vy || 0) - 100) / 900);
  // Fists begin coming down on the descent; impact finishes the stroke instead
  // of snapping raised arms straight into the idle pose on the landing frame.
  const smashLift = airborne ? 42 * (1 - descent * .62) : 17 * Math.pow(impact, 4);
  const lift = windAttack === 'fire' ? 24 * Math.max(warn, fire) : windAttack === 'smash' ? Math.max(smashLift, 42 * warn) : 0;
  const chargeWind = b.action === 'charge' ? .055 * Math.exp(-age * 16) : 0;
  const lean = Math.max(charge * .15, chargeWind) + (windAttack === 'charge' ? warn * .055 : 0);
  const squash = impact * .12 + (windAttack === 'smash' ? warn * .04 : 0);
  const groundY = 520, altitude = Math.max(0, groundY - foot);
  ellipse(x, groundY + 1, Math.max(28, 51 - altitude * .065), Math.max(3, 6 - altitude * .008), `rgba(4,10,27,${Math.max(.08, .4 - altitude * .001)})`);
  if (airborne) {
   const pulse = .75 + Math.sin(phase * 14) * .12;
   glow(x, groundY - 1, 75, color.glow);ctx.save();ctx.globalAlpha*=.27;ellipse(x, groundY, 55 * pulse, 7, color.light);ctx.restore();
   curve(color.bright, 2, () => ctx.ellipse(x, groundY, 58 * pulse, 8, 0, 0, TAU));
   for (const side of [-1, 1]) line(x + side * 61, groundY - 4, x + side * 68, groundY + 2, color.light, 1.5);
  }
  if (impact > .03) {
   const ring = 35 + (1 - impact) * 80;
   ctx.save();ctx.globalAlpha*=impact*.75;curve(color.bright, 2, () => ctx.ellipse(x, groundY - 1, ring, 7 + ring * .02, 0, 0, TAU));ctx.restore();
  }
  const pose = {x, foot, dir, phase, warn, fire, charge, airborne, impact, swing, step, lift, lean, squash, breathing, windAttack};
  if(!drawBossRaster(b,pose))bossProjectedBody(b,pose);
  if (b.action === 'warn') {
   const tx = x, ty = b.y - 62;
   const names={fire:b.kind==='nebula'?'VOID':b.kind==='destroyer'?'VENOM':'FLAME',blackhole:'VOID',mist:'SLOWING MIST',poison:'VENOM',dart:'SHARDS',tentacle:'TENTACLES',charge:'RUSH',smash:'SMASH'};
   const label=`${names[b.next] || 'ATTACK'} ${b.next==='smash'||b.next==='mist'?'↓':dir>0?'→':'←'}`;
   ctx.font = 'bold 11px system-ui';ctx.textAlign = 'center';
   const width=Math.max(86,ctx.measureText(label).width+20);
   rounded(tx-width/2,ty-11,width,23,10,'#10233bed');ctx.fillStyle=color.bright;ctx.fillText(label,tx,ty+4);
  }
  if (charge > .05) for (let i = 0; i < 5; i++) {
   const drift = ((phase * 12 + i * .21) % 1), px = x - dir * (37 + drift * 67), py = groundY - 5 - drift * 5;
   ellipse(px, py, 5 + drift * 9, 2 + drift * 2, `rgba(209,172,133,${(1 - drift) * charge * .28})`);
  }
 };
 window.drawHostileShot = function(s) {
  const x = s.x + s.w / 2, y = s.y + s.h / 2;
  const r = Math.min(s.w, s.h) / 2, speed = Math.hypot(s.vx || 0, s.vy || 0);
  const a = Math.atan2(s.vy || 0, s.vx || 1), p = time * 16 + x * .04;
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  if(s.kind==='blackhole'){
   glow(0,0,r*3.5,'#bd59fa4c');
   ctx.save();ctx.rotate(time*2.8);
   for(let i=0;i<3;i++){
    const rr=r*(1.14+i*.21);
    curve(['#a068e74f','#e6a7ff9a','#ffffffcf'][i],i===2?1.1:2,()=>ctx.ellipse(0,0,rr,rr*.49,-.5+i*.25,.3+i,Math.PI*1.7+i));
   }
   ctx.restore();circle(0,0,r*.81,'#0a0517');curve('#dfb3ffc9',1.35,()=>ctx.arc(0,0,r*.85,0,TAU));
   circle(-r*.26,-r*.27,r*.1,'#f7e8ff');
  }else if(s.kind==='mist'){
   ctx.rotate(-a);const pulse=.8+Math.sin(time*2+s.x*.013)*.1;
   for(let i=0;i<7;i++){
    const q=i*.9+time*.65,xx=(i/6-.5)*s.w*.82,yy=Math.sin(q)*s.h*.18;
    ellipse(xx,yy,s.w*.2*pulse,s.h*(.31+Math.cos(q)*.04),i%2?'#bea3fb24':'#796dca38');
    curve('#d8b6f74b',1,()=>{ctx.moveTo(xx-s.w*.12,yy);ctx.bezierCurveTo(xx-s.w*.02,yy-s.h*.27,xx+s.w*.17,yy+s.h*.13,xx+s.w*.13,yy-s.h*.1);});
   }
  }else if(s.kind==='poison'){
   glow(0,0,r*3,'#91f43050');
   path('#61c62961',null,0,()=>{ctx.moveTo(r*.5,-r*.7);ctx.bezierCurveTo(-r,-r,-r*2.9,-r*.4,-r*3.3,Math.sin(p)*r*.15);ctx.bezierCurveTo(-r*1.5,r*.75,-r*.3,r, r*.5,r*.7);});
   ellipse(0,0,s.w*.5,s.h*.5,material(-2,-2,r*1.1,'#f3ffc4','#b4ed44','#4d951e'));
   ellipse(r*.16,-r*.27,r*.3,r*.15,'#ffffdcb0');
   for(let i=0;i<3;i++)circle(-r*(1.3+i*.65),Math.sin(p+i)*r*.4,Math.max(1.2,r*(.13-i*.025)),'#bbff5b99');
  }else if(s.kind==='dart'){
   const length=Math.max(s.w,s.h),thick=Math.max(2.8,Math.min(s.w,s.h)*.4);
   glow(0,0,19,'#b1e96e32');
   path('#394152','#121c2e',.8,()=>{ctx.moveTo(length*.5,0);ctx.lineTo(-length*.42,-thick);ctx.lineTo(-length*.24,0);ctx.lineTo(-length*.42,thick);});
   path('#cbd4a4',null,0,()=>{ctx.moveTo(length*.5,0);ctx.lineTo(-length*.34,-thick*.75);ctx.lineTo(-length*.2,0);});
   line(-length*.2,0,length*.4,0,'#dafe75',.85);
  }else if(s.kind==='tentacle'){
   const length=Math.max(s.w,s.h),thick=Math.min(s.w,s.h),bend=Math.sin(time*5+s.x*.02)*thick*.18;
   path(material(-length*.13,0,length*.6,'#697a65','#423453','#211d37'),'#152039',1,()=>{
    ctx.moveTo(-length*.5,-thick*.32);ctx.bezierCurveTo(-length*.15,-thick*.52+bend,length*.22,-thick*.34,length*.5,0);
    ctx.bezierCurveTo(length*.22,thick*.32,-length*.12,thick*.43+bend,-length*.5,thick*.32);
   });
   for(let i=0;i<4;i++)ellipse(-length*.32+i*length*.16,thick*.16+bend*.5,thick*.09,thick*.13,'#a4c75491');
   path('#d8d3a9','#3c3c45',.5,()=>{ctx.moveTo(length*.34,-thick*.07);ctx.lineTo(length*.58,0);ctx.lineTo(length*.34,thick*.12);});
  }else if (s.kind === 'shockwave') {
   ctx.scale(1, Math.cos(a) < 0 ? -1 : 1);
   glow(0, 0, s.w * .7, '#ff9f473c');
   path('#f595485e', null, 0, () => { ctx.moveTo(-s.w / 2, s.h / 2); ctx.bezierCurveTo(-s.w * .3, -s.h, s.w * .2, -s.h * .6, s.w / 2, s.h / 2); });
   curve('#ffe3aaa8', 2, () => { ctx.moveTo(-s.w * .4, s.h * .4); ctx.quadraticCurveTo(0, -s.h * .68, s.w * .42, s.h * .4); });
  } else if (s.fire) {
   glow(0, 0, r * 3.4, '#ff8b3d53');
   for (let layer = 0; layer < 3; layer++) {
    const rr = r * (1 - layer * .2), length = r * (3.6 - layer * .7);
    path(['#e9654348', '#ff9b4c87', '#ffdb8099'][layer], null, 0, () => {
     ctx.moveTo(0, -rr * .8); ctx.bezierCurveTo(-length * .3, -rr + Math.sin(p + layer) * 2, -length * .9, -rr * .3, -length, Math.sin(p + layer) * rr * .2);
     ctx.bezierCurveTo(-length * .62, rr * .3, -length * .22, rr, 0, rr * .8);
    });
   }
   ellipse(0, 0, s.w / 2, s.h / 2, material(-2, -2, r * 1.1, '#fff7cf', '#ffc05c', '#ef7445'));
   ellipse(2, -1, r * .54, r * .55, '#fff7c1'); circle(3, -2, r * .28, '#fffdef');
  } else {
   glow(0, 0, 19, '#f8bc783c');
   path('#e49c725c', null, 0, () => { ctx.moveTo(0, -3); ctx.lineTo(-Math.min(16, speed * .035), 0); ctx.lineTo(0, 3); });
   circle(0, 0, 5, material(-1, -1, 6, '#fff2c5', '#eeb37a', '#bf7372')); circle(1, -1, 1.9, '#fff9dc');
  }
  ctx.restore();
 };
})();
