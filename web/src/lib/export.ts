import type { Transaction, CurrencyCode } from "../types/budget";
import { formatCents } from "./money";
import { getCategoryById } from "./categories";

/**
 * Export transactions as a CSV string.
 */
export function transactionsToCsv(
  transactions: Transaction[],
  currency: CurrencyCode,
): string {
  const headers = ["Date", "Type", "Category", "Description", "Amount", "Account"];
  const rows = transactions
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => {
      const cat = getCategoryById(t.category);
      return [
        t.date,
        t.type,
        cat ? cat.name : t.category,
        `"${t.description.replace(/"/g, '""')}"`,
        formatCents(t.amountCents, currency),
        t.accountId ?? "",
      ].join(",");
    });
  return [headers.join(","), ...rows].join("\n");
}

/**
 * Trigger a CSV file download in the browser.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generate a monthly summary report as CSV.
 */
export function monthlySummaryToCsv(
  transactions: Transaction[],
  yearMonth: string,
  currency: CurrencyCode,
): string {
  const filtered = transactions.filter((t) => t.date.startsWith(yearMonth));
  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amountCents, 0);
  const totalExpenses = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amountCents, 0);

  const categoryTotals = new Map<string, number>();
  for (const t of filtered) {
    if (t.type === "expense") {
      categoryTotals.set(
        t.category,
        (categoryTotals.get(t.category) ?? 0) + t.amountCents,
      );
    }
  }

  const lines = [
    `Monthly Summary - ${yearMonth}`,
    "",
    `Total Income,${formatCents(totalIncome, currency)}`,
    `Total Expenses,${formatCents(totalExpenses, currency)}`,
    `Net Savings,${formatCents(totalIncome - totalExpenses, currency)}`,
    "",
    "Category Breakdown",
    "Category,Amount",
  ];

  const sorted = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1]);
  for (const [catId, amount] of sorted) {
    const cat = getCategoryById(catId);
    lines.push(`${cat ? cat.name : catId},${formatCents(amount, currency)}`);
  }

  return lines.join("\n");
}
