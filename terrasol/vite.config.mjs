import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {ENGINE,DATA,ARENA2} from './src/config.mjs';
// The engine's own config carries plugins that generate files its modules import (src/firstVisitPins.js since
// 10e43fd0), so it is the base: a synced engine brings its current plugins, and Rowan's settings go on top.
const engineFile=path.join(ENGINE,'vite.config.js');
const exported=fs.existsSync(engineFile)?(await import(pathToFileURL(engineFile).href)).default:{};
const engine=typeof exported==='function'?await exported({command:'serve',mode:'development'}):exported;
const rowanLocalData={name:'rowan-local-data',configureServer(server){
  let names;
  server.middlewares.use((req,res,next)=>{
    if(!/^\/(?:play\/)?arena2\//i.test(req.url??''))return next();
    const name=decodeURIComponent(req.url.split('?')[0].split('/').pop());
    if(!/^[a-zA-Z0-9._-]+$/.test(name))return next();
    names??=new Map(fs.readdirSync(ARENA2).map(n=>[n.toUpperCase(),n]));
    let file=path.join(ARENA2,names.get(name.toUpperCase())??name);
    if(!fs.existsSync(file)&&/^BOK\d+\.TXT$/i.test(name)){
      const dir=path.join(ARENA2,names.get('BOOKS')??'BOOKS');
      if(fs.existsSync(dir))file=path.join(dir,fs.readdirSync(dir).find(n=>n.toUpperCase()===name.toUpperCase())??name);
    }
    if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.statusCode=404;res.end('not found');return;}
    res.setHeader('content-type','application/octet-stream');fs.createReadStream(file).pipe(res);
  });
}};
export default {
  ...engine,
  root:ENGINE,
  cacheDir:path.join(DATA,'vite-cache'),
  optimizeDeps:{noDiscovery:true,include:[]},
  server:{...engine.server,host:'127.0.0.1',fs:{...engine.server?.fs,allow:[ENGINE]}},
  // Rowan's data route runs first so its BOOKS fallback answers before the engine's own ARENA2 route.
  plugins:[rowanLocalData,...(engine.plugins??[]).flat()],
};
