"use strict";

const SYMBOLS: Record<string, string> = {
    USD: "$", CAD: "$", AUD: "$", NZD: "$", SGD: "$", HKD: "$",
    EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", INR: "₹", KRW: "₩",
    CHF: "CHF ", SEK: "kr ", NOK: "kr ", DKK: "kr ",
    BRL: "R$", MXN: "$", ZAR: "R", PLN: "zł ", TRY: "₺"
};

export type FormatStyle = "compact" | "full";

export function formatCurrency(
    value: number | null | undefined,
    currency: string = "USD",
    style: FormatStyle = "compact"
): string {
    if (value == null || !Number.isFinite(value)) { return ""; }
    const sym  = symbolFor(currency);
    const sign = value < 0 ? "-" : "";
    const abs  = Math.abs(value);

    if (style === "full") {
        return `${sign}${sym}${abs.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    }
    if (abs < 1_000)         { return `${sign}${sym}${trimDecimals(abs, 2)}`; }
    if (abs < 1_000_000)     { return `${sign}${sym}${Math.round(abs / 1_000)}K`; }
    if (abs < 1_000_000_000) { return `${sign}${sym}${trimDecimals(abs / 1_000_000, 1)}M`; }
    return `${sign}${sym}${trimDecimals(abs / 1_000_000_000, 1)}B`;
}

function symbolFor(code: string): string {
    const upper = (code || "USD").toUpperCase().trim();
    return SYMBOLS[upper] || `${upper} `;
}

function trimDecimals(n: number, maxDp: number): string {
    return parseFloat(n.toFixed(maxDp)).toString();
}