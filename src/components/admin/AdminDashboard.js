"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  fetchDashboardSnapshot,
  formatDashboardLkr,
  subscribeToDashboard,
} from "@/lib/admin/dashboardData";
import AdminSalesChart from "./AdminSalesChart";
import AdminStatsGrid from "./AdminStatsGrid";
import styles from "./Admin.module.css";

const EMPTY_METRICS = {
  todayBookings: 0,
  todaySales: 0,
  upcomingEvents: 0,
  averageTicket: 0,
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState(null);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [salesOverview, setSalesOverview] = useState(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setSyncError("Supabase is not configured.");
      setLoading(false);
      return;
    }

    try {
      setSyncError(null);
      const snapshot = await fetchDashboardSnapshot();
      setMetrics(snapshot.metrics);
      setSalesOverview(snapshot.salesOverview);
    } catch (err) {
      console.error("[AdminDashboard]", err);
      setSyncError(err?.message ?? "Could not load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

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
