import {query,type Envelope,type Operation} from '@heathermhuang/cbi-data';
import {loadDataset} from '@heathermhuang/cbi-data/load';
import {handleHttp} from '@heathermhuang/cbi-data/http';
const operation:Operation='coverage';const read=async(_path:string):Promise<unknown>=>({});
async function example():Promise<Envelope>{return query(await loadDataset(read,operation,{}),operation,{},'2026-10-25T09:15:00Z');}
void example;void handleHttp;
