# Dated programme activity

Dataset 2026-11-15.3 adds 34 statistics subjects, 72 observations and 21
source records. The eleven retail programme records and their legal, price,
family, travel and intake claims are unchanged. Historical and discretionary
statistics subjects do not expand that retail comparison's legal scope.

`data/statistics.json` is an independently authored factual compilation from
public reports and attributed public reporting. It contains no paid matrices,
private briefings, original PDFs, transcripts or personal applicant records.
The collection's sources have their own rights notes; the existing legal source
catalogue and its publisher exclusions retain their scope.

Passports issued count documents. Citizenship grants count people. Approved
applications count files that can include a family. Revocations and historical
passport-sales estimates have separate measures. Tuvalu and Kiribati document
schemes do not confer nationality; irregular historical sales are not classified
as formal programmes. All subjects retain a null unqualified passport total.
Dated observations, with period and population, are the usable measurements.

Exact source figures, approximate estimates, archived official documents,
statements reported through press and derived values are distinct. No arbitrary
household multiplier or revenue-based passport estimate is used. Missing
observations remain unknown. The Commission's 107,625 regional headline does
not reconcile with its country rows; no regional or worldwide total is chosen.

Derived values identify inputs and their disjointness basis. The validator
checks units, same subject/measure, original inputs, sums and non-overlapping
reporting intervals or distinct source categories. New calculations require
editorial evidence that the categories are actually disjoint. A successful
numeric check cannot supply that evidence. Some counts omit years or precede
the programme's inception; covered-period sums are not certified lifetime totals.

Use `GET /api/v1/statistics/vu?include=evidence` or the read-only
`get_programme_statistics` MCP tool with `{ "id": "vu", "include": "evidence" }`.
Identifiers accept the statistics subject ID or its documented website alias.
Optional `measure`, `limit`, `cursor` and `release` filters are strict. The response
retains units, periods, qualifications, review dates and explicit unknown states.
An older release without this collection returns `not_covered`, not an invented
zero. All seven releases remain hosted for existing clients.

The immutable release includes `statistics.json`, long-form `statistics.csv`,
the schema, source/observation revision IDs and change events. Software 0.2.1
adds one operation without changing the previous eight tools. No query fetches
external sources, uses a model or accesses a private store.

The existing deterministic monitor now watches the public reports and two report
archives. A changed hash queues review; it does not advance measurement dates,
review dates or legal status. Review dates describe source inspection, and are
separate from activity cutoffs, document publication and release generation.

## Estimates through 15 November 2026

Eight current, low-confidence CBI.me model estimates supplement the last reported
figures for Antigua and Barbuda, Dominica, Grenada, Saint Kitts and Nevis,
Saint Lucia, Vanuatu, Türkiye and Nauru. This is an editorial modelling choice,
not a claim that governments supplied new 2026 totals. São Tomé's September 2026
report remains a recent observation; Egypt and El Salvador lack a sufficiently
defined series to project. Historical closed programmes retain their final dated
figures rather than extrapolating after closure.

Each optional `estimate` record names a reported baseline and a same-measure
historical rate. The central value is baseline + rate value × days since baseline
/ rateDays. The sensitivity endpoints assume zero and twice the historical rate
for that gap. Endpoints round outward; the centre rounds to the nearest stated
step. These are transparent scenarios, not calibrated confidence intervals or
known bounds. There is no household, revenue or cross-country multiplier.

Saint Lucia's nine annual approval rows sum to 5,297 application files through
31 March 2025; the model uses the latest 2,278 files/year to project the gap.
It does not convert those files into people or passport documents. The 2026 cap
and transitional exemptions are acknowledged; assumed use of a legal ceiling
is not treated as observed activity.

The four Caribbean document estimates preserve missing historical years and
ambiguity over first issues/renewals. Dominica still omits 2022 and pre-2018;
none becomes a certified lifetime total. Vanuatu's 2015–2021 average is almost
five years old and especially weak after visa and programme changes. Türkiye
uses gross grants since 2018 and does not deduct differently dated revocations
or claim a current citizenship stock. Nauru's launch-year pace is volatile.
Actual outcomes can fall outside every sensitivity range.

Estimates are frozen as of the named date with a one-month review target.
Page load, source review and release generation never silently advance the
estimate date. Core, API, MCP, JSON and CSV retain the same model inputs and
reported baseline. Existing release 2026-11-15.1 remains byte-for-byte unchanged.
