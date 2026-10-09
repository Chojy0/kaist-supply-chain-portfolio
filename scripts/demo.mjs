import {spawn, spawnSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync, readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import net from 'node:net';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
if(process.platform==='win32')throw new Error('Use WSL or macOS/Linux for this launcher.');
if(Number(process.versions.node.split('.')[0])<22)throw new Error('Node.js 22+ is required.');
for(const name of ['initdb','pg_ctl','createdb','psql'])if(spawnSync('which',[name],{stdio:'ignore'}).status!==0)throw new Error(`PostgreSQL command missing: ${name}. Install PostgreSQL and add its bin directory to PATH.`);
const state=resolve(root,'.demo'), db=resolve(state,'postgres');mkdirSync(state,{recursive:true});
const dbPort=process.env.DEMO_DB_PORT||'55439', apiPort=process.env.DEMO_API_PORT||'3019', webPort=process.env.DEMO_WEB_PORT||'5179';
for(const port of [dbPort,apiPort,webPort]){
 const free=await new Promise(r=>{const s=net.createServer();s.once('error',()=>r(false));s.listen(Number(port),'127.0.0.1',()=>s.close(()=>r(true)));});
 if(!free)throw new Error(`Port ${port} is already in use. Stop the previous demo or set DEMO_DB_PORT, DEMO_API_PORT and DEMO_WEB_PORT.`);
}
function run(cmd,args,cwd=root,env=process.env){return new Promise((resolve,reject)=>{const p=spawn(cmd,args,{cwd,env,stdio:'inherit'});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(new Error(`${cmd} exited ${code}`)));});}
const children=[];let closing=false, startedDb=false;
async function stop(code=0){if(closing)return;closing=true;for(const p of children){try{process.kill(-p.pid,'SIGTERM');}catch{}}if(startedDb)spawnSync('pg_ctl',['-D',db,'-m','fast','stop'],{stdio:'inherit'});process.exit(code);}
process.on('SIGINT',()=>void stop());process.on('SIGTERM',()=>void stop());
try{
 if(!existsSync(resolve(db,'PG_VERSION')))await run('initdb',['-D',db,'-U','portfolio','--auth=trust','--encoding=UTF8','--locale=C']);
 await run('pg_ctl',['-D',db,'-l',resolve(state,'postgres.log'),'-o',`-p ${dbPort} -h 127.0.0.1 -k /tmp`,'start']);startedDb=true;
 const check=spawnSync('psql',['-h','127.0.0.1','-p',dbPort,'-U','portfolio','-d','postgres','-tAc',"SELECT 1 FROM pg_database WHERE datname='trace_demo'"],{encoding:'utf8'});
 if(check.status!==0)throw new Error('Database check failed');
 if(check.stdout.trim()!=='1')await run('createdb',['-h','127.0.0.1','-p',dbPort,'-U','portfolio','trace_demo']);
 const secretFile=resolve(state,'jwt-secret');if(!existsSync(secretFile))writeFileSync(secretFile,randomBytes(32).toString('hex'),{mode:0o600});
 const envFile=resolve(state,'backend.env');
 writeFileSync(envFile,`DB_HOST=127.0.0.1\nDB_PORT=${dbPort}\nDB_USERNAME=portfolio\nDB_PASSWORD=\nDB_DATABASE=trace_demo\nJWT_SECRET=${readFileSync(secretFile,'utf8')}\nJWT_EXPIRES_IN=2h\nNODE_ENV=development\nPORT=${apiPort}\nHOST=127.0.0.1\nHEDERA_ENABLED=false\nALLOW_REGISTRATION=false\nCORS_ORIGINS=http://127.0.0.1:${webPort}\n`,{mode:0o600});
 const backend=resolve(root,'backend'),frontend=resolve(root,'frontend');
 const env={...process.env,ENV_FILE:envFile,NODE_ENV:'development'};
 await run('npm',['ci','--ignore-scripts'],backend);await run('npm',['ci','--ignore-scripts'],frontend);
 await run('npm',['run','build'],backend,env);await run('npm',['run','create:users'],backend,env);
 const start=(cmd,args,cwd,env)=>{const p=spawn(cmd,args,{cwd,env,stdio:'inherit',detached:true});children.push(p);p.on('error',()=>void stop(1));p.on('exit',()=>{if(!closing)void stop(1)});return p;};
 start('node',['dist/src/main.js'],backend,env);
 start('npm',['run','dev','--','--host','127.0.0.1','--port',webPort,'--strictPort'],frontend,{...process.env,VITE_API_URL:`http://127.0.0.1:${apiPort}`,VITE_DEMO:'true'});
 writeFileSync(resolve(state,'runner.pid'),String(process.pid));
 console.log(`\nTRACE demo: http://127.0.0.1:${webPort}\nRequester: tier1@test.com / password123\nSupplier: tier2@test.com / password123\nCtrl+C stops only this demo. Data persists in .demo and backend/uploads.\n`);
}catch(e){console.error(e.message);await stop(1);}
