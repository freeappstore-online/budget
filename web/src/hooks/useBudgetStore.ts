import { useState, useCallback, useEffect } from "react";
import type {
  Transaction,
  BudgetLimit,
  Account,
  AccountTransfer,
  AppSettings,
  CurrencyCode,
  Cents,
} from "../types/budget";
import {
  loadTransactions,
  saveTransactions,
  loadBudgetLimits,
  saveBudgetLimits,
  loadAccounts,
  saveAccounts,
  loadTransfers,
  saveTransfers,
  loadSettings,
  saveSettings,
} from "../lib/storage";
import { generateRecurringEntries } from "../lib/recurrence";

export interface BudgetStore {
  transactions: Transaction[];
  budgetLimits: BudgetLimit[];
  accounts: Account[];
  transfers: AccountTransfer[];
  settings: AppSettings;

  addTransaction: (txn: Omit<Transaction, "id" | "createdAt" | "recurringSourceId">) => void;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, "id" | "createdAt">>) => void;
  deleteTransaction: (id: string) => void;

  setBudgetLimit: (categoryId: string, limitCents: Cents) => void;
  removeBudgetLimit: (categoryId: string) => void;
  setOverallBudget: (limitCents: Cents | null) => void;

  addAccount: (account: Omit<Account, "id">) => void;
  updateAccount: (id: string, updates: Partial<Omit<Account, "id">>) => void;
  deleteAccount: (id: string) => void;
  transferBetweenAccounts: (fromId: string, toId: string, amountCents: Cents, description: string) => void;

  setCurrency: (currency: CurrencyCode) => void;
}

export function useBudgetStore(): BudgetStore {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>(() => loadBudgetLimits());
  const [accounts, setAccounts] = useState<Account[]>(() => loadAccounts());
  const [transfers, setTransfers] = useState<AccountTransfer[]>(() => loadTransfers());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  // Generate recurring entries on load
  useEffect(() => {
    const newEntries = generateRecurringEntries(transactions);
    if (newEntries.length > 0) {
      const updated = [...transactions, ...newEntries];
      setTransactions(updated);
      saveTransactions(updated);
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addTransaction = useCallback(
    (txn: Omit<Transaction, "id" | "createdAt" | "recurringSourceId">) => {
      const newTxn: Transaction = {
        ...txn,
        id: crypto.randomUUID(),
        recurringSourceId: null,
        createdAt: new Date().toISOString(),
      };
      setTransactions((prev) => {
        const next = [...prev, newTxn];
        // Generate recurring entries if this is a recurring source
        const withRecurring = txn.recurrence
          ? [...next, ...generateRecurringEntries(next)]
          : next;
        saveTransactions(withRecurring);
        return withRecurring;
      });

      // Update account balance if applicable
      if (txn.accountId) {
        const delta = txn.type === "income" ? txn.amountCents : -txn.amountCents;
        setAccounts((prev) => {
          const next = prev.map((a) =>
            a.id === txn.accountId
              ? { ...a, balanceCents: a.balanceCents + delta }
              : a,
          );
          saveAccounts(next);
          return next;
        });
      }
    },
    [],
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Omit<Transaction, "id" | "createdAt">>) => {
      setTransactions((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
        saveTransactions(next);
        return next;
      });
    },
    [],
  );

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      // Also remove generated entries from this source
      const next = prev.filter(
        (t) => t.id !== id && t.recurringSourceId !== id,
      );
      saveTransactions(next);
      return next;
    });
  }, []);

  const setBudgetLimit = useCallback(
    (categoryId: string, limitCents: Cents) => {
      setBudgetLimits((prev) => {
        const existing = prev.findIndex((b) => b.categoryId === categoryId);
        let next: BudgetLimit[];
        if (existing >= 0) {
          next = prev.map((b) =>
            b.categoryId === categoryId ? { ...b, limitCents } : b,
          );
        } else {
          next = [...prev, { categoryId, limitCents }];
        }
        saveBudgetLimits(next);
        return next;
      });
    },
    [],
  );

  const removeBudgetLimit = useCallback((categoryId: string) => {
    setBudgetLimits((prev) => {
      const next = prev.filter((b) => b.categoryId !== categoryId);
      saveBudgetLimits(next);
      return next;
    });
  }, []);

  const setOverallBudget = useCallback((limitCents: Cents | null) => {
    setSettings((prev) => {
      const next = { ...prev, overallMonthlyBudgetCents: limitCents };
      saveSettings(next);
      return next;
    });
  }, []);

  const addAccount = useCallback(
    (account: Omit<Account, "id">) => {
      const newAcct: Account = { ...account, id: crypto.randomUUID() };
      setAccounts((prev) => {
        const next = [...prev, newAcct];
        saveAccounts(next);
        return next;
      });
    },
    [],
  );

  const updateAccount = useCallback(
    (id: string, updates: Partial<Omit<Account, "id">>) => {
      setAccounts((prev) => {
        const next = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
        saveAccounts(next);
        return next;
      });
    },
    [],
  );

  const deleteAccount = useCallback((id: string) => {
    setAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      saveAccounts(next);
      return next;
    });
  }, []);

  const transferBetweenAccounts = useCallback(
    (fromId: string, toId: string, amountCents: Cents, description: string) => {
      const transfer: AccountTransfer = {
        id: crypto.randomUUID(),
        fromAccountId: fromId,
        toAccountId: toId,
        amountCents,
        date: new Date().toISOString().slice(0, 10),
        description,
        createdAt: new Date().toISOString(),
      };
      setTransfers((prev) => {
        const next = [...prev, transfer];
        saveTransfers(next);
        return next;
      });
      setAccounts((prev) => {
        const next = prev.map((a) => {
          if (a.id === fromId) return { ...a, balanceCents: a.balanceCents - amountCents };
          if (a.id === toId) return { ...a, balanceCents: a.balanceCents + amountCents };
          return a;
        });
        saveAccounts(next);
        return next;
      });
    },
    [],
  );

  const setCurrency = useCallback((currency: CurrencyCode) => {
    setSettings((prev) => {
      const next = { ...prev, currency };
      saveSettings(next);
      return next;
    });
  }, []);

  return {
    transactions,
    budgetLimits,
    accounts,
    transfers,
    settings,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    setBudgetLimit,
    removeBudgetLimit,
    setOverallBudget,
    addAccount,
    updateAccount,
    deleteAccount,
    transferBetweenAccounts,
    setCurrency,
  };
}
