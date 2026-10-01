'use strict';

// Complete textured frames preserve the reference characters' round, nose-free
// faces. No face, ear, limb or fabric is reconstructed with Canvas primitives.
function heroRigPose(options = {}) {
 const phase = Number.isFinite(options.phase) ? options.phase : 0;
 const ground = options.ground !== false;
 const moving = !!options.moving;
 const vx = Number.isFinite(options.vx) ? options.vx : 0;
 const vy = Number.isFinite(options.vy) ? options.vy : 0;
 const idleTime = Math.max(0, options.idleTime || 0);
 const idle = ground && (!moving || options.steering === false || idleTime > .035);
 const turning = !idle && ground && Number.isFinite(options.turn) && Math.abs(options.turn) < .4;
 const cycle = ((phase / (Math.PI * 2)) % 1 + 1) % 1;
 const runIndex = Math.floor(cycle * 8) % 8;
 let direction = Number.isFinite(options.turn) && Math.abs(options.turn) > .025 ? Math.sign(options.turn) : Math.sign(options.face || vx || 1);
 let expression = options.idleExpression || 'neutral';
 // Gameplay may supply its own idle scheduler. These deterministic defaults
 // also let a portrait preview exercise expressions without a game state.
 if (!options.idleExpression && idleTime > 0) {
  if (idleTime >= 30) {
   const t = (idleTime - 30) % 16;
   expression = t < 1.1 ? 'yawn' : t < 10 ? 'sleep' : t < 11.2 ? 'smile' : 'neutral';
  } else if (idleTime % 4.8 > .08 && idleTime % 4.8 < .22) { expression = 'blink'; }
  else if (idleTime % 9 > 3.4 && idleTime % 9 < 4.3) { expression = 'smile'; }
 }
 let state, frame;
 if (idle || turning) {
  const map = { neutral: 0, blink: 1, smile: 2, happy: 2, yawn: 3, sleep: 1, doze: 1 };
  state = turning ? 'turn' : expression; frame = turning ? 0 : (map[expression] ?? 0); direction = 1;
 } else if (!ground) {
  if (vy < -160) { state = 'jump'; frame = 12; }
  else if (vy < 100) { state = 'apex'; frame = 13; }
  else { state = 'fall'; frame = 14; }
 } else if (options.attack) { state = 'attack'; frame = 15; }
 else if (moving) { state = 'run'; frame = 4 + runIndex; }
 else { state = 'profileIdle'; frame = 15; }
 return { state, frame, runIndex, cycle, phase, ground, moving, vx, vy, idleTime, expression,
  orientation: idle || turning ? 'front' : 'profile', direction: direction < 0 ? -1 : 1,
  flip: !(idle || turning) && direction < 0,
  // The atlas is foot-anchored. Authored raster foot contacts are checked
  // visually; an analytic IK contact result cannot describe these textures.
  footContact: null, raster: true };
}

const HeroSprites = (() => {
 const headless = typeof Image === 'undefined';
 const images = new Map(), assets = { sun: null, moon: null };
 let loadingPromise = Promise.resolve({ ready: headless, headless }), error = null, revision = 0;
 let manifest = null;
 const defaults = {
  sun: { src: 'assets/sun-atlas.png', columns: 4, rows: 4, targetHeight: 78 },
  moon: { src: 'assets/moon-atlas.png', columns: 4, rows: 4, targetHeight: 78 }
 };
 const finite = (v, f) => Number.isFinite(v) ? v : f;
 function normalize(type, config, image, textures = new Map()) {
  const columns = config.columns || 4, rows = config.rows || 4;
  const width = image?.naturalWidth || image?.width || config.imageWidth || 2048;
  const height = image?.naturalHeight || image?.height || config.imageHeight || 2048;
  const cw = width / columns, ch = height / rows, frames = [];
  for (let i = 0; i < Math.max(16, config.frames?.length || 0); i++) {
   const raw = config.frames?.[i] || {}, rect = raw.rect || [];
   const x = finite(raw.x, finite(raw.sx, finite(rect[0], (i % columns) * cw)));
   const y = finite(raw.y, finite(raw.sy, finite(rect[1], Math.floor(i / columns) * ch)));
   const w = finite(raw.w, finite(raw.sw, finite(rect[2], cw)));
   const h = finite(raw.h, finite(raw.sh, finite(rect[3], ch)));
   const anchorX = finite(raw.anchorX, finite(raw.ax, finite(raw.foot?.[0], finite(config.anchorX, w * .5))));
   const anchorY = finite(raw.anchorY, finite(raw.ay, finite(raw.foot?.[1], finite(config.anchorY, h * .94))));
   const clip = Array.isArray(raw.clip) && raw.clip.length > 2
    ? raw.clip.filter(point => Array.isArray(point) && point.length > 1 && point.every(Number.isFinite)).map(point => [point[0], point[1]]) : null;
   frames.push({ x, y, w, h, anchorX, anchorY, clip: clip?.length > 2 ? clip : null, label: raw.label || '',
    src: raw.src || raw.source || config.src || config.image || defaults[type].src,
    sourceScale: Math.max(.001, finite(raw.sourceScale, 1)) });
  }
  return { type, image, textures, src: config.src || config.image || defaults[type].src, frames,
   // One source height is shared by every frame. Individually fitting each
   // crop would make heads and clothes grow and shrink during a run.
   commonHeight: Math.max(1, finite(config.commonHeight, finite(config.heroHeight, ch * .86))),
   targetHeight: finite(config.targetHeight, 78), animations: config.animations || {} };
 }
 function loadImage(src) {
  if (images.has(src)) return images.get(src);
  const promise = new Promise((resolve, reject) => {
   const image = new Image(); image.decoding = 'async';
   image.onload = () => resolve(image);
   image.onerror = () => reject(new Error(`Could not load character artwork: ${src}`));
   image.src = src;
  }); images.set(src, promise); return promise;
 }
 function configure(nextManifest) {
  const id = ++revision; error = null; manifest = nextManifest || {};
  assets.sun = assets.moon = null;
  const configs = Object.fromEntries(['sun', 'moon'].map(type => [type, { ...defaults[type], ...(manifest[type] || manifest.heroes?.[type] || {}) }]));
  if (headless) {
   for (const type of ['sun', 'moon']) assets[type] = normalize(type, configs[type], null);
   loadingPromise = Promise.resolve({ ready: true, headless: true }); return loadingPromise;
  }
  loadingPromise = Promise.allSettled(['sun', 'moon'].map(async type => {
   const config = configs[type], primary = config.src || config.image;
   const sources = [...new Set([primary, ...(config.frames || []).map(f => f?.src || f?.source).filter(Boolean)])];
   const pairs = await Promise.all(sources.map(async src => [src, await loadImage(src)]));
   const textures = new Map(pairs), image = textures.get(primary);
   const asset = normalize(type, config, image, textures);
   if (id === revision) assets[type] = asset; return asset;
  })).then(results => {
   if (id !== revision) return { ready: false, superseded: true };
   const failed = results.filter(r => r.status === 'rejected');
   error = failed.length ? failed.map(r => r.reason.message).join('; ') : null;
   return { ready: !error && !!assets.sun && !!assets.moon, error, headless: false };
  });
  return loadingPromise;
 }
 function frameInfo(type, options = {}) {
  const asset = assets[type], pose = heroRigPose(options);
  if (!asset) return { pose, loaded: false };
  let index = pose.frame;
  const custom = asset.animations[pose.state];
  if (Array.isArray(custom) && custom.length) {
   const sequenceIndex = pose.state === 'run' ? Math.floor(pose.cycle * custom.length) % custom.length : 0;
   index = custom[sequenceIndex];
   if (pose.state === 'run') { pose.runIndex = sequenceIndex; pose.runFrameCount = custom.length; }
  }
  else if (Number.isFinite(custom)) index = custom;
  pose.frame = index;
  const frame = asset.frames[index] || asset.frames[0];
  const image = asset.textures.get(frame.src) || (frame.src === asset.src ? asset.image : null);
  return { pose, index, frame, commonHeight: asset.commonHeight, targetHeight: asset.targetHeight, src: frame.src,
   loaded: headless || !!image, scale: asset.targetHeight / asset.commonHeight * frame.sourceScale };
 }
 function draw(x, foot, type, face, options) {
  const asset = assets[type];
  if (headless || !asset?.image) return false;
  const info = frameInfo(type, { ...options, face }), f = info.frame, p = info.pose;
  const sourceImage = asset.textures.get(f?.src) || (f?.src === asset.src ? asset.image : null);
  if (!f || !sourceImage || f.w <= 0 || f.h <= 0) return false;
  const clock = Number.isFinite(options.clock) ? options.clock : (typeof renderTime === 'number' ? renderTime : (typeof time === 'number' ? time : 0));
  const breath = p.orientation === 'front' ? 1 + Math.sin(clock * 2.2) * .003 : 1;
  const scale = info.scale * (options.size || 1) * breath;
  ctx.save(); ctx.translate(x, foot);
  // Only genuine profile textures are mirrored. Front idle/expression frames
  // retain their original face and their original hair parting.
  if (p.flip) ctx.scale(-1, 1);
  ctx.imageSmoothingEnabled = true;
  if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high';
  if (f.clip) {
   ctx.beginPath();
   f.clip.forEach(([xx, yy], index) => {
    const px = (xx - f.anchorX) * scale, py = (yy - f.anchorY) * scale;
    if (index === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
   });
   ctx.closePath(); ctx.clip();
  }
  ctx.drawImage(sourceImage, f.x, f.y, f.w, f.h, -f.anchorX * scale, -f.anchorY * scale, f.w * scale, f.h * scale);
  ctx.restore(); return true;
 }
 const api = { configure, frameInfo, draw,
  runFrameCount(type) { return assets[type]?.animations.run?.length || 8; },
  get ready() { return headless || !!assets.sun?.image && !!assets.moon?.image; },
  get loadingPromise() { return loadingPromise; },
  get error() { return error; }, get headless() { return headless; }, get manifest() { return manifest; } };
 const supplied = typeof HERO_SPRITE_MANIFEST !== 'undefined' ? HERO_SPRITE_MANIFEST : (typeof window !== 'undefined' ? window.HERO_SPRITE_MANIFEST : null);
 configure(supplied);
 return api;
})();

function character(x, foot, type, face = 1, options = {}) {
 return HeroSprites.draw(x, foot, type, face, options);
}

if (typeof window !== 'undefined') {
 window.HeroSprites = HeroSprites;
 // Preserve the distance-driven gait scheduler's constants. They schedule
 // raster frames and do not establish exact raster foot contacts.
 window.HeroRig = { pose: heroRigPose, scale: .78, stanceFraction: .58, kind: 'raster-atlas' };
}
