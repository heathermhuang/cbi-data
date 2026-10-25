# Maintenance

A daily deterministic GitHub workflow compares the merged reviewed source registry.
It has no model calls and cannot change factual claims or review dates. Public PR
checks run offline with read-only tokens and no deployment/private-source secrets.
Only merged main code performs network probes. Actions are pinned to immutable SHAs.

Hard limits: 100 unique/redirect/retry requests, concurrency two globally and one
per host; 20-second request deadline; three same-host redirects; streamed 8 MiB
HTML/text or 20 MiB PDF cap; one retry for transient failures. DNS is checked for
public addresses and pinned to the checked answer for the TLS request. Credentials,
unapproved authorities, ports, local/private DNS and cross-host redirects fail.
Conditional validators and stable byte normalization reduce unchanged work. PDF
hashing is a retrieval observation; full PDF interpretation remains manual.

Unattempted and oldest-attempt work is serviced before repeats; oldest successful retrieval breaks ties. Failed sources cannot starve untouched backlog. Failures remain visible. Retry-After defers work. Source hashes and safe health transitions use a
monitor-state branch; routine successful fetch timestamps remain in bounded run
artifacts. No full pages, private notes, tokens or application material are stored.
Changed sources stay pending until a maintainer evidence decision. The weekly
legislation/operational-notice discovery task is explicitly manual, not falsely
reported as completed by the hash monitor. Every included source has a manual
review schedule in addition to retrieval monitoring.

Review targets: status/temporary offers seven days, costs/travel fourteen, other
eligibility/duties thirty (stricter fourteen-day migrated defaults are retained).
The API computes overdue flags from pinned data, not a mutable live monitor branch.
No freshness SLA or guaranteed maintenance capacity is offered. Before expanding
scope, measure review backlog and reviewer minutes. Record aggregate request,
error, release and payload metrics without applicant details or query text.
No paid capacity commitment is made here; hosting costs require measured usage.

After thirty days, assess independent pinned integrations, repeat usage, accepted
factual corrections and review time separately from synthetic tests or stars.
Expansion to residence/global travel remains gated by evidence and capacity.

Latest public checkpoint: [monitor-state summary](https://github.com/heathermhuang/cbi-data/blob/monitor-state/latest.json). Immutable releases retain their dated health observations; the API does not fetch this live branch.

The scheduled workflow runs reviewed default-branch maintenance code. A monitor-only patch does not change immutable data artifacts, query-library bytes or factual review dates.
