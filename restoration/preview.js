'use strict';
(() => {
  const C = window.POSTER_TWEEN;
  const $ = id => document.getElementById(id);
  const canvas = $('poster'), ctx = canvas.getContext('2d');
  const slider = $('progress'), play = $('play');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let playing = false, ready = false, mode = 'tween', value = 0, time = 0, last = 0, raf = 0;
  let images, restored;
  const ease = t => { t = Math.max(0, Math.min(1, t)); return t*t*(3-2*t); };
  function progress(t) {
    t %= C.duration;
    if (t < 1.5) return 0;
    if (t < 5) return ease((t-1.5)/3.5);
    if (t < 7) return 1;
    if (t < 9) return 1-ease((t-7)/2);
    return 0;
  }
  function bounds(row, name) {
    let y, left, right;
    if (name === 'before') [y,,left,right] = row;
    else { y = row[1]; left = 170-y*7/439; right = 458+y*10/439; }
    const span = right-left;
    return [left-130/740*span, right+130/740*span, y];
  }
  // Draw an affine triangle; pairs of triangles produce each registered strip.
  function triangle(target, img, from, to) {
    const [[x0,y0],[x1,y1],[x2,y2]] = from;
    const [[u0,v0],[u1,v1],[u2,v2]] = to;
    const det = x0*(y1-y2)+x1*(y2-y0)+x2*(y0-y1);
    const a = (u0*(y1-y2)+u1*(y2-y0)+u2*(y0-y1))/det;
    const c = (u0*(x2-x1)+u1*(x0-x2)+u2*(x1-x0))/det;
    const e = (u0*(x1*y2-x2*y1)+u1*(x2*y0-x0*y2)+u2*(x0*y1-x1*y0))/det;
    const b = (v0*(y1-y2)+v1*(y2-y0)+v2*(y0-y1))/det;
    const d = (v0*(x2-x1)+v1*(x0-x2)+v2*(x1-x0))/det;
    const f = (v0*(x1*y2-x2*y1)+v1*(x2*y0-x0*y2)+v2*(x0*y1-x1*y0))/det;
    // Overlap clips by a fraction of a pixel to avoid antialiasing seams.
    const cx=(u0+u1+u2)/3, cy=(v0+v1+v2)/3;
    const expanded=to.map(([x,y])=>{const distance=Math.hypot(x-cx,y-cy);return [x+(x-cx)/distance*.7,y+(y-cy)/distance*.7];});
    target.save(); target.beginPath(); target.moveTo(...expanded[0]); target.lineTo(...expanded[1]); target.lineTo(...expanded[2]); target.closePath(); target.clip();
    target.transform(a,b,c,d,e,f); target.drawImage(img,0,0); target.restore();
  }
  function drawPoster(target, name, amount) {
    const img = images[name], crop = C.assets[name].crop;
    const sx = img.naturalWidth/(crop[2]-crop[0]), sy = img.naturalHeight/(crop[3]-crop[1]);
    const sourcePoint = (x,y) => [(x-crop[0])*sx,(y-crop[1])*sy];
    for (let i=0; i<C.rows.length-1; i++) {
      const a=C.rows[i], b=C.rows[i+1];
      const [l0,r0,y0]=bounds(a,name), [l1,r1,y1]=bounds(b,name);
      const dy = row => 90+2.6*(name === 'after' ? row[1] : (row[0]-60)*(442/519)*(1-amount)+row[1]*amount);
      const top=Math.round(dy(a)), bottom=Math.round(dy(b));
      const tl=sourcePoint(l0,y0), tr=sourcePoint(r0,y0), bl=sourcePoint(l1,y1), br=sourcePoint(r1,y1);
      triangle(target,img,[tl,tr,br],[[0,top],[C.width,top],[C.width,bottom]]);
      triangle(target,img,[tl,br,bl],[[0,top],[C.width,bottom],[0,bottom]]);
    }
  }
  const beforeLayer = document.createElement('canvas'); beforeLayer.width=C.width; beforeLayer.height=C.height;
  const beforeCtx=beforeLayer.getContext('2d');
  function render(p) {
    if (!ready) return;
    value=p; ctx.clearRect(0,0,C.width,C.height);
    beforeCtx.clearRect(0,0,C.width,C.height);
    drawPoster(beforeCtx,'before',mode==='wipe' ? 1 : ease(p/.25));
    if (mode==='wipe') {
      ctx.drawImage(beforeLayer,0,0);
      ctx.save(); ctx.beginPath(); ctx.rect(0,0,C.width*p,C.height); ctx.clip(); ctx.clearRect(0,0,C.width,C.height); ctx.drawImage(restored,0,0); ctx.restore();
      if (p>0 && p<1) { ctx.strokeStyle='#f4dfb3'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(C.width*p,40); ctx.lineTo(C.width*p,C.height-40); ctx.stroke(); }
    } else {
      ctx.save(); ctx.globalAlpha=1-p; ctx.drawImage(beforeLayer,0,0); ctx.globalAlpha=p; ctx.globalCompositeOperation='lighter'; ctx.drawImage(restored,0,0); ctx.restore();
    }
    slider.value=String(Math.round(p*1000)); $('percent').textContent=`${Math.round(p*100)}%`;
    $('phase').textContent=p<.001?'Before restoration':p>.999?'After restoration':mode==='wipe'?'Wipe comparison':'Restoring';
    slider.setAttribute('aria-valuetext',`${Math.round(p*100)} percent restored`);
  }
  function tick(now) {
    if (!playing) return;
    if (last) time += Math.min((now-last)/1000,.1)*Number($('speed').value);
    last=now; render(progress(time)); raf=requestAnimationFrame(tick);
  }
  function setPlaying(state) {
    playing=state; play.textContent=state?'Pause':'Play'; play.setAttribute('aria-label',state?'Pause animation':'Play animation');
    cancelAnimationFrame(raf); last=0;
    if (state) raf=requestAnimationFrame(tick);
  }
  function seek(p) { setPlaying(false); render(p); }
  play.addEventListener('click',()=>{
    if (!playing) {
      // Resume along the forward curve at the currently displayed amount.
      let low=0, high=1;
      for(let i=0;i<24;i++){const mid=(low+high)/2;if(ease(mid)<value)low=mid;else high=mid;}
      time=value>=.999?5:value<=.001?0:1.5+3.5*(low+high)/2;
    }
    setPlaying(!playing);
  });
  slider.addEventListener('input',()=>seek(Number(slider.value)/1000));
  $('before').addEventListener('click',()=>seek(0)); $('after').addEventListener('click',()=>seek(1));
  for(const name of ['tween','wipe']) $(name).addEventListener('click',()=>{
    mode=name; for(const option of ['tween','wipe']) $(option).setAttribute('aria-pressed',String(option===name));
    $('caption').textContent=name==='wipe'?'Drag the slider to compare the aligned photographs.':'A ten-second loop. Drag the slider to explore.';
    render(value);
  });
  for(const button of document.querySelectorAll('[data-bg].swatch')) button.addEventListener('click',()=>{
    $('stage').dataset.bg=button.dataset.bg;
    for(const b of document.querySelectorAll('[data-bg].swatch')) b.setAttribute('aria-pressed',String(b===button));
  });
  document.addEventListener('visibilitychange',()=>{last=0;});
  reducedMotion.addEventListener('change',e=>{if(e.matches)setPlaying(false);});
  const load=name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error(`Could not load the ${name} PNG.`));img.src=`flyer-${name}-upscaled.png`;});
  Promise.all([load('before'),load('after')]).then(([before,after])=>{
    images={before,after}; restored=document.createElement('canvas');restored.width=C.width;restored.height=C.height;drawPoster(restored.getContext('2d'),'after',1);
    ready=true;play.disabled=false;render(0);if(!reducedMotion.matches)setPlaying(true);
  }).catch(error=>{$('phase').textContent='Images unavailable';$('caption').textContent=error.message+' Keep the preview beside its image files, or open the MP4.';$('caption').classList.add('error');});
})();
