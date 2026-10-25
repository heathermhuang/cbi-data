import {checkId,validateInput,QueryError} from './index.mjs';
export async function loadDataset(read,op,input={}){
 validateInput(op,input);
 const index=await read('index.json');const release=input.release??index.defaultRelease;checkId(release);
 if(index.withdrawnReleases?.includes(release))throw new QueryError('withdrawn_release','Release was withdrawn; consult the archive index.',410);
 if(!index.retainedReleases.includes(release))throw new QueryError('unknown_release','Unknown hosted release.',404);
 const base=release+'/';const [scope,manifest]=await Promise.all([read(base+'scope.json'),read(base+'manifest.json')]);
 if(scope.datasetRelease!==release||manifest.datasetRelease!==release||scope.schemaVersion!==manifest.schemaVersion)throw new QueryError('integrity_mismatch','Pinned release identities disagree.',503);
 const ids=new Set();
 let summaries;if(op==='programmes')summaries=await read(base+'summaries.json');
 if(['programme','costs'].includes(op)){checkId(input.id);ids.add(index.programmes.find(p=>p.id===input.id||p.aliases.includes(input.id))?.id??input.id);}
 if(op==='compare'){const is=Array.isArray(input.ids)?input.ids:String(input.ids??'').split(',');if(is.length<2||is.length>4)throw new QueryError('invalid_comparison','Choose 2–4 programmes.');for(const id of is){checkId(id);ids.add(index.programmes.find(p=>p.id===id||p.aliases.includes(id))?.id??id);}}
 let targetedTravel;if(op==='travel'){checkId(input.passport);checkId(input.destination);if(index.programmes.some(p=>p.jurisdiction===input.passport)&&scope.destinations.includes(input.destination))targetedTravel=await read(base+'travel/'+input.passport+'-'+input.destination+'.json');}
 const shards=await Promise.all([...ids].filter(id=>index.programmes.some(p=>p.id===id)).map(id=>read(base+'programmes/'+id+'.json')));
 const programmes=summaries?.programmes??shards.map(s=>s.programme),claims=summaries?.claims??(targetedTravel?[targetedTravel.claim]:shards.flatMap(s=>s.claims)),costItems=shards.flatMap(s=>s.costItems),travel=targetedTravel?[targetedTravel.travel]:shards.flatMap(s=>s.travel);
 const refs=new Set(input.include==='evidence'?claims.flatMap(c=>c.evidence.map(e=>e.sourceId)):[]);if(op==='source'){checkId(input.id);if(index.sourceClaims[input.id])refs.add(input.id);}
 const sources=await Promise.all([...refs].map(id=>read(base+'sources/'+id+'.json')));
 const changes=op==='changes'?await read(base+'changes.json'):[];
 return {index,scope,manifest,programmes,claims,costItems,travel,sources,changes};
}
