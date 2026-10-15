import type { TimeFilter } from "./types";

export function getDateRange(filter: TimeFilter): { start: string; end: string } {
  const end = new Date();
  const start = new Date();

  if (filter === "week") {
    start.setDate(start.getDate() - 6);
  } else if (filter === "month") {
    start.setDate(start.getDate() - 29);
  }

  return {
    start: toDateString(start),
    end: toDateString(end),
  };
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toDateString(d));
  }
  return days;
}

export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function todayString(): string {
  return toDateString(new Date());
}

export function formatDate(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/** Display label for a unit/nozzle pair (falls back to legacy pump name). */
export function formatUnitNozzle(unit: {
  name?: string | null;
  unit_number?: string | null;
  nozzle_number?: string | null;
  unitNumber?: string | null;
  nozzleNumber?: string | null;
}): string {
  const unitNo = unit.unit_number ?? unit.unitNumber;
  const nozzleNo = unit.nozzle_number ?? unit.nozzleNumber;
  if (unitNo && nozzleNo) return `Unit ${unitNo} / Nozzle ${nozzleNo}`;
  if (unitNo) return `Unit ${unitNo}`;
  return unit.name ?? "Unit";
}

export function buildUnitDisplayName(unitNumber: string, nozzleNumber: string): string {
  return `Unit ${unitNumber.trim()} / Nozzle ${nozzleNumber.trim()}`;
}

export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
) {
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
