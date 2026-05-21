"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import {
  fetchPaymentsFromSupabase,
  subscribeToPayments,
} from "@/lib/payments/paymentRealtime";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import AdminStatsGrid from "./AdminStatsGrid";
import { useAdminLocation } from "./adminLocationContext";
import {
  mockPayments,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
} from "./paymentsData";
import {
  exportPaymentsCsv,
  filterPayments,
  formatPaymentAmount,
  formatPaymentDate,
  getDateRange,
  summarizePayments,
} from "./paymentsUtils";
import { venueLocationAliases } from "./customersUtils";
import { useAdminSettings } from "./settings/adminSettingsContext";
import styles from "./PaymentSummary.module.css";

const DATE_PRESETS = [
  { id: "last7", label: "Last 7 days" },
  { id: "last30", label: "Last 30 days" },
  { id: "thisMonth", label: "This month" },
  { id: "today", label: "Today" },
  { id: "custom", label: "Custom range" },
  { id: "all", label: "All time" },
];

const STATUS_OPTIONS = [
  { id: "all", label: "All statuses" },
  { id: "completed", label: "Completed" },
  { id: "pending", label: "Pending" },
  { id: "failed", label: "Failed" },
  { id: "refunded", label: "Refunded" },
];

function defaultCustomRange() {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 29);
  const toKey = (date) => date.toISOString().slice(0, 10);
  return { from: toKey(from), to: toKey(today) };
}

export default function PaymentSummary() {
  const usesSupabase = isSupabaseConfigured();
  const { filterValue: locationFilter, locationId } = useAdminLocation();
  const { locations: settingsLocations } = useAdminSettings();
  const initialRange = defaultCustomRange();
  const [payments, setPayments] = useState(
    usesSupabase ? [] : mockPayments
  );
  const [paymentsReady, setPaymentsReady] = useState(!usesSupabase);
  const [paymentsSyncError, setPaymentsSyncError] = useState(null);
  const [datePreset, setDatePreset] = useState("last30");
  const [customFrom, setCustomFrom] = useState(initialRange.from);
  const [customTo, setCustomTo] = useState(initialRange.to);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const paymentLocationAliases = useMemo(() => {
    const current = settingsLocations.find((loc) => loc.id === locationId);
    const aliases = venueLocationAliases(current);
    return aliases.length > 0 ? aliases : [locationFilter];
  }, [settingsLocations, locationId, locationFilter]);

  const sortPayments = useCallback((list) => {
    return [...list].sort((a, b) => {
      const aKey = `${a.date}T${a.time}`;
      const bKey = `${b.date}T${b.time}`;
      return bKey.localeCompare(aKey);
    });
  }, []);

  const loadPayments = useCallback(async () => {
    const remote = await fetchPaymentsFromSupabase();
    setPayments(sortPayments(remote));
    setPaymentsSyncError(null);
  }, [sortPayments]);

  useEffect(() => {
    if (!usesSupabase) return undefined;

    let cancelled = false;
    let unsubscribe = () => {};

    async function init() {
      try {
        unsubscribe = await subscribeToPayments(
          () => {
            if (cancelled) return;
            void loadPayments().catch(() => {});
          },
          () => {
            if (cancelled) return;
            void loadPayments().catch(() => {});
          }
        );

        await loadPayments();
        if (!cancelled) {
          setPaymentsReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setPayments([]);
          setPaymentsSyncError(
            err?.message ?? "Could not sync payments from Supabase."
          );
          setPaymentsReady(true);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [usesSupabase, loadPayments]);

  useEffect(() => {
    if (!usesSupabase) return undefined;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadPayments().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    const interval = setInterval(() => {
      void loadPayments().catch(() => {});
    }, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [usesSupabase, loadPayments]);

  const dateRange = useMemo(
    () =>
      datePreset === "all"
        ? { from: "", to: "" }
        : getDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo]
  );

  const filteredPayments = useMemo(() => {
    const sorted = filterPayments(payments, {
      ...dateRange,
      status: statusFilter,
      locationAliases: paymentLocationAliases,
      query: searchQuery,
    });

    return sortPayments(sorted);
  }, [
    payments,
    dateRange,
    statusFilter,
    paymentLocationAliases,
    searchQuery,
    sortPayments,
  ]);

  const summary = useMemo(
    () => summarizePayments(filteredPayments),
    [filteredPayments]
  );

  const stats = [
    {
      label: "Total revenue",
      value: formatPaymentAmount(summary.totalRevenue),
    },
    {
      label: "Transactions",
      value: String(summary.transactionCount),
    },
    {
      label: "Pending",
      value: formatPaymentAmount(summary.pendingAmount),
    },
    {
      label: "Failed",
      value: String(summary.failedCount),
    },
  ];

  const handleExport = () => {
    if (filteredPayments.length === 0) return;

    const fromPart = dateRange.from || "all";
    const toPart = dateRange.to || "all";
    exportPaymentsCsv(
      filteredPayments,
      `payment-summary-${fromPart}-to-${toPart}.csv`
    );
  };

  const handleReset = () => {
    const range = defaultCustomRange();
    setDatePreset("last30");
    setCustomFrom(range.from);
    setCustomTo(range.to);
    setStatusFilter("all");
    setSearchQuery("");
  };

  return (
    <div className={styles.page}>
      <AdminStatsGrid stats={stats} />

      {usesSupabase && paymentsSyncError && (
        <p className={styles.syncError} role="alert">
          {paymentsSyncError}
        </p>
      )}

      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="pay-date-preset">
            Date range
          </label>
          <select
            id="pay-date-preset"
            className={styles.select}
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
          >
            {DATE_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        {datePreset === "custom" && (
          <>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pay-from">
                From
              </label>
              <input
                id="pay-from"
                type="date"
                className={styles.input}
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="pay-to">
                To
              </label>
              <input
                id="pay-to"
                type="date"
                className={styles.input}
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          </>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="pay-status">
            Status
          </label>
          <select
            id="pay-status"
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={`${styles.field} ${styles.fieldGrow}`}>
          <label className={styles.label} htmlFor="pay-search">
            Search
          </label>
          <input
            id="pay-search"
            type="search"
            className={styles.input}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Reference, customer, mobile, ID..."
          />
        </div>

        <div className={styles.toolbarActions}>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleReset}
          >
            <RotateCcw size={16} />
            Reset
          </button>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={handleExport}
            disabled={filteredPayments.length === 0}
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h3>Transaction summary</h3>
            <p>
              {!paymentsReady && usesSupabase
                ? "Loading transactions…"
                : `${filteredPayments.length} transaction${
                    filteredPayments.length === 1 ? "" : "s"
                  } · ${locationFilter}`}
            </p>
          </div>
        </div>

        {paymentsReady && filteredPayments.length === 0 ? (
          <p className={styles.empty}>
            No transactions match your filters. Try adjusting the date range or
            search.
          </p>
        ) : paymentsReady ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const status = PAYMENT_STATUSES[payment.status];
                  return (
                    <tr key={payment.dbId ?? payment.id}>
                      <td>
                        {formatPaymentDate(payment.date, payment.time)}
                        <span className={styles.meta}>{payment.id}</span>
                      </td>
                      <td>{payment.reference}</td>
                      <td>
                        {payment.customerName}
                        <span className={styles.meta}>
                          {payment.customerPhone}
                        </span>
                      </td>
                      <td>{payment.location}</td>
                      <td>{payment.description}</td>
                      <td>
                        {PAYMENT_METHODS[payment.method] ?? "Card"}
                        {payment.methodOther ? (
                          <span className={styles.meta}>
                            {payment.methodOther}
                          </span>
                        ) : null}
                      </td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            color: status?.color ?? "#94a3b8",
                            background: `${status?.color ?? "#94a3b8"}22`,
                          }}
                        >
                          {status?.label ?? payment.status}
                        </span>
                      </td>
                      <td className={styles.amount}>
                        {formatPaymentAmount(payment.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
