import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {query} from '../src/core/index.mjs';
import {loadDataset} from '../src/core/load.mjs';

const read = async path => JSON.parse(await readFile(new URL('../dist/' + path, import.meta.url), 'utf8'));

test('gazetted household costs retain evidence and exclude unlisted charges', async () => {
  const {defaultRelease} = await read('index.json');
  const scope = await read(defaultRelease + '/scope.json');
  const cases = [
    {id: 'st', scenario: 'single_adult', total: '95000.00', charges: 1, sources: ['st-decree-07-2025']},
    {id: 'st', scenario: 'couple_two_children_under12', total: '100000.00', charges: 1, sources: ['st-decree-07-2025']},
    {id: 'lc', scenario: 'single_adult', total: '250000.00', charges: 2, sources: ['lc-si-106-2024', 'lc-regulations-2026']},
    {id: 'lc', scenario: 'couple_two_children_under12', total: '258000.00', charges: 4, sources: ['lc-si-106-2024', 'lc-regulations-2026']},
  ];
  for (const {id, scenario, total, charges, sources} of cases) {
    const args = {id, scenario, release: defaultRelease};
    const dataset = await loadDataset(read, 'costs', args);
    const {data} = query(dataset, 'costs', args, scope.generatedAt);
    assert.equal(data.outcome, 'conditional');
    assert.deepEqual(data.knownSubtotal, {USD: total});
    assert.equal(data.comprehensiveTotal, null);
    assert.equal(data.items.filter(({claim}) => claim.value.category === 'government_charge').length, charges);
    assert.deepEqual(data.excludedItems, []);
    const evidence = new Set(data.items.flatMap(({claim}) => claim.evidence.map(({sourceId}) => sourceId)));
    for (const source of sources) assert.ok(evidence.has(source), source);
  }
});
