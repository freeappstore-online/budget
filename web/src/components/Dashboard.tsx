import { useMemo, useState } from "react";
import type { Transaction, BudgetLimit, CurrencyCode, Account } from "../types/budget";
import { formatCents } from "../lib/money";
import { currentYearMonth, formatMonthYear, formatShortDate, getYearMonth } from "../lib/dates";
import { getCategoryById } from "../lib/categories";
import { TransactionForm } from "./TransactionForm";

interface DashboardProps {
  transactions: Transaction[];
  budgetLimits: BudgetLimit[];
  currency: CurrencyCode;
  accounts: Account[];
  onAddTransaction: (data: {
    type: "income" | "expense";
    amountCents: number;
    category: string;
    description: string;
    date: string;
    accountId: string | null;
    recurrence: "weekly" | "monthly" | "yearly" | null;
  }) => void;
}

export function Dashboard({
  transactions,
  budgetLimits,
  currency,
  accounts,
  onAddTransaction,
}: DashboardProps) {
  const [showForm, setShowForm] = useState(false);
  const ym = currentYearMonth();

  const monthTxns = useMemo(
    () => transactions.filter((t) => getYearMonth(t.date) === ym),
    [transactions, ym],
  );

  const income = monthTxns
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amountCents, 0);
  const expenses = monthTxns
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amountCents, 0);
  const net = income - expenses;

  // Previous month
  const prevYm = useMemo(() => {
    const [y, m] = ym.split("-").map(Number);
    if (y === undefined || m === undefined) return "";
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [ym]);

  const prevExpenses = useMemo(
    () =>
      transactions
        .filter((t) => getYearMonth(t.date) === prevYm && t.type === "expense")
        .reduce((s, t) => s + t.amountCents, 0),
    [transactions, prevYm],
  );

  const trend = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

  // Recent 10 transactions
  const recent = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10),
    [transactions],
  );

  // Budget health per category
  const categorySpending = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTxns) {
      if (t.type === "expense") {
        map.set(t.category, (map.get(t.category) ?? 0) + t.amountCents);
      }
    }
    return map;
  }, [monthTxns]);

  return (
    <div className="flex flex-col gap-4">
      {/* Month summary card */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <h2 className="mb-3 text-sm font-medium" style={{ color: "var(--muted)" }}>
          {formatMonthYear(ym)}
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Income</p>
            <p className="text-lg font-bold" style={{ color: "var(--success)" }}>
              {formatCents(income, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Expenses</p>
            <p className="text-lg font-bold" style={{ color: "var(--error)" }}>
              {formatCents(expenses, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Net</p>
            <p
              className="text-lg font-bold"
              style={{ color: net >= 0 ? "var(--success)" : "var(--error)" }}
            >
              {formatCents(net, currency)}
            </p>
          </div>
        </div>
        {prevExpenses > 0 && (
          <p className="mt-2 text-center text-xs" style={{ color: "var(--muted)" }}>
            {trend > 0 ? "Up" : "Down"} {Math.abs(trend).toFixed(1)}% vs last month
          </p>
        )}
      </div>

      {/* Budget health indicators */}
      {budgetLimits.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--muted)" }}>
            Budget Health
          </h3>
          <div className="flex flex-col gap-2">
            {budgetLimits.map((bl) => {
              const cat = getCategoryById(bl.categoryId);
              const spent = categorySpending.get(bl.categoryId) ?? 0;
              const pct = bl.limitCents > 0 ? (spent / bl.limitCents) * 100 : 0;
              const statusColor =
                pct >= 100 ? "var(--error)" : pct >= 80 ? "var(--warning)" : "var(--success)";
              return (
                <div key={bl.categoryId} className="flex items-center gap-2">
                  <span className="text-sm">{cat?.emoji ?? "?"}</span>
                  <span className="min-w-0 flex-1 truncate text-xs font-medium">
                    {cat?.name ?? bl.categoryId}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: statusColor }}
                  />
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--muted)" }}>
          Recent Transactions
        </h3>
        {recent.length === 0 ? (
          <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
            No transactions yet
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {recent.map((txn) => {
              const cat = getCategoryById(txn.category);
              return (
                <div key={txn.id} className="flex items-center gap-2 py-1">
                  <span className="text-sm">{cat?.emoji ?? "?"}</span>
                  <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--ink)" }}>
                    {cat?.name ?? txn.category}
                    {txn.description ? ` - ${txn.description}` : ""}
                  </span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {formatShortDate(txn.date)}
                  </span>
                  <span
                    className="text-xs font-semibold whitespace-nowrap"
                    style={{
                      color: txn.type === "income" ? "var(--success)" : "var(--error)",
                    }}
                  >
                    {txn.type === "income" ? "+" : "-"}
                    {formatCents(txn.amountCents, currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick add FAB */}
      {showForm ? (
        <TransactionForm
          accounts={accounts}
          onSubmit={(data) => {
            onAddTransaction(data);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="fixed right-5 bottom-20 z-50 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
          style={{ background: "var(--accent)" }}
        >
          +
        </button>
      )}
    </div>
  );
}
