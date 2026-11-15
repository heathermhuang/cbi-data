import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Ajv from 'ajv';
import {validateStatistics,statisticsFor,preferredStatistic,statisticLabel} from '../src/core/statistics.mjs';
import {loadDataset} from '../src/core/load.mjs';
import {query} from '../src/core/index.mjs';
import {handleHttp} from '../src/http/index.mjs';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {registerTools} from '../src/mcp/index.mjs';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
const read=async p=>JSON.parse(await readFile(new URL('../dist/'+p,import.meta.url),'utf8'));
const raw=JSON.parse(await readFile(new URL('../data/statistics.json',import.meta.url),'utf8'));
const time='2026-11-15T08:00:00Z';
const run=async input=>query(await loadDataset(read,'statistics',input),'statistics',input,time);

test('observations preserve units, source definitions and unknown passport counts',()=>{
 validateStatistics(raw);
 assert.equal(raw.subjects.length,34);
 const vu=statisticsFor(raw,'vu');assert.equal(preferredStatistic(vu).value,10524);assert.equal(preferredStatistic(vu,'citizenships_granted').value,13489);
 const lc=statisticsFor(raw,'lc');assert.equal(preferredStatistic(lc),null);assert.equal(lc.subject.passportCount,null);assert.equal(lc.observations[0].unit,'applications');assert.equal(lc.observations[0].value,2278);
 const tr=statisticsFor(raw,'tr');assert.equal(preferredStatistic(tr,'citizenships_revoked').value,6134);assert.equal(preferredStatistic(tr,'citizenships_granted').value,174567);
 assert.equal(statisticsFor(raw,'tv-investor-passport').subject.classification,'noncitizen_documents');
 assert.equal(statisticsFor(raw,'ws-old').subject.classification,'irregular_historical');
 const old=statisticsFor(raw,'nr-old').observations[0];assert.equal(old.measure,'passport_sales');assert.match(statisticLabel(old),/^About 1,000/);
 assert.equal(raw.conflicts[0].listedWindowsSum,137325);assert.equal(raw.conflicts[0].reportedValue,107625);
});
test('schema and semantic checks reject private fields, mixed units and invented sums',async()=>{
 const schema=JSON.parse(await readFile(new URL('../schemas/statistics.schema.json',import.meta.url),'utf8'));
 const valid=new Ajv({strict:true}).compile(schema);assert(valid(raw));assert(!valid({...raw,privateCaseHistory:'synthetic'}));
 const bad=structuredClone(raw);bad.observations[0].unit='people';assert.throws(()=>validateStatistics(bad),/unit disagreement/);
 const sum=structuredClone(raw);sum.observations.find(o=>o.derivation).derivation.inputIds.push('lca-approvals-fy2024-25');assert.throws(()=>validateStatistics(sum),/incompatible derivation/);
 const duplicate=structuredClone(raw);const d=duplicate.observations.find(o=>o.derivation);d.derivation.inputIds.push(d.derivation.inputIds[0]);assert.throws(()=>validateStatistics(duplicate),/duplicate/);
 const overlap=structuredClone(raw);overlap.observations.find(o=>o.id==='cbi-atg-ec-1').reportingIntervals=[{start:'2023-01-01',end:'2024-12-31'}];assert.throws(()=>validateStatistics(overlap),/overlapping reporting periods/);
});
test('core, HTTP and MCP return identical bounded evidence without external fetches',async()=>{
 const input={id:'vu',measure:'passports_issued',include:'evidence',limit:1};
 const original=globalThis.fetch;globalThis.fetch=()=>{throw Error('No external I/O allowed');};
 const server=new McpServer({name:'statistics-test',version:'1'});registerTools(server,read,()=>time);
 const [s,c]=InMemoryTransport.createLinkedPair();const client=new Client({name:'test',version:'1'});
 try{await server.connect(s);await client.connect(c);const expected=await run(input);assert.equal(expected.data.items[0].value,10524);assert.equal(expected.evidence[0].id,'V1');
  const h=await handleHttp(new Request('https://cbi.me/api/v1/statistics/vu?measure=passports_issued&include=evidence&limit=1'),read,time);assert.equal(h.status,200);assert.deepEqual(await h.json(),expected);
  const m=await client.callTool({name:'get_programme_statistics',arguments:input});assert.ok(!m.isError,JSON.stringify(m));assert.deepEqual(m.structuredContent,expected);
  const next=await run({id:'gd',limit:1});assert(next.data.nextCursor);await assert.rejects(run({id:'lc',limit:1,cursor:next.data.nextCursor}),/Cursor/);
 }finally{globalThis.fetch=original;await client.close();await server.close();}
});
test('unknowns, unsupported measures, overdue reviews and old releases remain explicit',async()=>{
 const sv=await run({id:'sv'});assert.equal(sv.data.outcome,'unknown');assert.equal(sv.data.subject.passportCount,null);
 assert.equal((await run({id:'vu',release:'2026-11-14.2'})).data.outcome,'not_covered');
 await assert.rejects(run({id:'vu',measure:'success_rate'}),/Unknown.*measure/);
 await assert.rejects(run({id:'../private'}),/identifier/);
 const gd=await loadDataset(read,'statistics',{id:'gd'});assert(query(gd,'statistics',{id:'gd'},'2027-03-01T00:00:00Z').data.items.every(o=>o.reviewStatus==='overdue'));
});
