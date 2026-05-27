import { useState } from "react";
import type { TransactionType, RecurrenceInterval, Account } from "../types/budget";
import { getCategoriesByType } from "../lib/categories";
import { parseDollarsToCents } from "../lib/money";
import { todayISO } from "../lib/dates";

interface TransactionFormProps {
  accounts: Account[];
  onSubmit: (data: {
    type: TransactionType;
    amountCents: number;
    category: string;
    description: string;
    date: string;
    accountId: string | null;
    recurrence: RecurrenceInterval | null;
  }) => void;
  onCancel: () => void;
  initial?: {
    type: TransactionType;
    amountCents: number;
    category: string;
    description: string;
    date: string;
    accountId: string | null;
    recurrence: RecurrenceInterval | null;
  };
}

export function TransactionForm({ accounts, onSubmit, onCancel, initial }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState(
    initial ? (initial.amountCents / 100).toFixed(2) : "",
  );
  const [category, setCategory] = useState(initial?.category ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [accountId, setAccountId] = useState(initial?.accountId ?? "");
  const [recurrence, setRecurrence] = useState<string>(initial?.recurrence ?? "none");
  const [error, setError] = useState<string | null>(null);

  const categories = getCategoriesByType(type);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = parseDollarsToCents(amount);
    if (cents === null || cents <= 0) {
      setError("Enter a valid positive amount");
      return;
    }
    if (!category) {
      setError("Select a category");
      return;
    }
    if (!date) {
      setError("Select a date");
      return;
    }
    setError(null);
    onSubmit({
      type,
      amountCents: cents,
      category,
      description: description.trim(),
      date,
      accountId: accountId || null,
      recurrence: recurrence === "none" ? null : (recurrence as RecurrenceInterval),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl p-4"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => { setType("expense"); setCategory(""); }}
          className="flex-1 rounded-lg py-2 text-sm font-semibold transition-colors"
          style={{
            background: type === "expense" ? "var(--error)" : "var(--panel)",
            color: type === "expense" ? "#fff" : "var(--muted)",
            border: `1px solid ${type === "expense" ? "var(--error)" : "var(--line)"}`,
          }}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => { setType("income"); setCategory(""); }}
          className="flex-1 rounded-lg py-2 text-sm font-semibold transition-colors"
          style={{
            background: type === "income" ? "var(--success)" : "var(--panel)",
            color: type === "income" ? "#fff" : "var(--muted)",
            border: `1px solid ${type === "income" ? "var(--success)" : "var(--line)"}`,
          }}
        >
          Income
        </button>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>
          Amount
        </label>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-lg font-semibold"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
          }}
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-lg px-3 py-2"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
          }}
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>
          Description
        </label>
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg px-3 py-2"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
          }}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg px-3 py-2"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
          }}
        />
      </div>

      {accounts.length > 0 && (
        <div>
          <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>
            Account (optional)
          </label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full rounded-lg px-3 py-2"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          >
            <option value="">No account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium" style={{ color: "var(--muted)" }}>
          Recurring
        </label>
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
          className="w-full rounded-lg px-3 py-2"
          style={{
            background: "var(--paper)",
            color: "var(--ink)",
            border: "1px solid var(--line)",
          }}
        >
          <option value="none">One-time</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {error && (
        <p className="text-sm font-medium" style={{ color: "var(--error)" }}>
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg py-2 text-sm font-medium"
          style={{
            background: "var(--panel)",
            color: "var(--muted)",
            border: "1px solid var(--line)",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg py-2 text-sm font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          {initial ? "Update" : "Add Transaction"}
        </button>
      </div>
    </form>
  );
}
