export class QueryError extends Error {
 constructor(code,message,status=400){super(message);this.code=code;this.status=status;}
}
export const tools={list_programmes:'programmes',get_programme:'programme',compare_programmes:'compare',get_programme_costs:'costs',get_travel_rule:'travel',get_source:'source',get_changes:'changes',get_coverage:'coverage'};
export const identifier=/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const fail=(code,message,status)=>{throw new QueryError(code,message,status);};
export function checkId(id){if(typeof id!=='string'||!identifier.test(id))fail('invalid_identifier','Use an identifier of 1–64 safe characters.');return id;}
export function freshness(claim,time){const at=Date.parse(time);return {...claim,reviewStatus:claim.reviewDueAt&&at>=Date.parse(claim.reviewDueAt+'T00:00:00Z')?'overdue':'within_target',requiresRecheck:!!(!claim.reviewedAt||(claim.reviewDueAt&&at>=Date.parse(claim.reviewDueAt+'T00:00:00Z'))||!!claim.effectiveUntil&&at>=Date.parse(claim.effectiveUntil+'T00:00:00Z')),expired:!!claim.effectiveUntil&&at>=Date.parse(claim.effectiveUntil+'T00:00:00Z'),notYetEffective:!!claim.effectiveFrom&&at<Date.parse(claim.effectiveFrom+'T00:00:00Z')};}
// Checked decimal strings are converted to integer minor units, never binary money totals.
const decimals={USD:2,VUV:0,EUR:2,TRY:2,EGP:2};
export function minor(amount,currency){const dp=decimals[currency];if(dp===undefined||!/^\d+(?:\.\d+)?$/.test(amount))fail('invalid_money','Unsupported currency or decimal amount.');const [a,b='']=amount.split('.');if(b.length>dp)fail('invalid_money','Too many decimal places.');return BigInt(a)*10n**BigInt(dp)+BigInt(b.padEnd(dp,'0')||'0');}
export function decimal(amount,currency){const dp=decimals[currency],s=String(amount).padStart(dp+1,'0');return dp?s.slice(0,-dp)+'.'+s.slice(-dp):s;}
function getProgramme(d,id){checkId(id);const p=d.programmes.find(p=>p.id===id||p.aliases.includes(id));if(!p)fail('unknown_programme','Programme not found in this dataset.',404);return p;}
function claimsFor(d,p,time){return d.claims.filter(c=>c.subject===p.id).map(c=>freshness(c,time));}
function summary(d,p,time){const fields=['financialResources','amount','capital','capitalType','family','hold','presence','caveat','passportDelivery','intake'];return {id:p.id,aliases:p.aliases,country:p.country,jurisdiction:p.jurisdiction,kind:p.kind,mechanism:p.mechanism,profileURL:p.profileURL,optionIds:p.optionIds,qualifications:p.qualifications,claims:claimsFor(d,p,time).filter(c=>fields.some(k=>p.fields[k]===c.id))};}
export function calculateCosts(d,id,option,scenario,time){
 const p=getProgramme(d,id);if(!d.scope.scenarios.includes(scenario))return {outcome:'unsupported_scenario',supportedScenarios:d.scope.scenarios};
 option=option??p.optionIds[0];checkId(option);if(!p.optionIds.includes(option))fail('unknown_option','Option does not belong to programme.',404);
 const candidates=d.costItems.filter(x=>x.programmeId===p.id&&x.optionId===option).map(x=>({...x,claim:freshness(d.claims.find(c=>c.id===x.claimId),time)})).filter(x=>x.claim.value.scenario===scenario);
 const excluded=candidates.filter(x=>x.claim.expired||x.claim.notYetEffective||x.claim.verification==='disputed');
 const items=candidates.filter(x=>!excluded.includes(x));const totals={};for(const x of items){const v=x.claim.value;totals[v.currency]=(totals[v.currency]??0n)+minor(v.amount,v.currency)*BigInt(v.quantity);}
 const family=scenario!=='single_adult';
 const missing=['Unlisted mandatory charges and amount/applicability of passport, interview, biometric, bank, oath or enhanced checks have not been exhaustively established.',...(family?['Exact dependant acceptance, relationship and dependency conditions require confirmation.']:[])];
 return {outcome:excluded.some(x=>x.claim.verification==='disputed')?'conflicting_evidence':items.length?'conditional':'insufficient_evidence',programmeId:p.id,optionId:option,scenario,items,excludedItems:excluded,knownSubtotal:Object.fromEntries(Object.entries(totals).map(([c,a])=>[c,decimal(a,c)])),subtotalDefinition:'Sum of the included dated items by currency, including qualifying capital; not an all-in cost or proof of eligibility. Expired, future and disputed items are excluded.',comprehensiveTotal:null,missing,excludedCosts:['Professional and agent services','Document, translation and certification','Tax, travel and property transaction costs','Unlisted and case-specific government charges'],recurringObligations:{items:[],state:'insufficient_evidence'},qualifications:p.qualifications};
}
function travelRule(d,input,time){
 for(const k of ['passport','destination'])checkId(input[k]);
 if(input.documentType&&input.documentType!=='ordinary')return {outcome:'not_covered',reason:'Only ordinary national passports are in scope.'};
 if(input.purpose&&input.purpose!=='short_visit')return {outcome:'not_covered',reason:'Only short visitor policy is in scope.'};
 if(input.transport&&!['air','land','sea','unknown'].includes(input.transport))fail('invalid_transport','Use air, land, sea or unknown.');
 if(input.qualifyingVisa&&!['yes','no','unknown'].includes(input.qualifyingVisa))fail('invalid_flag','Use yes, no or unknown.');
 const t=d.travel.find(x=>x.passport===input.passport&&x.destination===input.destination);if(!t)return {outcome:'not_covered',reason:'No rule is inferred for a missing destination, territory or document.'};
 const claim=freshness(d.claims.find(c=>c.id===t.claimId),time);let route=t.route,outcome=t.outcome,requiredFacts=[];
 if(route==='conditional_eta'){
  if(['land','sea'].includes(input.transport)||input.qualifyingVisa==='no'){route='advance_visa';outcome='conditional';}
  else {if(!input.transport||input.transport==='unknown')requiredFacts.push('transport');if(!input.qualifyingVisa||input.qualifyingVisa==='unknown')requiredFacts.push('qualifyingVisa');outcome='conditional';}
 }
 if(claim.verification==='disputed'){outcome='conflicting_evidence';route='unresolved';}if(claim.expired||claim.notYetEffective){outcome='insufficient_evidence';route='unresolved';}
 return {...t,route,outcome,claim,requiredFacts,context:{transport:input.transport??'unknown',qualifyingVisa:input.qualifyingVisa??'unknown'},warnings:claim.limitations};
}
const allowed={programmes:['release','limit','cursor','kind','jurisdiction','stage','include'],programme:['id','release','include'],compare:['ids','scenario','release','include'],costs:['id','option','scenario','release','include'],travel:['passport','destination','documentType','purpose','transport','qualifyingVisa','release','include'],source:['id','release','include'],changes:['from','to','programme','limit','cursor','release','include'],coverage:['release'],releases:['release','limit','cursor'],release:['id','release']};
export function validateInput(op,input){if(!allowed[op])fail('unknown_operation','Unknown operation.',404);if(!input||typeof input!=='object'||Array.isArray(input))fail('invalid_input','Use an object.');for(const [k,v]of Object.entries(input)){if(!allowed[op].includes(k)||v===undefined||v===null)fail('unsupported_parameter','Unsupported parameter: '+k);if(k!=='ids'&&typeof v!=='string'&&k!=='limit')fail('invalid_parameter','Expected a string: '+k);if(typeof v==='string'&&v.length>8192)fail('request_too_large','Parameter too large.',413);}
 for(const key of ['id','option','from','to','programme','passport','destination','documentType','purpose','jurisdiction'])if(input[key]!==undefined)checkId(input[key]);
 if(input.include&&input.include!=='evidence')fail('unsupported_include','Only include=evidence is supported.');
 if(input.release)checkId(input.release);if(input.limit!==undefined&&(!/^\d+$/.test(String(input.limit))||Number(input.limit)<1||Number(input.limit)>50))fail('invalid_limit','Limit must be 1–50.');
}
function page(items,input,op,release){const limit=Number(input.limit??20);let offset=0;const filters=JSON.stringify(Object.fromEntries(Object.entries(input).filter(([k])=>!['cursor','limit','release'].includes(k)).sort()));if(input.cursor){try{const c=JSON.parse(atob(input.cursor));if(c.release!==release||c.filters!==filters||c.op!==op||!Number.isInteger(c.offset)||c.offset<0)throw Error();offset=c.offset;}catch{fail('invalid_cursor','Cursor must bind the same release, operation and filters.');}}
 return {items:items.slice(offset,offset+limit),nextCursor:offset+limit<items.length?btoa(JSON.stringify({release,filters,op,offset:offset+limit})):null};}
export function query(d,op,input={},evaluatedAt){
 validateInput(op,input);if(!evaluatedAt||!Number.isFinite(Date.parse(evaluatedAt)))fail('invalid_time','An explicit ISO evaluation time is required.');const time=new Date(evaluatedAt).toISOString();
 if(input.release&&input.release!==d.scope.datasetRelease)fail('unknown_release','Release is not hosted.',404);
 let data;
 switch(op){
 case 'programme':{const p=getProgramme(d,input.id);data={...p,claims:claimsFor(d,p,time)};break;}
 case 'programmes':{if(input.kind&&input.kind!=='citizenship')fail('unsupported_filter','Only citizenship is included.');if(input.stage&&!['published_application_route','published_with_limits'].includes(input.stage))fail('unsupported_filter','Unknown operating-stage filter.');if(input.jurisdiction)checkId(input.jurisdiction);let ps=d.programmes.filter(p=>(!input.jurisdiction||p.jurisdiction===input.jurisdiction)&&(!input.stage||d.claims.find(c=>c.id===p.fields.intake)?.value.intake===input.stage)).sort((a,b)=>a.id.localeCompare(b.id));data=page(ps.map(p=>summary(d,p,time)),input,op,d.scope.datasetRelease);break;}
 case 'compare':{const ids=Array.isArray(input.ids)?input.ids:String(input.ids??'').split(',');if(ids.length<2||ids.length>4||new Set(ids).size!==ids.length)fail('invalid_comparison','Choose 2–4 distinct programmes.');const ps=ids.map(id=>getProgramme(d,id));if(new Set(ps.map(p=>p.id)).size!==ps.length)fail('invalid_comparison','Programme aliases must resolve to distinct programmes.');data={programmes:ps.map(p=>summary(d,p,time)),...(input.scenario?{costs:ps.map(p=>calculateCosts(d,p.id,undefined,input.scenario,time))}:{})};break;}
 case 'costs':data=calculateCosts(d,input.id,input.option,input.scenario??'single_adult',time);break;
 case 'travel':data=travelRule(d,input,time);break;
 case 'source':{checkId(input.id);const s=d.sources.find(s=>s.id===input.id);if(!s)fail('unknown_source','Source not found.',404);data={...s,supportedClaimIds:d.index.sourceClaims[input.id]??[]};break;}
 case 'changes':{if(input.to!==d.scope.datasetRelease)fail('incompatible_release','Pin the target release when querying changes.');for(const k of ['from','to'])checkId(input[k]);if(![input.from,input.to].every(r=>d.index.retainedReleases.includes(r)))fail('unknown_release','Both change endpoints must be retained releases.',404);data=page(input.from===input.to?[]:d.changes.filter(c=>c.from===input.from&&c.to===input.to&&(!input.programme||c.programmeId===input.programme)),input,op,d.scope.datasetRelease);break;}
 case 'coverage':data={...d.index.coverage,scope:d.scope,reviewDueCount:d.index.reviewDates.filter(x=>!x||time>=x+'T00:00:00.000Z').length,monitoring:'Dated release observations only. Sources have an explicit manual review schedule. Retrieval is not claim verification.'};break;
 case 'releases':data=page(d.releaseManifests??[d.manifest],input,op,d.scope.datasetRelease);break;
 case 'release':if(input.id!==d.scope.datasetRelease)fail('unknown_release','Release is not hosted.',404);data=d.manifest;break;
 }
 const out={schemaVersion:d.scope.schemaVersion,datasetRelease:d.scope.datasetRelease,generatedAt:d.scope.generatedAt,evaluatedAt:time,coverage:d.index.coverage,warnings:['Expired or not-yet-effective claims are recorded evidence only and must not be used as current values.','Selected, dated and incomplete research; retain claim evidence, conditions and missing fields.','Release time is not legal commencement or a freshness guarantee.'],data};
 if(input.include==='evidence'){const text=JSON.stringify(data);out.evidence=d.sources.filter(s=>text.includes('"'+s.id+'"'));}
 if(JSON.stringify(out).length>131072)fail('response_too_large','Use a smaller page or individual programme shards.',413);return out;
}
