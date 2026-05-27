import { useState } from "react";
import type { Account, AccountTransfer, CurrencyCode, Cents } from "../types/budget";
import { formatCents, parseDollarsToCents } from "../lib/money";

interface AccountsProps {
  accounts: Account[];
  transfers: AccountTransfer[];
  currency: CurrencyCode;
  onAddAccount: (account: Omit<Account, "id">) => void;
  onUpdateAccount: (id: string, updates: Partial<Omit<Account, "id">>) => void;
  onDeleteAccount: (id: string) => void;
  onTransfer: (fromId: string, toId: string, amountCents: Cents, description: string) => void;
}

const ACCOUNT_TYPE_LABELS: Record<Account["type"], string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit_card: "Credit Card",
};

const ACCOUNT_TYPE_EMOJI: Record<Account["type"], string> = {
  checking: "🏦",
  savings: "💰",
  cash: "💵",
  credit_card: "💳",
};

export function Accounts({
  accounts,
  transfers,
  currency,
  onAddAccount,
  onUpdateAccount,
  onDeleteAccount,
  onTransfer,
}: AccountsProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<Account["type"]>("checking");
  const [newBalance, setNewBalance] = useState("");

  // Transfer form state
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDesc, setTransferDesc] = useState("");

  // Edit form state
  const [editName, setEditName] = useState("");

  const totalBalance = accounts.reduce((s, a) => s + a.balanceCents, 0);

  function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    const cents = parseDollarsToCents(newBalance || "0");
    if (!newName.trim() || cents === null) return;
    onAddAccount({ name: newName.trim(), type: newType, balanceCents: cents });
    setNewName("");
    setNewBalance("");
    setShowAddForm(false);
  }

  function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    const cents = parseDollarsToCents(transferAmount);
    if (!transferFrom || !transferTo || transferFrom === transferTo || cents === null || cents <= 0)
      return;
    onTransfer(transferFrom, transferTo, cents, transferDesc.trim());
    setTransferAmount("");
    setTransferDesc("");
    setShowTransfer(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Total balance */}
      <div
        className="rounded-xl p-4 text-center"
        style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
      >
        <p className="text-xs" style={{ color: "var(--muted)" }}>Total Balance</p>
        <p className="text-2xl font-bold" style={{ color: "var(--ink)" }}>
          {formatCents(totalBalance, currency)}
        </p>
      </div>

      {/* Account list */}
      <div className="flex flex-col gap-2">
        {accounts.map((acct) => {
          if (editingId === acct.id) {
            return (
              <div
                key={acct.id}
                className="flex items-center gap-2 rounded-xl p-3"
                style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
              >
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded-lg px-2 py-1 text-sm"
                  style={{
                    background: "var(--paper)",
                    color: "var(--ink)",
                    border: "1px solid var(--line)",
                  }}
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (editName.trim()) onUpdateAccount(acct.id, { name: editName.trim() });
                    setEditingId(null);
                  }}
                  className="rounded px-2 py-1 text-xs text-white"
                  style={{ background: "var(--accent)" }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  Cancel
                </button>
              </div>
            );
          }
          return (
            <div
              key={acct.id}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
            >
              <span className="text-xl">{ACCOUNT_TYPE_EMOJI[acct.type]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                  {acct.name}
                </p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>
                  {ACCOUNT_TYPE_LABELS[acct.type]}
                </p>
              </div>
              <p
                className="text-sm font-bold"
                style={{
                  color: acct.balanceCents >= 0 ? "var(--success)" : "var(--error)",
                }}
              >
                {formatCents(acct.balanceCents, currency)}
              </p>
              <button
                onClick={() => {
                  setEditingId(acct.id);
                  setEditName(acct.name);
                }}
                className="text-xs"
                style={{ color: "var(--accent)" }}
              >
                Edit
              </button>
              <button
                onClick={() => onDeleteAccount(acct.id)}
                className="text-xs"
                style={{ color: "var(--error)" }}
              >
                Del
              </button>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex-1 rounded-lg py-2 text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          Add Account
        </button>
        {accounts.length >= 2 && (
          <button
            onClick={() => setShowTransfer(!showTransfer)}
            className="flex-1 rounded-lg py-2 text-sm font-medium"
            style={{
              background: "var(--panel)",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
            }}
          >
            Transfer
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <form
          onSubmit={handleAddAccount}
          className="flex flex-col gap-3 rounded-xl p-4"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <input
            type="text"
            placeholder="Account name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
            autoFocus
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as Account["type"])}
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          >
            {(Object.keys(ACCOUNT_TYPE_LABELS) as Account["type"][]).map((t) => (
              <option key={t} value={t}>
                {ACCOUNT_TYPE_EMOJI[t]} {ACCOUNT_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Initial balance (0.00)"
            value={newBalance}
            onChange={(e) => setNewBalance(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex-1 rounded-lg py-2 text-sm"
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
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white"
              style={{ background: "var(--accent)" }}
            >
              Create
            </button>
          </div>
        </form>
      )}

      {/* Transfer form */}
      {showTransfer && (
        <form
          onSubmit={handleTransfer}
          className="flex flex-col gap-3 rounded-xl p-4"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <select
            value={transferFrom}
            onChange={(e) => setTransferFrom(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          >
            <option value="">From account...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={transferTo}
            onChange={(e) => setTransferTo(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          >
            <option value="">To account...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Amount"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={transferDesc}
            onChange={(e) => setTransferDesc(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              background: "var(--paper)",
              color: "var(--ink)",
              border: "1px solid var(--line)",
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowTransfer(false)}
              className="flex-1 rounded-lg py-2 text-sm"
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
              className="flex-1 rounded-lg py-2 text-sm font-medium text-white"
              style={{ background: "var(--accent)" }}
            >
              Transfer
            </button>
          </div>
        </form>
      )}

      {/* Recent transfers */}
      {transfers.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
        >
          <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
            Recent Transfers
          </h3>
          <div className="flex flex-col gap-1.5">
            {transfers
              .slice()
              .reverse()
              .slice(0, 10)
              .map((tr) => {
                const fromAcct = accounts.find((a) => a.id === tr.fromAccountId);
                const toAcct = accounts.find((a) => a.id === tr.toAccountId);
                return (
                  <div key={tr.id} className="flex items-center gap-2 text-xs">
                    <span style={{ color: "var(--ink)" }}>
                      {fromAcct?.name ?? "?"} → {toAcct?.name ?? "?"}
                    </span>
                    <span className="flex-1" />
                    <span style={{ color: "var(--accent)" }} className="font-medium">
                      {formatCents(tr.amountCents, currency)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
