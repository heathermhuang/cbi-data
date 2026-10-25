import type {Operation} from './index.d.ts';
export function loadDataset(read:(path:string)=>Promise<unknown>,operation:Operation,input?:Record<string,unknown>):Promise<unknown>;
