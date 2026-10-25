import {readFile,writeFile,mkdir,readdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const files=async p=>Promise.all((await readdir(p)).filter(f=>f.endsWith('.json')).sort().map(f=>read(p+'/'+f)));
const [scope,programmes,claimGroups,costGroups,travelGroups,sources,changeGroups]=await Promise.all([read('scope.json'),files('data/programmes'),files('data/claims'),files('data/costs'),files('data/travel'),files('data/sources'),files('data/changes')]);
const claims=claimGroups.flat(),costItems=costGroups.flat(),travel=travelGroups.flat();
const base='dist/'+scope.datasetRelease;await rm(base,{recursive:true,force:true});await mkdir(base,{recursive:true});
const emit=async(p,x)=>{await mkdir((base+'/'+p).split('/').slice(0,-1).join('/'),{recursive:true});await writeFile(base+'/'+p,JSON.stringify(x,null,2)+'\n');};
for(const p of programmes)await emit('programmes/'+p.id+'.json',{programme:p,claims:claims.filter(c=>c.subject===p.id),costItems:costItems.filter(c=>c.programmeId===p.id),travel:travel.filter(c=>c.programmeId===p.id)});
const summaryFields=['amount','capital','capitalType','family','hold','presence','caveat','passportDelivery','intake'];
await emit('summaries.json',{programmes,claims:claims.filter(c=>programmes.some(p=>summaryFields.some(k=>p.fields[k]===c.id)))});
for(const t of travel)await emit('travel/'+t.id+'.json',{travel:t,claim:claims.find(c=>c.id===t.claimId)});
for(const s of sources)await emit('sources/'+s.id+'.json',s);
await emit('scope.json',scope);await emit('changes.json',changeGroups.flat());
const safeCSV=v=>'"'+String(v??'').replace(/^(?:[=+@\-\t\r]|\s+[=+@\-])/,"'$&").replaceAll('"','""')+'"';
const rows=[['claimId','revisionId','subject','predicate','valueJSON','verification','valueStatus','reviewedAt','reviewDueAt','effectiveFrom','effectiveUntil','evidenceJSON','conditionsJSON','limitationsJSON'],...claims.map(c=>[c.id,c.revisionId,c.subject,c.predicate,JSON.stringify(c.value),c.verification,c.valueStatus,c.reviewedAt,c.reviewDueAt,c.effectiveFrom,c.effectiveUntil,JSON.stringify(c.evidence),JSON.stringify(c.conditions),JSON.stringify(c.limitations)])];
await writeFile(base+'/claims.csv',rows.map(r=>r.map(safeCSV).join(',')).join('\r\n')+'\r\n');
const sha=b=>createHash('sha256').update(b).digest('hex');
async function walk(p,prefix=''){let out=[];for(const f of (await readdir(p,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const rel=prefix+f.name;if(f.isDirectory())out.push(...await walk(p+'/'+f.name,rel+'/'));else out.push(rel);}return out;}
const outputFiles=(await walk(base)).filter(f=>!['manifest.json','SHA256SUMS'].includes(f));const entries=[];for(const f of outputFiles){const b=await readFile(base+'/'+f);entries.push({path:f,size:b.length,sha256:sha(b)});}
const counts={programmes:programmes.length,claims:claims.length,travelSlots:travel.length,requiredFieldSlots:programmes.reduce((n,p)=>n+Object.keys(p.requiredFields).length,0),explicitGaps:programmes.flatMap(p=>Object.values(p.requiredFields)).filter(v=>v.state==='gap').length,partialFields:programmes.flatMap(p=>Object.values(p.requiredFields)).filter(v=>v.state==='partial').length,confirmedClaims:claims.filter(c=>c.verification==='confirmed').length,partialClaims:claims.filter(c=>c.verification==='partial').length,disputedClaims:claims.filter(c=>c.verification==='disputed').length,sources:sources.length};
const canonicalHash=sha(JSON.stringify({scope,programmes,claims,costItems,travel,sources,changes:changeGroups.flat()}));
let sourceCommit=null;try{sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
const manifest={datasetRelease:scope.datasetRelease,schemaVersion:scope.schemaVersion,packageVersion:'0.1.0',generatedAt:scope.generatedAt,sourceCommit,canonicalHash,buildToolVersion:'0.1.0',supersedes:null,files:entries,coverage:counts,licences:{software:'MIT',compilation:'CC-BY-4.0',upstream:'Links only; no upstream documents or text licensed by this project'},archiveURL:'https://github.com/heathermhuang/cbi-data/releases/tag/data-'+scope.datasetRelease,hosted:true};
await emit('manifest.json',manifest);const mb=await readFile(base+'/manifest.json');await writeFile(base+'/SHA256SUMS',[...entries.map(e=>e.sha256+'  '+e.path),sha(mb)+'  manifest.json'].join('\n')+'\n');
const index={defaultRelease:scope.datasetRelease,retainedReleases:[scope.datasetRelease],withdrawnReleases:[],programmes:programmes.map(p=>({id:p.id,aliases:p.aliases,jurisdiction:p.jurisdiction})),sourceClaims:Object.fromEntries(sources.map(s=>[s.id,claims.filter(c=>c.evidence.some(e=>e.sourceId===s.id)).map(c=>c.id)])),coverage:counts,reviewDates:claims.map(c=>c.reviewDueAt)};
await mkdir('dist',{recursive:true});await writeFile('dist/index.json',JSON.stringify(index,null,2)+'\n');console.log(JSON.stringify({release:scope.datasetRelease,canonicalHash,...counts}));
