/* Original nine-stage campaign. All dimensions are world pixels; device size
   never changes jump physics. Platforms have a straight, readable landing lip. */
window.GAME_TUNING=Object.freeze({walkSun:305,walkMoon:285,boostSun:465,boostMoon:445,jump:710,boostJump:890,gravity:1800,moonFallGravity:1200,moonFallMax:480,acceleration:2250,airAcceleration:1500,coyote:.12,jumpBuffer:.16});
window.WORLD_TITLES=['The Enchanted Trails','Dreams Beyond the Veil','The Dying Universe'];
window.BOSS_DEFS=[
 {kind:'warden',name:'Cinder Warden',hp:4,w:100,h:130,theme:'void'},
 {kind:'nebula',name:'Nebula Phantom',hp:6,w:110,h:145,theme:'nebula'},
 {kind:'destroyer',name:'The Destroyer of the Universe',hp:8,w:170,h:155,theme:'inferno'}
];
const STAGE_LAYOUTS=[
 {theme:'forest',names:['The Midnight Grove','The Waking Garden'],widths:[740,570,480,560,460,690],gaps:[220,240,235,255,245],tops:[520,520,490,520,480,520]},
 {theme:'ruins',names:['Starlit Ruins','Sunlit Ruins'],widths:[660,480,430,510,420,650],gaps:[245,260,250,275,265],tops:[520,470,430,500,460,520]},
 {theme:'observatory',names:['The Eclipse Observatory','The Golden Observatory'],widths:[620,420,390,470,380,640],gaps:[270,290,285,305,290],tops:[520,480,520,460,500,520]},
 {theme:'void',names:['The Weeping Below','The Whispering Grotto'],widths:[670,510,470,490,440,660],gaps:[235,250,255,270,250],tops:[520,485,520,470,520,520]},
 {theme:'dream',names:['The Dreaming Tides','The Pearl Stairway'],widths:[620,440,400,460,410,650],gaps:[255,275,265,290,280],tops:[520,460,490,440,485,520]},
 {theme:'nebula',names:['The Veil of Stars','The Hollow Constellation'],widths:[610,390,370,440,370,660],gaps:[290,305,300,320,310],tops:[520,480,450,500,470,520]},
 {theme:'asteroid',names:['The Sleeping Asteroid','The Dreamstone Belt'],widths:[640,460,420,460,420,660],gaps:[255,270,280,285,275],tops:[520,495,460,510,475,520]},
 {theme:'rings',names:['The Rings of Saturn','The Saturn Passage'],widths:[610,390,365,420,370,670],gaps:[280,300,310,315,305],tops:[520,470,510,450,490,520]},
 {theme:'inferno',names:['The Last Light','The Devouring Universe'],widths:[590,360,350,390,345,690],gaps:[305,325,315,330,325],tops:[520,480,450,510,475,520]}
];
function makeStage(source,index){
 const difficulty=5+index%3,worldIndex=Math.floor(index/3),ground=[];
 let cursor=0;source.widths.forEach((width,i)=>{ground.push([cursor,source.tops[i],width]);cursor+=width+(source.gaps[i]||0);});
 const last=ground[5],platforms=[
  [ground[1][0]+70,ground[1][1]-105,125-index%3*10],
  [ground[3][0]+140,ground[3][1]-120,130-index%3*12],
  [last[0]+90,425,135-index%3*12],
  [last[0]+300,330,145-index%3*10]
 ];
 const enemies=[];
 ground.forEach(([x,y,w],i)=>{
  if(i===0)enemies.push([x+425,y,index%3===0?'crawler':'hopper']);
  else enemies.push([x+w*.55,y,(i+index)%3===0?'turret':i%2?'hopper':'crawler']);
  if(i>0&&i<5&&(index%3>0||worldIndex>0))enemies.push([x+w*.25,y-150,['bat','drone','wisp'][(index+i)%3]]);
 });
 const hazards=[];
 for(let i=0;i<5;i++){
  const [x,y,w]=ground[i];
  if(i===0&&index%3===0)continue;
  hazards.push({kind:source.theme==='inferno'?'vent':worldIndex===2?'crystal':source.theme==='forest'?'thorns':'spikes',x:x+w-155,y:y-30,w:60+(difficulty-5)*8,h:30,period:3.7,phase:i*.63});
  if(i>0&&difficulty>=6)hazards.push({kind:worldIndex===2?'orbit':'vent',x:x+95,y:y-85,w:28,h:85,period:4.5,phase:i*.81});
 }
 return {width:cursor,ground,platforms,checkpoints:[[ground[2][0]+70,ground[2][1]],[ground[4][0]+65,ground[4][1]]],enemies,hazards,powerups:[[260,478],[ground[3][0]+65,ground[3][1]-42]],key:[last[0]+350,280],exit:cursor-130,portal:ground[1][0]+210,returnX:ground[2][0]+90,difficulty,worldIndex,localStage:index%3};
}
const MAIN_LEVELS=STAGE_LAYOUTS.map(makeStage);
window.CAMPAIGN_LENGTH=9;
window.createWorld=(hero,stage)=>{
 const source=MAIN_LEVELS[stage],style=STAGE_LAYOUTS[stage],day=hero==='moon';
 return {...structuredClone(source),id:'main',day:stage>=3?false:day,theme:style.theme,name:`WORLD ${source.worldIndex+1} · ${source.localStage+1}/3 · ${style.names[day?1:0]}`,subtitle:`${WORLD_TITLES[source.worldIndex]} · difficulty ${source.difficulty}/10. Find the key. Boost over the gaps.`,key:{x:source.key[0],y:source.key[1],w:28,h:28,got:false},portals:[{x:source.portal+(day?0:24),y:source.ground[1][1],kind:day?'cloud':'blackhole',label:day?'JUMP INTO THE CLOUD ↑':'JUMP INTO THE HOLE ↓',returnX:source.returnX}],spawn:[80,520],final:false};
};
window.createBonus=(hero,stage)=>{
 const day=hero==='moon';return {id:'bonus',day,theme:day?'clouds':'void',name:day?'Above the clouds':'The Weeping Below',subtitle:day?'A hidden path above the world.':'The walls are alive. Violet slime slows your steps.',width:2450,ground:[[0,520,540],[780,490,510],[1560,520,420],[2200,520,250]],platforms:[[310,405,120],[1000,380,125],[1770,410,130]],checkpoints:[[850,490],[1650,520]],enemies:[[1080,490,'hopper'],[1260,255,day?'drone':'bat'],[1830,520,'crawler']],hazards:[],powerups:[[380,478],[1100,448]],key:null,exit:null,portals:[{x:2310,y:520,kind:'return',label:'RETURN TO THE TRAIL'}],spawn:[90,520],final:false,worldIndex:Math.floor(stage/3),localStage:stage%3,difficulty:5+stage%3};
};
window.createBossWorld=(phase,index=0)=>{
 const b=BOSS_DEFS[index];return {id:'boss',day:false,theme:b.theme,name:`WORLD ${index+1} BOSS · ${b.name}${index===0&&phase===2?' · Inferno':''}`,subtitle:index===0?(phase===1?'Four head stomps. Dodge flames, rushes and smash waves.':'Double jump unlocked! Release jump, then jump again in the air.'):index===1?'Six head stomps. Tap MAGIC / X repeatedly to break free of the mist.':'Eight head stomps. Dodge poison, darts and the marked tentacle strikes.',width:1550,ground:[[0,520,1550]],platforms:[[250,405,130],[645,365,135],[1120,405,130]],checkpoints:[],enemies:[],hazards:[],powerups:[[140,478]],key:null,exit:null,portals:[],spawn:[90,520],final:false,bossPhase:phase,bossIndex:index,worldIndex:index,localStage:3,difficulty:7+index};
};
