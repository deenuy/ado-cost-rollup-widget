## Overview

Azure DevOps dashboards show what work is happening — counts, status, burndown — but provide no built-in way to roll up a numeric field across a query and display the total. Teams tracking budgets, cost estimates, or business impact end up exporting work items to Excel or building Power BI reports just to see totals.

This widget fills that gap. Pick a saved query, pick a field to group by (team, area, portfolio, status, owner), and pick a numeric field to sum (budget, estimated cost, business impact). The widget aggregates work items into buckets and renders the totals as formatted currency, with item counts and percentage of the grand total.

The widget is dashboard-native. It uses your existing queries, reads only the fields it needs, and renders inline with other widgets. No external services, no telemetry, no data leaves your Azure DevOps tenant.

## Typical uses

- Total budget by business unit
- Estimated versus actual cost by team
- Business impact rolled up by portfolio area
- Project cost by status (Active, On Hold, Completed)
- Funding distribution across initiatives