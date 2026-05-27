import { useState } from "react";
import type { TabId, CurrencyCode } from "./types/budget";
import { useBudgetStore } from "./hooks/useBudgetStore";
import { Dashboard } from "./components/Dashboard";
import { TransactionList } from "./components/TransactionList";
import { TransactionForm } from "./components/TransactionForm";
import { BudgetSettings } from "./components/BudgetSettings";
import { Charts } from "./components/Charts";
import { Accounts } from "./components/Accounts";
import { Insights } from "./components/Insights";
import { ExportPanel } from "./components/ExportPanel";

const TABS: { id: TabId; label: string; emoji: string }[] = [
  { id: "dashboard", label: "Home", emoji: "🏠" },
  { id: "transactions", label: "Txns", emoji: "💸" },
  { id: "budgets", label: "Budget", emoji: "🎯" },
  { id: "charts", label: "Charts", emoji: "📊" },
  { id: "accounts", label: "Accounts", emoji: "🏦" },
  { id: "insights", label: "Insights", emoji: "💡" },
];

const CURRENCIES: { code: CurrencyCode; label: string }[] = [
  { code: "USD", label: "$" },
  { code: "EUR", label: "€" },
  { code: "GBP", label: "£" },
  { code: "AUD", label: "A$" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const store = useBudgetStore();

  const currentSymbol = CURRENCIES.find((c) => c.code === store.settings.currency)?.label ?? "$";

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col" style={{ background: "var(--paper)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3"
        style={{
          background: "var(--glass)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <h1 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
          Budget Tracker
        </h1>
        <div className="relative">
          <button
            onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium"
            style={{
              background: "var(--panel)",
              color: "var(--accent)",
              border: "1px solid var(--line)",
            }}
          >
            {currentSymbol} {store.settings.currency}
          </button>
          {showCurrencyPicker && (
            <div
              className="absolute right-0 top-full mt-1 flex flex-col rounded-lg shadow-lg"
              style={{
                background: "var(--panel)",
                border: "1px solid var(--line)",
                zIndex: 50,
              }}
            >
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    store.setCurrency(c.code);
                    setShowCurrencyPicker(false);
                  }}
                  className="px-4 py-2 text-left text-sm hover:opacity-80"
                  style={{
                    color:
                      store.settings.currency === c.code
                        ? "var(--accent)"
                        : "var(--ink)",
                    fontWeight:
                      store.settings.currency === c.code ? 600 : 400,
                  }}
                >
                  {c.label} {c.code}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-4">
        {activeTab === "dashboard" && (
          <Dashboard
            transactions={store.transactions}
            budgetLimits={store.budgetLimits}
            currency={store.settings.currency}
            accounts={store.accounts}
            onAddTransaction={store.addTransaction}
          />
        )}

        {activeTab === "transactions" && (
          <div className="flex flex-col gap-4">
            {showAddForm ? (
              <TransactionForm
                accounts={store.accounts}
                onSubmit={(data) => {
                  store.addTransaction(data);
                  setShowAddForm(false);
                }}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="rounded-lg py-2.5 text-sm font-medium text-white"
                style={{ background: "var(--accent)" }}
              >
                + Add Transaction
              </button>
            )}
            <TransactionList
              transactions={store.transactions}
              accounts={store.accounts}
              currency={store.settings.currency}
              onUpdate={store.updateTransaction}
              onDelete={store.deleteTransaction}
            />
            <ExportPanel
              transactions={store.transactions}
              currency={store.settings.currency}
            />
          </div>
        )}

        {activeTab === "budgets" && (
          <BudgetSettings
            budgetLimits={store.budgetLimits}
            transactions={store.transactions}
            currency={store.settings.currency}
            overallBudgetCents={store.settings.overallMonthlyBudgetCents}
            onSetLimit={store.setBudgetLimit}
            onRemoveLimit={store.removeBudgetLimit}
            onSetOverallBudget={store.setOverallBudget}
          />
        )}

        {activeTab === "charts" && (
          <Charts
            transactions={store.transactions}
            currency={store.settings.currency}
          />
        )}

        {activeTab === "accounts" && (
          <Accounts
            accounts={store.accounts}
            transfers={store.transfers}
            currency={store.settings.currency}
            onAddAccount={store.addAccount}
            onUpdateAccount={store.updateAccount}
            onDeleteAccount={store.deleteAccount}
            onTransfer={store.transferBetweenAccounts}
          />
        )}

        {activeTab === "insights" && (
          <Insights
            transactions={store.transactions}
            currency={store.settings.currency}
          />
        )}
      </main>

      {/* Bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-lg items-center justify-around py-2"
        style={{
          background: "var(--dock)",
          borderTop: "1px solid var(--line)",
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex flex-col items-center gap-0.5 px-2 py-1"
          >
            <span className="text-lg">{tab.emoji}</span>
            <span
              className="text-[10px] font-medium"
              style={{
                color: activeTab === tab.id ? "var(--accent)" : "var(--muted)",
              }}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
