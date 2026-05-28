"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  fetchDashboardSnapshot,
  formatDashboardLkr,
  subscribeToDashboard,
} from "@/lib/admin/dashboardData";
import { resolveCalendarLocation } from "@/lib/locations/resolveAdminLocation";
import AdminSalesChart from "./AdminSalesChart";
import AdminStatsGrid from "./AdminStatsGrid";
import { useAdminLocation } from "./adminLocationContext";
import { venueLocationAliases } from "./customersUtils";
import { useAdminSettings } from "./settings/adminSettingsContext";
import styles from "./Admin.module.css";

const EMPTY_METRICS = {
  todayBookings: 0,
  todaySales: 0,
  upcomingEvents: 0,
  averageTicket: 0,
};

export default function AdminDashboard() {
  const { filterValue: locationFilter, locationId } = useAdminLocation();
  const { locations: settingsLocations } = useAdminSettings();
  const [calendarLocation, setCalendarLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [salesOverview, setSalesOverview] = useState(null);

  useEffect(() => {
    setCalendarLocation(null);
    let cancelled = false;

    resolveCalendarLocation(settingsLocations, {
      locationId,
      filterValue: locationFilter,
    }).then((resolved) => {
      if (!cancelled) setCalendarLocation(resolved);
    });

    return () => {
      cancelled = true;
    };
  }, [settingsLocations, locationId, locationFilter]);

  const locationAliases = useMemo(() => {
    const current = settingsLocations.find((loc) => loc.id === locationId);
    const aliases = venueLocationAliases(current);
    return aliases.length > 0 ? aliases : [locationFilter];
  }, [settingsLocations, locationId, locationFilter]);

  const locationDbId = calendarLocation?.dbId ?? null;

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setSyncError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    if (calendarLocation === null) return;

    try {
      setSyncError(null);
      setLoading(true);
      const snapshot = await fetchDashboardSnapshot({
        locationDbId,
        locationAliases,
      });
      setMetrics(snapshot.metrics);
      setSalesOverview(snapshot.salesOverview);
    } catch (err) {
      console.error("[AdminDashboard]", err);
      setSyncError(err?.message ?? "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [calendarLocation, locationDbId, locationAliases]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return undefined;

    const unsubscribe = subscribeToDashboard(() => {
      void load();
    });

    return unsubscribe;
  }, [load]);

  const stats = useMemo(
    () => [
      {
        label: "Today's Bookings",
        value: String(metrics.todayBookings),
      },
      {
        label: "Sales",
        value: formatDashboardLkr(metrics.todaySales),
      },
      {
        label: "Upcoming Events",
        value: String(metrics.upcomingEvents),
      },
      {
        label: "Average ticket size",
        value: formatDashboardLkr(metrics.averageTicket),
      },
    ],
    [metrics]
  );

  return (
    <>
      {syncError ? (
        <p className={styles.syncError} role="alert">
          {syncError}
        </p>
      ) : null}

      <AdminStatsGrid stats={stats} loading={loading} />

      <AdminSalesChart
        salesOverview={salesOverview}
        loading={loading}
      />
    </>
  );
}
