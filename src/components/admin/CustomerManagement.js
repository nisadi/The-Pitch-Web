"use client";

import { useMemo, useState } from "react";
import { MessageSquare, RotateCcw } from "lucide-react";
import AdminStatsGrid from "./AdminStatsGrid";
import EnquiryDetailModal from "./EnquiryDetailModal";
import { getAdminUser } from "./adminSession";
import { useAdminLocation } from "./adminLocationContext";
import {
  CUSTOMER_STATUSES,
  ENQUIRY_STATUSES,
  mockCustomers,
  mockEnquiries,
} from "./customersData";
import {
  filterCustomers,
  filterEnquiries,
  formatCustomerAmount,
  formatCustomerDate,
  formatEnquiryDateTime,
  summarizeCustomers,
  summarizeEnquiries,
  truncateText,
} from "./customersUtils";
import styles from "./CustomerManagement.module.css";

const TABS = [
  { id: "customers", label: "Customer database" },
  { id: "enquiries", label: "Enquiries" },
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
  const { filterValue: locationFilter } = useAdminLocation();
  const [activeTab, setActiveTab] = useState("customers");
  const [customerStatus, setCustomerStatus] = useState("all");
  const [enquiryStatus, setEnquiryStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [enquiries, setEnquiries] = useState(mockEnquiries);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState(null);

  const selectedEnquiry = useMemo(
    () => enquiries.find((e) => e.id === selectedEnquiryId) ?? null,
    [enquiries, selectedEnquiryId]
  );

  const filteredCustomers = useMemo(() => {
    const list = filterCustomers(mockCustomers, {
      location: locationFilter,
      status: customerStatus,
      query: searchQuery,
    });

    return [...list].sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
  }, [locationFilter, customerStatus, searchQuery]);

  const filteredEnquiries = useMemo(() => {
    const list = filterEnquiries(enquiries, {
      location: locationFilter,
      status: enquiryStatus,
      query: searchQuery,
    });

    return [...list].sort((a, b) => {
      const aKey = `${a.date}T${a.time}`;
      const bKey = `${b.date}T${b.time}`;
      return bKey.localeCompare(aKey);
    });
  }, [enquiries, locationFilter, enquiryStatus, searchQuery]);

  const customerSummary = useMemo(
    () => summarizeCustomers(filteredCustomers),
    [filteredCustomers]
  );

  const enquirySummary = useMemo(
    () => summarizeEnquiries(filteredEnquiries),
    [filteredEnquiries]
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
            label: "Lifetime spend",
            value: formatCustomerAmount(customerSummary.totalRevenue),
          },
        ]
      : [
          { label: "Total enquiries", value: String(enquirySummary.total) },
          { label: "New", value: String(enquirySummary.new) },
          { label: "In progress", value: String(enquirySummary.inProgress) },
          { label: "Resolved", value: String(enquirySummary.resolved) },
        ];

  const updateEnquiryStatus = (id, status) => {
    setEnquiries((prev) =>
      prev.map((enquiry) =>
        enquiry.id === id ? { ...enquiry, status } : enquiry
      )
    );
  };

  const handleSendReply = (id, message) => {
    const admin = getAdminUser();
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 5);

    setEnquiries((prev) =>
      prev.map((enquiry) => {
        if (enquiry.id !== id) return enquiry;

        return {
          ...enquiry,
          status:
            enquiry.status === "new" ? "in_progress" : enquiry.status,
          replies: [
            ...(enquiry.replies ?? []),
            {
              id: `REP-${Date.now()}`,
              date,
              time,
              author: admin.name,
              message,
            },
          ],
        };
      })
    );
  };

  const handleReset = () => {
    setCustomerStatus("all");
    setEnquiryStatus("all");
    setSearchQuery("");
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchQuery("");
    setCustomerStatus("all");
    setEnquiryStatus("all");
  };

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
            value={activeTab === "customers" ? customerStatus : enquiryStatus}
            onChange={(e) =>
              activeTab === "customers"
                ? setCustomerStatus(e.target.value)
                : setEnquiryStatus(e.target.value)
            }
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
            placeholder={
              activeTab === "customers"
                ? "Name, mobile, email, ID..."
                : "Name, subject, message, ID..."
            }
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
                {filteredCustomers.length} customer
                {filteredCustomers.length === 1 ? "" : "s"}
                {` · ${locationFilter}`}
              </p>
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
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
                    <th>Location</th>
                    <th>Bookings</th>
                    <th>Total spent</th>
                    <th>Last visit</th>
                    <th>Joined</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => {
                    const status = CUSTOMER_STATUSES[customer.status];
                    return (
                      <tr key={customer.id}>
                        <td>
                          {customer.name}
                          <span className={styles.meta}>{customer.phone}</span>
                        </td>
                        <td>{customer.email || "—"}</td>
                        <td>{customer.location}</td>
                        <td>{customer.bookingsCount}</td>
                        <td className={styles.amount}>
                          {formatCustomerAmount(customer.totalSpent)}
                        </td>
                        <td>{formatCustomerDate(customer.lastVisit)}</td>
                        <td>{formatCustomerDate(customer.joinedDate)}</td>
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
      ) : (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Enquiries management</h3>
              <p>
                {filteredEnquiries.length} enquir
                {filteredEnquiries.length === 1 ? "y" : "ies"}
                {` · ${locationFilter}`}
              </p>
            </div>
          </div>

          {filteredEnquiries.length === 0 ? (
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
                    <th>Location</th>
                    <th>Sport</th>
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
                          <span className={styles.meta}>{enquiry.id}</span>
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
                            {(enquiry.replies?.length ?? 0) > 0 && (
                              <span className={styles.replyCount}>
                                {enquiry.replies.length}
                              </span>
                            )}
                          </button>
                        </td>
                        <td>{enquiry.location}</td>
                        <td>{enquiry.sport || "—"}</td>
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
      )}

      <EnquiryDetailModal
        open={Boolean(selectedEnquiry)}
        enquiry={selectedEnquiry}
        onClose={() => setSelectedEnquiryId(null)}
        onSendReply={handleSendReply}
      />
    </div>
  );
}
