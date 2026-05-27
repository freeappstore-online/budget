/** All money values are stored as integer cents */
export type Cents = number;

export type TransactionType = "income" | "expense";

export type RecurrenceInterval = "weekly" | "monthly" | "yearly";

export interface Transaction {
  id: string;
  type: TransactionType;
  /** Amount in cents (always positive) */
  amountCents: Cents;
  category: string;
  description: string;
  /** ISO date string YYYY-MM-DD */
  date: string;
  accountId: string | null;
  recurrence: RecurrenceInterval | null;
  /** ID of the recurring source transaction (null if manual) */
  recurringSourceId: string | null;
  createdAt: string;
}

export interface CategoryDef {
  id: string;
  name: string;
  emoji: string;
  type: TransactionType;
}

export interface BudgetLimit {
  categoryId: string;
  /** Monthly limit in cents */
  limitCents: Cents;
}

export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "cash" | "credit_card";
  /** Balance in cents (can be negative for credit cards) */
  balanceCents: Cents;
}

export interface AccountTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amountCents: Cents;
  date: string;
  description: string;
  createdAt: string;
}

export type CurrencyCode = "USD" | "EUR" | "GBP" | "AUD";

export interface AppSettings {
  currency: CurrencyCode;
  overallMonthlyBudgetCents: Cents | null;
}

export type TabId =
  | "dashboard"
  | "transactions"
  | "budgets"
  | "charts"
  | "accounts"
  | "insights";
