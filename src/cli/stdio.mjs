#!/usr/bin/env node
import {readFile} from 'node:fs/promises';import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';import {registerTools} from '../mcp/index.mjs';
const root=new URL('../../dist/',import.meta.url);const read=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));const server=new McpServer({name:'CBI Data',version:'0.1.0'});registerTools(server,read);await server.connect(new StdioServerTransport());
