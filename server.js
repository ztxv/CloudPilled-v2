const fs=require('fs');
const http=require('http');
const path=require('path');
const {Readable}=require('stream');

const ROOT=__dirname;
const PORT=Number(process.env.PORT || 5174);
const HOST=process.env.HOST || '127.0.0.1';
const NVIDIA_URL='https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_MODEL=process.env.NVIDIA_MODEL || 'moonshotai/kimi-k2-instruct';
const AI_LIMIT=5;
const AI_WINDOW_MS=60*60*1000;
const usageByIp=new Map();

loadDotEnv(path.join(ROOT,'.env'));

const MIME={
  '.html':'text/html; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8',
  '.svg':'image/svg+xml',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.ico':'image/x-icon',
};

function loadDotEnv(file){
  if(!fs.existsSync(file))return;
  const lines=fs.readFileSync(file,'utf8').split(/\r?\n/);
  for(const line of lines){
    const trimmed=line.trim();
    if(!trimmed || trimmed.startsWith('#'))continue;
    const idx=trimmed.indexOf('=');
    if(idx===-1)continue;
    const key=trimmed.slice(0,idx).trim();
    let value=trimmed.slice(idx+1).trim();
    if((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))){
      value=value.slice(1,-1);
    }
    if(key && process.env[key]===undefined)process.env[key]=value;
  }
}

function json(res,status,body){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});
  res.end(JSON.stringify(body));
}

function getUsage(ip){
  const now=Date.now();
  let usage=usageByIp.get(ip);
  if(!usage || now-usage.windowStart>=AI_WINDOW_MS){
    usage={windowStart:now,count:0};
    usageByIp.set(ip,usage);
  }
  return usage;
}

function readBody(req){
  return new Promise((resolve,reject)=>{
    let body='';
    req.on('data',chunk=>{
      body+=chunk;
      if(body.length>1024*1024){
        reject(new Error('Request body is too large.'));
        req.destroy();
      }
    });
    req.on('end',()=>resolve(body));
    req.on('error',reject);
  });
}

async function handleChat(req,res){
  if(req.method!=='POST'){
    json(res,405,{error:'Method not allowed'});
    return;
  }

  const apiKey=process.env.NVIDIA_API_KEY;
  if(!apiKey || apiKey==='PASTE_KEY_HERE'){
    json(res,500,{error:'Missing NVIDIA_API_KEY. Add it to .env, then restart npm run dev.'});
    return;
  }

  const ip=req.socket.remoteAddress || 'local';
  const usage=getUsage(ip);
  if(usage.count>=AI_LIMIT){
    const resetMs=Math.max(0, AI_WINDOW_MS-(Date.now()-usage.windowStart));
    json(res,429,{error:'Study Buddy question limit reached.',resetMs});
    return;
  }
  usage.count+=1;

  let payload;
  try{
    payload=JSON.parse(await readBody(req));
  }catch(e){
    json(res,400,{error:'Invalid JSON request body.'});
    return;
  }

  try{
    const upstream=await fetch(NVIDIA_URL,{
      method:'POST',
      headers:{
        'Authorization':'Bearer '+apiKey,
        'Content-Type':'application/json',
      },
      body:JSON.stringify({
        model:NVIDIA_MODEL,
        messages:Array.isArray(payload.messages)?payload.messages:[],
        temperature:payload.temperature ?? 0.6,
        top_p:payload.top_p ?? 0.9,
        max_tokens:payload.max_tokens ?? 2048,
        stream:payload.stream !== false,
      }),
    });

    res.writeHead(upstream.status,{
      'Content-Type':upstream.headers.get('content-type') || 'text/event-stream; charset=utf-8',
      'Cache-Control':'no-cache',
    });

    if(upstream.body){
      Readable.fromWeb(upstream.body).pipe(res);
    }else{
      res.end();
    }
  }catch(e){
    json(res,502,{error:'Nvidia API request failed.',detail:e.message || String(e)});
  }
}

function serveStatic(req,res){
  let urlPath;
  try{
    urlPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  }catch(e){
    res.writeHead(400);
    res.end('Bad request');
    return;
  }
  if(urlPath==='/')urlPath='/index.html';

  const filePath=path.normalize(path.join(ROOT,urlPath));
  if(filePath!==ROOT && !filePath.startsWith(ROOT+path.sep)){
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath,(err,data)=>{
    if(err){
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200,{'Content-Type':MIME[path.extname(filePath)] || 'application/octet-stream'});
    res.end(data);
  });
}

const server=http.createServer((req,res)=>{
  if(req.url && req.url.startsWith('/api/chat/completions')){
    handleChat(req,res);
    return;
  }
  serveStatic(req,res);
});

server.listen(PORT,HOST,()=>{
  console.log(`AWS CCP Study Site running at http://${HOST}:${PORT}`);
});
