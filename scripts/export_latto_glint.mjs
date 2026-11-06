// Export the existing SVG animation exactly as rendered by Chrome, with alpha.
// Requires Chrome, Python 3 and Pillow. No package installation is needed.
import {spawn, spawnSync} from 'node:child_process';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, dirname, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const goldBorder=process.argv.includes('--gold-border');
const sourceName=goldBorder?'latto-cutout-gold.png':'latto-cutout.png';
const outputName=goldBorder?'latto-glint-gold.webp':'latto-glint.webp';
const temporary=await mkdtemp(join(tmpdir(),'latto-webp-'));
const chromePath=process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chrome=spawn(chromePath,[
  '--headless','--disable-gpu','--no-first-run','--no-default-browser-check',
  `--user-data-dir=${join(temporary,'chrome')}`,'--remote-debugging-pipe',
],{stdio:['ignore','ignore','ignore','pipe','pipe']});
let nextId=0, buffer='';
const pending=new Map();
chrome.stdio[4].on('data',chunk=>{
  buffer+=chunk.toString();let boundary;
  while((boundary=buffer.indexOf('\0'))>=0){
    const raw=buffer.slice(0,boundary);buffer=buffer.slice(boundary+1);
    if(!raw)continue;
    const message=JSON.parse(raw), request=pending.get(message.id);
    if(request){pending.delete(message.id);message.error?request.reject(message.error):request.resolve(message.result);}
  }
});
function call(method,params={},sessionId){
  return new Promise((resolve,reject)=>{
    const id=++nextId;pending.set(id,{resolve,reject});
    chrome.stdio[3].write(JSON.stringify({id,method,params,...(sessionId?{sessionId}:{})})+'\0');
  });
}
const watchdog=setTimeout(()=>{chrome.kill();console.error('Chrome export timed out');process.exit(1);},120000);
const frames=[];
try{
  const {targetId}=await call('Target.createTarget',{url:'about:blank'});
  const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
  const c=(method,params={})=>call(method,params,sessionId);
  await c('Page.enable');await c('Runtime.enable');
  await c('Emulation.setDeviceMetricsOverride',{width:613,height:1080,deviceScaleFactor:1,mobile:false});
  await c('Emulation.setDefaultBackgroundColorOverride',{color:{r:0,g:0,b:0,a:0}});
  await c('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  await c('Page.navigate',{url:pathToFileURL(join(root,'restoration/latto-glint.html')).href});
  const evaluate=async expression=>{
    const response=await c('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
    if(response.exceptionDetails)throw new Error(JSON.stringify(response.exceptionDetails));
    return response.result.value;
  };
  for(let i=0;i<100;i++){
    if(await evaluate("!!document.getElementById('time')"))break;
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  await evaluate(`(async()=>{
    const photo=new Image();photo.src=${JSON.stringify(sourceName)};await photo.decode();
    document.getElementById('latto-photo').setAttribute('href',${JSON.stringify(sourceName)});
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const style=document.createElement('style');
    style.textContent='html,body{background:transparent!important;margin:0!important;padding:0!important;width:613px!important;height:1080px!important;overflow:hidden!important}header,.controls{display:none!important}main{margin:0!important;padding:0!important;display:block!important}.portrait{position:fixed!important;inset:0!important;width:613px!important;height:1080px!important;min-height:0!important;max-height:none!important;display:block!important}.portrait svg{width:613px!important;height:1080px!important;max-width:none!important}';
    document.head.append(style);
  })()`);
  const capture=async(time,duration)=>{
    await evaluate(`(()=>{const slider=document.getElementById('time');slider.value='${Math.round(time*1000)}';slider.dispatchEvent(new Event('input'));})()`);
    const png=await c('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    const file=join(temporary,`frame-${String(frames.length).padStart(3,'0')}.png`);
    await writeFile(file,Buffer.from(png.data,'base64'));
    frames.push({file,duration,time});
  };
  await capture(0,500);
  // Only the 1.5-second moving portion needs individual frames (24 fps).
  // Long still holds are encoded as single frames, keeping the file compact.
  for(let i=0;i<36;i++){
    await capture(.5+i/24,Math.round((i+1)*1000/24)-Math.round(i*1000/24));
    if(i%12===0)console.log(`Captured ${i+1}/36 motion frames`);
  }
  await capture(2,3000);
  await writeFile(join(temporary,'frames.json'),JSON.stringify(frames));
  await call('Browser.close');
  clearTimeout(watchdog);
  const result=spawnSync('python3',[join(root,'scripts/encode_latto_webp.py'),join(temporary,'frames.json'),join(root,'restoration',outputName)],{stdio:'inherit'});
  if(result.status!==0)throw new Error('WebP encoding failed');
}finally{
  clearTimeout(watchdog);chrome.kill();
  await rm(temporary,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
