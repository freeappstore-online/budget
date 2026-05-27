import type { CategoryDef } from "../types/budget";

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  // Income
  { id: "salary", name: "Salary", emoji: "💰", type: "income" },
  { id: "freelance", name: "Freelance", emoji: "💻", type: "income" },
  { id: "investments", name: "Investments", emoji: "📈", type: "income" },
  { id: "gifts", name: "Gifts", emoji: "🎁", type: "income" },
  { id: "other-income", name: "Other Income", emoji: "💵", type: "income" },

  // Expenses
  { id: "housing", name: "Housing", emoji: "🏠", type: "expense" },
  { id: "food", name: "Food & Groceries", emoji: "🛒", type: "expense" },
  { id: "transportation", name: "Transportation", emoji: "🚗", type: "expense" },
  { id: "utilities", name: "Utilities", emoji: "⚡", type: "expense" },
  { id: "entertainment", name: "Entertainment", emoji: "🎬", type: "expense" },
  { id: "shopping", name: "Shopping", emoji: "🛍️", type: "expense" },
  { id: "health", name: "Health", emoji: "🏥", type: "expense" },
  { id: "education", name: "Education", emoji: "🎓", type: "expense" },
  { id: "subscriptions", name: "Subscriptions", emoji: "🔄", type: "expense" },
  { id: "insurance", name: "Insurance", emoji: "🛡️", type: "expense" },
  { id: "savings", name: "Savings", emoji: "🏦", type: "expense" },
  { id: "other-expense", name: "Other", emoji: "📦", type: "expense" },
];

export function getCategoryById(id: string): CategoryDef | undefined {
  return DEFAULT_CATEGORIES.find((c) => c.id === id);
}

export function getCategoriesByType(type: "income" | "expense"): CategoryDef[] {
  return DEFAULT_CATEGORIES.filter((c) => c.type === type);
}
