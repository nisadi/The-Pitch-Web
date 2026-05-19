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
  const replies = enquiry.replies ?? [];
  const canReply = enquiry.status !== "closed";

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) return;

    onSendReply(enquiry.id, trimmed);
    setReplyText("");
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
              <dt className={styles.detailLabel}>Location</dt>
              <dd>{enquiry.location}</dd>
            </div>
            {enquiry.sport ? (
              <div>
                <dt className={styles.detailLabel}>Sport</dt>
                <dd>{enquiry.sport}</dd>
              </div>
            ) : null}
          </dl>

          <div className={styles.thread}>
            <p className={styles.threadTitle}>Conversation</p>

            <article
              className={`${styles.bubble} ${styles.bubbleCustomer}`}
            >
              <div className={styles.bubbleHead}>
                <span className={styles.bubbleAuthor}>{enquiry.name}</span>
                <time className={styles.bubbleTime}>
                  {formatEnquiryDateTime(enquiry.date, enquiry.time)}
                </time>
              </div>
              <p className={styles.bubbleText}>{enquiry.message}</p>
            </article>

            {replies.map((reply) => (
              <article
                key={reply.id}
                className={`${styles.bubble} ${styles.bubbleAdmin}`}
              >
                <div className={styles.bubbleHead}>
                  <span className={styles.bubbleAuthor}>{reply.author}</span>
                  <time className={styles.bubbleTime}>
                    {formatEnquiryDateTime(reply.date, reply.time)}
                  </time>
                </div>
                <p className={styles.bubbleText}>{reply.message}</p>
              </article>
            ))}
          </div>
        </div>

        {canReply ? (
          <form className={styles.footer} onSubmit={handleSubmit}>
            <label className={styles.replyLabel} htmlFor="enquiry-reply">
              Reply to {enquiry.name}
            </label>
            <textarea
              id="enquiry-reply"
              className={styles.textarea}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply. The customer will receive this by email or SMS."
              rows={4}
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
                disabled={!replyText.trim()}
              >
                <Send size={16} />
                Send reply
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

