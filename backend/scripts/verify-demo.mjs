import assert from 'node:assert/strict';
const base = process.env.DEMO_API || 'http://127.0.0.1:3019';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname), 'Use a disposable local demo only');
let checks=0;
async function call(path, token, method='GET', body, expected=200) {
 const headers={};if(token)headers.Authorization=`Bearer ${token}`;
 if(body && !(body instanceof FormData)) {headers['Content-Type']='application/json';body=JSON.stringify(body);}
 const r=await fetch(base+path,{method,headers,body});
 assert.equal(r.status,expected,`${method} ${path}: ${r.status}`);checks++;
 if(r.status===204)return;
 const type=r.headers.get('content-type')||'';return type.includes('application/json')?r.json():r.text();
}
async function login(email) {return (await call('/auth/login',null,'POST',{email,password:'password123'},201)).access_token;}
const [a,b,c]=await Promise.all(['tier1@test.com','tier2@test.com','outside@test.com'].map(login));
await call('/lca-data',null,'GET',undefined,401);
const users=await call('/users/sub-suppliers',a);assert.ok(users.length);assert.ok(!JSON.stringify(users).includes('password'));
const req=await call('/upload-requests',a,'POST',{tier2plusSupplierId:users[0].id,productName:'배터리 모듈 · 파일 검증',description:'로컬 자동 검증으로 생성한 시연 자료',deadline:new Date(Date.now()+86400000*14).toISOString(),functionalUnit:'제품 1개'},201);
await call(`/upload-requests/${req.id}`,c,'GET',undefined,403);
const file='stage,material_kg,electricity_kwh\nmanufacturing,40,125\n';
function form(){const x=new FormData();x.set('productName',req.productName);x.set('uploadRequestId',req.id);x.set('file',new Blob([file],{type:'text/csv'}),'evidence.csv');return x;}
const doc=await call('/lca-data/upload',b,'POST',form(),201);
await call('/lca-data/upload',b,'POST',form(),409);
assert.equal(await call(`/lca-data/${doc.id}/file`,a),file);
await call(`/lca-data/${doc.id}/file`,c,'GET',undefined,403);
await call(`/lca-data/${doc.id}`,c,'GET',undefined,403);
await call('/feedback',b,'POST',{lcaDataId:doc.id,type:'approval',content:'not allowed'},403);
const f=await call('/feedback',a,'POST',{lcaDataId:doc.id,type:'rejection',content:'단위별 산정 근거 보완 필요'},201);
assert.equal((await call(`/feedback/lca-data/${doc.id}`,b))[0].content,f.content);
assert.equal((await call(`/feedback/lca-data/${doc.id}`,c)).length,0);
await call(`/lca-data/${doc.id}`,b,'PUT',{productName:'overwrite'},409);
const revised=await call('/lca-data/upload',b,'POST',form(),201);
await call('/feedback',a,'POST',{lcaDataId:revised.id,type:'approval',content:'보완 자료 확인 완료'},201);
assert.equal((await call(`/upload-requests/${req.id}`,a)).status,'completed');
await call('/lca-data/upload',b,'POST',form(),409);
await call(`/lca-data/${revised.id}`,b,'DELETE',undefined,409);
await call(`/lca-data/${revised.id}/anchor`,a,'POST',{publishHash:true},503);
await call(`/lca-data/${revised.id}/anchor`,a,'POST',{publishHash:false},400);
await call(`/feedback/${f.id}`,a,'DELETE',undefined,409);
await call('/users',null,'POST',{email:'blocked@test.com',password:'password123',name:'blocked',role:'tier1_supplier'},403);
const invalid=new FormData();invalid.set('productName','Bad');invalid.set('inventoryData','invalid-json');await call('/lca-data/upload',b,'POST',invalid,400);
console.log(`PASS: ${checks} local HTTP checks, including original file bytes, revision history, ownership, approval lock, disabled Hedera and input validation.`);
