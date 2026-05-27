import { useCallback, useMemo } from "react";
import type { Transaction, CurrencyCode } from "../types/budget";
import { getCategoryById } from "../lib/categories";
import { formatCents } from "../lib/money";
import { getLastNMonths, getDaysInMonth, currentYearMonth, shortMonthLabel, getYearMonth } from "../lib/dates";
import {
  drawDonutChart,
  drawBarChart,
  drawLineChart,
  drawHorizontalBarChart,
  getChartColor,
} from "../lib/charts";
import { useCanvasChart } from "../hooks/useCanvasChart";

interface ChartsProps {
  transactions: Transaction[];
  currency: CurrencyCode;
}

function DonutChart({ transactions, currency }: ChartsProps) {
  const ym = currentYearMonth();
  const segments = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "expense" && getYearMonth(t.date) === ym) {
        map.set(t.category, (map.get(t.category) ?? 0) + t.amountCents);
      }
    }
    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
    return sorted.map(([catId, value], i) => {
      const cat = getCategoryById(catId);
      return {
        label: cat?.name ?? catId,
        value,
        color: getChartColor(i),
      };
    });
  }, [transactions, ym]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) =>
      drawDonutChart(ctx, segments, w, h),
    [segments],
  );
  const canvasRef = useCanvasChart(draw);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
        Expense Breakdown
      </h3>
      <div className="relative" style={{ height: 200 }}>
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
      {segments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-1 text-xs">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: s.color }}
              />
              <span style={{ color: "var(--ink)" }}>{s.label}</span>
              <span style={{ color: "var(--muted)" }}>
                ({formatCents(s.value, currency)})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IncomeExpenseTrend({ transactions, currency: _currency }: ChartsProps) {
  const months = getLastNMonths(6);
  const groups = useMemo(() => {
    return months.map((ym) => {
      const monthTxns = transactions.filter((t) => getYearMonth(t.date) === ym);
      const income = monthTxns
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amountCents, 0);
      const expenses = monthTxns
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amountCents, 0);
      return {
        label: shortMonthLabel(ym),
        values: [
          { value: income, color: "#16a34a" },
          { value: expenses, color: "#dc2626" },
        ],
      };
    });
  }, [transactions, months]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) =>
      drawBarChart(ctx, groups, w, h),
    [groups],
  );
  const canvasRef = useCanvasChart(draw);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
        Income vs Expenses (6 months)
      </h3>
      <div className="flex gap-3 mb-2">
        <div className="flex items-center gap-1 text-xs">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#16a34a" }} />
          <span style={{ color: "var(--muted)" }}>Income</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#dc2626" }} />
          <span style={{ color: "var(--muted)" }}>Expenses</span>
        </div>
      </div>
      <div className="relative" style={{ height: 200 }}>
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
}

function DailySpendingChart({ transactions, currency: _currency }: ChartsProps) {
  const ym = currentYearMonth();
  const days = getDaysInMonth(ym);
  const series = useMemo(() => {
    const dayMap = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "expense" && getYearMonth(t.date) === ym) {
        dayMap.set(t.date, (dayMap.get(t.date) ?? 0) + t.amountCents);
      }
    }
    const points = days.map((d) => ({
      label: d.slice(8),
      value: dayMap.get(d) ?? 0,
    }));
    return [{ points, color: "#2563eb" }];
  }, [transactions, ym, days]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) =>
      drawLineChart(ctx, series, w, h),
    [series],
  );
  const canvasRef = useCanvasChart(draw);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
        Daily Spending (current month)
      </h3>
      <div className="relative" style={{ height: 200 }}>
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
}

function CategoryComparisonChart({ transactions, currency: _currency }: ChartsProps) {
  const ym = currentYearMonth();
  const prevYm = useMemo(() => {
    const [y, m] = ym.split("-").map(Number);
    if (y === undefined || m === undefined) return "";
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, [ym]);

  const items = useMemo(() => {
    const currMap = new Map<string, number>();
    const prevMap = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const tym = getYearMonth(t.date);
      if (tym === ym) currMap.set(t.category, (currMap.get(t.category) ?? 0) + t.amountCents);
      if (tym === prevYm) prevMap.set(t.category, (prevMap.get(t.category) ?? 0) + t.amountCents);
    }

    const allCats = new Set([...currMap.keys(), ...prevMap.keys()]);
    const result: { label: string; values: { value: number; color: string }[] }[] = [];
    for (const catId of allCats) {
      const cat = getCategoryById(catId);
      result.push({
        label: cat ? `${cat.emoji} ${cat.name}` : catId,
        values: [
          { value: currMap.get(catId) ?? 0, color: "#2563eb" },
          { value: prevMap.get(catId) ?? 0, color: "#9ca3af" },
        ],
      });
    }
    return result.sort((a, b) => (b.values[0]?.value ?? 0) - (a.values[0]?.value ?? 0));
  }, [transactions, ym, prevYm]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) =>
      drawBarChart(ctx, items, w, h),
    [items],
  );
  const canvasRef = useCanvasChart(draw);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
        Category Comparison (this vs last month)
      </h3>
      <div className="flex gap-3 mb-2">
        <div className="flex items-center gap-1 text-xs">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#2563eb" }} />
          <span style={{ color: "var(--muted)" }}>This month</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: "#9ca3af" }} />
          <span style={{ color: "var(--muted)" }}>Last month</span>
        </div>
      </div>
      <div className="relative" style={{ height: Math.max(200, items.length * 40) }}>
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
}

function SavingsRateChart({ transactions, currency: _currency }: ChartsProps) {
  const months = getLastNMonths(6);
  const series = useMemo(() => {
    const points = months.map((ym) => {
      const monthTxns = transactions.filter((t) => getYearMonth(t.date) === ym);
      const income = monthTxns
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amountCents, 0);
      const expenses = monthTxns
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amountCents, 0);
      const rate = income > 0 ? ((income - expenses) / income) * 100 : 0;
      return { label: shortMonthLabel(ym), value: Math.max(rate, 0) };
    });
    return [{ points, color: "#16a34a" }];
  }, [transactions, months]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) =>
      drawLineChart(ctx, series, w, h),
    [series],
  );
  const canvasRef = useCanvasChart(draw);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
        Savings Rate Trend (%)
      </h3>
      <div className="relative" style={{ height: 200 }}>
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
}

function TopSpendingChart({ transactions, currency }: ChartsProps) {
  const ym = currentYearMonth();
  const items = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === "expense" && getYearMonth(t.date) === ym) {
        map.set(t.category, (map.get(t.category) ?? 0) + t.amountCents);
      }
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([catId, value], i) => {
        const cat = getCategoryById(catId);
        return {
          label: cat ? `${cat.emoji} ${cat.name}` : catId,
          value,
          color: getChartColor(i),
        };
      });
  }, [transactions, ym]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) =>
      drawHorizontalBarChart(ctx, items, w, h),
    [items],
  );
  const canvasRef = useCanvasChart(draw);

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
    >
      <h3 className="mb-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
        Top Spending Categories
      </h3>
      {items.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {items.map((item) => (
            <span key={item.label} className="text-xs" style={{ color: "var(--muted)" }}>
              {item.label}: {formatCents(item.value, currency)}
            </span>
          ))}
        </div>
      )}
      <div className="relative" style={{ height: Math.max(150, items.length * 28 + 20) }}>
        <canvas ref={canvasRef} className="absolute inset-0" />
      </div>
    </div>
  );
}

export function Charts({ transactions, currency }: ChartsProps) {
  return (
    <div className="flex flex-col gap-4">
      <DonutChart transactions={transactions} currency={currency} />
      <TopSpendingChart transactions={transactions} currency={currency} />
      <IncomeExpenseTrend transactions={transactions} currency={currency} />
      <DailySpendingChart transactions={transactions} currency={currency} />
      <CategoryComparisonChart transactions={transactions} currency={currency} />
      <SavingsRateChart transactions={transactions} currency={currency} />
    </div>
  );
}
