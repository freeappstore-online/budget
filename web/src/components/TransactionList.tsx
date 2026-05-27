import { useState } from "react";
import type { Transaction, Account, CurrencyCode } from "../types/budget";
import { getCategoryById } from "../lib/categories";
import { formatCents } from "../lib/money";
import { formatShortDate, currentYearMonth } from "../lib/dates";
import { TransactionForm } from "./TransactionForm";

interface TransactionListProps {
  transactions: Transaction[];
  accounts: Account[];
  currency: CurrencyCode;
  onUpdate: (id: string, updates: Partial<Omit<Transaction, "id" | "createdAt">>) => void;
  onDelete: (id: string) => void;
}

export function TransactionList({
  transactions,
  accounts,
  currency,
  onUpdate,
  onDelete,
}: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(currentYearMonth());
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

  const filtered = transactions
    .filter((t) => t.date.startsWith(filterMonth))
    .filter((t) => filterType === "all" || t.type === filterType)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amountCents, 0);
  const totalExpenses = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amountCents, 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="rounded-lg px-3 py-1.5 text-sm"
          style={{
            background: "var(--panel)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
          }}
        />
        <div className="flex gap-1">
          {(["all", "income", "expense"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium capitalize"
              style={{
                background: filterType === t ? "var(--accent)" : "var(--panel)",
                color: filterType === t ? "#fff" : "var(--muted)",
                border: `1px solid ${filterType === t ? "var(--accent)" : "var(--line)"}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div
        className="flex justify-between rounded-lg px-4 py-2 text-sm"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <span style={{ color: "var(--success)" }}>
          +{formatCents(totalIncome, currency)}
        </span>
        <span style={{ color: "var(--error)" }}>
          -{formatCents(totalExpenses, currency)}
        </span>
        <span className="font-semibold" style={{ color: "var(--ink)" }}>
          Net: {formatCents(totalIncome - totalExpenses, currency)}
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div
          className="rounded-lg py-12 text-center text-sm"
          style={{ color: "var(--muted)", background: "var(--panel)" }}
        >
          No transactions for this period
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((txn) => {
            const cat = getCategoryById(txn.category);
            if (editingId === txn.id) {
              return (
                <TransactionForm
                  key={txn.id}
                  accounts={accounts}
                  initial={{
                    type: txn.type,
                    amountCents: txn.amountCents,
                    category: txn.category,
                    description: txn.description,
                    date: txn.date,
                    accountId: txn.accountId,
                    recurrence: txn.recurrence,
                  }}
                  onSubmit={(data) => {
                    onUpdate(txn.id, data);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              );
            }
            return (
              <div
                key={txn.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{
                  background: "var(--panel)",
                  border: "1px solid var(--line)",
                }}
              >
                <span className="text-xl">{cat?.emoji ?? "?"}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium" style={{ color: "var(--ink)" }}>
                    {cat?.name ?? txn.category}
                  </span>
                  {txn.description && (
                    <span className="truncate text-xs" style={{ color: "var(--muted)" }}>
                      {txn.description}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {formatShortDate(txn.date)}
                    {txn.recurrence && ` (${txn.recurrence})`}
                    {txn.recurringSourceId && " (auto)"}
                  </span>
                </div>
                <span
                  className="text-sm font-semibold whitespace-nowrap"
                  style={{
                    color: txn.type === "income" ? "var(--success)" : "var(--error)",
                  }}
                >
                  {txn.type === "income" ? "+" : "-"}
                  {formatCents(txn.amountCents, currency)}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingId(txn.id)}
                    className="rounded p-1 text-xs"
                    style={{ color: "var(--muted)" }}
                    title="Edit"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(txn.id)}
                    className="rounded p-1 text-xs"
                    style={{ color: "var(--error)" }}
                    title="Delete"
                  >
                    Del
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
