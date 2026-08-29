import type { Decimal } from "@prisma/client/runtime/library";

export function dec(value: Decimal | number | string): number {
  return Number(value);
}

export function dateStr(value: Date | string): string {
  if (typeof value === "string") return value.split("T")[0];
  return value.toISOString().split("T")[0];
}

export function iso(value: Date): string {
  return value.toISOString();
}
