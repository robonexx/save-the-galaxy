'use strict';
// Original music and monster voices, synthesized locally. No downloaded,
// Nintendo, or third-party recordings are included in this game.
window.GameAudio=(()=>{
 let context=null,master=null,timer=null,next=0,beat=0;
 const events=[];
 const melodies=[
  [72,76,79,76,74,77,81,77,76,79,84,79,74,77,79,71,72,null,76,79,81,79,76,74,72,76,79,84,83,79,76,null],
  [74,77,81,86,84,81,77,null,72,76,79,84,81,79,76,null,70,74,77,81,79,77,74,null,69,73,76,81,79,76,73,null],
  [69,72,76,81,79,76,72,null,68,71,75,80,78,75,71,null,65,69,72,77,76,72,69,null,64,68,71,76,75,71,68,null]
 ];
 const basses=[[48,53,55,48],[50,48,46,45],[45,44,41,40]];
 const hz=midi=>440*Math.pow(2,(midi-69)/12);
 function ensure(){
  if(typeof window.AudioContext!=='function'&&typeof window.webkitAudioContext!=='function')return false;
  try{audio??=new(window.AudioContext||window.webkitAudioContext)();context=audio;
   if(!master){master=context.createGain();master.gain.value=.65;const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=5000;master.connect(filter);filter.connect(context.destination);}
   context.resume();return true;
  }catch{return false;}
 }
 function note(midi,at,length,volume=.028,type='triangle',slide=1){
  if(midi==null||!context)return;
  const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type=type;
  oscillator.frequency.setValueAtTime(hz(midi),at);if(slide!==1)oscillator.frequency.exponentialRampToValueAtTime(hz(midi)*slide,at+length);
  gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+length);
  oscillator.connect(gain);gain.connect(master);oscillator.start(at);oscillator.stop(at+length+.025);
 }
 function hiss(at,length,volume,frequency=1200){
  const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*length),context.sampleRate),data=buffer.getChannelData(0);
  for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);
  const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=1.8;
  gain.gain.setValueAtTime(volume,at);gain.gain.exponentialRampToValueAtTime(.0001,at+length);source.connect(filter);filter.connect(gain);gain.connect(master);source.start(at);
 }
 function tick(){
  if(!context||!master)return;
  const audible=sound&&['playing','transition','transport'].includes(state);
  master.gain.setTargetAtTime(audible?.65:0,context.currentTime,.08);
  if(!audible){next=context.currentTime+.08;return;}
  const wi=Math.min(2,Math.floor(stage/3)),seconds=60/(boss?140:112+wi*9)/2;
  if(next<context.currentTime)next=context.currentTime+.03;
  while(next<context.currentTime+.24){
   const melody=melodies[wi],index=beat%melody.length;
   if(!boss||beat%2===0)note(melody[index],next,seconds*.83,boss?.015:.021,'triangle');
   if(beat%4===0)note(basses[wi][Math.floor(beat/8)%4],next,seconds*2.9,.023,'triangle');
   if(beat%2===1)note(basses[wi][Math.floor(beat/8)%4]+19,next,seconds*.65,.009,'square');
   if(boss&&beat%4===0){note(31,next,.16,.035,'sine',.5);hiss(next,.045,.011,4200);}
   beat++;next+=seconds;
  }
 }
 function start(){if(!ensure())return;next=context.currentTime+.03;if(timer===null&&typeof setInterval==='function')timer=setInterval(tick,120);tick();}
 function voice(kind,roar=false){
  if(!sound||!ensure())return;
  const now=context.currentTime+.015,base=kind==='destroyer'?38:kind==='nebula'?48:43;
  events.push({kind,type:roar?'roar':'laugh',at:now});if(events.length>20)events.shift();
  if(roar){
   for(let i=0;i<5;i++)note(base+i*7,now,.8,.055/(1+i*.25),'sawtooth',.57);
   hiss(now,.78,.12,kind==='nebula'?900:430);
  }else{
   // Three separated voiced “ha” envelopes with descending pitch and breath.
   for(let i=0;i<3;i++){
    const at=now+i*.23;note(base+7-i*2,at,.19,.075,'sawtooth',.78);note(base+19-i*2,at,.17,.026,'triangle',.7);hiss(at,.16,.055,750-i*90);
   }
  }
 }
 return {start,laugh:kind=>voice(kind),roar:kind=>voice(kind,true),setMuted:()=>{if(master)master.gain.setTargetAtTime(sound?.65:0,context.currentTime,.05);},captureStream:()=>{if(!ensure())return null;const destination=context.createMediaStreamDestination();master.connect(destination);return destination.stream;},inspect:()=>({enabled:!!context,musicRunning:timer!==null,state:context?.state??'unavailable',events:[...events],original:true})};
})();
