"use client";

import { useMemo, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
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

export default function PaymentSummary() {
  const { filterValue: locationFilter } = useAdminLocation();
  const [datePreset, setDatePreset] = useState("last30");
  const [customFrom, setCustomFrom] = useState("2026-05-01");
  const [customTo, setCustomTo] = useState("2026-05-18");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const dateRange = useMemo(
    () =>
      datePreset === "all"
        ? { from: "", to: "" }
        : getDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo]
  );

  const filteredPayments = useMemo(() => {
    const sorted = filterPayments(mockPayments, {
      ...dateRange,
      status: statusFilter,
      location: locationFilter,
      query: searchQuery,
    });

    return [...sorted].sort((a, b) => {
      const aKey = `${a.date}T${a.time}`;
      const bKey = `${b.date}T${b.time}`;
      return bKey.localeCompare(aKey);
    });
  }, [dateRange, statusFilter, locationFilter, searchQuery]);

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
    setDatePreset("last30");
    setCustomFrom("2026-05-01");
    setCustomTo("2026-05-18");
    setStatusFilter("all");
    setSearchQuery("");
  };

  return (
    <div className={styles.page}>
      <AdminStatsGrid stats={stats} />

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
              {filteredPayments.length} transaction
              {filteredPayments.length === 1 ? "" : "s"}
              {` · ${locationFilter}`}
            </p>
          </div>
        </div>

        {filteredPayments.length === 0 ? (
          <p className={styles.empty}>
            No transactions match your filters. Try adjusting the date range or
            search.
          </p>
        ) : (
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
                    <tr key={payment.id}>
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
                      <td>{PAYMENT_METHODS[payment.method] ?? "Card"}</td>
                      <td>
                        <span
                          className={styles.badge}
                          style={{
                            color: status.color,
                            background: `${status.color}22`,
                          }}
                        >
                          {status.label}
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
        )}
      </section>
    </div>
  );
}
