import type { Transaction, RecurrenceInterval } from "../types/budget";
import { todayISO } from "./dates";

/**
 * Given a set of recurring-source transactions and all existing transactions,
 * generate any missing recurring entries up to today.
 */
export function generateRecurringEntries(
  allTransactions: Transaction[],
): Transaction[] {
  const today = todayISO();
  const newEntries: Transaction[] = [];

  const sources = allTransactions.filter((t) => t.recurrence !== null && t.recurringSourceId === null);
  const existingGenerated = new Set(
    allTransactions
      .filter((t) => t.recurringSourceId !== null)
      .map((t) => `${t.recurringSourceId}_${t.date}`),
  );

  for (const source of sources) {
    const dates = getRecurrenceDates(source.date, source.recurrence!, today);
    for (const date of dates) {
      const key = `${source.id}_${date}`;
      if (existingGenerated.has(key)) continue;
      // Also skip the source's own date
      if (date === source.date) continue;

      newEntries.push({
        id: crypto.randomUUID(),
        type: source.type,
        amountCents: source.amountCents,
        category: source.category,
        description: source.description,
        date,
        accountId: source.accountId,
        recurrence: null,
        recurringSourceId: source.id,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return newEntries;
}

function getRecurrenceDates(
  startDate: string,
  interval: RecurrenceInterval,
  endDate: string,
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");

  let current = new Date(start);
  while (current <= end) {
    const iso = current.toISOString().slice(0, 10);
    dates.push(iso);
    switch (interval) {
      case "weekly":
        current.setDate(current.getDate() + 7);
        break;
      case "monthly":
        current.setMonth(current.getMonth() + 1);
        break;
      case "yearly":
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return dates;
}
