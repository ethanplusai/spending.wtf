# Expanding into a durable spending investigation platform

This document distinguishes the working release from the next integrations. The current application includes contracts, grants, direct payments, other assistance, loans, source-wide aggregate queries, subawards, nonprofit financials, historical budget classifications, entity grouping within loaded records, macroeconomic history, national state/local expenditure aggregates, and a source directory. See [the current expansion record](expansion-v4.md). It does not claim to have already built the warehouse described below.

## 1. Federal award and transaction warehouse

Keep USAspending as the primary federal ledger. Its [documented API](https://api.usaspending.gov/docs/endpoints) exposes awards, transactions, subawards, recipient identities, funding accounts, agency rollups, and bulk exports.

Use bulk files for initial backfill and broad analysis; use APIs for focused drilldowns and incremental freshness. A nationwide warehouse should not be populated by pretending the top 50 search results represent the universe. Preserve negative obligations, amendments, source corrections, cancellation events, IDVs, and parent-child award relationships.

Proposed storage layers:

| Layer | Records | Required behavior |
|---|---|---|
| Immutable raw archive | Original downloads, request filters, HTTP/source metadata, hashes | Reproduce every displayed result from a specific source vintage |
| Normalized ledger | Awards, transactions, payments, subawards, accounts, recipients | Preserve accounting measure and avoid collapsing flows into stocks |
| Entity index | UEI, legacy DUNS, agency codes, jurisdiction vendor IDs | Exact source identifiers first; explicit uncertainty for inferred matches |
| Materialized aggregates | Agency/time/geography/category totals | Reconcile against official totals with documented scope differences |
| Research layer | Evidence sets, annotations, candidate anomalies, review status | Save the query, source version, rule version, and counterevidence |

A PostgreSQL schema could start with the following entities (amounts stored as exact decimal values, not floating-point):

```sql
CREATE TABLE source_snapshot (
  id uuid PRIMARY KEY,
  source_name text NOT NULL,
  source_url text NOT NULL,
  retrieved_at timestamptz NOT NULL,
  published_at timestamptz,
  request_filters jsonb NOT NULL,
  content_sha256 text NOT NULL,
  raw_object_uri text NOT NULL,
  schema_version text NOT NULL
);
CREATE TABLE jurisdiction (
  id text PRIMARY KEY,
  name text NOT NULL,
  government_level text NOT NULL,
  parent_id text REFERENCES jurisdiction(id),
  fiscal_year_end_month integer CHECK (fiscal_year_end_month BETWEEN 1 AND 12)
);
CREATE TABLE entity (
  id uuid PRIMARY KEY,
  canonical_name text NOT NULL
);
CREATE TABLE entity_identifier (
  namespace text NOT NULL,
  identifier text NOT NULL,
  entity_id uuid NOT NULL REFERENCES entity(id),
  source_snapshot_id uuid NOT NULL REFERENCES source_snapshot(id),
  PRIMARY KEY (namespace, identifier)
);
CREATE TABLE award (
  source_namespace text NOT NULL,
  source_award_id text NOT NULL,
  recipient_id uuid REFERENCES entity(id),
  awarding_jurisdiction text REFERENCES jurisdiction(id),
  parent_award_id text,
  start_date date,
  end_date date,
  snapshot_id uuid NOT NULL REFERENCES source_snapshot(id),
  PRIMARY KEY (source_namespace, source_award_id, snapshot_id)
);
CREATE TABLE ledger_transaction (
  namespace text NOT NULL,
  source_transaction_id text NOT NULL,
  source_award_id text,
  action_date date NOT NULL,
  measure text NOT NULL CHECK (measure IN ('obligation','outlay','payment','receipt')),
  amount numeric(24,2) NOT NULL,
  currency char(3) NOT NULL DEFAULT 'USD',
  fiscal_year integer,
  jurisdiction_id text REFERENCES jurisdiction(id),
  snapshot_id uuid NOT NULL REFERENCES source_snapshot(id),
  PRIMARY KEY (namespace, source_transaction_id, snapshot_id)
);
CREATE TABLE evidence_relationship (
  id uuid PRIMARY KEY,
  from_entity uuid NOT NULL REFERENCES entity(id),
  to_entity uuid NOT NULL REFERENCES entity(id),
  relationship_type text NOT NULL,
  basis text NOT NULL,
  review_status text NOT NULL,
  snapshot_id uuid NOT NULL REFERENCES source_snapshot(id)
);
```

Before production use, add migrations, indexes, row-level authorization for private research, retention policies, a current-version view, and reconciliation jobs. Schema snippets here are design proposals, not an applied production database.

**Acceptance criteria:** an award's full modification history is reproducible; an API page and a bulk import agree for the same record/vintage; duplicate source IDs cannot inflate totals; partial refreshes cannot publish; loaded coverage and freshness are visible; period obligations reconcile to the corresponding source aggregate within justified differences.

## 2. Evidence-backed investigative features

Expand the current procurement detail panel into versioned research signals. These should generate questions, not accusations.

| Candidate signal | Needed fields and comparison | Required caveat / corroboration |
|---|---|---|
| One reported offer | Offer count, competition status, solicitation and amendment history | One bidder alone does not establish an improper procurement |
| Repeated noncompetitive awards | Competition exception, recipient, agency, PSC, time window | Emergency, sole-source technical, and statutory exceptions must remain visible |
| Large modifications | Transaction obligations, base/options values, dates, original scope | Inflation, option exercise, legitimate scope changes, and corrections matter |
| Year-end concentration | Transaction dates and amounts over multiple fiscal years | Appropriation expiration creates lawful seasonality; use agency/category baselines |
| Recipient concentration | Recipient and parent identities, category, agency, whole-universe denominator | A top-results page cannot establish market share |
| Apparent duplicate payments | Payment ID, invoice, amount, dates, payee, reversals | Similar transactions and canceled/reissued payments can be legitimate |
| Price anomalies | Verified quantity, unit, specification, labor/services scope, comparable contracts | Never estimate a unit price by setting missing quantity to one |

Do not calculate a composite “fraud probability” without a validated labeled dataset, evaluation protocol, and calibrated error rates. Every signal needs a versioned rule, denominator, missingness rate, explanation, source record, and review disposition.

Use [Oversight.gov](https://www.oversight.gov/) and individual inspector general reports as corroborating evidence, with exact document citations. SAM entity/exclusion integration may require credentials and compliance with provider terms. FEC records could support disclosed contribution research, but name similarity must not be presented as identity or corruption. These are future integrations, not current claims.

## 3. State and local expansion

The implemented OMB Table 14.2 series supplies national own-source expenditure context. To compare individual jurisdictions, begin with the [Census Annual Survey of State and Local Government Finances](https://www.census.gov/programs-surveys/gov-finances.html). It provides a standardized statistical framework, whereas local checkbooks provide transaction detail. The two serve different questions.

Recommended integration sequence:

1. **Census jurisdiction aggregates:** revenue, expenditure, debt, intergovernmental transfers; preserve survey year, government unit, estimates, and reporting coverage. Do not label estimates as audited checkbook transactions.
2. **New York State:** [Open Book New York](https://www.osc.ny.gov/open-book-new-york) provides state contract/payment tools and local-government financial data. Treat payment, contract, and authority datasets as distinct ledgers.
3. **New York City:** [Checkbook NYC](https://www.checkbooknyc.com/) provides a bounded municipal starting point. Validate available export/API methods and reporting semantics before building an adapter.
4. **Texas and California:** source discovery via the [Texas Comptroller](https://comptroller.texas.gov/transparency/) and [California Open Data](https://data.ca.gov/), followed by individually validated datasets. Catalog presence is not proof of complete expenditure coverage.
5. Expand only after the prior adapters reconcile, rather than showing an unsupported nationwide transaction coverage badge.

Each adapter must declare:

- covered jurisdictions, agencies, exclusions, reporting periods, and release cadence;
- cash versus accrual basis; expenditure versus commitment versus authorization;
- gross amounts, refunds, reversals, amendments, and transfer treatment;
- source identifiers and their stability over time;
- original currency/unit, timezone/date semantics, and fiscal-year boundaries;
- license/terms, access method, rate budgets, and any credentials;
- reconciliation totals, known gaps, and last successful refresh.

**Avoid double counting:** a federal grant to a state, a state transfer to a city, and the city's vendor payment can represent different stages of the same funding flow. Store transfer edges and stage-specific measures. Publish separate views for originating funding and ultimate expenditure. Never sum all stages as independent spending.

**Entity resolution:** exact UEI or jurisdiction vendor IDs are strong evidence within their namespaces. Legacy IDs, names, addresses, corporate parents, and subsidiaries need dated provenance. Fuzzy name matches belong in a candidate review queue. A similar address is not an ownership relationship.

## 4. Research collaboration and tracking

Browser-local bookmarks work in the implemented release. A next shared-research release should add authenticated workspaces, evidence snapshots, annotations, saved queries, diff-based alerts, private/public visibility, and audit logs. Notifications require user opt-in and should report a record change, not imply wrongdoing.

Debt and macroeconomic tracking should publish the last reported observation, source cadence, and revision history. Forecasts, scenarios, and hypothetical policy changes must be visually separated from reported data. A continuously animated debt clock would be an estimate, so this release deliberately uses reported observations.

## 5. Operational release gates

- Immutable, reproducible datasets with a validated snapshot manifest.
- Reconciliation tests and explicit source-contract/schema checks.
- Partial-failure isolation; bounded retries; provider-aware caching and rate limits.
- Clear unavailable, stale, revised, and provisional states.
- Keyboard and screen-reader review in addition to automated accessibility checks.
- Query performance measured against realistic full-universe datasets.
- Export provenance and accounting definitions attached to every research package.
- Coverage documented honestly at jurisdiction and dataset level.
