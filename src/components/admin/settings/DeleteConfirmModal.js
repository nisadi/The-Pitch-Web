"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./DeleteConfirmModal.module.css";

export const DELETE_CONFIRM_WORD = "Delete";

export default function DeleteConfirmModal({
  open,
  title,
  description,
  confirmButtonLabel = "Delete",
  onClose,
  onConfirm,
}) {
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!open) {
      setConfirmText("");
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

  if (!open) return null;

  const canDelete = confirmText === DELETE_CONFIRM_WORD;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canDelete) return;
    onConfirm();
    setConfirmText("");
  };

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="delete-confirm-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.description}>{description}</p>

        <form onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="delete-confirm-input">
            Type <code>{DELETE_CONFIRM_WORD}</code> to confirm
          </label>
          <input
            id="delete-confirm-input"
            className={styles.input}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={DELETE_CONFIRM_WORD}
            autoComplete="off"
            autoFocus
          />

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.deleteBtn}
              disabled={!canDelete}
            >
              {confirmButtonLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
