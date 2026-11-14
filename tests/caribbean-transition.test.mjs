import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {projectProgramme} from '../src/core/projection.mjs';

const read=async p=>JSON.parse(await readFile(new URL('../dist/'+p,import.meta.url),'utf8'));
const current='2026-11-14.2',previous='2026-10-25.2';
test('transition evidence preserves old releases, price and travel revisions',async()=>{
 const scope=await read(current+'/scope.json'),index=await read('index.json');
 for(const id of ['cbi-atg','cbi-dma','cbi-grd','cbi-kna','cbi-lca']){
  const old=await read(previous+'/programmes/'+id+'.json'),now=await read(current+'/programmes/'+id+'.json');
  const before=new Map(old.claims.map(c=>[c.id,c])),after=new Map(now.claims.map(c=>[c.id,c]));
  for(const c of old.claims.filter(c=>['amount','family_amount'].includes(c.predicate)||c.predicate.startsWith('cost_')||c.predicate.startsWith('travel_')))assert.deepEqual(after.get(c.id),c);
  const update=after.get(now.programme.fields.editorialUpdate);assert.equal(update.reviewedAt,'2026-11-14');assert.equal(update.effectiveFrom,null);
  assert(['confirmed','partial'].includes(update.verification));assert(update.value.items.length>=1);
  for(const e of update.evidence){const source=await read(current+'/sources/'+e.sourceId+'.json');assert(!/imidaily|nowgrenada/.test(source.url));assert.equal(source.rights.disposition,'link_only');}
  if(old.programme.fields.editorialUpdate){const inherited=before.get(old.programme.fields.editorialUpdate);assert.deepEqual(after.get(inherited.id),inherited);for(const [key,value] of Object.entries(inherited.value).filter(([key])=>!['items','guides','checked'].includes(key)))assert.deepEqual(update.value[key],value);for(const item of inherited.value.items)assert(update.value.items.some(x=>JSON.stringify(x)===JSON.stringify(item)));}
  const projected=projectProgramme(now,scope,index);assert(projected.programme.keyNote.length);assert.equal(projected.research.checked,'2026-11-14');
  if(id==='cbi-kna'){
   assert.equal(projected.programme.status,'Open with limits');
   assert.match(after.get(now.programme.fields.intake).conditions.join(' '),/Applications continue/);
   assert.match(projected.programme.caveat,/Wind-down announced/);
   assert.equal(before.get(old.programme.fields.intake).value.intake,'published_application_route');
  }else assert.equal(projected.programme.status,'Open');
 }
});
test('Saint Lucia letter and Grenada fiscal risk do not become closure agreements',async()=>{
 for(const [id,pattern] of [['cbi-lca',/does not reveal whether Saint Lucia offered a phase-out/],['cbi-grd',/does not verify a later political statement/]]){
  const shard=await read(current+'/programmes/'+id+'.json');const c=shard.claims.find(c=>c.id===shard.programme.fields.editorialUpdate);
  assert.match(c.value.items[0].text,pattern);assert.equal(c.effectiveFrom,null);
 }
});
