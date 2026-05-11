/// <reference path="isettings.d.ts" />
"use strict";
import WitClient = require("TFS/WorkItemTracking/RestClient");
import WitContracts = require("TFS/WorkItemTracking/Contracts");

type ColumnKind = "groupBy" | "aggregate";

interface QueryColumn {
    referenceName: string;
    name: string;
    type: string;
}

const GROUP_BY_TYPES = ["string", "treepath", "identity", "boolean", "picklist", "picklistinteger", "pickliststring"];
const AGGREGATE_TYPES = ["integer", "double"];

export class Configuration {
    private ctx: any = null;
    private client = WitClient.getClient();
    private current: ISettings = blankSettings();
    private fieldTypeMap = new Map<string, string>();

    constructor(public WidgetHelpers: any) { }

    public load(widgetSettings: any, widgetConfigurationContext: any) {
        this.ctx = widgetConfigurationContext;
        try { this.current = { ...blankSettings(), ...JSON.parse(widgetSettings.customSettings.data) }; }
        catch (e) { /* first load */ }

        const project = VSS.getWebContext().project.name;
        this.bindEvents();
        this.populateQueries(project);
        this.populateCurrency();
        this.populateStyle();
        this.setValue("max-rows", String(this.current.maxRows || 0));

        return this.WidgetHelpers.WidgetStatusHelper.Success();
    }

    public onSave() {
        const s = this.readForm();
        if (!s.queryId || !s.groupByRef || !s.aggregateRef) {
            return this.WidgetHelpers.WidgetConfigurationSave.Invalid();
        }
        return this.WidgetHelpers.WidgetConfigurationSave.Valid({ data: JSON.stringify(s) });
    }

    // -----------------------------------------------------------------

    private bindEvents(): void {
        document.getElementById("query")!.addEventListener("change", () => this.onQueryChange());
        ["group-by", "aggregate", "group-label", "agg-label", "currency", "style", "max-rows"]
            .forEach(id => document.getElementById(id)!.addEventListener("change", () => this.notify()));
        document.getElementById("agg-label")!.addEventListener("input", () => this.notify());
        document.getElementById("group-label")!.addEventListener("input", () => this.notify());
    }

    private populateQueries(project: string): void {
        const $q = document.getElementById("query") as HTMLSelectElement;
        $q.disabled = true;
        $q.innerHTML = `<option value="">Loading queries…</option>`;

        this.client.getQueries(project, WitContracts.QueryExpand.None, 2, false).then(
            (roots) => {
                const leaves: { id: string; path: string }[] = [];
                const collect = (n: WitContracts.QueryHierarchyItem) => {
                    if (!n.isFolder) { leaves.push({ id: n.id, path: n.path }); return; }
                    if (n.children) { n.children.forEach(collect); }
                };
                roots.forEach(collect);

                $q.innerHTML = "";
                const placeholder = document.createElement("option");
                placeholder.value = "";
                placeholder.textContent = "Select a query…";
                placeholder.disabled = true;
                placeholder.selected = !this.current.queryId;
                $q.appendChild(placeholder);

                leaves.sort((a, b) => a.path.localeCompare(b.path)).forEach(q => {
                    const o = document.createElement("option");
                    o.value = q.id;
                    o.textContent = q.path;
                    o.title = q.path;
                    $q.appendChild(o);
                });
                $q.disabled = false;

                if (this.current.queryId) {
                    $q.value = this.current.queryId;
                    this.loadColumns(this.current.queryId);
                }
            },
            (err) => {
                console.error(err);
                $q.innerHTML = `<option value="">Failed to load queries</option>`;
            }
        );
    }

    private onQueryChange(): void {
        const $q = document.getElementById("query") as HTMLSelectElement;
        const id = $q.value;
        if (!id) { return; }
        this.current.queryId = id;
        this.current.queryName = $q.options[$q.selectedIndex].textContent || "";
        this.current.groupByRef = "";
        this.current.aggregateRef = "";
        this.loadColumns(id);
        this.notify();
    }

    private async loadColumns(queryId: string): Promise<void> {
        const project = VSS.getWebContext().project.name;

        try {
            // Fetch the query (gives us columns) and the project's field list (gives us types).
            // Cache the field-type map across query changes — fields don't change per query.
            if (this.fieldTypeMap.size === 0) {
                const allFields = await this.client.getFields(project);
                allFields.forEach(f => this.fieldTypeMap.set(f.referenceName, fieldTypeName(f)));
            }

            const q = await this.client.getQuery(project, queryId, WitContracts.QueryExpand.Wiql, 0);
            const columns: QueryColumn[] = (q.columns || []).map(c => ({
                referenceName: c.referenceName,
                name: c.name,
                type: this.fieldTypeMap.get(c.referenceName) || ""
            }));

            this.populateColumnDropdowns(columns);
        } catch (err) {
            console.error(err);
            this.populateColumnDropdowns([]);
        }
    }

    private populateColumnDropdowns(columns: QueryColumn[]): void {
        const group = columns.filter(c => matches(c.type, GROUP_BY_TYPES));
        const agg = columns.filter(c => matches(c.type, AGGREGATE_TYPES));

        this.fillSelect("group-by", group, this.current.groupByRef, "Select a field…");
        this.fillSelect("aggregate", agg, this.current.aggregateRef, "Select a numeric field…");

        const $hint = document.getElementById("agg-hint")!;
        $hint.hidden = agg.length > 0;

        // Default labels from selected option's friendly name
        if (this.current.groupByRef) { this.setValue("group-label", this.current.groupByLabel || lookup(group, this.current.groupByRef)); }
        if (this.current.aggregateRef) { this.setValue("agg-label", this.current.aggregateLabel || lookup(agg, this.current.aggregateRef)); }
    }

    private fillSelect(id: string, cols: QueryColumn[], selectedRef: string, placeholder: string): void {
        const $s = document.getElementById(id) as HTMLSelectElement;
        $s.innerHTML = "";
        const p = document.createElement("option");
        p.value = ""; p.disabled = true; p.textContent = placeholder; p.selected = !selectedRef;
        $s.appendChild(p);

        cols.forEach(c => {
            const o = document.createElement("option");
            o.value = c.referenceName;
            o.textContent = c.name;
            o.setAttribute("data-name", c.name);
            $s.appendChild(o);
        });

        if (selectedRef && cols.some(c => c.referenceName === selectedRef)) {
            $s.value = selectedRef;
        }
        $s.disabled = cols.length === 0;
    }

    private populateCurrency(): void {
        const codes = ["USD", "EUR", "GBP", "JPY", "INR", "CAD", "AUD", "BRL", "ZAR", "CHF", "CNY", "KRW"];
        const $s = document.getElementById("currency") as HTMLSelectElement;
        $s.innerHTML = "";
        codes.forEach(c => {
            const o = document.createElement("option");
            o.value = c; o.textContent = c;
            $s.appendChild(o);
        });
        $s.value = this.current.currency || "USD";
    }

    private populateStyle(): void {
        const $s = document.getElementById("style") as HTMLSelectElement;
        $s.value = this.current.style || "compact";
    }

    private readForm(): ISettings {
        const $group = document.getElementById("group-by") as HTMLSelectElement;
        const $agg   = document.getElementById("aggregate") as HTMLSelectElement;
        return {
            queryId:        this.current.queryId,
            queryName:      this.current.queryName,
            groupByRef:     $group.value,
            groupByLabel:   this.getValue("group-label") || ($group.options[$group.selectedIndex]?.getAttribute("data-name") || ""),
            aggregateRef:   $agg.value,
            aggregateLabel: this.getValue("agg-label") || ($agg.options[$agg.selectedIndex]?.getAttribute("data-name") || ""),
            currency:       this.getValue("currency") || "USD",
            style:          (this.getValue("style") === "full" ? "full" : "compact"),
            maxRows:        parseInt(this.getValue("max-rows") || "0", 10) || 0
        };
    }

    private notify(): void {
        if (!this.ctx) { return; }
        const data = { data: JSON.stringify(this.readForm()) };
        this.ctx.notify(this.WidgetHelpers.WidgetEvent.ConfigurationChange, this.WidgetHelpers.WidgetEvent.Args(data));
    }

    private setValue(id: string, v: string): void {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el) { el.value = v; }
    }

    private getValue(id: string): string {
        return (document.getElementById(id) as HTMLInputElement)?.value || "";
    }
}

function matches(type: string, allowed: string[]): boolean {
    const t = (type || "").toLowerCase();
    return allowed.some(a => t.indexOf(a) !== -1);
}

function lookup(cols: QueryColumn[], ref: string): string {
    const c = cols.find(c => c.referenceName === ref);
    return c ? c.name : "";
}

function blankSettings(): ISettings {
    return {
        queryId: "", queryName: "",
        groupByRef: "", groupByLabel: "",
        aggregateRef: "", aggregateLabel: "",
        currency: "USD", style: "compact",
        maxRows: 0
    };
}

/** Convert FieldType enum to lowercase string the classifier expects. */
function fieldTypeName(f: WitContracts.WorkItemField): string {
    // SDK exposes type as enum (number); map back to the lowercase name.
    const t = WitContracts.FieldType[f.type as any];
    return (typeof t === "string" ? t : "").toLowerCase();
}

VSS.ready(() => {
    VSS.require(["TFS/Dashboards/WidgetHelpers"], (WidgetHelpers: any) => {
        WidgetHelpers.IncludeWidgetConfigurationStyles();
        VSS.register("cost-rollup-widget-Configuration", () => new Configuration(WidgetHelpers));
        VSS.notifyLoadSucceeded();
    });
});