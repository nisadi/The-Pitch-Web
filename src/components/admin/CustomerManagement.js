"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquare, RotateCcw } from "lucide-react";
import {
  fetchCustomersFromSupabase,
  subscribeToCustomers,
} from "@/lib/customers/customerRealtime";
import {
  applyEnquiryRealtimeEvent,
  fetchEnquiriesFromSupabase,
  subscribeToEnquiries,
} from "@/lib/eventInquiries/enquiryRealtime";
import { upsertEnquiryClient } from "@/lib/eventInquiries/enquiryMutations";
import { createAdminReply } from "@/lib/eventInquiries/enquiryMapper";
import {
  fetchEventInquiriesFromSupabase,
  subscribeToEventInquiries,
} from "@/lib/eventInquiries/stadiumEventRealtime";
import { upsertEventInquiryClient } from "@/lib/eventInquiries/stadiumEventMutations";
import { normalizeStadiumEventInquiry } from "@/lib/eventInquiries/stadiumEventMapper";
import {
  findThreadById,
  groupEnquiriesIntoThreads,
  patchEnquiriesForThread,
  pickReplyTargetRow,
  resolveThreadPhone,
} from "@/lib/eventInquiries/enquiryThreads";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import AdminStatsGrid from "./AdminStatsGrid";
import EnquiryDetailModal from "./EnquiryDetailModal";
import { getAdminUser } from "./adminSession";
import { useAdminLocation } from "./adminLocationContext";
import {
  CUSTOMER_STATUSES,
  ENQUIRY_STATUSES,
  mockCustomers,
  mockEnquiries,
  mockEventInquiries,
} from "./customersData";
import { useAdminSettings } from "./settings/adminSettingsContext";
import {
  filterCustomers,
  filterEnquiryThreads,
  formatCustomerAmount,
  formatEnquiryDateTime,
  summarizeCustomers,
  summarizeEnquiries,
  truncateText,
  venueLocationAliases,
} from "./customersUtils";
import styles from "./CustomerManagement.module.css";

const TABS = [
  { id: "customers", label: "Customer database" },
  { id: "enquiries", label: "Enquiries" },
  { id: "events", label: "Events" },
];

const CUSTOMER_STATUS_OPTIONS = [
  { id: "all", label: "All statuses" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

const ENQUIRY_STATUS_OPTIONS = [
  { id: "all", label: "All statuses" },
  { id: "new", label: "New" },
  { id: "in_progress", label: "In progress" },
  { id: "resolved", label: "Resolved" },
  { id: "closed", label: "Closed" },
];

export default function CustomerManagement() {
  const usesSupabase = isSupabaseConfigured();
  const { filterValue: locationFilter, locationId } = useAdminLocation();
  const { locations: settingsLocations } = useAdminSettings();
  const [activeTab, setActiveTab] = useState("customers");
  const [customerStatus, setCustomerStatus] = useState("all");
  const [enquiryStatus, setEnquiryStatus] = useState("all");
  const [eventInquiryStatus, setEventInquiryStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState(
    usesSupabase ? [] : mockCustomers
  );
  const [customersReady, setCustomersReady] = useState(!usesSupabase);
  const [customersSyncError, setCustomersSyncError] = useState(null);
  const [enquiries, setEnquiries] = useState(mockEnquiries);
  const [enquiriesReady, setEnquiriesReady] = useState(!usesSupabase);
  const [enquiriesSyncError, setEnquiriesSyncError] = useState(null);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);
  const [eventInquiries, setEventInquiries] = useState(mockEventInquiries);
  const [eventInquiriesReady, setEventInquiriesReady] = useState(!usesSupabase);
  const [eventInquiriesSyncError, setEventInquiriesSyncError] = useState(null);
  const [selectedEventInquiryId, setSelectedEventInquiryId] = useState(null);
  const [replySending, setReplySending] = useState(false);
  const [eventReplySending, setEventReplySending] = useState(false);
  const enquiriesLoadedRef = useRef(false);

  const sortEnquiries = useCallback((list) => {
    return [...list].sort((a, b) => {
      const aKey = `${a.date}T${a.time}`;
      const bKey = `${b.date}T${b.time}`;
      return bKey.localeCompare(aKey);
    });
  }, []);

  const venueLocationAliasesList = useMemo(() => {
    const current = settingsLocations.find((loc) => loc.id === locationId);
    const aliases = venueLocationAliases(current);
    return aliases.length > 0 ? aliases : [locationFilter];
  }, [settingsLocations, locationId, locationFilter]);

  const loadCustomers = useCallback(async () => {
    const remote = await fetchCustomersFromSupabase();
    setCustomers(remote);
    setCustomersSyncError(null);
  }, []);

  const loadEnquiries = useCallback(async () => {
    const remote = await fetchEnquiriesFromSupabase();
    setEnquiries(sortEnquiries(remote));
    setEnquiriesSyncError(null);
  }, [sortEnquiries]);

  const loadEventInquiries = useCallback(async () => {
    const remote = await fetchEventInquiriesFromSupabase();
    setEventInquiries(sortEnquiries(remote));
    setEventInquiriesSyncError(null);
  }, [sortEnquiries]);

  useEffect(() => {
    if (!usesSupabase) return undefined;

    let cancelled = false;
    let unsubscribe = () => {};

    async function init() {
      try {
        unsubscribe = await subscribeToCustomers(
          () => {
            if (cancelled) return;
            void loadCustomers().catch(() => {});
          },
          () => {
            if (cancelled) return;
            void loadCustomers().catch(() => {});
          }
        );

        await loadCustomers();
        if (!cancelled) {
          setCustomersReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setCustomers([]);
          setCustomersSyncError(
            err?.message ?? "Could not sync customers from Supabase."
          );
          setCustomersReady(true);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [usesSupabase, loadCustomers]);

  useEffect(() => {
    if (!usesSupabase || activeTab !== "customers") return undefined;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadCustomers().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    const interval = setInterval(() => {
      void loadCustomers().catch(() => {});
    }, 60_000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [usesSupabase, activeTab, loadCustomers]);

  useEffect(() => {
    if (!usesSupabase || activeTab !== "enquiries") return undefined;

    let cancelled = false;
    let unsubscribe = null;

    void (async () => {
      try {
        if (!enquiriesLoadedRef.current) {
          await loadEnquiries();
          enquiriesLoadedRef.current = true;
          if (!cancelled) {
            setEnquiriesReady(true);
            setEnquiriesSyncError(null);
          }
        } else if (!cancelled) {
          setEnquiriesReady(true);
        }

        const cleanup = await subscribeToEnquiries((payload) => {
          if (cancelled) return;
          setEnquiries((prev) => applyEnquiryRealtimeEvent(prev, payload));
          setEnquiriesSyncError(null);
        });

        if (cancelled) {
          await cleanup();
          return;
        }

        unsubscribe = cleanup;
      } catch (err) {
        if (!cancelled) {
          setEnquiries([]);
          setEnquiriesSyncError(
            err?.message ?? "Could not sync enquiries from Supabase."
          );
          setEnquiriesReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      void unsubscribe?.();
    };
  }, [usesSupabase, activeTab, loadEnquiries]);

  useEffect(() => {
    if (!usesSupabase || activeTab !== "enquiries") return undefined;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadEnquiries().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [usesSupabase, activeTab, loadEnquiries]);

  useEffect(() => {
    if (!usesSupabase || activeTab !== "events") return undefined;

    let cancelled = false;
    let unsubscribe = null;

    setEventInquiriesReady(false);

    void (async () => {
      try {
        const cleanup = await subscribeToEventInquiries(
          () => {
            if (cancelled) return;
            void loadEventInquiries()
              .then(() => setEventInquiriesSyncError(null))
              .catch(() => {});
          },
          () => {
            if (cancelled) return;
            void loadEventInquiries().catch(() => {});
          }
        );

        if (cancelled) {
          await cleanup();
          return;
        }

        unsubscribe = cleanup;

        await loadEventInquiries();
        if (!cancelled) {
          setEventInquiriesSyncError(null);
          setEventInquiriesReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setEventInquiries([]);
          setEventInquiriesSyncError(
            err?.message ?? "Could not sync event inquiries from Supabase."
          );
          setEventInquiriesReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      void unsubscribe?.();
    };
  }, [usesSupabase, activeTab, loadEventInquiries]);

  useEffect(() => {
    if (!usesSupabase || activeTab !== "events") return undefined;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void loadEventInquiries().catch(() => {});
      }
    };

    document.addEventListener("visibilitychange", onVisible);

    const interval = setInterval(() => {
      void loadEventInquiries().catch(() => {});
    }, 12000);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(interval);
    };
  }, [usesSupabase, activeTab, loadEventInquiries]);

  const enquiryThreads = useMemo(
    () => groupEnquiriesIntoThreads(enquiries),
    [enquiries]
  );

  const selectedEnquiry = useMemo(
    () => findThreadById(enquiryThreads, selectedEnquiryId),
    [enquiryThreads, selectedEnquiryId]
  );

  const eventInquiryThreads = useMemo(
    () => groupEnquiriesIntoThreads(eventInquiries),
    [eventInquiries]
  );

  const selectedEventInquiry = useMemo(
    () => findThreadById(eventInquiryThreads, selectedEventInquiryId),
    [eventInquiryThreads, selectedEventInquiryId]
  );

  const filteredCustomers = useMemo(() => {
    const list = filterCustomers(customers, {
      locationAliases: venueLocationAliasesList,
      status: customerStatus,
      query: searchQuery,
    });

    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, venueLocationAliasesList, customerStatus, searchQuery]);

  const filteredEnquiries = useMemo(
    () =>
      filterEnquiryThreads(enquiryThreads, {
        locationAliases: venueLocationAliasesList,
        status: enquiryStatus,
        query: searchQuery,
      }),
    [enquiryThreads, venueLocationAliasesList, enquiryStatus, searchQuery]
  );

  const customerSummary = useMemo(
    () => summarizeCustomers(filteredCustomers),
    [filteredCustomers]
  );

  const filteredEventInquiries = useMemo(
    () =>
      filterEnquiryThreads(eventInquiryThreads, {
        locationAliases: venueLocationAliasesList,
        status: eventInquiryStatus,
        query: searchQuery,
      }),
    [
      eventInquiryThreads,
      venueLocationAliasesList,
      eventInquiryStatus,
      searchQuery,
    ]
  );

  const enquirySummary = useMemo(
    () => summarizeEnquiries(filteredEnquiries),
    [filteredEnquiries]
  );

  const eventInquirySummary = useMemo(
    () => summarizeEnquiries(filteredEventInquiries),
    [filteredEventInquiries]
  );

  const stats =
    activeTab === "customers"
      ? [
          { label: "Total customers", value: String(customerSummary.total) },
          { label: "Active", value: String(customerSummary.active) },
          {
            label: "Visited (30 days)",
            value: String(customerSummary.recentVisitors),
          },
          {
            label: "Inactive",
            value: String(customerSummary.inactive),
          },
        ]
      : activeTab === "enquiries"
        ? [
            { label: "Total enquiries", value: String(enquirySummary.total) },
            { label: "New", value: String(enquirySummary.new) },
            { label: "In progress", value: String(enquirySummary.inProgress) },
            { label: "Resolved", value: String(enquirySummary.resolved) },
          ]
        : [
            { label: "Total events", value: String(eventInquirySummary.total) },
            { label: "New", value: String(eventInquirySummary.new) },
            {
              label: "In progress",
              value: String(eventInquirySummary.inProgress),
            },
            { label: "Resolved", value: String(eventInquirySummary.resolved) },
          ];

  const persistEnquiry = async (nextEnquiry) => {
    if (!usesSupabase) return nextEnquiry;

    try {
      const saved = await upsertEnquiryClient(nextEnquiry);
      setEnquiriesSyncError(null);
      return saved;
    } catch (err) {
      setEnquiriesSyncError(err?.message ?? "Could not save enquiry.");
      throw err;
    }
  };

  const updateEnquiryStatus = async (id, status) => {
    const thread = findThreadById(enquiryThreads, id);
    if (!thread) return;

    const snapshot = enquiries;
    setEnquiries((prev) => patchEnquiriesForThread(prev, thread, { status }));

    if (!usesSupabase) return;

    try {
      for (const row of thread.sourceRows) {
        const saved = await persistEnquiry({ ...row, status });
        setEnquiries((prev) =>
          prev.map((enquiry) =>
            enquiry.dbId === saved.dbId ? saved : enquiry
          )
        );
      }
      setEnquiriesSyncError(null);
    } catch {
      setEnquiries(snapshot);
    }
  };

  const persistEventInquiry = async (nextInquiry) => {
    if (!usesSupabase) return nextInquiry;

    try {
      const saved = await upsertEventInquiryClient(nextInquiry);
      setEventInquiriesSyncError(null);
      return saved;
    } catch (err) {
      setEventInquiriesSyncError(
        err?.message ?? "Could not save event inquiry."
      );
      throw err;
    }
  };

  const updateEventInquiryStatus = async (id, status) => {
    const thread = findThreadById(eventInquiryThreads, id);
    if (!thread) return;

    const snapshot = eventInquiries;
    setEventInquiries((prev) =>
      patchEnquiriesForThread(prev, thread, { status }, normalizeStadiumEventInquiry)
    );

    if (!usesSupabase) return;

    try {
      for (const row of thread.sourceRows) {
        const saved = await persistEventInquiry({ ...row, status });
        setEventInquiries((prev) =>
          prev.map((inquiry) =>
            inquiry.dbId === saved.dbId ? saved : inquiry
          )
        );
      }
      setEventInquiriesSyncError(null);
    } catch {
      setEventInquiries(snapshot);
    }
  };

  const handleSendEventReply = async (id, message) => {
    const admin = getAdminUser();
    const thread = findThreadById(eventInquiryThreads, id);
    const targetRow = pickReplyTargetRow(thread);
    if (!targetRow?.dbId) return false;

    const smsPhone = resolveThreadPhone(thread);
    if (!smsPhone) {
      window.alert("This event inquiry has no phone number. Cannot send SMS.");
      return false;
    }

    setEventReplySending(true);
    try {
      const response = await fetch("/api/admin/enquiries/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: smsPhone,
          message,
          referenceCode: targetRow.id,
          enquiryQuestion: targetRow.message,
        }),
      });
      const smsResult = await response.json();
      if (!response.ok || !smsResult.success) {
        const detail = [
          smsResult.error,
          smsResult.formattedPhone
            ? `Number sent as: ${smsResult.formattedPhone}`
            : null,
        ]
          .filter(Boolean)
          .join("\n");
        window.alert(
          detail || "SMS could not be sent. Check ESMS settings in .env.local."
        );
        return false;
      }

      const reply = createAdminReply({
        message,
        author: admin?.name ?? "Admin",
        inReplyTo: targetRow.id,
        channel: "sms",
        smsMessageId: smsResult.messageId ?? null,
      });

      const optimistic = {
        ...targetRow,
        status: targetRow.status === "new" ? "in_progress" : targetRow.status,
        replies: [...(targetRow.replies ?? []), reply],
      };

      const snapshot = eventInquiries;
      setEventInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.dbId === targetRow.dbId ? optimistic : inquiry
        )
      );

      if (usesSupabase) {
        try {
          const saved = await persistEventInquiry(optimistic);
          setEventInquiries((prev) =>
            prev.map((inquiry) =>
              inquiry.dbId === saved.dbId ? saved : inquiry
            )
          );
          setEventInquiriesSyncError(null);
        } catch {
          setEventInquiries(snapshot);
          window.alert(
            "SMS was sent but saving the reply to the database failed."
          );
        }
      }

      return true;
    } catch (err) {
      window.alert(err?.message ?? "SMS could not be sent.");
      return false;
    } finally {
      setEventReplySending(false);
    }
  };

  const handleSendReply = async (id, message) => {
    const admin = getAdminUser();
    const thread = findThreadById(enquiryThreads, id);
    const targetRow = pickReplyTargetRow(thread);
    if (!targetRow?.dbId) return false;

    const smsPhone = resolveThreadPhone(thread);
    if (!smsPhone) {
      window.alert("This enquiry has no phone number. Cannot send SMS.");
      return false;
    }

    setReplySending(true);
    try {
      const response = await fetch("/api/admin/enquiries/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: smsPhone,
          message,
          referenceCode: targetRow.id,
          enquiryQuestion: targetRow.message,
        }),
      });
      const smsResult = await response.json();
      if (!response.ok || !smsResult.success) {
        const detail = [
          smsResult.error,
          smsResult.formattedPhone
            ? `Number sent as: ${smsResult.formattedPhone}`
            : null,
        ]
          .filter(Boolean)
          .join("\n");
        window.alert(
          detail || "SMS could not be sent. Check ESMS settings in .env.local."
        );
        return false;
      }

      const reply = createAdminReply({
        message,
        author: admin?.name ?? "Admin",
        inReplyTo: targetRow.id,
        channel: "sms",
        smsMessageId: smsResult.messageId ?? null,
      });

      const optimistic = {
        ...targetRow,
        status: targetRow.status === "new" ? "in_progress" : targetRow.status,
        replies: [...(targetRow.replies ?? []), reply],
      };

      const snapshot = enquiries;
      setEnquiries((prev) =>
        prev.map((enquiry) =>
          enquiry.dbId === targetRow.dbId ? optimistic : enquiry
        )
      );

      if (usesSupabase) {
        try {
          const saved = await persistEnquiry(optimistic);
          setEnquiries((prev) =>
            prev.map((enquiry) =>
              enquiry.dbId === saved.dbId ? saved : enquiry
            )
          );
          setEnquiriesSyncError(null);
        } catch {
          setEnquiries(snapshot);
          window.alert(
            "SMS was sent but saving the reply to the database failed."
          );
        }
      }

      return true;
    } catch (err) {
      window.alert(err?.message ?? "SMS could not be sent.");
      return false;
    } finally {
      setReplySending(false);
    }
  };

  const handleReset = () => {
    setCustomerStatus("all");
    setEnquiryStatus("all");
    setEventInquiryStatus("all");
    setSearchQuery("");
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchQuery("");
    setCustomerStatus("all");
    setEnquiryStatus("all");
    setEventInquiryStatus("all");
  };

  const activeStatus =
    activeTab === "customers"
      ? customerStatus
      : activeTab === "enquiries"
        ? enquiryStatus
        : eventInquiryStatus;

  const setActiveStatus = (value) => {
    if (activeTab === "customers") setCustomerStatus(value);
    else if (activeTab === "enquiries") setEnquiryStatus(value);
    else setEventInquiryStatus(value);
  };

  const searchPlaceholder =
    activeTab === "customers"
      ? "Name, mobile, email, ID..."
      : activeTab === "enquiries"
        ? "Name, subject, message, ID..."
        : "Organization, category, requirements, ID...";

  return (
    <div className={styles.page}>
      <div className={styles.tabs} role="tablist" aria-label="Customer sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AdminStatsGrid stats={stats} />

      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cust-status">
            Status
          </label>
          <select
            id="cust-status"
            className={styles.select}
            value={activeStatus}
            onChange={(e) => setActiveStatus(e.target.value)}
          >
            {(activeTab === "customers"
              ? CUSTOMER_STATUS_OPTIONS
              : ENQUIRY_STATUS_OPTIONS
            ).map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={`${styles.field} ${styles.fieldGrow}`}>
          <label className={styles.label} htmlFor="cust-search">
            Search
          </label>
          <input
            id="cust-search"
            type="search"
            className={styles.input}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>

        <div className={styles.toolbarActions}>
          <button type="button" className={styles.resetBtn} onClick={handleReset}>
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
      </div>

      {activeTab === "customers" ? (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Customer database</h3>
              <p>
                {!customersReady && usesSupabase
                  ? "Loading from Supabase…"
                  : `${filteredCustomers.length} customer${
                      filteredCustomers.length === 1 ? "" : "s"
                    } · ${locationFilter}`}
              </p>
              {customersSyncError && (
                <p className={styles.syncError}>{customersSyncError}</p>
              )}
            </div>
          </div>

          {!customersReady && usesSupabase ? (
            <p className={styles.empty}>Syncing customers with Supabase…</p>
          ) : filteredCustomers.length === 0 ? (
            <p className={styles.empty}>
              No customers match your filters. Try adjusting status or search.
            </p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Bookings</th>
                    <th>Total spent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const status = CUSTOMER_STATUSES[customer.status];
                    return (
                      <tr key={customer.dbId ?? customer.id}>
                        <td>
                          {customer.name}
                          <span className={styles.meta}>{customer.phone}</span>
                        </td>
                        <td>{customer.email || "—"}</td>
                        <td>{customer.bookingsCount}</td>
                        <td className={styles.amount}>
                          {formatCustomerAmount(customer.totalSpent)}
                        </td>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : activeTab === "enquiries" ? (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Enquiries management</h3>
              <p>
                {!enquiriesReady
                  ? "Loading from Supabase…"
                  : `${filteredEnquiries.length} enquir${filteredEnquiries.length === 1 ? "y" : "ies"} · ${locationFilter}`}
              </p>
              {enquiriesSyncError && (
                <p className={styles.syncError}>{enquiriesSyncError}</p>
              )}
            </div>
          </div>

          {!enquiriesReady ? (
            <p className={styles.empty}>Syncing enquiries with Supabase…</p>
          ) : filteredEnquiries.length === 0 ? (
            <p className={styles.empty}>
              No enquiries match your filters. Try adjusting status or search.
            </p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Received</th>
                    <th>Contact</th>
                    <th>Subject</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEnquiries.map((enquiry) => {
                    const status = ENQUIRY_STATUSES[enquiry.status];
                    return (
                      <tr key={enquiry.id}>
                        <td>
                          {formatEnquiryDateTime(enquiry.date, enquiry.time)}
                          <span className={styles.meta}>
                            {enquiry.id}
                            {enquiry.threadCount > 1
                              ? ` · ${enquiry.threadCount} submissions`
                              : ""}
                          </span>
                        </td>
                        <td>
                          {enquiry.name}
                          <span className={styles.meta}>{enquiry.phone}</span>
                        </td>
                        <td>{enquiry.subject}</td>
                        <td className={styles.message}>
                          <p className={styles.messagePreview}>
                            {truncateText(enquiry.message, 48)}
                          </p>
                          <button
                            type="button"
                            className={styles.viewMsgBtn}
                            onClick={() => setSelectedEnquiryId(enquiry.id)}
                          >
                            <MessageSquare size={14} />
                            Read &amp; reply
                            {enquiry.messageCount > 1 && (
                              <span className={styles.replyCount}>
                                {enquiry.messageCount}
                              </span>
                            )}
                          </button>
                        </td>
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
                        <td>
                          <div className={styles.actions}>
                            {enquiry.status === "new" && (
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                onClick={() =>
                                  updateEnquiryStatus(enquiry.id, "in_progress")
                                }
                              >
                                Start
                              </button>
                            )}
                            {(enquiry.status === "new" ||
                              enquiry.status === "in_progress") && (
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() =>
                                  updateEnquiryStatus(enquiry.id, "resolved")
                                }
                              >
                                Resolve
                              </button>
                            )}
                            {enquiry.status !== "closed" && (
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() =>
                                  updateEnquiryStatus(enquiry.id, "closed")
                                }
                              >
                                Close
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Event inquiries</h3>
              <p>
                {!eventInquiriesReady
                  ? "Loading from Supabase…"
                  : `${filteredEventInquiries.length} event inquir${filteredEventInquiries.length === 1 ? "y" : "ies"} · ${locationFilter}`}
              </p>
              {eventInquiriesSyncError && (
                <p className={styles.syncError}>{eventInquiriesSyncError}</p>
              )}
            </div>
          </div>

          {!eventInquiriesReady ? (
            <p className={styles.empty}>Syncing event inquiries with Supabase…</p>
          ) : filteredEventInquiries.length === 0 ? (
            <p className={styles.empty}>
              No event inquiries match your filters. Try adjusting status or search.
            </p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Received</th>
                    <th>Contact</th>
                    <th>Category</th>
                    <th>Requirements</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEventInquiries.map((inquiry) => {
                    const status = ENQUIRY_STATUSES[inquiry.status];
                    return (
                      <tr key={inquiry.id}>
                        <td>
                          {formatEnquiryDateTime(inquiry.date, inquiry.time)}
                          <span className={styles.meta}>
                            {inquiry.id}
                            {inquiry.threadCount > 1
                              ? ` · ${inquiry.threadCount} submissions`
                              : ""}
                          </span>
                        </td>
                        <td>
                          {inquiry.name}
                          <span className={styles.meta}>
                            {inquiry.organizationName
                              ? `${inquiry.organizationName} · `
                              : ""}
                            {inquiry.phone}
                          </span>
                        </td>
                        <td>{inquiry.eventCategory || inquiry.subject}</td>
                        <td className={styles.message}>
                          <p className={styles.messagePreview}>
                            {truncateText(inquiry.message, 48)}
                          </p>
                          <button
                            type="button"
                            className={styles.viewMsgBtn}
                            onClick={() =>
                              setSelectedEventInquiryId(inquiry.id)
                            }
                          >
                            <MessageSquare size={14} />
                            Read &amp; reply
                            {inquiry.messageCount > 1 && (
                              <span className={styles.replyCount}>
                                {inquiry.messageCount}
                              </span>
                            )}
                          </button>
                        </td>
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
                        <td>
                          <div className={styles.actions}>
                            {inquiry.status === "new" && (
                              <button
                                type="button"
                                className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                                onClick={() =>
                                  updateEventInquiryStatus(
                                    inquiry.id,
                                    "in_progress"
                                  )
                                }
                              >
                                Start
                              </button>
                            )}
                            {(inquiry.status === "new" ||
                              inquiry.status === "in_progress") && (
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() =>
                                  updateEventInquiryStatus(
                                    inquiry.id,
                                    "resolved"
                                  )
                                }
                              >
                                Resolve
                              </button>
                            )}
                            {inquiry.status !== "closed" && (
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() =>
                                  updateEventInquiryStatus(inquiry.id, "closed")
                                }
                              >
                                Close
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <EnquiryDetailModal
        open={Boolean(selectedEnquiry)}
        enquiry={selectedEnquiry}
        onClose={() => setSelectedEnquiryId(null)}
        onSendReply={handleSendReply}
        sending={replySending}
      />

      <EnquiryDetailModal
        open={Boolean(selectedEventInquiry)}
        enquiry={selectedEventInquiry}
        onClose={() => setSelectedEventInquiryId(null)}
        onSendReply={handleSendEventReply}
        sending={eventReplySending}
      />
    </div>
  );
}
