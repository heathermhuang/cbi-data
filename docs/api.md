# HTTP API v1

Anonymous GET/HEAD under `https://cbi.me/api/v1`. OPTIONS permits public GET CORS
without credentials. Unknown and duplicate query parameters are rejected.
`release=2026-10-25.1` pins the first release; omission uses and echoes the default.
Every successful data response includes schemaVersion, datasetRelease, generatedAt,
evaluatedAt, coverage, warnings and data. Optional `include=evidence` adds source
metadata without stripping the original qualifications and revision references.

| Route | Parameters |
| --- | --- |
| `/programmes` | kind=citizenship, jurisdiction (ISO3), stage=published_application_route or published_with_limits, limit 1–50, cursor |
| `/programmes/{id}` | id or legacy alias |
| `/compare` | ids (2–4 distinct comma-separated IDs), scenario |
| `/programmes/{id}/costs` | option (belongs to programme), scenario |
| `/travel-rules` | passport (ISO3), destination=GBR/USA/CAN/SCHENGEN_SHORT_STAY, documentType=ordinary, purpose=short_visit, transport=air/land/sea/unknown, qualifyingVisa=yes/no/unknown |
| `/sources/{id}` | exact source ID |
| `/changes` | from, to (both retained release IDs), programme, limit, cursor |
| `/coverage` | release only |
| `/releases` | limit, cursor |
| `/releases/{id}` | exact hosted release ID |
| `/openapi.json` | no parameters; root guide OpenAPI is preserved |

Pagination defaults to 20, orders by stable ID and binds cursors to release,
operation and filters. The first release has no previous public release:
changes from/to the same release is empty; the archive records the baseline
as new_coverage, not a retroactive law-change event.

Domain outcomes are HTTP 200: supported, conditional, insufficient_evidence,
conflicting_evidence, not_covered, unsupported_scenario. Errors: 400 malformed or
unsupported input; 404 unknown record/release; 410 withdrawn/retired release;
413 excessive URL/payload; 405 wrong method; 406 incompatible response type;
429 platform limit; 503 data/dependency failure. No transport error invents a fact.
Identifiers are at most 64 safe characters (`[A-Za-z0-9][A-Za-z0-9._-]*`).
URL limit 8 KiB; response bound 128 KiB. Use individual record queries for detail.
Travel target 12 KiB and four-programme summary target 64 KiB are tested.

Query responses use no-store with representation SHA-256 ETags. Evaluation dates
can change on a new request; no cache extends an expiry or review boundary.
Release downloads are immutable and checksummed. Evidence/conditions are never
removed to force a response below its bound. No arbitrary URL or field expression
is accepted, and no government/GitHub fetch or model call occurs on a query path.
