export const measures={passports_issued:'Passports issued',citizenships_granted:'People granted citizenship',applications_approved:'Applications approved',citizenships_revoked:'Citizenship decisions revoked',passport_sales:'Historical passport sales'};
export const measureUnits={passports_issued:'documents',citizenships_granted:'people',applications_approved:'applications',citizenships_revoked:'people',passport_sales:'documents'};

export function validateStatistics(data){
 const assert=(ok,message)=>{if(!ok)throw Error('Statistics: '+message);};
 const subjects=new Map(data.subjects.map(s=>[s.id,s])),observations=new Map(data.observations.map(o=>[o.id,o])),sources=new Map(data.sources.map(s=>[s.id,s]));
 assert(subjects.size===data.subjects.length&&observations.size===data.observations.length&&sources.size===data.sources.length,'duplicate identities');
 const aliases=data.subjects.flatMap(s=>s.aliases);assert(new Set(aliases).size===aliases.length,'ambiguous subject aliases');
 for(const s of subjects.values()){assert(s.passportCount===null,'no unqualified mutable passport total');assert(['unknown','dated_observations'].includes(s.passportCountStatus),'coverage state');}
 for(const source of sources.values()){const u=new URL(source.url);assert(u.protocol==='https:'&&!u.username&&!u.password,'source URL');}
 for(const o of observations.values()){
  assert(subjects.has(o.subjectId),'unknown subject '+o.id);assert(measureUnits[o.measure]===o.unit,'measure/unit disagreement '+o.id);
  assert(Number.isSafeInteger(o.value)&&o.value>=0,'invalid count '+o.id);
  assert(o.reviewDueAt>=o.reviewedAt&&o.period.length>0,'dates/period '+o.id);
  assert(o.evidence.length>0&&o.evidence.every(e=>sources.has(e.sourceId)&&e.locator.length>0),'missing evidence '+o.id);
  assert(o.lowerBound===null||Number.isSafeInteger(o.lowerBound)&&o.lowerBound>=0&&o.lowerBound<=o.value,'lower bound '+o.id);
  assert(o.upperBound===null||Number.isSafeInteger(o.upperBound)&&o.upperBound>=o.value,'upper bound '+o.id);
  assert(o.qualifier!=='range'||o.lowerBound!==null&&o.upperBound!==null,'range requires bounds');
  assert(o.qualifier!=='at_least'||o.lowerBound!==null,'at-least requires lower bound');
  for(const interval of o.reportingIntervals)assert(interval.start<=interval.end&&Number.isFinite(Date.parse(interval.start))&&Number.isFinite(Date.parse(interval.end)),'invalid interval '+o.id);
  if(o.estimate){
   const e=o.estimate,base=observations.get(e.baselineId),rate=observations.get(e.rateId);
   assert(o.basis==='modelled_estimate'&&o.qualifier==='range'&&!o.derivation,'estimate must be labelled '+o.id);
   assert(base&&rate&&!base.estimate&&!rate.estimate&&[base,rate].every(i=>i.subjectId===o.subjectId&&i.measure===o.measure&&i.unit===o.unit&&i.population===o.population),'incompatible estimate inputs '+o.id);
   const days=(Date.parse(e.asOf)-Date.parse(e.from))/86400000;
   assert(e.method==='constant_rate_sensitivity_v1'&&days>0&&Number.isFinite(days)&&e.rateDays>0&&e.roundTo>0&&e.asOf<=o.reviewedAt,'invalid estimate dates/rate '+o.id);
   assert(e.lowerMultiplier===0&&e.centralMultiplier===1&&e.upperMultiplier===2&&e.confidence==='low'&&e.assumptions.length>=3,'unsupported estimate assumptions '+o.id);
   const increment=rate.value*days/e.rateDays;
   assert(o.value===Math.floor((base.value+increment)/e.roundTo+0.5)*e.roundTo&&o.lowerBound===Math.floor(base.value/e.roundTo)*e.roundTo&&o.upperBound===Math.ceil((base.value+2*increment)/e.roundTo)*e.roundTo,'estimate arithmetic '+o.id);
  }else assert(o.basis!=='modelled_estimate','missing estimate model '+o.id);
  if(o.derivation){
   assert(o.basis==='derived'&&o.derivation.formula==='sum','unsupported derivation');
   assert(new Set(o.derivation.inputIds).size===o.derivation.inputIds.length&&!o.derivation.inputIds.includes(o.id),'duplicate/self input');
   const inputs=o.derivation.inputIds.map(id=>observations.get(id));
   assert(inputs.every(i=>i&&!i.derivation&&i.subjectId===o.subjectId&&i.measure===o.measure&&i.unit===o.unit),'incompatible derivation '+o.id);
   assert(inputs.reduce((n,i)=>n+i.value,0)===o.value,'sum disagreement '+o.id);
   if(o.derivation.disjointness==='nonoverlapping_periods'){
    assert(inputs.every(i=>i.reportingIntervals.length>0),'missing reporting intervals');
    const intervals=inputs.flatMap(i=>i.reportingIntervals).toSorted((a,b)=>a.start.localeCompare(b.start));
    assert(intervals.every((v,n)=>!n||v.start>intervals[n-1].end),'overlapping reporting periods');
   }else{
    assert(o.derivation.disjointness==='source_categories','missing disjointness');
    const groups=inputs.map(i=>i.seriesId+':'+i.population);
    assert(new Set(groups).size===groups.length,'overlapping source categories');
   }
   // Every derivation is explicitly reviewed; numeric agreement alone never establishes disjoint populations.
   assert(o.derivation.reason.length>0,'missing derivation basis');
  }
 }
 return data;
}

export function statisticsFor(data,id){
 const subject=data?.subjects.find(s=>s.id===id||s.aliases.includes(id));
 if(!subject)return null;
 const observations=data.observations.filter(o=>o.subjectId===subject.id);
 return {subject,observations,sources:data.sources.filter(s=>observations.some(o=>o.evidence.some(e=>e.sourceId===s.id))),checked:data.checked,limitations:data.limitations};
}

export function preferredStatistic(group,measure='passports_issued'){
 if(!group)return null;
 const observations=group.observations.filter(o=>o.measure===measure);
 // Reviewed derived sums have explicit covered windows; never add different measures or infer missing years here.
 return observations.filter(o=>o.estimate).toSorted((a,b)=>a.estimate.asOf.localeCompare(b.estimate.asOf)).at(-1)??observations.find(o=>o.periodKind==='covered_period_sum')??observations.find(o=>o.basis==='derived'&&o.periodKind==='cumulative')??observations.at(-1)??null;
}

export function statisticLabel(o){
 if(!o)return 'Passport count unknown';
 return (o.estimate?'Estimated ':o.qualifier==='approximate'?'About ':o.qualifier==='at_least'?'At least ':'')+o.value.toLocaleString('en-US')+(o.qualifier==='range'?' ('+o.lowerBound.toLocaleString('en-US')+'–'+o.upperBound.toLocaleString('en-US')+')':'')+' '+({passports_issued:'passports',citizenships_granted:'people granted citizenship',applications_approved:'approved applications',citizenships_revoked:'revoked citizenship decisions',passport_sales:'reported passport sales'}[o.measure]);
}
