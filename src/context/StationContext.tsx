"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { isStationLocked } from "@/lib/permissions";
import type { Station } from "@/lib/types";

const STORAGE_KEY = "pumpmetrics-active-station";

type StationContextValue = {
  stations: Station[];
  activeStationId: number | null;
  activeStation: Station | null;
  setActiveStationId: (id: number) => void;
  refreshStations: () => Promise<void>;
  loading: boolean;
  stationLocked: boolean;
};

const StationContext = createContext<StationContextValue | null>(null);

export function StationProvider({ children }: { children: React.ReactNode }) {
  const { profile, role, loading: authLoading } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [activeStationId, setActiveStationIdState] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const locked = isStationLocked(role);
  const assignedStationId = profile?.station_id ?? null;

  const refreshStations = useCallback(async () => {
    const res = await fetch("/api/stations");
    if (res.ok) {
      setStations(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      void refreshStations();
    }
  }, [authLoading, refreshStations]);

  useEffect(() => {
    if (authLoading) return;

    if (locked && assignedStationId) {
      setActiveStationIdState(assignedStationId);
      return;
    }

    setActiveStationIdState((current) => {
      if (current && stations.some((s) => s.id === current)) {
        return current;
      }

      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem(STORAGE_KEY)
          : null;
      const storedId = stored ? parseInt(stored, 10) : null;

      if (storedId && stations.some((s) => s.id === storedId)) {
        return storedId;
      }

      return stations[0]?.id ?? null;
    });
  }, [authLoading, locked, assignedStationId, stations]);

  const setActiveStationId = useCallback(
    (id: number) => {
      if (locked) return;
      setActiveStationIdState(id);
      localStorage.setItem(STORAGE_KEY, String(id));
    },
    [locked],
  );

  const activeStation = useMemo(
    () => stations.find((s) => s.id === activeStationId) ?? null,
    [stations, activeStationId],
  );

  const value = useMemo(
    () => ({
      stations,
      activeStationId,
      activeStation,
      setActiveStationId,
      refreshStations,
      loading: loading || authLoading,
      stationLocked: locked,
    }),
    [
      stations,
      activeStationId,
      activeStation,
      setActiveStationId,
      refreshStations,
      loading,
      authLoading,
      locked,
    ],
  );

  return (
    <StationContext.Provider value={value}>{children}</StationContext.Provider>
  );
}

export function useStation() {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error("useStation must be used within a StationProvider");
  }
  return context;
}
