/**
 * Canvas-based chart drawing utilities.
 * All charts render to a provided CanvasRenderingContext2D.
 */

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

const CHART_COLORS = [
  "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a",
  "#0891b2", "#ca8a04", "#dc2626", "#4f46e5", "#059669",
  "#d946ef", "#f97316",
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]!;
}

export function drawDonutChart(
  ctx: CanvasRenderingContext2D,
  segments: DonutSegment[],
  width: number,
  height: number,
): void {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#6b7280";
    ctx.font = "14px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No data", width / 2, height / 2);
    return;
  }

  const cx = width / 2;
  const cy = height / 2;
  const outerR = Math.min(cx, cy) - 10;
  const innerR = outerR * 0.6;

  ctx.clearRect(0, 0, width, height);

  let startAngle = -Math.PI / 2;
  for (const seg of segments) {
    const sweep = (seg.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sweep);
    ctx.arc(cx, cy, innerR, startAngle + sweep, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    startAngle += sweep;
  }
}

interface BarGroup {
  label: string;
  values: { value: number; color: string }[];
}

export function drawBarChart(
  ctx: CanvasRenderingContext2D,
  groups: BarGroup[],
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
  const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#1a1a1a";
  const line = getComputedStyle(document.documentElement).getPropertyValue("--line").trim() || "#e5e7eb";

  if (groups.length === 0) return;

  const padding = { top: 20, right: 20, bottom: 40, left: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxBars = groups.reduce((m, g) => Math.max(m, g.values.length), 0);
  const allValues = groups.flatMap((g) => g.values.map((v) => v.value));
  const maxVal = Math.max(...allValues, 1);

  const groupWidth = chartW / groups.length;
  const barWidth = Math.min(groupWidth / (maxBars + 1), 30);
  const gap = barWidth * 0.3;

  // Grid lines
  ctx.strokeStyle = line;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // Bars
  groups.forEach((group, gi) => {
    const groupX = padding.left + gi * groupWidth + groupWidth / 2;
    const totalBarsWidth = group.values.length * barWidth + (group.values.length - 1) * gap;
    let barX = groupX - totalBarsWidth / 2;

    for (const v of group.values) {
      const barH = (v.value / maxVal) * chartH;
      const barY = padding.top + chartH - barH;
      ctx.fillStyle = v.color;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barWidth, barH, [3, 3, 0, 0]);
      ctx.fill();
      barX += barWidth + gap;
    }

    // Label
    ctx.fillStyle = ink;
    ctx.font = "11px Manrope, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(group.label, groupX, height - padding.bottom + 20);
  });
}

interface LinePoint {
  label: string;
  value: number;
}

export function drawLineChart(
  ctx: CanvasRenderingContext2D,
  series: { points: LinePoint[]; color: string }[],
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
  const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#1a1a1a";
  const line = getComputedStyle(document.documentElement).getPropertyValue("--line").trim() || "#e5e7eb";

  if (series.length === 0 || series[0]!.points.length === 0) return;

  const padding = { top: 20, right: 20, bottom: 40, left: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allValues = series.flatMap((s) => s.points.map((p) => p.value));
  const maxVal = Math.max(...allValues, 1);

  const pointCount = series[0]!.points.length;
  const stepX = pointCount > 1 ? chartW / (pointCount - 1) : chartW;

  // Grid
  ctx.strokeStyle = line;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // Lines
  for (const s of series) {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    s.points.forEach((p, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartH - (p.value / maxVal) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    ctx.fillStyle = s.color;
    s.points.forEach((p, i) => {
      const x = padding.left + i * stepX;
      const y = padding.top + chartH - (p.value / maxVal) * chartH;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // Labels
  ctx.fillStyle = ink;
  ctx.font = "10px Manrope, sans-serif";
  ctx.textAlign = "center";

  const maxLabels = 10;
  const labelStep = Math.max(1, Math.ceil(pointCount / maxLabels));
  series[0]!.points.forEach((p, i) => {
    if (i % labelStep === 0 || i === pointCount - 1) {
      const x = padding.left + i * stepX;
      ctx.fillText(p.label, x, height - padding.bottom + 18);
    }
  });
}

export function drawHorizontalBarChart(
  ctx: CanvasRenderingContext2D,
  items: { label: string; value: number; color: string }[],
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height);
  const ink = getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() || "#1a1a1a";

  if (items.length === 0) return;

  const padding = { top: 10, right: 20, bottom: 10, left: 110 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const barH = Math.min(chartH / items.length - 4, 24);

  const maxVal = Math.max(...items.map((i) => i.value), 1);

  items.forEach((item, i) => {
    const y = padding.top + i * (barH + 4);
    const barW = (item.value / maxVal) * chartW;

    // Label
    ctx.fillStyle = ink;
    ctx.font = "12px Manrope, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(item.label, padding.left - 8, y + barH / 2 + 4);

    // Bar
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.roundRect(padding.left, y, barW, barH, 4);
    ctx.fill();
  });
}
