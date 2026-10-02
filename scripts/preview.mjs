import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('out');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.txt':'text/plain','.json':'application/json'};
http.createServer((req,res)=>{
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch {res.writeHead(400);res.end();return;}
  let file = path.resolve(root,'.'+pathname);
  if(file!==root && !file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
  let status=200;
  if(!fs.existsSync(file)){file=path.join(root,'404.html');status=404;}
  if(!fs.existsSync(file)){res.writeHead(404);res.end('Run npm run build first.');return;}
  res.writeHead(status,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
}).listen(3000,'127.0.0.1',()=>console.log('Static portfolio preview: http://localhost:3000'));
