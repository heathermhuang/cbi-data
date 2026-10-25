import type {Operation} from './index.mjs';
export function loadDataset(read:(path:string)=>Promise<unknown>,operation:Operation,input?:Record<string,unknown>):Promise<unknown>;
