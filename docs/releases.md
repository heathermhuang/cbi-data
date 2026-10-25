# Releases and integrity

API v1, schema 0.1.0, software 0.1.0, dataset 2026-10-25.1 are independently
versioned. A correction requires a new immutable dataset ID and GitHub tag.
The manifest records the public canonical source commit, normalized-input hash,
fixed generation time, build-tool/package versions, coverage and file SHA-256s.
`SHA256SUMS` also covers the manifest. CSV JSON-valued fields retain qualifications;
formula-leading display values are escaped without altering typed canonical JSON.

Build from the exact source tag with Node 24: npm ci --ignore-scripts; npm run check.
Compare two independent output trees with their SHA256SUMS. Scan the exact public
Git tree, package tarball and dataset/source archives. A public release contains
JSON shards, CSV, schemas, code/CLI, lockfile and reproducible instructions.
No private source is required by public CI or examples.

Initially the one public release is hosted. Retain all public archives; host the
current and previous three once available. Withdrawn releases remain identifiable
in the index and return 410. Older downloadable data need not remain query-hosted.
A factual correction normally publishes another release rather than overwriting
bytes. A software rollback restores code and default release together. Website
and research service are separate deployments: publish explicit release support,
verify identical manifests, then promote discovery/defaults after matching pins.

npm namespace availability is checked separately from ownership/publication access.
This release uses GitHub artifacts; no npm registry release is asserted.

A source archive has no Git metadata. Set CBI_SOURCE_COMMIT to the exact public commit recorded in the release manifest when rebuilding from that archive; a tagged Git checkout discovers its own commit. This changes provenance metadata only, never factual values or review dates.
