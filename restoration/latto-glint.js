'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const beam = $('reflection-beam'), star = $('tip-sparkle'), slider = $('time');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = v => Math.max(0,Math.min(1,v));
  const smooth = v => {const t=clamp(v);return t*t*(3-2*t);};
  let time=0, last=0, raf=0, playing=false;
  function draw(t) {
    const travel=clamp((t-.5)/1.1);
    // A mostly linear sweep keeps the highlight moving like a passing light.
    const x=1710+490*travel;
    const fade=smooth(travel/.14)*(1-smooth((travel-.84)/.16));
    beam.setAttribute('transform',`translate(${x} 1020) rotate(-18)`);
    beam.setAttribute('opacity',String(t>=.5&&t<=1.6?fade:0));
    const glint=(t-1.5)/.42;
    const bloom=glint>=0&&glint<=1 ? Math.pow(Math.sin(glint*Math.PI),1.3) : 0;
    star.setAttribute('transform',`translate(2178 1007) rotate(${-12+24*clamp(glint)}) scale(${bloom})`);
    star.setAttribute('opacity',String(bloom));
    const label=t>=1.5&&t<=1.92?'Tip sparkle':t>=.5&&t<1.5?'Light sweep':'Still';
    $('phase').textContent=label;
    $('timestamp').textContent=`${Math.min(t,2.4).toFixed(2)} s`;
    slider.value=String(Math.min(t*1000,2400));
    slider.setAttribute('aria-valuetext',`${label}, ${Math.min(t,2.4).toFixed(2)} seconds`);
  }
  function setPlaying(state) {
    playing=state;last=0;cancelAnimationFrame(raf);
    $('pause').textContent=state?'Pause':'Play';
    if(state)raf=requestAnimationFrame(tick);
  }
  function tick(now) {
    if(!playing)return;
    if(last)time+=Math.min((now-last)/1000,.1);
    last=now;
    if($('loop').checked){if(time>=5)time%=5;}
    else if(time>=2.4){time=2.4;draw(time);setPlaying(false);return;}
    draw(time);raf=requestAnimationFrame(tick);
  }
  $('replay').addEventListener('click',()=>{time=0;draw(time);setPlaying(true);});
  $('pause').addEventListener('click',()=>{if(!playing&&time>=2.4)time=0;setPlaying(!playing);});
  slider.addEventListener('input',()=>{setPlaying(false);time=Number(slider.value)/1000;draw(time);});
  $('loop').addEventListener('change',()=>{if(!$('loop').checked&&time>=2.4){time=2.4;draw(time);setPlaying(false);}});
  document.addEventListener('visibilitychange',()=>{last=0;});
  reduceMotion.addEventListener('change',e=>{if(e.matches)setPlaying(false);});
  // Start only when the photograph is ready, so the first sweep is visible.
  const photo=new Image();
  photo.onload=()=>{draw(0);setPlaying(!reduceMotion.matches);};
  photo.onerror=()=>{$('phase').textContent='Image unavailable';$('phase').classList.add('error');};
  photo.src='latto-cutout.png';
})();
