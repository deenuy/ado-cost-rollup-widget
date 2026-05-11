## Overview

Azure DevOps dashboards excel at tracking work status — counts, burndowns, velocity — but offer no built-in way to **roll up a numeric field** across a query and display the total. Teams tracking budgets, cost estimates, or business impact end up exporting to Excel or building Power BI reports just to see a simple sum.

**Cost Roll-Up** fills that gap — directly on your dashboard.

Point it at any saved query, choose a field to group by, and a numeric field to sum. The widget aggregates work items into groups and renders totals as **formatted currency** — with item counts and percentage of the grand total — all inline with your existing dashboard widgets.

<img src="docs/images/Widget-Demo.png" alt="Widget Demo" width="450" />

---

## Key Features

- **Query-driven** — uses your existing saved queries. No separate query language to learn.
- **Type-aware field pickers** — group-by shows only string-like columns; aggregate shows only numeric fields. Invalid combinations cannot be configured.
- **Multi-currency support** — USD, EUR, GBP, INR, JPY, CAD, AUD, BRL, ZAR, and more (ISO 4217).
- **Two display formats** — `Compact` (`$2K`, `$1.5M`) for at-a-glance views, or `Full` (`$2,000`, `$1,500,000`) when precision matters.
- **Handles negative values** — displays `-$50K` for cost reductions or credits.
- **Native look and feel** — built with Fluent UI conventions to blend seamlessly with Azure DevOps built-in widgets.
- **Efficient at scale** — streams work items in batches of 200. Handles 10K+ items without blocking the UI.

---

## Getting Started

1. Install the extension from the Marketplace → **Get it free** → select your organization.
2. Open any team dashboard → **Edit** → **Add a widget** → search **Cost Roll-Up**.
3. Click the widget gear icon → **Configure**.

<img src="docs/images/Configuration-Demo.png" alt="Configuration" width="350" />

| Option | Description |
|---|---|
| **Title** | Display title on the widget header (e.g., `FY26 Business Value (Revenue Growth)`). |
| **Width / Height** | Widget dimensions on the dashboard grid. |
| **Query** | Any saved query under Shared Queries or My Queries. |
| **Group by** | A string-like column from the query (Area Path, Team, Status, Owner, etc.). |
| **Aggregate** | An Integer or Double column from the query (Business Value, Estimated Cost, etc.). |
| **Currency** | ISO 4217 currency code (default: USD). |
| **Format** | Compact (`$2K`) or Full (`$2,000`). |
| **Max rows** | Limit visible groups. `0` = show all. |

---

## Typical Use Cases

- **Budget roll-up by business unit** — see total planned spend per area.
- **Business impact by portfolio area** — aggregate cost reduction, revenue growth, or efficiency gains.
- **Project cost by status** — compare Active, On Hold, and Completed investment.
- **Estimated vs. actual cost by team** — track forecast accuracy across delivery teams.
- **Funding distribution across initiatives** — visualize allocation at a glance.

---

## Format Examples

| Value | Compact (USD) | Full (USD) | Compact (EUR) |
|---|---|---|---|
| 2,000 | `$2K` | `$2,000` | `€2K` |
| 245,678 | `$246K` | `$245,678` | `€246K` |
| 1,500,000 | `$1.5M` | `$1,500,000` | `€1.5M` |
| -50,000 | `-$50K` | `-$50,000` | `-€50K` |

---

## Privacy and Security

This widget runs inside an Azure DevOps-provided iframe with the `vso.work` scope. It reads only the fields needed for the configured query and aggregation. **No external network calls. No telemetry. No data leaves your Azure DevOps tenant.**

---

## Learn More

- [Source code and documentation on GitHub](https://github.com/deenuy/ado-cost-rollup-widget)
- [Report an issue](https://github.com/deenuy/ado-cost-rollup-widget/issues)
- [Contributing guidelines](https://github.com/deenuy/ado-cost-rollup-widget/blob/main/CONTRIBUTING.md)