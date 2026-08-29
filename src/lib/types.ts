export type UserRole = "super_admin" | "station_manager" | "cashier";

export type UserProfile = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  station_id: number | null;
  created_at: string;
  stations?: { name: string; location: string | null } | null;
};

export type Station = {
  id: number;
  name: string;
  location: string | null;
  phone: string | null;
  manager_name: string | null;
  created_at: string;
  pumpCount?: number;
};

export type Pump = {
  id: number;
  name: string;
  fuel_type: string;
  station_id: number | null;
  created_at: string;
};

export type DailyReading = {
  id: number;
  pump_id: number;
  reading_date: string;
  start_reading: number;
  end_reading: number;
  liters_sold: number;
  created_at: string;
  pumps?: Pump | null;
};

export type FuelInventory = {
  id: number;
  fuel_type: string;
  current_stock: number;
  last_delivery_date: string | null;
  last_delivery_amount: number | null;
  station_id: number | null;
  updated_at: string;
};

export type StoreSale = {
  id: number;
  sale_date: string;
  cash_revenue: number;
  card_revenue: number;
  total_revenue: number;
  station_id: number | null;
  created_at: string;
};

export type TimeFilter = "day" | "week" | "month";

export type StationSummary = {
  stationId: number;
  stationName: string;
  location: string | null;
  phone: string | null;
  managerName: string | null;
  pumpCount: number;
  fuelLiters: number;
  storeRevenue: number;
};

export type ManagerPerformance = {
  stationId: number;
  stationName: string;
  managerName: string | null;
  fuelLiters: number;
  storeRevenue: number;
  totalSales: number;
  rank: number;
};

export type StationDirectoryEntry = {
  stationId: number;
  name: string;
  address: string | null;
  phone: string | null;
  managerName: string | null;
  pumpCount: number;
};
