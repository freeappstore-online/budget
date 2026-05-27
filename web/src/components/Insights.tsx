import { useMemo } from "react";
import type { Transaction, CurrencyCode } from "../types/budget";
import { formatCents } from "../lib/money";
import { currentYearMonth, getDaysInMonth, getYearMonth } from "../lib/dates";
import { getCategoryById } from "../lib/categories";

interface InsightsProps {
  transactions: Transaction[];
  currency: CurrencyCode;
}

export function Insights({ transactions, currency }: InsightsProps) {
  const ym = currentYearMonth();
  const prevYm = useMemo(() => {
    const [y, m] = ym.split("-").map(Number);
    if (y === undefined || m === undefined) return "";
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [ym]);

  const monthTxns = useMemo(
    () => transactions.filter((t) => getYearMonth(t.date) === ym),
    [transactions, ym],
  );
  const prevMonthTxns = useMemo(
    () => transactions.filter((t) => getYearMonth(t.date) === prevYm),
    [transactions, prevYm],
  );

  const income = monthTxns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amountCents, 0);
  const expenses = monthTxns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amountCents, 0);
  const prevExpenses = prevMonthTxns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amountCents, 0);
  const prevIncome = prevMonthTxns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amountCents, 0);

  // Days elapsed so far this month
  const today = new Date();
  const daysElapsed = today.getDate();
  const daysInMonth = getDaysInMonth(ym).length;

  const avgDailySpend = daysElapsed > 0 ? Math.round(expenses / daysElapsed) : 0;

  // Biggest expense
  const biggestExpense = useMemo(() => {
    const expenseOnly = monthTxns.filter((t) => t.type === "expense");
    if (expenseOnly.length === 0) return null;
    return expenseOnly.reduce((max, t) => (t.amountCents > max.amountCents ? t : max));
  }, [monthTxns]);

  // Month-over-month change
  const momChange = prevExpenses > 0
    ? ((expenses - prevExpenses) / prevExpenses) * 100
    : 0;

  // Savings comparison
  const currentSavings = income - expenses;
  const prevSavings = prevIncome - prevExpenses;
  const savingsChange = prevSavings !== 0
    ? ((currentSavings - prevSavings) / Math.abs(prevSavings)) * 100
    : 0;

  // Projected month end
  const projectedTotal = daysElapsed > 0
    ? Math.round((expenses / daysElapsed) * daysInMonth)
    : 0;

  // Top category this month
  const topCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTxns) {
      if (t.type === "expense") {
        map.set(t.category, (map.get(t.category) ?? 0) + t.amountCents);
      }
    }
    let maxCat = "";
    let maxVal = 0;
    for (const [cat, val] of map) {
      if (val > maxVal) {
        maxCat = cat;
        maxVal = val;
      }
    }
    return maxCat ? { category: getCategoryById(maxCat), amount: maxVal } : null;
  }, [monthTxns]);

  const insights: { label: string; value: string; detail?: string; color?: string }[] = [];

  insights.push({
    label: "Average Daily Spend",
    value: formatCents(avgDailySpend, currency),
    detail: `Over ${daysElapsed} days this month`,
  });

  if (biggestExpense) {
    const cat = getCategoryById(biggestExpense.category);
    insights.push({
      label: "Biggest Expense",
      value: formatCents(biggestExpense.amountCents, currency),
      detail: `${cat?.emoji ?? ""} ${cat?.name ?? biggestExpense.category}${biggestExpense.description ? ` - ${biggestExpense.description}` : ""}`,
      color: "var(--error)",
    });
  }

  if (prevExpenses > 0) {
    insights.push({
      label: "Month-over-Month Spending",
      value: `${momChange > 0 ? "+" : ""}${momChange.toFixed(1)}%`,
      detail: momChange > 0
        ? `Spending ${formatCents(expenses - prevExpenses, currency)} more than last month`
        : `Spending ${formatCents(prevExpenses - expenses, currency)} less than last month`,
      color: momChange > 0 ? "var(--error)" : "var(--success)",
    });
  }

  if (prevSavings !== 0) {
    insights.push({
      label: "Savings Trend",
      value: `${savingsChange > 0 ? "+" : ""}${savingsChange.toFixed(1)}%`,
      detail: currentSavings > prevSavings
        ? `You've saved ${formatCents(currentSavings - prevSavings, currency)} more than last month so far`
        : `Savings down ${formatCents(prevSavings - currentSavings, currency)} vs last month`,
      color: savingsChange > 0 ? "var(--success)" : "var(--warning)",
    });
  }

  if (income > 0) {
    const savingsRate = ((income - expenses) / income) * 100;
    insights.push({
      label: "Savings Rate",
      value: `${savingsRate.toFixed(1)}%`,
      detail: `${formatCents(income - expenses, currency)} saved out of ${formatCents(income, currency)} earned`,
      color: savingsRate >= 20 ? "var(--success)" : savingsRate >= 0 ? "var(--warning)" : "var(--error)",
    });
  }

  insights.push({
    label: "Projected Monthly Spend",
    value: formatCents(projectedTotal, currency),
    detail: `At current pace (${daysElapsed}/${daysInMonth} days)`,
  });

  if (topCategory) {
    insights.push({
      label: "Top Spending Category",
      value: formatCents(topCategory.amount, currency),
      detail: `${topCategory.category?.emoji ?? ""} ${topCategory.category?.name ?? "Unknown"}`,
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium" style={{ color: "var(--muted)" }}>
        Insights for this month
      </h2>
      {insights.length === 0 ? (
        <div
          className="rounded-xl py-12 text-center text-sm"
          style={{ color: "var(--muted)", background: "var(--panel)" }}
        >
          Add some transactions to see insights
        </div>
      ) : (
        insights.map((ins) => (
          <div
            key={ins.label}
            className="rounded-xl p-4"
            style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
          >
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {ins.label}
            </p>
            <p
              className="text-xl font-bold"
              style={{ color: ins.color ?? "var(--ink)" }}
            >
              {ins.value}
            </p>
            {ins.detail && (
              <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                {ins.detail}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}
