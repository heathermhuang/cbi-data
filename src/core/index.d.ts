export interface Claim {id:string;revisionId:string;subject:string;predicate:string;value:unknown;verification:'confirmed'|'partial'|'disputed'|'unverified'|'not_applicable';valueStatus:'known'|'unknown'|'not_stated'|'not_applicable';evidence:Array<{sourceId:string;locator:string;scope:string}>;reviewedAt:string|null;reviewDueAt:string|null;effectiveFrom:string|null;effectiveUntil:string|null;conditions:string[];limitations:string[]}
export interface Envelope {schemaVersion:string;datasetRelease:string;generatedAt:string;evaluatedAt:string;coverage:Record<string,unknown>;warnings:string[];data:unknown;evidence?:unknown[]}
export type Operation='programmes'|'programme'|'compare'|'costs'|'travel'|'source'|'changes'|'coverage'|'releases'|'release';
export class QueryError extends Error {code:string;status:number;constructor(code:string,message:string,status?:number)}
export function query(dataset:unknown,operation:Operation,input:Record<string,unknown>,evaluatedAt:string):Envelope;
export function calculateCosts(dataset:unknown,id:string,option:string|undefined,scenario:string,time:string):unknown;
export function minor(amount:string,currency:string):bigint;
export function decimal(amount:bigint,currency:string):string;
export function freshness(claim:Claim,time:string):Claim & {reviewStatus:string;requiresRecheck:boolean;expired:boolean;notYetEffective:boolean};
