interface ISettings {
    queryId: string;
    queryName: string;
    groupByRef: string;        // field reference name to group by
    groupByLabel: string;      // friendly column header
    aggregateRef: string;      // numeric field reference name to sum
    aggregateLabel: string;    // friendly column header
    currency: string;          // ISO 4217 code
    style: "compact" | "full";
    maxRows: number;           // 0 = all
}