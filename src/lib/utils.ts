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
