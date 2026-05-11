/// <reference path="isettings.d.ts" />
"use strict";
import WitClient = require("TFS/WorkItemTracking/RestClient");
import WitContracts = require("TFS/WorkItemTracking/Contracts");
import { formatCurrency, FormatStyle } from "./formatCurrency";

interface Bucket { key: string; count: number; sum: number; }

export class CostRollUpWidget {
    private client = WitClient.getClient();

    constructor(public WidgetHelpers: any) { }

    public load(widgetSettings: any) { return this.run(widgetSettings); }
    public reload(widgetSettings: any) { return this.run(widgetSettings); }

    private async run(widgetSettings: any): Promise<any> {
        const $title = document.querySelector(".title-header") as HTMLElement;
        $title.textContent = widgetSettings.name;

        let s: ISettings;
        try { s = JSON.parse(widgetSettings.customSettings.data); }
        catch (e) { this.showPanel("configure"); return this.WidgetHelpers.WidgetStatusHelper.Success(); }

        if (!s.queryId || !s.groupByRef || !s.aggregateRef) {
            this.showPanel("configure");
            return this.WidgetHelpers.WidgetStatusHelper.Success();
        }

        this.showPanel("loading");

        try {
            const projectId = VSS.getWebContext().project.id;
            const project = VSS.getWebContext().project.name;
            const result = await this.client.queryById(s.queryId, projectId);
            const ids = this.extractIds(result);

            if (ids.length === 0) {
                this.renderEmpty(s);
                this.showPanel("content");
                return this.WidgetHelpers.WidgetStatusHelper.Success();
            }

            const buckets = await this.aggregateInBatches(ids, s.groupByRef, s.aggregateRef);
            const sorted = buckets.sort((a, b) => b.sum - a.sum);
            const sliced = s.maxRows > 0 ? sorted.slice(0, s.maxRows) : sorted;

            this.render(sliced, sorted, s, project);
            this.showPanel("content");
            return this.WidgetHelpers.WidgetStatusHelper.Success();
        } catch (err) {
            console.error(err);
            this.showPanel("error");
            return this.WidgetHelpers.WidgetStatusHelper.Success();
        }
    }

    private extractIds(result: WitContracts.WorkItemQueryResult): number[] {
        if (result.workItems?.length) { return result.workItems.map(w => w.id); }
        if (result.workItemRelations?.length) {
            const set: Record<number, boolean> = {};
            result.workItemRelations.forEach(r => { if (r.target?.id) { set[r.target.id] = true; } });
            return Object.keys(set).map(k => parseInt(k, 10));
        }
        return [];
    }

    /** Stream-aggregate: hold one batch at a time, never the full result set. */
    private async aggregateInBatches(ids: number[], groupRef: string, aggRef: string): Promise<Bucket[]> {
        const map = new Map<string, Bucket>();
        const fields = [groupRef, aggRef];

        for (let i = 0; i < ids.length; i += 200) {
            const chunk = ids.slice(i, i + 200);
            const items = await this.client.getWorkItems(chunk, fields, null, null);
            for (const item of items) {
                const key = groupKey(item.fields?.[groupRef]);
                const val = toNumber(item.fields?.[aggRef]);
                const b = map.get(key);
                if (b) { b.count++; b.sum += val; }
                else   { map.set(key, { key, count: 1, sum: val }); }
            }
        }
        return Array.from(map.values());
    }

    private render(rows: Bucket[], all: Bucket[], s: ISettings, project: string): void {
        const $table = document.getElementById("table") as HTMLTableElement;
        const $foot  = document.getElementById("hint")  as HTMLElement;

        const grandSum   = all.reduce((a, b) => a + b.sum, 0);
        const grandAbs   = all.reduce((a, b) => a + Math.abs(b.sum), 0);   // sum of magnitudes
        const grandCount = all.reduce((a, b) => a + b.count, 0);

        const fmt = (n: number) => formatCurrency(n, s.currency, s.style as FormatStyle);

        let html = `
            <thead>
              <tr>
                <th class="col-group">${escapeHtml(s.groupByLabel || "Group")}</th>
                <th class="col-count">Projects</th>
                <th class="col-sum">${escapeHtml(s.aggregateLabel || "Total")}</th>
                <th class="col-pct">%</th>
              </tr>
            </thead>
            <tbody>`;
        rows.forEach(r => {
            const pct = grandAbs > 0 ? Math.round((Math.abs(r.sum) / grandAbs) * 100) : 0;
            html += `<tr>
                <td class="col-group" title="${escapeHtml(r.key)}">${escapeHtml(r.key)}</td>
                <td class="col-count">${r.count}</td>
                <td class="col-sum">${fmt(r.sum)}</td>
                <td class="col-pct">${pct}%</td>
              </tr>`;
        });
        html += `</tbody>
            <tfoot>
              <tr>
                <td class="col-group"><strong>Total</strong></td>
                <td class="col-count"><strong>${grandCount}</strong></td>
                <td class="col-sum"><strong>${fmt(grandSum)}</strong></td>
                <td class="col-pct"><strong>100%</strong></td>
              </tr>
            </tfoot>`;
        $table.innerHTML = html;

        $foot.hidden = !(s.maxRows === 0 && all.length > 50);
        if (!$foot.hidden) { $foot.textContent = `${all.length} groups. Consider setting Max Rows or grouping by a higher-level field.`; }
    }

    private renderEmpty(s: ISettings): void {
        const $table = document.getElementById("table") as HTMLTableElement;
        $table.innerHTML = `<tbody><tr><td class="empty">No work items found in the selected query.</td></tr></tbody>`;
    }

    private showPanel(which: "content" | "loading" | "configure" | "error"): void {
        ["content", "loading", "configure", "error"].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.display = id === which ? "" : "none"; }
        });
    }
}

function groupKey(value: any): string {
    if (value == null || value === "") { return "(unassigned)"; }
    if (typeof value === "object" && value.displayName) { return value.displayName; }
    return String(value);
}

function toNumber(raw: any): number {
    if (raw == null || raw === "") { return 0; }
    if (typeof raw === "number") { return Number.isFinite(raw) ? raw : 0; }
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
}

function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

VSS.ready(() => {
    VSS.require(["TFS/Dashboards/WidgetHelpers"], (WidgetHelpers: any) => {
        WidgetHelpers.IncludeWidgetStyles();
        VSS.register("cost-rollup-widget", () => new CostRollUpWidget(WidgetHelpers));
        VSS.notifyLoadSucceeded();
    });
});