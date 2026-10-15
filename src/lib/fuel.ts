/** Canonical fuel type labels used across forms and dashboards. */
export const FUEL_TYPES = ["Regular Petrol", "Hi-Octane", "Diesel"] as const;

export type FuelType = (typeof FUEL_TYPES)[number];

export function fuelBadgeClass(fuelType: string): string {
  const map: Record<string, string> = {
    "Regular Petrol": "fuel-badge-regular",
    "Hi-Octane": "fuel-badge-premium",
    Diesel: "fuel-badge-diesel",
    // Legacy labels still in older rows
    Regular: "fuel-badge-regular",
    Premium: "fuel-badge-premium",
  };
  return map[fuelType] ?? "bg-secondary";
}

export function fuelChipVariant(
  fuelType: string,
): "primary" | "success" | "warning" | "info" {
  if (fuelType === "Regular Petrol" || fuelType === "Regular") return "primary";
  if (fuelType === "Hi-Octane" || fuelType === "Premium") return "warning";
  if (fuelType === "Diesel") return "success";
  return "info";
}
