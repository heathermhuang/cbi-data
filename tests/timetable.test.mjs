import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('St Kitts cutoff preserves current intake and distinct processing deadline',async()=>{const cs=JSON.parse(await readFile('data/claims/cbi-kna.json'));const c=cs.find(c=>c.predicate==='editorial_update');assert.match(c.value.items[0].text,/31 January 2029/);assert.match(c.value.items[0].text,/31 December 2029/);assert.match(cs.find(c=>c.predicate==='keyNote').value,/31 January 2029/);const i=cs.find(c=>c.predicate==='intake_observation');assert.equal(i.value.intake,'published_with_limits');assert.equal(cs.find(c=>c.predicate==='capital').reviewedAt,'2026-10-13');assert(c.evidence.some(e=>e.sourceId==='transition-skn-timetable'));});
