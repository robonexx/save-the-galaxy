/* Nine individually authored trails. All dimensions are world pixels; device
   size never changes jump physics. Clear landing and takeoff lips stay free. */
window.GAME_TUNING=Object.freeze({walkSun:305,walkMoon:285,boostSun:465,boostMoon:445,jump:710,boostJump:890,gravity:1800,moonFallGravity:1200,moonFallMax:480,acceleration:2250,airAcceleration:1500,coyote:.12,jumpBuffer:.16});
window.WORLD_TITLES=['The Enchanted Trails','Dreams Beyond the Veil','The Dying Universe'];
window.BOSS_DEFS=[
 {kind:'warden',name:'Cinder Warden',hp:4,w:100,h:130,theme:'void'},
 {kind:'nebula',name:'Nebula Phantom',hp:6,w:110,h:145,theme:'nebula'},
 {kind:'destroyer',name:'The Destroyer of the Universe',hp:8,w:170,h:155,theme:'inferno'}
];
const STAGE_LAYOUTS=[
 // 1-1: long garden runs, two small ravines and an optional canopy route.
 {theme:'forest',names:['The Midnight Grove','The Waking Garden'],hint:'Wide garden paths. Find the key in the canopy.',
  ground:[[0,520,1180],[1320,500,1160],[2650,520,1120]],
  platforms:[[300,410,180],[580,330,190],[940,410,170],[1610,395,180],[1900,300,220],[2260,400,180]],
  checkpoints:[[1430,500],[2780,520]],powerups:[[260,478],[2830,478]],
  enemies:[[470,520,'crawler'],[1020,520,'hopper'],[1710,500,'crawler'],[2310,500,'hopper'],[3110,520,'crawler'],[3440,385,'bat']],
  key:[1960,255],portal:[845,520],returnX:1430,hazards:[]},
 // 1-2: a rising stone staircase, a high terrace and a downhill exit.
 {theme:'ruins',names:['Starlit Ruins','Sunlit Ruins'],hint:'Climb the ruined stairway. The key waits on the high terrace.',
  ground:[[0,520,680],[810,465,360],[1250,400,380],[1710,345,490],[2290,435,520],[2990,520,930]],
  platforms:[[400,415,150],[1420,285,160],[2360,320,190],[2650,340,160]],
  checkpoints:[[1320,400],[3040,520]],powerups:[[260,478],[2440,393]],
  enemies:[[460,520,'crawler'],[1000,465,'hopper'],[1500,400,'crawler'],[2030,345,'turret'],[2570,435,'hopper'],[2740,280,'wisp'],[3440,520,'crawler']],
  key:[1880,300],portal:[960,465],returnX:1320,hazards:[]},
 // 1-3: climb a central observatory tower across suspended star bridges.
 {theme:'observatory',names:['The Eclipse Observatory','The Golden Observatory'],hint:'Cross the star bridges. Watch the drifting bridge beyond the key.',
  ground:[[0,520,920],[1820,475,740],[3000,500,440],[3650,520,820]],
  platforms:[[1040,435,190],[1320,350,210],[1590,405,190],[2700,390,190],[3180,385,160],[3930,405,190]],
  movingPlatforms:[{platform:2,axis:'x',amplitude:35,period:5.5}],
  checkpoints:[[1930,475],[3710,520]],powerups:[[260,478],[2210,433]],
  enemies:[[410,520,'crawler'],[2180,475,'hopper'],[2420,335,'drone'],[3240,500,'crawler'],[4000,520,'turret'],[4210,380,'bat']],
  key:[1380,305],portal:[600,520],returnX:760,hazards:[]},
 // 2-1: mostly continuous cave floor with low ledges over the sticky pools.
 {theme:'void',names:['The Weeping Below','The Whispering Grotto'],hint:'Run through the grotto. Low ledges offer a way over the slime.',
  ground:[[0,520,1680],[1870,485,710],[2730,520,1230]],
  platforms:[[280,425,200],[600,405,230],[1120,410,260],[1440,395,130],[2180,400,260],[3120,420,200]],
  checkpoints:[[1350,520],[2830,520]],powerups:[[490,478],[3250,478]],
  enemies:[[600,520,'crawler'],[1220,335,'bat'],[2060,485,'hopper'],[2490,330,'wisp'],[3060,520,'crawler'],[3450,380,'bat']],
  key:[2260,355],portal:[970,520],returnX:1340,hazards:[]},
 // 2-2: one long rising and falling pearl staircase, with recovery ledges.
 {theme:'dream',names:['The Dreaming Tides','The Pearl Stairway'],hint:'Ride the floating pearls across the great chasm. The key is at the crest.',
  ground:[[0,520,760],[3220,520,960]],
  platforms:[[900,435,210],[1170,510,160],[1240,350,200],[1550,280,230],[1830,500,170],[1900,320,250],[2280,395,210],[2490,520,180],[2640,455,200],[2990,440,200]],
  movingPlatforms:[{platform:0,axis:'y',amplitude:28,period:5.6},{platform:5,axis:'x',amplitude:45,period:6.4},{platform:6,axis:'y',amplitude:28,period:5.2}],
  checkpoints:[[1300,350],[2680,455]],powerups:[[260,478],[1950,278]],
  enemies:[[1040,320,'wisp'],[1760,405,'bat'],[2330,290,'drone'],[2740,455,'hopper'],[3570,520,'crawler'],[3850,380,'wisp']],
  key:[1640,235],portal:[420,520],returnX:590,hazards:[]},
 // 2-3: three short constellation relays separated by broad resting islands.
 {theme:'nebula',names:['The Veil of Stars','The Hollow Constellation'],hint:'Leap between constellations. The key waits on the middle relay.',
  ground:[[0,520,830],[1500,480,550],[2820,450,530],[4050,520,1140]],
  platforms:[[990,420,170],[1270,435,160],[2220,385,190],[2540,350,170],[3490,350,180],[3780,415,170]],
  movingPlatforms:[{platform:4,axis:'x',amplitude:40,period:4.8}],
  checkpoints:[[1620,480],[2980,450],[4200,520]],powerups:[[260,478],[4280,478]],
  enemies:[[360,520,'hopper'],[1100,290,'wisp'],[1780,480,'turret'],[2370,245,'drone'],[3090,450,'hopper'],[3650,250,'bat'],[4820,520,'hopper']],
  key:[2580,305],portal:[480,520],returnX:670,
  hazards:[{kind:'spikes',x:4580,y:490,w:60,h:30}]},
 // 3-1: paired asteroid rocks, wide craters and a large central dreamstone.
 {theme:'asteroid',names:['The Sleeping Asteroid','The Dreamstone Belt'],hint:'Cross the crater pairs. Climb the central dreamstone for the key.',
  ground:[[0,520,980],[1140,470,340],[1640,515,430],[2350,460,1180],[3850,495,320],[4320,520,850]],
  platforms:[[920,395,170],[1920,400,150],[2160,420,170],[2670,355,210],[3000,270,240],[3650,395,160]],
  checkpoints:[[1730,515],[4390,520]],powerups:[[260,478],[2570,418]],
  enemies:[[400,520,'crawler'],[1300,470,'hopper'],[1870,515,'crawler'],[2540,460,'turret'],[3300,315,'drone'],[4020,495,'hopper'],[4690,520,'turret']],
  key:[3090,225],portal:[640,520],returnX:800,hazards:[]},
 // 3-2: two ring arches, each with a high bridge and a lower recovery route.
 {theme:'rings',names:['The Rings of Saturn','The Saturn Passage'],hint:'Time your jumps between drifting rings. Both high and low paths lead onward.',
  ground:[[0,520,720],[2220,490,560],[4320,520,980]],
  platforms:[[890,430,180],[1050,515,180],[1190,350,220],[1370,485,180],[1530,270,250],[1690,465,190],[1900,350,200],[2020,490,150],[2420,380,180],[2940,410,190],[3110,510,190],[3260,325,220],[3430,500,190],[3610,360,240],[3790,505,200],[4000,440,190]],
  movingPlatforms:[{platform:0,axis:'y',amplitude:25,period:5.6},{platform:2,axis:'x',amplitude:50,period:6},{platform:5,axis:'x',amplitude:45,period:5.4},{platform:11,axis:'y',amplitude:32,period:5.8},{platform:15,axis:'x',amplitude:60,period:6.2}],
  checkpoints:[[2300,490],[4400,520]],powerups:[[250,478],[3750,318]],
  enemies:[[350,520,'crawler'],[1250,215,'drone'],[1720,355,'wisp'],[2560,490,'turret'],[3340,190,'drone'],[3830,505,'hopper'],[4610,520,'turret'],[5000,380,'wisp']],
  key:[2480,335],portal:[420,520],returnX:570,hazards:[]},
 // 3-3: quick lava stepping stones, a wide key terrace and a final open run.
 {theme:'inferno',names:['The Last Light','The Devouring Universe'],hint:'Cross the lava fissures. The last key waits above the wide terrace.',
  ground:[[0,520,860],[1230,495,280],[1730,460,900],[3370,505,300],[4100,520,1240]],
  platforms:[[980,420,150],[2090,365,160],[2290,330,180],[2780,360,170],[3100,395,160],[3820,390,160]],
  movingPlatforms:[{platform:3,axis:'y',amplitude:32,period:5.4},{platform:5,axis:'x',amplitude:45,period:4.8}],
  checkpoints:[[1850,460],[4210,520]],powerups:[[260,478],[4430,478]],
  enemies:[[390,520,'crawler'],[1370,495,'hopper'],[1970,460,'turret'],[2510,460,'hopper'],[2910,225,'drone'],[3530,505,'crawler'],[4390,320,'bat'],[5030,520,'turret']],
  key:[2350,285],portal:[440,520],returnX:650,
  hazards:[{kind:'spikes',x:4660,y:490,w:60,h:30}]}
];
function makeStage(source,index){
 const {ground,platforms,checkpoints,enemies,hazards,powerups,key,portal,returnX,movingPlatforms=[]}=source;
 const last=ground[ground.length-1],width=last[0]+last[2];
 return {width,ground,platforms,movingPlatforms,checkpoints,enemies,hazards,powerups,key,exit:width-130,portal,returnX,difficulty:5+index%3,worldIndex:Math.floor(index/3),localStage:index%3};
}
const MAIN_LEVELS=STAGE_LAYOUTS.map(makeStage);
window.CAMPAIGN_LENGTH=9;
window.createWorld=(hero,stage)=>{
 const source=MAIN_LEVELS[stage],style=STAGE_LAYOUTS[stage],day=hero==='moon';
 return {...structuredClone(source),id:'main',day:stage>=3?false:day,theme:style.theme,name:`WORLD ${source.worldIndex+1} · ${source.localStage+1}/3 · ${style.names[day?1:0]}`,subtitle:`${WORLD_TITLES[source.worldIndex]} · difficulty ${source.difficulty}/10. ${style.hint}`,key:{x:source.key[0],y:source.key[1],w:28,h:28,got:false},portals:[{x:source.portal[0]+(day?0:24),y:source.portal[1],kind:day?'cloud':'blackhole',label:day?'JUMP INTO THE CLOUD ↑':'JUMP INTO THE HOLE ↓',returnX:source.returnX}],spawn:[80,520],final:false};
};
window.createBonus=(hero,stage)=>{
 const day=hero==='moon';return {id:'bonus',day,theme:day?'clouds':'void',name:day?'Above the clouds':'The Weeping Below',subtitle:day?'A hidden path above the world.':'The walls are alive. Violet slime slows your steps.',width:2450,ground:[[0,520,540],[780,490,510],[1560,520,420],[2200,520,250]],platforms:[[310,405,120],[1000,380,125],[1770,410,130]],checkpoints:[[850,490],[1650,520]],enemies:[[1080,490,'hopper'],[1260,255,day?'drone':'bat'],[1830,520,'crawler']],hazards:[],powerups:[[380,478],[1100,448]],key:null,exit:null,portals:[{x:2310,y:520,kind:'return',label:'RETURN TO THE TRAIL'}],spawn:[90,520],final:false,worldIndex:Math.floor(stage/3),localStage:stage%3,difficulty:5+stage%3};
};
window.createBossWorld=(phase,index=0)=>{
 const b=BOSS_DEFS[index],arenas=[[[250,405,145],[650,365,155],[1120,405,145]],[[220,430,175],[500,340,190],[805,410,175],[1130,315,190]],[[190,415,175],[525,355,175],[900,390,175],[1210,330,165]]];
 return {id:'boss',day:false,theme:b.theme,name:`WORLD ${index+1} BOSS · ${b.name}${index===0&&phase===2?' · Inferno':index===2&&phase===1?' · Break the Shell':index===2?' · The Last Battle':''}`,subtitle:index===0?(phase===1?'Four head stomps. Dodge flames, rushes and smash waves.':'Four more stomps. Double jump over the fire!'):index===1?'Six head stomps. Dodge the drifting mist; only contact traps you.':phase===1?'Four stomps to break its shell. The Destroyer guards a galaxy rift.':'Eight head stomps. Dodge poison, darts and the marked tentacle strikes.',width:1550,ground:[[0,520,1550]],platforms:arenas[index],checkpoints:[],enemies:[],hazards:[],powerups:[[140,478]],key:null,exit:null,portals:[],spawn:[90,520],final:false,bossPhase:phase,bossIndex:index,worldIndex:index,localStage:3,difficulty:7+index};
};
