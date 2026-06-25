"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Send, X } from "lucide-react";
import { ENQUIRY_STATUSES } from "./customersData";
import { formatEnquiryDateTime } from "./customersUtils";
import styles from "./EnquiryDetailModal.module.css";

export default function EnquiryDetailModal({
  open,
  enquiry,
  onClose,
  onSendReply,
  sending = false,
}) {
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (!open) {
      setReplyText("");
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !enquiry) return null;

  const status = ENQUIRY_STATUSES[enquiry.status];
  const messages =
    enquiry.messages?.length > 0
      ? enquiry.messages
      : [
          {
            id: `customer-${enquiry.id}`,
            role: "customer",
            author: enquiry.name,
            message: enquiry.message,
            date: enquiry.date,
            time: enquiry.time,
          },
          ...(enquiry.replies ?? []).map((reply) => ({
            ...reply,
            role: "admin",
          })),
        ];
  const canReply = enquiry.status !== "closed";

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || sending) return;

    const ok = await onSendReply(enquiry.id, trimmed);
    if (ok) setReplyText("");
  };

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="enquiry-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <h2 id="enquiry-detail-title">{enquiry.subject}</h2>
            <div className={styles.headerMeta}>
              <span>{enquiry.id}</span>
              <span>·</span>
              <span>
                {formatEnquiryDateTime(enquiry.date, enquiry.time)}
              </span>
              {enquiry.threadCount > 1 && (
                <>
                  <span>·</span>
                  <span>{enquiry.threadCount} messages from customer</span>
                </>
              )}
              <span
                className={styles.badge}
                style={{
                  color: status.color,
                  background: `${status.color}22`,
                }}
              >
                {status.label}
              </span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.body}>
          <dl className={styles.details}>
            <div>
              <dt className={styles.detailLabel}>Name</dt>
              <dd>{enquiry.name}</dd>
            </div>
            <div>
              <dt className={styles.detailLabel}>Mobile</dt>
              <dd>{enquiry.phone}</dd>
            </div>
            <div>
              <dt className={styles.detailLabel}>Email</dt>
              <dd>{enquiry.email || "—"}</dd>
            </div>
            <div>
              <dt className={styles.detailLabel}>Subject</dt>
              <dd>{enquiry.subject}</dd>
            </div>
            {enquiry.organizationName ? (
              <div>
                <dt className={styles.detailLabel}>Organization</dt>
                <dd>{enquiry.organizationName}</dd>
              </div>
            ) : null}
            {enquiry.eventCategory ? (
              <div>
                <dt className={styles.detailLabel}>Event category</dt>
                <dd>{enquiry.eventCategory}</dd>
              </div>
            ) : null}
            {enquiry.guestCount != null && enquiry.guestCount !== "" ? (
              <div>
                <dt className={styles.detailLabel}>Estimated guests</dt>
                <dd>{enquiry.guestCount}</dd>
              </div>
            ) : null}
            {enquiry.preferredDate ? (
              <div>
                <dt className={styles.detailLabel}>Preferred date</dt>
                <dd>{enquiry.preferredDate}</dd>
              </div>
            ) : null}
            {enquiry.location ? (
              <div>
                <dt className={styles.detailLabel}>Location</dt>
                <dd>{enquiry.location}</dd>
              </div>
            ) : null}
          </dl>

          <div className={styles.thread}>
            <p className={styles.threadTitle}>Conversation</p>

            {messages.map((entry) => {
              const isCustomer = entry.role === "customer";
              return (
                <article
                  key={entry.id}
                  className={`${styles.bubble} ${
                    isCustomer ? styles.bubbleCustomer : styles.bubbleAdmin
                  }`}
                >
                  <div className={styles.bubbleHead}>
                    <span className={styles.bubbleAuthor}>
                      {entry.author}
                      {entry.enquiryId ? (
                        <span className={styles.bubbleRef}>
                          {" "}
                          · {isCustomer ? entry.enquiryId : `Re: ${entry.inReplyTo ?? entry.enquiryId}`}
                        </span>
                      ) : null}
                    </span>
                    <time className={styles.bubbleTime}>
                      {formatEnquiryDateTime(entry.date, entry.time)}
                    </time>
                  </div>
                  <p className={styles.bubbleText}>{entry.message}</p>
                </article>
              );
            })}
          </div>
        </div>

        {canReply ? (
          <form className={styles.footer} onSubmit={handleSubmit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <label className={styles.replyLabel} htmlFor="enquiry-reply">
                Reply to {enquiry.name}
              </label>
              <span style={{ fontSize: "12px", color: "var(--text-secondary, #888)" }}>
                {replyText.length} / 100
              </span>
            </div>
            <textarea
              id="enquiry-reply"
              className={styles.textarea}
              value={replyText}
              onChange={(e) => {
                let val = e.target.value;
                if (val.length > 100) val = val.substring(0, 100);
                val = val.replace(/[^a-zA-Z0-9 .,!?'"()\n-]/g, "");
                setReplyText(val);
              }}
              placeholder="Your reply — sent in full via SMS with the enquiry reference, customer question, and Pitch contact details."
              disabled={sending}
              rows={4}
              maxLength={100}
            />
            <div className={styles.footerActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.sendBtn}
                disabled={!replyText.trim() || sending || !enquiry.phone?.trim()}
              >
                <Send size={16} />
                {sending ? "Sending SMS…" : "Send SMS reply"}
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.footer}>
            <p className={styles.replyLabel}>
              This enquiry is closed. Reopen it to send another reply.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
