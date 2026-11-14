import {handleRefugio} from './refugio-agent.mjs';
export function withRefugio(server){
 const original=server.listeners('request');
 if(original.length!==1)throw Error('A integração da Bia exige um único manipulador HTTP existente.');
 server.removeAllListeners('request');
 server.on('request',(req,res)=>{
  const pathname=(req.url||'').split('?')[0];
  if(pathname==='/api/refugio'){
   Promise.resolve(handleRefugio(req,res)).catch(()=>{if(!res.headersSent)res.writeHead(500,{'Content-Type':'application/json','Access-Control-Allow-Origin':req.headers.origin==='https://comandante22.github.io'?req.headers.origin:'null','Vary':'Origin','Cache-Control':'no-store'});if(!res.writableEnded)res.end(JSON.stringify({erro:'Não foi possível concluir a consulta.'}))});return;
  }
  original[0].call(server,req,res);
 });
 return server;
}
