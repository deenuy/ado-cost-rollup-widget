# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] — 2026-05-10

### Fixed
- Percentage column showed 0% for all rows when the grand total was zero or negative. Now uses sum of absolute values (magnitude) as the denominator, so each row's percentage represents its share regardless of sign. The signed total still displays correctly in the sum column.

## [1.0.0] — 2026-05-10

Initial production release.

### Added
- Dashboard widget that aggregates work items by a string-like field and sums a numeric field, rendered as formatted currency (`$2K`, `€1.5M`, `₹245K`).
- Configuration pane with type-aware field pickers: group-by dropdown filtered to string, identity, tree-path, boolean, and picklist columns; aggregate dropdown filtered to Integer and Double.
- Query picker that enumerates Shared and My Queries via a single `getQueries` call.
- Per-binding currency selection (USD, EUR, GBP, JPY, INR, CAD, AUD, BRL, ZAR, and more — full ISO 4217 fallback for unknown codes).
- Two format styles: `compact` (`$2K`, `$1.5M`) and `full` (`$2,000`, `$1,500,000`).
- Configurable column headers for both the group and aggregate columns.
- Max-rows control with `0 = all`, plus an automatic hint when results exceed 50 groups.
- Identity field grouping that displays `displayName` instead of the raw object.
- Null/empty group values bucketed as `(unassigned)`.
- Grand-total footer row with item count, summed total, and 100% reference.
- Per-row percentage of grand total.
- Loading, empty, configure-needed, and error states with native-feeling messaging.
- Dark mode via `prefers-color-scheme`.
- Fluent UI alignment for both the widget tile and configuration dialog (sentence-case labels, 2px input radius, custom select chevrons, hover/focus states matching ADO's native widgets).
- Eight supported widget sizes from 2×2 to 4×5.

### Performance
- Stream-aggregation via `Map<string, Bucket>` — never materializes the full work item array. Memory stays under ~70 KB for 10K work items.
- Work items fetched in batches of 200 IDs, requesting only the two fields needed (`groupByRef`, `aggregateRef`).
- Field-type metadata cached for the configuration session — single `getFields(project)` call regardless of how many times the user changes the query selection.

### Security
- Scope limited to `vso.work` (read work items the user already has access to).
- No telemetry, no external network calls, no third-party CDN dependencies.

### Compatibility
- Azure DevOps Services (all current versions).
- Azure DevOps Server 2018+ (TFS 15.0+).
- Modern browsers (Chrome 90+, Edge 90+, Firefox 88+, Safari 14+).
- Node 18+ for building from source.