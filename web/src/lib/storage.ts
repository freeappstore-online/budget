import type {
  Transaction,
  BudgetLimit,
  Account,
  AccountTransfer,
  AppSettings,
} from "../types/budget";

const KEYS = {
  transactions: "budget_transactions",
  budgets: "budget_limits",
  accounts: "budget_accounts",
  transfers: "budget_transfers",
  settings: "budget_settings",
} as const;

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Transactions ---
export function loadTransactions(): Transaction[] {
  return load<Transaction[]>(KEYS.transactions, []);
}
export function saveTransactions(txns: Transaction[]): void {
  save(KEYS.transactions, txns);
}

// --- Budget Limits ---
export function loadBudgetLimits(): BudgetLimit[] {
  return load<BudgetLimit[]>(KEYS.budgets, []);
}
export function saveBudgetLimits(limits: BudgetLimit[]): void {
  save(KEYS.budgets, limits);
}

// --- Accounts ---
export function loadAccounts(): Account[] {
  return load<Account[]>(KEYS.accounts, []);
}
export function saveAccounts(accounts: Account[]): void {
  save(KEYS.accounts, accounts);
}

// --- Transfers ---
export function loadTransfers(): AccountTransfer[] {
  return load<AccountTransfer[]>(KEYS.transfers, []);
}
export function saveTransfers(transfers: AccountTransfer[]): void {
  save(KEYS.transfers, transfers);
}

// --- Settings ---
export function loadSettings(): AppSettings {
  return load<AppSettings>(KEYS.settings, {
    currency: "USD",
    overallMonthlyBudgetCents: null,
  });
}
export function saveSettings(settings: AppSettings): void {
  save(KEYS.settings, settings);
}
