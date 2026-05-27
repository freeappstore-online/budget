import type { Transaction, CurrencyCode } from "../types/budget";
import { transactionsToCsv, monthlySummaryToCsv, downloadCsv } from "../lib/export";
import { currentYearMonth, formatMonthYear } from "../lib/dates";

interface ExportPanelProps {
  transactions: Transaction[];
  currency: CurrencyCode;
}

export function ExportPanel({ transactions, currency }: ExportPanelProps) {
  const ym = currentYearMonth();

  function handleExportAll() {
    const csv = transactionsToCsv(transactions, currency);
    downloadCsv(csv, "budget-transactions.csv");
  }

  function handleExportMonthly() {
    const csv = monthlySummaryToCsv(transactions, ym, currency);
    downloadCsv(csv, `budget-summary-${ym}.csv`);
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleExportAll}
        className="rounded-lg py-2.5 text-sm font-medium"
        style={{
          background: "var(--panel)",
          color: "var(--accent)",
          border: "1px solid var(--accent)",
        }}
      >
        Export All Transactions (CSV)
      </button>
      <button
        onClick={handleExportMonthly}
        className="rounded-lg py-2.5 text-sm font-medium"
        style={{
          background: "var(--panel)",
          color: "var(--accent)",
          border: "1px solid var(--accent)",
        }}
      >
        Export {formatMonthYear(ym)} Summary
      </button>
    </div>
  );
}
