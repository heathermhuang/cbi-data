export function handleHttp(request:Request,read:(path:string)=>Promise<unknown>,evaluatedAt?:string):Promise<Response>;
export function openapi():Record<string,unknown>;
