import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
export function registerTools(server:McpServer,read:(path:string)=>Promise<unknown>,clock?:()=>string):void;
