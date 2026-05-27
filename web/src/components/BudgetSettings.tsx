import { useState } from "react";
import type { BudgetLimit, Transaction, CurrencyCode, Cents } from "../types/budget";
import { getCategoriesByType } from "../lib/categories";
import { formatCents, parseDollarsToCents } from "../lib/money";
import { currentYearMonth, getYearMonth } from "../lib/dates";

interface BudgetSettingsProps {
  budgetLimits: BudgetLimit[];
  transactions: Transaction[];
  currency: CurrencyCode;
  overallBudgetCents: Cents | null;
  onSetLimit: (categoryId: string, limitCents: Cents) => void;
  onRemoveLimit: (categoryId: string) => void;
  onSetOverallBudget: (limitCents: Cents | null) => void;
}

export function BudgetSettings({
  budgetLimits,
  transactions,
  currency,
  overallBudgetCents,
  onSetLimit,
  onRemoveLimit,
  onSetOverallBudget,
}: BudgetSettingsProps) {
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [overallInput, setOverallInput] = useState(
    overallBudgetCents !== null ? (overallBudgetCents / 100).toFixed(2) : "",
  );

  const ym = currentYearMonth();
  const expenseCategories = getCategoriesByType("expense");

  const monthExpenses = transactions.filter(
    (t) => t.type === "expense" && getYearMonth(t.date) === ym,
  );
  const totalExpenses = monthExpenses.reduce((s, t) => s + t.amountCents, 0);

  const categorySpending = new Map<string, number>();
  for (const t of monthExpenses) {
    categorySpending.set(
      t.category,
      (categorySpending.get(t.category) ?? 0) + t.amountCents,
    );
  }

  function handleSaveLimit(categoryId: string) {
    const cents = parseDollarsToCents(editAmount);
    if (cents !== null && cents > 0) {
      onSetLimit(categoryId, cents);
    }
    setEditingCat(null);
    setEditAmount("");
  }

  function handleSaveOverall() {
    if (overallInput.trim() === "") {
      onSetOverallBudget(null);
    } else {
      const cents = parseDollarsToCents(overallInput);
      if (cents !== null && cents > 0) {
        onSetOverallBudget(cents);
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Overall monthly budget */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--muted)" }}>
          Overall Monthly Budget
        </h3>
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="No limit"
            value={overallInput}
            onChange={(e) => setOverallInput(e.target.value)}
            className="flex-1 rounded-lg px-3 py-2 text-sm"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          />
          <button
            onClick={handleSaveOverall}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: "var(--accent)" }}
          >
            Set
          </button>
        </div>
        {overallBudgetCents !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
              <span>Spent: {formatCents(totalExpenses, currency)}</span>
              <span>Budget: {formatCents(overallBudgetCents, currency)}</span>
            </div>
            <div
              className="mt-1 h-3 overflow-hidden rounded-full"
              style={{ background: "var(--line)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min((totalExpenses / overallBudgetCents) * 100, 100)}%`,
                  background:
                    totalExpenses >= overallBudgetCents
                      ? "var(--error)"
                      : totalExpenses >= overallBudgetCents * 0.8
                        ? "var(--warning)"
                        : "var(--success)",
                }}
              />
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
              {totalExpenses < overallBudgetCents
                ? `${formatCents(overallBudgetCents - totalExpenses, currency)} remaining`
                : `Over budget by ${formatCents(totalExpenses - overallBudgetCents, currency)}`}
            </p>
          </div>
        )}
      </div>

      {/* Per-category budgets */}
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <h3 className="mb-3 text-sm font-medium" style={{ color: "var(--muted)" }}>
          Category Budgets
        </h3>
        <div className="flex flex-col gap-3">
          {expenseCategories.map((cat) => {
            const limit = budgetLimits.find((b) => b.categoryId === cat.id);
            const spent = categorySpending.get(cat.id) ?? 0;
            const pct = limit ? (spent / limit.limitCents) * 100 : 0;

            if (editingCat === cat.id) {
              return (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="text-sm">{cat.emoji}</span>
                  <span className="text-xs font-medium">{cat.name}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="flex-1 rounded-lg px-2 py-1 text-sm"
                    style={{
                      background: "var(--paper)",
                      color: "var(--ink)",
                      border: "1px solid var(--line)",
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveLimit(cat.id);
                      if (e.key === "Escape") setEditingCat(null);
                    }}
                  />
                  <button
                    onClick={() => handleSaveLimit(cat.id)}
                    className="rounded px-2 py-1 text-xs font-medium text-white"
                    style={{ background: "var(--accent)" }}
                  >
                    Save
                  </button>
                </div>
              );
            }

            return (
              <div key={cat.id}>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{cat.emoji}</span>
                  <span className="min-w-0 flex-1 text-xs font-medium">{cat.name}</span>
                  {limit ? (
                    <>
                      <span className="text-xs" style={{ color: "var(--muted)" }}>
                        {formatCents(spent, currency)} / {formatCents(limit.limitCents, currency)}
                      </span>
                      <button
                        onClick={() => {
                          setEditingCat(cat.id);
                          setEditAmount((limit.limitCents / 100).toFixed(2));
                        }}
                        className="text-xs"
                        style={{ color: "var(--accent)" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onRemoveLimit(cat.id)}
                        className="text-xs"
                        style={{ color: "var(--error)" }}
                      >
                        Remove
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingCat(cat.id);
                        setEditAmount("");
                      }}
                      className="text-xs"
                      style={{ color: "var(--accent)" }}
                    >
                      Set Budget
                    </button>
                  )}
                </div>
                {limit && (
                  <div
                    className="mt-1 ml-7 h-2 overflow-hidden rounded-full"
                    style={{ background: "var(--line)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        background:
                          pct >= 100
                            ? "var(--error)"
                            : pct >= 80
                              ? "var(--warning)"
                              : "var(--success)",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
