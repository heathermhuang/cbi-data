# CBI Data

Dated, evidence-qualified investment citizenship research for eleven programmes.
The original public compilation is authoritative for its migrated CBI.me claims.
It includes **44 ordinary-passport policy lookup slots** for the UK, US, Canada
and Schengen short stays. These are qualified slots, not 44 unconditional waivers.
Every required programme field has evidence or an explicit incomplete state.

This first release retains dated editorial reviews with partial verification;
it does not claim a newly completed legal audit. Conflicting Saint Lucia prices,
São Tomé adult-dependant issuance limits, US issuance exceptions and conditional
Canadian air eTA access remain explicit. Costs return exact known subtotals by
currency and a null comprehensive total. Eligibility and admission are separate.

## Reproduce a pinned release

Requires Node 24 LTS. No maintainer account, private repository or API key needed.

```sh
git clone --branch data-2026-10-25.1 https://github.com/heathermhuang/cbi-data.git
cd cbi-data
npm ci --ignore-scripts
npm run check
node examples/compare.mjs
node examples/travel-rule.mjs
node examples/mcp-client.mjs
```

Use the GitHub Release dataset archive and `SHA256SUMS` for static JSON/CSV.
The package tarball can be installed locally; npm registry publication is not
required. Never substitute an unversioned installer for the pinned example.

```sh
curl -fsS 'https://cbi.me/api/v1/travel-rules?passport=ATG&destination=CAN&release=2026-10-25.1'
curl -fsS 'https://cbi.me/api/v1/coverage?release=2026-10-25.1'
```

Remote MCP: `https://cbi.me/mcp` (Streamable HTTP, anonymous public reads).
Local MCP: `node /absolute/path/to/cbi-data/src/cli/stdio.mjs` after the pinned
checkout and build above. Stdout contains protocol messages only.

Eight tools: `list_programmes`, `get_programme`, `compare_programmes`,
`get_programme_costs`, `get_travel_rule`, `get_source`, `get_changes`, `get_coverage`.
The hosted service also retains its four existing guide tools. The standalone
adapter has no private workspace tools, accounts, bindings or storage.

See [API](docs/api.md), [MCP](docs/mcp.md), [methodology](docs/methodology.md),
[coverage](docs/coverage.md), [maintenance](docs/maintenance.md),
[releases](docs/releases.md) and [contributing](CONTRIBUTING.md).

Original code MIT; original compilation CC BY 4.0. Linked sources retain rights.
